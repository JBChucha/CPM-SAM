import { MOCK_PRODUCTS, type ProductItem } from '@/features/purchase-orders/api/mock-products';

/**
 * Product catalog seen from a sales rep's (SP) point of view.
 *
 * Built on top of the purchase-order catalog so both modules always show the
 * same products, codes, sizes and pack sizes — the withdrawal screen and the
 * clearing wizard have to agree on what was taken out and what came back.
 * `mock-products.ts` itself is only read here, never modified.
 *
 * Every derived number is a pure function of the product, not `Math.random`:
 * the values must be identical on the server and the client or React would
 * report a hydration mismatch, and identical between screen visits or the
 * wizard totals would drift between steps.
 */
export interface SpProductItem extends ProductItem {
  /** Selling price the rep charges, as printed on the withdrawal slip. */
  spPrice: number;
  /** Units the rep is already carrying (สต็อก SP). */
  spStock: number;
  /** Units left on consignment with shops (จำนวนที่ฝาก). */
  deposited: number;
  /** Units reserved for standing orders (ลูกค้าประจำ). */
  regularCustomer: number;
}

/**
 * Selling prices read off the reference screens. Products outside that capture
 * fall back to the rule below.
 */
const SP_PRICE_BY_CODE: Record<string, number> = {
  '72000726': 12.0,
  '72000731': 12.0,
  '72000724': 11.2,
  '72000873': 12.0,
  '72000723': 12.0,
  '72001770': 12.0,
  '72001769': 12.0,
  '72001768': 12.0,
  '72000733': 12.0,
  '72001767': 12.0,
  '72000720': 12.0,
  '72001771': 12.0,
  '72001101': 12.0,
  '72001149': 18.5,
  '72001618': 18.5,
  '72001663': 12.0,
  '72001786': 12.0
};

/**
 * Fallback selling price: the wholesale price marked up and rounded to the
 * nearest quarter baht, which is how the listed prices above relate to their
 * purchase-order counterparts.
 */
const deriveSpPrice = (price: number) => Math.round(price * 1.3 * 4) / 4;

/**
 * Small deterministic hash → a stable "random-looking" number per product.
 * Seeded by the product id so the same product always yields the same figures.
 */
const seeded = (id: number, salt: number, max: number) => ((id * 37 + salt * 101) % (max + 1)) | 0;

export const SP_PRODUCTS: SpProductItem[] = MOCK_PRODUCTS.map((product) => {
  const spStock = seeded(product.id, 1, 12);
  return {
    ...product,
    spPrice: SP_PRICE_BY_CODE[product.code] ?? deriveSpPrice(product.price),
    spStock,
    // A rep can never have more on consignment than they are carrying.
    deposited: Math.min(spStock, seeded(product.id, 2, 8)),
    regularCustomer: seeded(product.id, 3, 4)
  };
});

/** The four catalog tabs, in the order the reference screens show them. */
export const SP_CATEGORIES = ['นมพาสเจอร์ไรส์', 'นมเปรี้ยว', 'นมเปรี้ยวโพรไบโอ', 'โยเกิร์ตเมจิ'] as const;

export type SpCategory = (typeof SP_CATEGORIES)[number];

export function getSpProductsByCategory(category: string) {
  return SP_PRODUCTS.filter((product) => product.category === category);
}

export interface SpStaffItem {
  id: number;
  name: string;
  code: string;
  route: string;
}

/** Sales reps available in the pickers, matching the reference data. */
export const SP_STAFF: SpStaffItem[] = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  name: `พนักงานขาย คนที่${index + 1}`,
  code: `SP${String(index + 1).padStart(3, '0')}`,
  route: `สายการขายที่ ${(index % 5) + 1}`
}));

/**
 * Billing cycles a rep still owes money for. The withdrawal screen warns about
 * this before letting more stock leave — the reference capture shows "พนักงาน
 * ค้างเคลียร์หนี้ 3 รอบบิล" for คนที่1, so that rep keeps three here.
 *
 * Derived from the id rather than stored per rep: only some reps should be in
 * arrears, and the same rep must always show the same figure.
 */
export function getOutstandingCycles(staffId: number) {
  if (staffId === 1) return 3;
  // Every third rep carries a debt of one or two cycles; the rest are clear.
  return staffId % 3 === 0 ? (staffId % 2 === 0 ? 2 : 1) : 0;
}
