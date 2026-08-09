'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Employee', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' }
  ],
  '/dashboard/purchase-orders/create': [
    { title: 'หน้าหลัก', link: '/dashboard' },
    { title: 'รายการคำสั่งซื้อ', link: '/dashboard/purchase-orders' },
    { title: 'สร้างใบสั่งซื้อ', link: '/dashboard/purchase-orders/create' }
  ],
  '/dashboard/sp-withdrawals/create': [
    { title: 'หน้าหลัก', link: '/dashboard' },
    { title: 'เบิกสินค้า SP', link: '/dashboard/sp-withdrawals' },
    { title: 'สร้างใบเบิกสินค้า SP', link: '/dashboard/sp-withdrawals/create' }
  ],
  '/dashboard/sp-payments': [
    { title: 'หน้าหลัก', link: '/dashboard' },
    { title: 'เคลียร์เงิน/เบิกค่าคอมมิชชั่น', link: '/dashboard/sp-payments' },
    { title: 'เคลียร์เงิน', link: '/dashboard/sp-payments' }
  ],
  // ระบบเดิมตัดชั้นกลุ่มเมนู 'เคลียร์เงิน/เบิกค่าคอมมิชชั่น' ออกในหน้าเพิ่มรายการ
  // เหลือ 3 ระดับตามภาพหน้า 5–8 ต่างจากหน้ารายการ (/dashboard/sp-payments) ที่ยังมี 4 ชั้นเดิม
  '/dashboard/sp-payments/create': [
    { title: 'หน้าหลัก', link: '/dashboard' },
    { title: 'เคลียร์เงิน', link: '/dashboard/sp-payments' },
    { title: 'เพิ่มรายการฝาก/คืน', link: '/dashboard/sp-payments/create' }
  ]
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // Purchase order detail view: /dashboard/purchase-orders/[id]
    const orderDetailMatch = pathname.match(/^\/dashboard\/purchase-orders\/(?!create$)([^/]+)$/);
    if (orderDetailMatch) {
      return [
        { title: 'หน้าหลัก', link: '/dashboard' },
        { title: 'ข้อมูลการสั่งซื้อสินค้า', link: '/dashboard/purchase-orders' },
        { title: 'รายการสั่งซื้อสินค้า', link: '/dashboard/purchase-orders' },
        { title: `ใบสั่งซื้อเลขที่_${decodeURIComponent(orderDetailMatch[1])}`, link: pathname }
      ];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
