export const SUPPORT_CATEGORIES = [
  "Personal details",
  "Investment details",
  "File issues",
  "Payout details",
  "Technical issues",
  "Other",
] as const;

export const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

// Some investor records have associate_name filled in with a variant of the investor's own
// name (self-entered during registration) rather than a genuine referrer — treat those as
// "no associate" instead of displaying a confusing near-duplicate name.
export function isDistinctAssociateName(investorName: string, associateName: string | null): associateName is string {
  if (!associateName?.trim()) return false;
  const a = associateName.trim().toLowerCase();
  const n = investorName.trim().toLowerCase();
  return a !== n && !n.includes(a) && !a.includes(n);
}

const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function isAllowedAttachmentType(mimeType: string): boolean {
  return ALLOWED_ATTACHMENT_MIME_TYPES.includes(mimeType);
}

export function fileCategoryForMimeType(mimeType: string): "IMAGE" | "DOCUMENT" {
  return IMAGE_MIME_TYPES.has(mimeType) ? "IMAGE" : "DOCUMENT";
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
