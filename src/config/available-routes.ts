/**
 * Routes that currently have a real page in this prototype.
 *
 * Everything else in the navigation (เหรียญและของรางวัล, ใบแจ้งหนี้, ข่าวสาร,
 * ติดต่อเรา, วารสารประจำปี, เปลี่ยนรหัสผ่าน, โปรไฟล์ …) is still a placeholder:
 * those paths have no `page.tsx`, and Clerk's middleware treats them as
 * protected, so following them bounces the user out to the Clerk sign-in page.
 *
 * Until those pages exist, navigation targets that are not listed here render
 * as inert controls — they keep their normal appearance but stay on the
 * current page instead of navigating. Add a path here as soon as its page
 * ships and the link starts working again automatically.
 */
export const AVAILABLE_ROUTES = [
  '/dashboard/purchase-orders/create',
  '/dashboard/sp-withdrawals/create',
  '/dashboard/sp-payments',
  '/dashboard/sp-payments/create'
];

export function isAvailableRoute(url?: string) {
  if (!url) return false;
  const path = url.split('?')[0];
  if (AVAILABLE_ROUTES.includes(path)) return true;
  if (/^\/dashboard\/purchase-orders\/[^/]+$/.test(path)) return true;
  if (/^\/dashboard\/sp-payments\/[^/]+$/.test(path)) return true;
  return false;
}
