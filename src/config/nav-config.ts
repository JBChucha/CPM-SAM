import { NavGroup, NavItem } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
const HOME: NavItem = {
  title: 'หน้าหลัก',
  url: '/dashboard/overview',
  icon: 'dashboard',
  isActive: false,
  items: []
};

const JOURNAL: NavItem = {
  title: 'วารสารประจำปี',
  url: '/dashboard/journal',
  icon: 'book',
  isActive: false,
  items: []
};

const CHANGE_PASSWORD: NavItem = {
  title: 'เปลี่ยนรหัสผ่าน',
  url: '/dashboard/change-password',
  icon: 'key',
  isActive: false,
  items: []
};

const CONTACT: NavItem = {
  title: 'ติดต่อเรา',
  url: '/dashboard/contact',
  icon: 'world',
  isActive: false,
  items: []
};

export const navGroups: NavGroup[] = [
  {
    label: 'เมนูหลัก',
    items: [
      HOME,
      {
        title: 'เหรียญและของรางวัล',
        url: '/dashboard/rewards',
        icon: 'coins',
        isActive: false,
        items: []
      },
      {
        title: 'ใบแจ้งหนี้ (Invoice)',
        url: '/dashboard/invoices',
        icon: 'invoice',
        isActive: false,
        items: []
      },
      {
        title: 'ข่าวสารและโปรโมชั่น',
        url: '/dashboard/news',
        icon: 'news',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'ทั่วไป',
    items: [JOURNAL, CONTACT, CHANGE_PASSWORD]
  }
];

/**
 * Trimmed menu used by the order-detail screen, which the reference system
 * reaches from a context where only these three destinations stay available.
 */
export const compactNavGroups: NavGroup[] = [
  {
    label: 'เมนูหลัก',
    items: [HOME]
  },
  {
    label: 'ทั่วไป',
    items: [JOURNAL, CHANGE_PASSWORD]
  }
];

/** Routes rendered with `compactNavGroups` instead of the full agent menu. */
const COMPACT_NAV_PATTERNS = [
  // A purchase order by id — /dashboard/purchase-orders/create keeps the full menu.
  /^\/dashboard\/purchase-orders\/(?!create$)[^/]+$/
];

export function getNavGroupsForPath(pathname: string): NavGroup[] {
  return COMPACT_NAV_PATTERNS.some((pattern) => pattern.test(pathname))
    ? compactNavGroups
    : navGroups;
}
