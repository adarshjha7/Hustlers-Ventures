/**
 * Normalises any user-typed phone (with +, spaces, dashes) into the canonical
 * display/storage form: "+91 9876543210" for Indian mobiles, "+<digits>" for others.
 *
 * Used by both server (storage) and client (display) so the format is consistent.
 */
export function formatPhoneE164(input: string | null | undefined): string {
  if (!input) return "";
  let digits = String(input).replace(/[^\d]/g, "");
  // Bare 10-digit Indian mobile → prepend country code.
  if (/^[6-9]\d{9}$/.test(digits)) digits = `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2)}`;
  }
  return `+${digits}`;
}

/** Strip everything but digits (used when a downstream API needs E.164-without-+). */
export function phoneDigitsOnly(input: string | null | undefined): string {
  return input ? String(input).replace(/[^\d]/g, "") : "";
}
