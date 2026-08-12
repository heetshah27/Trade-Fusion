import { createHash, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const PROFILE_PHOTO_RULES = {
  maxBytes: 10 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
};

const profilePhotoSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(PROFILE_PHOTO_RULES.acceptedMimeTypes),
  dataUrl: z.string().min(32).max(Math.ceil(PROFILE_PHOTO_RULES.maxBytes * 1.4) + 256),
});

const displayNameSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must have at least 2 characters").max(40, "Display name must be 40 characters or fewer"),
});

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function emailAvatarUrl(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;
  const hash = createHash("md5").update(normalizedEmail).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=256&d=identicon&r=g`;
}

export function decodeProfilePhoto(dataUrl: string, expectedMimeType: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1] !== expectedMimeType) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Profile photo must be a valid image data URL" });
  }
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > PROFILE_PHOTO_RULES.maxBytes) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Profile photo must be 10 MB or smaller" });
  }

  const validSignature =
    (expectedMimeType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (expectedMimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (expectedMimeType === "image/webp" && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP");
  if (!validSignature) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Profile photo content does not match the selected image type" });
  }
  return bytes;
}

function avatarExtension(mimeType: string) {
  return mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
}

export const accountRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account database unavailable" });
    const [member] = await db
      .select({ name: users.name, email: users.email, tradingStyle: users.tradingStyle, profileAvatarUrl: users.profileAvatarUrl })
      .from(users)
      .where(eq(users.id, ctx.user.id));
    const customAvatarUrl = member?.profileAvatarUrl ?? null;
    return {
      name: member?.name?.trim() || "Trader",
      email: member?.email ?? ctx.user.email,
      role: ctx.user.role,
      tradingStyle: member?.tradingStyle ?? ctx.user.tradingStyle,
      avatarUrl: customAvatarUrl ?? emailAvatarUrl(member?.email ?? ctx.user.email),
      customAvatarUrl,
    };
  }),

  uploadProfilePhoto: protectedProcedure.input(profilePhotoSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account database unavailable" });
    const bytes = decodeProfilePhoto(input.dataUrl, input.mimeType);
    const uploaded = await storagePut(
      `account-avatars/${ctx.user.id}/${randomUUID()}.${avatarExtension(input.mimeType)}`,
      bytes,
      input.mimeType,
    );
    await db
      .update(users)
      .set({ profileAvatarUrl: uploaded.url, profileAvatarKey: uploaded.key, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));
    return { avatarUrl: uploaded.url };
  }),

  updateDisplayName: protectedProcedure.input(displayNameSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account database unavailable" });
    const name = normalizeDisplayName(input.displayName);
    await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
    return { name };
  }),

  removeProfilePhoto: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account database unavailable" });
    await db
      .update(users)
      .set({ profileAvatarUrl: null, profileAvatarKey: null, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));
    return { avatarUrl: emailAvatarUrl(ctx.user.email) };
  }),
});
