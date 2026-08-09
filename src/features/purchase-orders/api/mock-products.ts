export interface ProductItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  price: number;
  vat: number; // e.g. 0 or 7
  stock: number; // whole units on hand (ขวด / ถ้วย) — never fractional
  recommended: number;
  size: string; // e.g. "ขนาด 200 cc"
  packSize: string; // e.g. "49 / ลัง"
  category: string; // e.g. "นมพาสเจอร์ไรส์", "นมเปรี้ยว", "นมเปรี้ยวโพรไบโอ", "โยเกิร์ตเมจิ"
  image: string; // SVG data URL
}

// SVG helpers for product thumbnails
const svgMilk = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
  <rect x="30" y="35" width="40" height="55" rx="5" fill="${color}" stroke="#333" stroke-width="2"/>
  <path d="M30 35 L40 15 L60 15 L70 35 Z" fill="#fff" stroke="#333" stroke-width="2"/>
  <rect x="45" y="10" width="10" height="5" fill="#333"/>
  <circle cx="50" cy="60" r="12" fill="#fff" opacity="0.8"/>
  <path d="M45 55 Q50 48 55 55 Q50 68 45 55 Z" fill="#2563eb"/>
  <text x="50" y="80" font-family="sans-serif" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">MEIJI</text>
</svg>
`)}`;

const svgYogurt = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
  <path d="M25 30 L75 30 L65 85 L35 85 Z" fill="#fff" stroke="#333" stroke-width="2"/>
  <ellipse cx="50" cy="30" rx="25" ry="8" fill="${color}" stroke="#333" stroke-width="2"/>
  <ellipse cx="50" cy="28" rx="20" ry="6" fill="#fff"/>
  <rect x="32" y="45" width="36" height="20" rx="3" fill="${color}" opacity="0.2"/>
  <text x="50" y="58" font-family="sans-serif" font-size="8" font-weight="bold" fill="#333" text-anchor="middle">YOGURT</text>
  <circle cx="50" cy="72" r="5" fill="red"/>
</svg>
`)}`;

export const MOCK_PRODUCTS: ProductItem[] = [
  // ─── นมพาสเจอร์ไรส์ ───
  {
    id: 1,
    code: '72000726',
    name: 'PM 200 จืด',
    unit: 'ขวด',
    price: 9.34,
    vat: 0,
    stock: 14696,
    recommended: 1,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#f3f4f6')
  },
  {
    id: 2,
    code: '72000731',
    name: 'PM 200 ขาดมันเนย',
    unit: 'ขวด',
    price: 9.34,
    vat: 0,
    stock: 3064,
    recommended: 1,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#93c5fd')
  },
  {
    id: 3,
    code: '72000724',
    name: 'PM 200 กาแฟ',
    unit: 'ขวด',
    price: 8.32,
    vat: 7,
    stock: 2988,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#b45309')
  },
  {
    id: 4,
    code: '72000073',
    name: 'PM 200 ช็อกโกแลต',
    unit: 'ขวด',
    price: 8.65,
    vat: 7,
    stock: 3086,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#78350f')
  },
  {
    id: 5,
    code: '72000723',
    name: 'PM 200 รสหวาน',
    unit: 'ขวด',
    price: 8.65,
    vat: 7,
    stock: 3002,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#fef08a')
  },
  {
    id: 6,
    code: '72000733',
    name: 'PM 200 สตรอเบอร์รี่',
    unit: 'ขวด',
    price: 8.65,
    vat: 7,
    stock: 3088,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#fca5a5')
  },
  {
    id: 7,
    code: '72000720',
    name: 'PM 200 เมล่อนญี่ปุ่น',
    unit: 'ขวด',
    price: 8.65,
    vat: 7,
    stock: 2778,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#86efac')
  },
  {
    id: 8,
    code: '72001101',
    name: 'PM 200 นมสด กลิ่นกล้วย',
    unit: 'ขวด',
    price: 8.65,
    vat: 7,
    stock: 3100,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#fde047')
  },
  {
    id: 9,
    code: '72001663',
    name: 'PM 200 กาแฟผสมโสม(ไม่เติมน้ำตาลทราย)',
    unit: 'ขวด',
    price: 8.65,
    vat: 7,
    stock: 3100,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#7c2d12')
  },
  {
    id: 10,
    code: '72001786',
    name: 'PM 200 รสผักผลไม้รวมรสชาหวานน้อย',
    unit: 'ขวด',
    price: 8.65,
    vat: 7,
    stock: 3100,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '49 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#a7f3d0')
  },
  {
    id: 11,
    code: '72000801',
    name: 'PM 350 จืด',
    unit: 'ขวด',
    price: 17.5,
    vat: 0,
    stock: 9500,
    recommended: 2,
    size: 'ขนาด 350 cc',
    packSize: '36 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#f3f4f6')
  },
  {
    id: 12,
    code: '72000802',
    name: 'PM 350 ขาดมันเนย',
    unit: 'ขวด',
    price: 17.5,
    vat: 0,
    stock: 4200,
    recommended: 1,
    size: 'ขนาด 350 cc',
    packSize: '36 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#93c5fd')
  },
  {
    id: 13,
    code: '72000803',
    name: 'PM 350 ช็อกโกแลต',
    unit: 'ขวด',
    price: 16.5,
    vat: 7,
    stock: 5500,
    recommended: 0,
    size: 'ขนาด 350 cc',
    packSize: '36 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#78350f')
  },
  {
    id: 14,
    code: '72000804',
    name: 'PM 350 กาแฟ',
    unit: 'ขวด',
    price: 16.5,
    vat: 7,
    stock: 6000,
    recommended: 0,
    size: 'ขนาด 350 cc',
    packSize: '36 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#b45309')
  },
  {
    id: 15,
    code: '72000901',
    name: 'PM 400 จืด (ขวดแก้ว)',
    unit: 'ขวด',
    price: 22.0,
    vat: 0,
    stock: 2000,
    recommended: 0,
    size: 'ขนาด 400 cc',
    packSize: '20 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#cbd5e1')
  },
  {
    id: 16,
    code: '72001001',
    name: 'PM 450 จืด',
    unit: 'ขวด',
    price: 24.5,
    vat: 0,
    stock: 4000,
    recommended: 1,
    size: 'ขนาด 450 cc',
    packSize: '20 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#f3f4f6')
  },
  {
    id: 17,
    code: '72001002',
    name: 'PM 450 ขาดมันเนย',
    unit: 'ขวด',
    price: 24.5,
    vat: 0,
    stock: 2500,
    recommended: 0,
    size: 'ขนาด 450 cc',
    packSize: '20 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#93c5fd')
  },
  {
    id: 18,
    code: '72001201',
    name: 'PM 450 ลังใหญ่ จืด',
    unit: 'ขวด',
    price: 24.0,
    vat: 0,
    stock: 1500,
    recommended: 0,
    size: 'ขนาด 450 cc',
    packSize: '36 / ลัง',
    category: 'นมพาสเจอร์ไรส์',
    image: svgMilk('#f3f4f6')
  },

  // ─── นมเปรี้ยว ───
  {
    id: 19,
    code: '73000101',
    name: 'นมเปรี้ยว กลิ่นผลไม้รวม',
    unit: 'ขวด',
    price: 7.0,
    vat: 7,
    stock: 12000,
    recommended: 5,
    size: 'ขนาด 100 cc',
    packSize: '48 / ลัง',
    category: 'นมเปรี้ยว',
    image: svgMilk('#f472b6')
  },
  {
    id: 20,
    code: '73000102',
    name: 'นมเปรี้ยว กลิ่นส้ม',
    unit: 'ขวด',
    price: 7.0,
    vat: 7,
    stock: 8000,
    recommended: 3,
    size: 'ขนาด 100 cc',
    packSize: '48 / ลัง',
    category: 'นมเปรี้ยว',
    image: svgMilk('#fb923c')
  },
  {
    id: 21,
    code: '73000103',
    name: 'นมเปรี้ยว กลิ่นสตรอเบอร์รี่',
    unit: 'ขวด',
    price: 7.0,
    vat: 7,
    stock: 9500,
    recommended: 0,
    size: 'ขนาด 100 cc',
    packSize: '48 / ลัง',
    category: 'นมเปรี้ยว',
    image: svgMilk('#fca5a5')
  },
  {
    id: 22,
    code: '73000201',
    name: 'นมเปรี้ยว 200 cc กลิ่นผลไม้รวม',
    unit: 'ขวด',
    price: 12.5,
    vat: 7,
    stock: 6400,
    recommended: 2,
    size: 'ขนาด 200 cc',
    packSize: '36 / ลัง',
    category: 'นมเปรี้ยว',
    image: svgMilk('#f472b6')
  },
  {
    id: 23,
    code: '73000202',
    name: 'นมเปรี้ยว 200 cc กลิ่นส้ม',
    unit: 'ขวด',
    price: 12.5,
    vat: 7,
    stock: 4000,
    recommended: 0,
    size: 'ขนาด 200 cc',
    packSize: '36 / ลัง',
    category: 'นมเปรี้ยว',
    image: svgMilk('#fb923c')
  },
  {
    id: 24,
    code: '73000203',
    name: 'นมเปรี้ยว 200 cc กลิ่นบลูเบอร์รี่',
    unit: 'ขวด',
    price: 12.5,
    vat: 7,
    stock: 5000,
    recommended: 1,
    size: 'ขนาด 200 cc',
    packSize: '36 / ลัง',
    category: 'นมเปรี้ยว',
    image: svgMilk('#c084fc')
  },

  // ─── นมเปรี้ยวโพรไบโอ ───
  {
    id: 25,
    code: '74000101',
    name: 'ไพเกน โพรไบโอติก รสจืด',
    unit: 'ขวด',
    price: 8.5,
    vat: 7,
    stock: 11000,
    recommended: 3,
    size: 'ขนาด 100 cc',
    packSize: '48 / ลัง',
    category: 'นมเปรี้ยวโพรไบโอ',
    image: svgMilk('#38bdf8')
  },
  {
    id: 26,
    code: '74000102',
    name: 'ไพเกน โพรไบโอติก รสบลูเบอร์รี่',
    unit: 'ขวด',
    price: 8.5,
    vat: 7,
    stock: 7500,
    recommended: 2,
    size: 'ขนาด 100 cc',
    packSize: '48 / ลัง',
    category: 'นมเปรี้ยวโพรไบโอ',
    image: svgMilk('#818cf8')
  },

  // ─── โยเกิร์ตเมจิ ───
  {
    id: 27,
    code: '75000101',
    name: 'โยเกิร์ต รสธรรมชาติ',
    unit: 'ถ้วย',
    price: 14.0,
    vat: 7,
    stock: 8500,
    recommended: 4,
    size: 'ขนาด 110 g',
    packSize: '36 / ลัง',
    category: 'โยเกิร์ตเมจิ',
    image: svgYogurt('#f3f4f6')
  },
  {
    id: 28,
    code: '75000102',
    name: 'โยเกิร์ต รสสตรอเบอร์รี่',
    unit: 'ถ้วย',
    price: 14.0,
    vat: 7,
    stock: 9000,
    recommended: 4,
    size: 'ขนาด 110 g',
    packSize: '36 / ลัง',
    category: 'โยเกิร์ตเมจิ',
    image: svgYogurt('#fca5a5')
  },
  {
    id: 29,
    code: '75000103',
    name: 'โยเกิร์ต รสวุ้นมะพร้าว',
    unit: 'ถ้วย',
    price: 14.0,
    vat: 7,
    stock: 6500,
    recommended: 0,
    size: 'ขนาด 110 g',
    packSize: '36 / ลัง',
    category: 'โยเกิร์ตเมจิ',
    image: svgYogurt('#e2e8f0')
  },
  {
    id: 30,
    code: '75000104',
    name: 'โยเกิร์ต รสบลูเบอร์รี่',
    unit: 'ถ้วย',
    price: 14.0,
    vat: 7,
    stock: 7000,
    recommended: 2,
    size: 'ขนาด 110 g',
    packSize: '36 / ลัง',
    category: 'โยเกิร์ตเมจิ',
    image: svgYogurt('#c084fc')
  }
];
