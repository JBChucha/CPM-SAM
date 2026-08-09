import { Icons } from '@/components/icons';

/**
 * Registry of every screen in the CP SAM redesign.
 *
 * The eight screens do not share a single user flow — they are grouped only by
 * the module they belong to in the legacy SAM system and by the design system
 * they now have in common. `no` is the spine of the whole feature: it matches
 * the legacy capture in `data resource/CP SAM_Redesign/<no>.png` and both
 * thumbnails under `public/portal/{before,after}/<no>.webp`, which is why the
 * card derives its image paths instead of storing them.
 *
 * A screen with `status: 'planned'` has no `href` yet: its card renders as an
 * inert tile. Ship the page, set `href` and flip `status` to 'ready', and the
 * card starts linking on its own.
 */
export type PortalScreenStatus = 'ready' | 'planned';

export type PortalScreen = {
  /** Reference number of the source screenshot (1–8). */
  no: number;
  title: string;
  description: string;
  icon: keyof typeof Icons;
  /** Route in this prototype. Present only once the screen ships. */
  href?: string;
  /** Matching path in the legacy SAM system, shown for side-by-side review. */
  legacyPath: string;
  status: PortalScreenStatus;
};

export type PortalGroup = {
  id: string;
  title: string;
  description: string;
  screens: PortalScreen[];
};

export const PORTAL_GROUPS: PortalGroup[] = [
  {
    id: 'purchase-orders',
    title: 'สั่งซื้อสินค้า',
    description: 'เอเยนต์สร้างใบสั่งซื้อและยืนยันรายการก่อนส่งให้ CP',
    screens: [
      {
        no: 1,
        title: 'สร้างใบสั่งซื้อ',
        description: 'เลือกสินค้าตามหมวดและขนาด ระบุจำนวนที่สั่ง พร้อมแนบไฟล์ใบสั่งซื้อลูกค้า',
        icon: 'cart',
        href: '/dashboard/purchase-orders/create',
        legacyPath: '/SAM_Pentest/Home/CreatePurchaseOrderAgent',
        status: 'ready'
      },
      {
        no: 2,
        title: 'ยืนยันใบสั่งซื้อ',
        description: 'ตรวจสอบสรุปรายการสินค้าที่สั่ง ยอดรวม VAT และประวัติการแก้ไขใบสั่งซื้อ',
        icon: 'invoice',
        href: '/dashboard/purchase-orders/9999999999PO260703',
        legacyPath: '/SAM_Pentest/Home/PurchaseOrder',
        status: 'ready'
      }
    ]
  },
  {
    id: 'sp-withdrawals',
    title: 'เบิกสินค้า SP',
    description: 'พนักงานขายเบิกสินค้าออกจากสต็อกเอเยนต์เพื่อนำไปขาย',
    screens: [
      {
        no: 3,
        title: 'สร้างใบเบิกสินค้า SP',
        description: 'เลือกพนักงานขายและระบุจำนวนที่เบิกรายสินค้า พร้อมแจ้งเตือนหนี้ค้างเคลียร์',
        icon: 'truck',
        href: '/dashboard/sp-withdrawals/create',
        legacyPath: '/SAM_Pentest/Home/CreateWithDrawSP',
        status: 'ready'
      }
    ]
  },
  {
    id: 'sp-payments',
    title: 'เคลียร์เงิน',
    description: 'สรุปยอดขาย ค่าคอมมิชชั่น และหนี้คงค้างของพนักงานขายในแต่ละรอบ',
    screens: [
      {
        no: 4,
        title: 'รายการเคลียร์เงิน',
        description: 'ค้นหาใบเคลียร์เงินตามช่วงวันที่และพนักงานขาย ดูรายละเอียดหรือดาวน์โหลดเอกสาร',
        icon: 'billing',
        href: '/dashboard/sp-payments',
        legacyPath: '/SAM_Pentest/Home/ManageSpPayment',
        status: 'ready'
      },
      {
        no: 5,
        title: 'ขั้นที่ 1 — เลือกพนักงานและเลขที่ใบเบิก',
        description: 'เลือกพนักงานขาย แล้วเลือกใบเบิกสินค้าที่จะนำมาเคลียร์ในรอบนี้',
        icon: 'employee',
        href: '/dashboard/sp-payments/create?step=1',
        legacyPath: '/SAM_Pentest/Home/CreateSPPayment',
        status: 'ready'
      },
      {
        no: 6,
        title: 'ขั้นที่ 3 — ส่งเงินสุทธิและค่าคอมฯ',
        description: 'สรุปรายการเบิก/ขายรายวัน คำนวณมูลค่าที่ขายได้จริงและค่าคอมมิชชั่น',
        icon: 'coins',
        href: '/dashboard/sp-payments/create?step=3',
        legacyPath: '/SAM_Pentest/Home/CreateSPPayment',
        status: 'ready'
      },
      {
        no: 7,
        title: 'ขั้นที่ 4 — หนี้/รายได้อื่นๆ',
        description: 'บันทึกหนี้อื่นๆ และรายได้เพิ่มเติมของพนักงาน แล้วสรุปยอดที่ต้องชำระ',
        icon: 'creditCard',
        href: '/dashboard/sp-payments/create?step=4',
        legacyPath: '/SAM_Pentest/Home/CreateSPPayment',
        status: 'ready'
      },
      {
        no: 8,
        title: 'ขั้นที่ 5 — สรุปการเคลียร์เงิน',
        description: 'สรุปยอดส่งเงินสุทธิ หนี้ยกไป และคอมมิชชั่นสะสม ก่อนปิดรอบการเคลียร์',
        icon: 'checks',
        href: '/dashboard/sp-payments/create?step=5',
        legacyPath: '/SAM_Pentest/Home/CreateSPPayment',
        status: 'ready'
      }
    ]
  }
];

/**
 * The portal renders one flat 4×2 grid rather than three stacked sections — that
 * is the only way all eight entries fit on a laptop screen without scrolling —
 * so each screen carries its group label along for the card to show as a tag.
 */
export type PortalScreenWithGroup = PortalScreen & {
  groupId: string;
  groupTitle: string;
};

export const PORTAL_SCREENS: PortalScreenWithGroup[] = PORTAL_GROUPS.flatMap((group) =>
  group.screens.map((screen) => ({
    ...screen,
    groupId: group.id,
    groupTitle: group.title
  }))
);

export const PORTAL_READY_COUNT = PORTAL_SCREENS.filter(
  (screen) => screen.status === 'ready'
).length;

/**
 * All thumbnails are regenerated by `npm run portal:shots`.
 *
 * The redesigned screen has two captures — one per colour scheme — so the
 * thumbnail matches the theme the portal is being viewed in. The legacy system
 * only ever had one look, so `before` is a single image.
 */
export function portalThumbnails(screen: PortalScreen) {
  return {
    before: `/portal/before/${screen.no}.webp?v=2`,
    afterLight: `/portal/after/light/${screen.no}.webp?v=2`,
    afterDark: `/portal/after/dark/${screen.no}.webp?v=2`
  };
}
