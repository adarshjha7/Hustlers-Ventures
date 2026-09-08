// Admins are identified by email - no DB column or table needed.
// To grant admin access to another account, add its email here.
const ADMIN_EMAILS = new Set([
  "superadmin@mail.com",
]);

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}
