/** Owner-only screenshot constraints for private trade Journal entries. */
export const TRADE_JOURNAL_ATTACHMENT_RULES = {
  maxFilesPerEntry: 4,
  maxBytesPerFile: 3 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;
