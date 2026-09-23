export const ALLOWED_EMAIL_DOMAIN = "@cornell.edu";

export function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}
