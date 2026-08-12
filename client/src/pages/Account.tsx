import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Check, CircleUserRound, ImagePlus, LoaderCircle, Mail, Pencil, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

const MAX_PROFILE_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Account() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.account.profile.useQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const initial = (profile?.name || user?.name || "T").charAt(0).toUpperCase();

  const uploadPhoto = trpc.account.uploadProfilePhoto.useMutation({
    onSuccess: async () => {
      setUploadError(null);
      await utils.account.profile.invalidate();
    },
    onError: error => setUploadError(error.message),
  });
  const removePhoto = trpc.account.removeProfilePhoto.useMutation({
    onSuccess: async () => {
      setUploadError(null);
      await utils.account.profile.invalidate();
    },
    onError: error => setUploadError(error.message),
  });
  const updateDisplayName = trpc.account.updateDisplayName.useMutation({
    onSuccess: async () => {
      setEditingName(false);
      setUploadError(null);
      await utils.account.profile.invalidate();
    },
    onError: error => setUploadError(error.message),
  });

  useEffect(() => setDisplayName(profile?.name || user?.name || "Trader"), [profile?.name, user?.name]);

  const choosePhoto = () => fileInputRef.current?.click();
  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setUploadError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setUploadError("Profile photos must be 10 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadPhoto.mutate({ fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", dataUrl: String(reader.result) });
    reader.onerror = () => setUploadError("Your photo could not be read. Please choose a different image.");
    reader.readAsDataURL(file);
  };

  const isWorking = uploadPhoto.isPending || removePhoto.isPending || updateDisplayName.isPending;
  const saveDisplayName = () => {
    const nextName = displayName.trim();
    if (!nextName) return setUploadError("Enter a display name before saving.");
    updateDisplayName.mutate({ displayName: nextName });
  };

  return (
    <div className="min-h-full bg-[#07101f] px-5 py-8 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[oklch(0.70_0.16_250)]">Member account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Your trader profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Your account stays private. Add a custom profile photo, or keep the email-linked avatar as your fallback.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-blue-200/[0.10] bg-gradient-to-b from-[#152647] to-[#101c33] p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative w-fit">
                <Avatar className="h-24 w-24 border-2 border-blue-300/[0.22] bg-slate-800 shadow-[0_0_26px_oklch(0.66_0.18_250_/_0.22)]">
                  <AvatarImage src={profile?.avatarUrl ?? undefined} alt={`${profile?.name || "Trader"} profile`} />
                  <AvatarFallback className="bg-slate-800 text-lg text-blue-200">{initial}</AvatarFallback>
                </Avatar>
                {isWorking && <span className="absolute inset-0 grid place-items-center rounded-full bg-[#07101f]/75"><LoaderCircle className="h-5 w-5 animate-spin text-blue-200" /></span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {editingName ? <div className="flex w-full max-w-sm items-center gap-2"><input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} autoFocus className="h-9 min-w-0 flex-1 rounded-lg border border-blue-300/[0.22] bg-[#0a1427] px-3 text-sm font-semibold text-white outline-none focus:ring-1 focus:ring-blue-300/60" aria-label="Display name" /><Button type="button" size="icon" onClick={saveDisplayName} disabled={isWorking} className="h-9 w-9 bg-blue-500 text-white hover:bg-blue-400" aria-label="Save display name"><Check className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" onClick={() => { setEditingName(false); setDisplayName(profile?.name || user?.name || "Trader"); }} disabled={isWorking} className="h-9 w-9 border-white/[0.12] text-slate-300 hover:bg-white/[0.06]" aria-label="Cancel display name editing"><X className="h-4 w-4" /></Button></div> : <><h2 className="truncate text-xl font-semibold text-white">{profile?.name || "Trader"}</h2><button type="button" onClick={() => setEditingName(true)} className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-blue-200" aria-label="Edit display name"><Pencil className="h-3.5 w-3.5" /></button></>}
                  {profile?.role === "admin" && <span className="inline-flex items-center gap-1 rounded-full border border-blue-300/[0.20] bg-blue-400/[0.10] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-blue-100"><ShieldCheck className="h-3 w-3" />Founder · Moderator</span>}
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400"><Mail className="h-4 w-4 text-slate-500" />{profile?.email || "Email unavailable"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={choosePhoto} disabled={isWorking} className="bg-[oklch(0.66_0.18_250)] text-white hover:bg-[oklch(0.72_0.18_250)]">
                    <ImagePlus className="mr-2 h-4 w-4" />{profile?.customAvatarUrl ? "Replace photo" : "Upload photo"}
                  </Button>
                  {profile?.customAvatarUrl && <Button type="button" variant="outline" onClick={() => removePhoto.mutate()} disabled={isWorking} className="border-white/[0.12] text-slate-300 hover:bg-white/[0.06] hover:text-white"><Trash2 className="mr-2 h-4 w-4" />Use email avatar</Button>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoSelection} />
                <p className="mt-3 text-xs leading-5 text-slate-500">JPG, PNG, or WebP up to 10 MB. Your custom image appears beside your messages in Trader’s Room.</p>
                {uploadError && <p className="mt-2 text-xs text-red-300" role="alert">{uploadError}</p>}
              </div>
            </div>
          </Card>

          <Card className="border-blue-200/[0.10] bg-[#101c33] p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Account privacy</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span className="text-slate-300">Your journal and account information remain private.</span></div>
              <div className="flex gap-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span className="text-slate-300">Only the trading style you select is shown in Trader’s Room.</span></div>
              <div className="flex gap-3"><CircleUserRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span className="text-slate-300">Your chosen photo is stored separately from your trading journal.</span></div>
            </div>
          </Card>
        </div>

        <Card className="mt-5 border-blue-200/[0.10] bg-[#101c33] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-blue-200/[0.12] bg-blue-400/[0.08] text-blue-200"><UserRound className="h-4 w-4" /></span>
            <div><p className="text-sm font-medium text-white">Profile photo fallback</p><p className="mt-1 text-xs leading-5 text-slate-500">If you remove a custom photo, Trade Fusion returns to the email-linked avatar when available, then uses your private initials fallback.</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
