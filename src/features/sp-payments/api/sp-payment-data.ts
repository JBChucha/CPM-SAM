import { DEMO_USER } from '@/config/demo-user';
import { SP_PRODUCTS, SP_STAFF, type SpProductItem } from '@/features/sp/api/sp-catalog';

/**
 * Mock data for the เคลียร์เงิน module (ManageSpPayment / CreateSPPayment).
 *
 * Same rules as `sp/api/sp-catalog.ts`: every figure is a pure function of its
 * inputs, never `Math.random` and never `new Date()` at module scope, so the
 * numbers are identical on the server and the client (no hydration mismatch)
 * and identical between wizard steps (the totals must not drift as the user
 * walks back and forth).
 *
 * Where the reference captures show concrete values — the ten rows of the
 * clearing list, คนที่1's carried debt and accumulated commission — those exact
 * values are kept here so a screen can be read side by side with its capture.
 */

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** Deterministic hash → a stable "random-looking" number. */
const seeded = (value: number, salt: number, max: number) =>
  ((value * 37 + salt * 101) % (max + 1)) | 0;

const round2 = (value: number) => Math.round(value * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// Commission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Commission rate per product, keyed by catalog size.
 *
 * Read off the reference capture of ขั้นตอนที่ 3, where the คอมมิชชั่น column is
 * a fixed percentage of มูลค่า per product line: PM 200 pays 27.20 on 204.00
 * (2/15), PM 350 pays 18.00 on 276.00, PM 450 pays 23.11 on 308.05, and the
 * cultured-milk lines pay 5.00 on 90.00.
 */
const COMMISSION_RATE_BY_SIZE: Record<string, number> = {
  'ขนาด 100 cc': 0.0556,
  'ขนาด 110 g': 0.0652,
  'ขนาด 200 cc': 2 / 15,
  'ขนาด 350 cc': 0.0652,
  'ขนาด 400 cc': 0.075,
  'ขนาด 450 cc': 0.075
};

/** Rate for a size outside the map above — the mid rate of the ones that are. */
const DEFAULT_COMMISSION_RATE = 0.075;

export function getCommissionRate(product: SpProductItem) {
  return COMMISSION_RATE_BY_SIZE[product.size] ?? DEFAULT_COMMISSION_RATE;
}

/** Commission earned on one product line, rounded the way the slip prints it. */
export function getLineCommission(product: SpProductItem, soldValue: number) {
  return round2(soldValue * getCommissionRate(product));
}

// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal slips — ขั้นตอนที่ 1 picks the slips a clearing round covers
// ─────────────────────────────────────────────────────────────────────────────

export interface SlipLine {
  productId: number;
  /** Units the rep took out on this slip. */
  qty: number;
}

export interface WithdrawalSlip {
  /** เลขที่ใบเบิกสินค้า — staff code + YYYYMMDD, e.g. 00320251214. */
  id: string;
  date: Date;
  lines: SlipLine[];
}

/**
 * Fixed "today" for generated documents. A literal rather than `new Date()`:
 * slip numbers embed their date, and a clock-derived anchor would renumber the
 * documents at midnight and could differ between the server and the client.
 */
const ANCHOR = new Date(2026, 7, 1);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const documentDate = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

/**
 * The products one slip covers. Walks the catalog with a seeded start and
 * stride, skipping repeats, so a slip lists 8–14 distinct products drawn from
 * across the four categories — the mix the reference capture shows.
 */
function buildSlipLines(staffId: number, slipIndex: number): SlipLine[] {
  const count = 8 + seeded(staffId, slipIndex, 6);
  const stride = 1 + seeded(staffId, slipIndex + 9, 2);
  const start = seeded(staffId, slipIndex + 5, SP_PRODUCTS.length - 1);

  const products: SpProductItem[] = [];
  const taken = new Set<number>();
  for (let step = 0; products.length < count && step < SP_PRODUCTS.length * 3; step += 1) {
    const product = SP_PRODUCTS[(start + step * stride) % SP_PRODUCTS.length];
    if (taken.has(product.id)) continue;
    taken.add(product.id);
    products.push(product);
  }

  return products.map((product) => ({
    productId: product.id,
    qty: 1 + seeded(product.id, slipIndex + staffId, 49)
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// รอบเคลียร์เงินอ้างอิงของ คนที่1 — the round the reference captures 5–8 show
// ─────────────────────────────────────────────────────────────────────────────

/** The rep every reference capture of the wizard was taken on. */
const REFERENCE_STAFF_ID = 1;

/** ฝาก/คืน of one product — structurally the `DepositReturnEntry` of the wizard. */
export interface DepositReturn {
  deposited: number;
  returned: number;
}

interface ReferenceLine extends DepositReturn {
  productId: number;
  /** Which of the three slips below the line was taken out on. */
  slip: number;
  /** จำนวนที่เบิก. */
  withdrawn: number;
}

/**
 * The fourteen product lines of the reference round, with the ฝาก/คืน the rep
 * came back with — เบิก − ฝาก − คืน is what they actually sold.
 *
 * The quantities are picked so the wizard lands on the exact figures printed on
 * the reference summary (capture 8), using this prototype's own catalog and
 * commission rates:
 *
 *   มูลค่าสินค้าเบิก      4,134.35
 *   1. มูลค่าสินค้าขายจริง  1,055.65   → 12. ยอดคงค้างยกไป 1,055.65 (ยังไม่ชำระ)
 *   ค่าคอมมิชชั่นที่ได้        96.32   → คอมมิชชั่นสะสมสุทธิ 2,958.72
 *
 * The legacy round is built from SKUs this prototype's catalog does not carry
 * (PM 350 เมจิเฮโปรตีน, PM 450 เมจิเรฟ, DY 150, PG 80, SY 135), so the products
 * differ line for line — the totals, which are what the summary screen shows,
 * do not. Eight of the lines came back fully ฝาก and sold nothing, the same
 * shape the capture has.
 */
const REFERENCE_LINES: ReferenceLine[] = [
  // ── 00320251214 ────────────────────────────────────────── ขายได้ 204.00 ──
  { slip: 0, productId: 1, withdrawn: 23, deposited: 5, returned: 1 },
  { slip: 0, productId: 2, withdrawn: 22, deposited: 13, returned: 1 },
  { slip: 0, productId: 3, withdrawn: 8, deposited: 1, returned: 0 },
  { slip: 0, productId: 4, withdrawn: 3, deposited: 3, returned: 0 },
  { slip: 0, productId: 5, withdrawn: 16, deposited: 16, returned: 0 },
  // ── 00320251216 ────────────────────────────────────────────────────────────
  { slip: 1, productId: 11, withdrawn: 20, deposited: 20, returned: 0 },
  { slip: 1, productId: 15, withdrawn: 20, deposited: 8, returned: 0 },
  { slip: 1, productId: 19, withdrawn: 30, deposited: 8, returned: 3 },
  { slip: 1, productId: 27, withdrawn: 20, deposited: 11, returned: 0 },
  // ── 00320260226 ────────────────────────────────────────────────────────────
  { slip: 2, productId: 16, withdrawn: 20, deposited: 20, returned: 0 },
  { slip: 2, productId: 22, withdrawn: 20, deposited: 20, returned: 0 },
  { slip: 2, productId: 25, withdrawn: 20, deposited: 20, returned: 0 },
  { slip: 2, productId: 26, withdrawn: 20, deposited: 20, returned: 0 },
  { slip: 2, productId: 29, withdrawn: 12, deposited: 12, returned: 0 }
];

/** เลขที่ใบเบิกสินค้า / วันที่เบิก, value for value from the capture of ขั้นตอนที่ 1. */
const REFERENCE_SLIPS: { id: string; date: Date }[] = [
  { id: '00320251214', date: new Date(2025, 11, 14) },
  { id: '00320251216', date: new Date(2025, 11, 16) },
  { id: '00320260226', date: new Date(2026, 1, 26) }
];

/**
 * Slips still waiting to be cleared for a rep, newest last — the same three-row
 * table the reference shows for คนที่1 (00320251214, 00320251216, 00320260226).
 */
export function getWithdrawalSlips(staffId: number): WithdrawalSlip[] {
  if (staffId === REFERENCE_STAFF_ID) {
    return REFERENCE_SLIPS.map((slip, slipIndex) => ({
      ...slip,
      lines: REFERENCE_LINES.filter((line) => line.slip === slipIndex).map((line) => ({
        productId: line.productId,
        qty: line.withdrawn
      }))
    }));
  }

  return [0, 1, 2].map((slipIndex) => {
    const date = addDays(ANCHOR, -(230 - slipIndex * 2 - seeded(staffId, slipIndex, 40)));
    return {
      id: `${pad(staffId, 3)}${documentDate(date)}`,
      date,
      lines: buildSlipLines(staffId, slipIndex)
    };
  });
}

/**
 * ฝาก/คืน the wizard opens ขั้นตอนที่ 2 with, keyed by product.
 *
 * Only the reference rep starts with anything: their round is a finished one
 * being re-entered, so the summary reads like the capture without the reviewer
 * having to key the ฝาก/คืน back in. Every other rep starts from zero.
 */
export function getDepositReturnEntries(staffId: number): Record<number, DepositReturn> {
  if (staffId !== REFERENCE_STAFF_ID) return {};

  return Object.fromEntries(
    REFERENCE_LINES.map((line) => [
      line.productId,
      { deposited: line.deposited, returned: line.returned }
    ])
  );
}

/** Pre-populated map helper for withdrawal slips by staff ID. */
export const CLEARING_SLIPS_BY_STAFF: Record<number, WithdrawalSlip[]> = new Proxy(
  {},
  {
    get: (_, prop) => getWithdrawalSlips(Number(prop))
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Carry-over per rep
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ยอดหนี้คงค้างยกมา — money still owed from the rep's previous clearing round.
 *
 * คนที่1 is the rep in the reference captures, which show 0.00 on every debt
 * row, so that rep stays at zero here; the rest carry a seeded balance only
 * when they have an unclosed billing cycle.
 */
export function getCarriedDebt(staffId: number) {
  if (staffId === 1) return 0;
  return staffId % 3 === 0 ? round2(seeded(staffId, 4, 4000) / 4) : 0;
}

/**
 * คอมมิชชั่นสะสมสุทธิ before this round. คนที่1 holds the exact figure behind
 * the reference summary (2,958.72 accumulated on 96.32 earned this round).
 */
export function getAccumulatedCommission(staffId: number) {
  if (staffId === 1) return 2862.4;
  return round2(seeded(staffId, 6, 40000) / 10);
}

/**
 * หนี้ยกมา on the หนี้/รายได้อื่นๆ side — money the rep owes for something other
 * than goods (a float, a damaged crate). A separate carry-over from
 * `getCarriedDebt`, which only ever tracks unpaid goods money; adding the same
 * balance to both chains would charge the rep for it twice.
 */
export function getCarriedOtherDebt(staffId: number) {
  if (staffId === 1) return 0;
  return staffId % 5 === 0 ? round2(seeded(staffId, 8, 1200) / 4) : 0;
}

/** A line of ข้อมูลหนี้อื่นๆ or ข้อมูลรายได้เพิ่มเติมพนักงาน. */
export interface OtherLedgerEntry {
  id: string;
  label: string;
  amount: number;
}

/**
 * ข้อมูลหนี้อื่นๆ / ข้อมูลรายได้เพิ่มเติมพนักงาน / จำนวนเงินที่ส่งจริง — the three
 * things ขั้นตอนที่ 4 shows.
 *
 * The reference screen only displays them; they are booked against the rep
 * elsewhere and arrive with the round, which is why they are read here instead
 * of being typed into the wizard. คนที่1 is the rep in the capture and the
 * capture shows both ledgers empty and 0.00 on every row, so that rep stays
 * empty; the rest carry a seeded ledger so the block can be read with rows in
 * it.
 */
/**
 * Each row carries its own base amount rather than a seeded one: `seeded` is
 * near-linear for the small staff ids in play, so two ledgers built from it
 * would track each other and รายได้ would outrun หนี้ on every rep, pushing
 * ข้อ 4 จำนวนเงินที่ต้องชำระ negative. The bases keep the debts the larger side;
 * the seeded part only jitters them so two reps don't read identically.
 */
const OTHER_DEBT_ROWS = [
  { label: 'ค่าปรับสินค้าเสียหาย', base: 320 },
  { label: 'ค่าอุปกรณ์ที่เบิกเพิ่ม', base: 480 },
  { label: 'เงินยืมทดรอง', base: 750 }
];

const OTHER_INCOME_ROWS = [
  { label: 'เบี้ยขยัน', base: 150 },
  { label: 'ค่าเที่ยวเสริม', base: 90 },
  { label: 'โบนัสยอดขาย', base: 220 }
];

function buildOtherEntries(
  staffId: number,
  salt: number,
  rows: { label: string; base: number }[]
): OtherLedgerEntry[] {
  if (staffId === REFERENCE_STAFF_ID) return [];

  // 0–2 rows per rep, so some reps show the empty state and some show a total.
  const count = seeded(staffId, salt, 100) % 3;
  return rows.slice(0, count).map((row, index) => ({
    id: `${salt}-${staffId}-${index}`,
    label: row.label,
    amount: round2(row.base + seeded(staffId, salt + index, 60))
  }));
}

export function getOtherDebtEntries(staffId: number): OtherLedgerEntry[] {
  return buildOtherEntries(staffId, 11, OTHER_DEBT_ROWS);
}

export function getOtherIncomeEntries(staffId: number): OtherLedgerEntry[] {
  return buildOtherEntries(staffId, 17, OTHER_INCOME_ROWS);
}

/**
 * จำนวนเงินที่ส่งจริง on the หนี้/รายได้อื่นๆ side — what the rep actually handed
 * over against จำนวนเงินที่ต้องชำระ. Zero for the reference rep, as in the
 * capture; otherwise the rep settles the round in full, except every fourth rep
 * who pays part of it — ข้อ 6 หนี้ยกไป only ever shows a figure for those.
 *
 * Kept here rather than in the page so it can read the same ledgers the
 * จำนวนเงินที่ต้องชำระ row is built from — the two have to agree or ข้อ 6
 * หนี้ยกไป lands on a figure the screen cannot explain.
 */
export function getOtherSentAmount(staffId: number) {
  if (staffId === REFERENCE_STAFF_ID) return 0;

  const sum = (entries: OtherLedgerEntry[]) =>
    entries.reduce((total, entry) => total + entry.amount, 0);
  const payable = round2(
    getCarriedOtherDebt(staffId) +
      sum(getOtherDebtEntries(staffId)) -
      sum(getOtherIncomeEntries(staffId))
  );

  if (payable <= 0) return 0;
  return staffId % 4 === 0 ? round2(payable * 0.7) : payable;
}

/**
 * ส่วนลด(จากทางศูนย์นม) — a credit the milk centre pushes down onto a clearing
 * round. Nothing in this prototype issues one, and every reference capture
 * shows 0.00, so the row is always present but always zero.
 */
export function getCenterDiscount(_staffId: number) {
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clearing records — the list screen (ManageSpPayment)
// ─────────────────────────────────────────────────────────────────────────────

export interface SpPaymentRecord {
  /** เลขที่ใบเคลียร์เงิน. */
  id: string;
  staffId: number;
  /** ชื่อ SP — the rep the round belongs to. */
  staffName: string;
  /** ยอดสุทธิที่ต้องส่ง. */
  netDue: number;
  /** ยอดส่งจริง. */
  netSent: number;
  /** ค่าคอมฯ SP. */
  commission: number;
  transactionDate: Date;
  /** ชื่อผู้ทำรายการ — the agent, or the rep when they filed it themselves. */
  createdBy: string;
}

const staffName = (staffId: number) =>
  SP_STAFF.find((staff) => staff.id === staffId)?.name ?? `พนักงานขาย คนที่${staffId}`;

/**
 * The ten rows of the reference capture, value for value.
 *
 * Only ชื่อผู้ทำรายการ is translated: the capture was taken on a demo account
 * named "เอเยนต์ใหม่เริ่มสิบหลัก", where this prototype signs in as
 * `DEMO_USER`.
 */
const REFERENCE_RECORDS: SpPaymentRecord[] = [
  {
    id: '99999999990042568002',
    staffId: 2,
    netDue: 13595.0,
    netSent: 13.0,
    commission: 0,
    transactionDate: new Date(2025, 11, 14),
    createdBy: staffName(2)
  },
  {
    id: '99999999990032568006',
    staffId: 1,
    netDue: 2400.0,
    netSent: 2.0,
    commission: 320.0,
    transactionDate: new Date(2025, 11, 14),
    createdBy: staffName(1)
  },
  {
    id: '99999999990022568001',
    staffId: 16,
    netDue: 953.0,
    netSent: 953.0,
    commission: 79.95,
    transactionDate: new Date(2025, 11, 9),
    createdBy: DEMO_USER.fullName
  },
  {
    id: '99999999990032568005',
    staffId: 1,
    netDue: 26054.6,
    netSent: 26.0,
    commission: 2448.96,
    transactionDate: new Date(2025, 10, 14),
    createdBy: staffName(1)
  },
  {
    id: '99999999990032568004',
    staffId: 1,
    netDue: 801.4,
    netSent: 801.4,
    commission: 90.24,
    transactionDate: new Date(2025, 10, 14),
    createdBy: DEMO_USER.fullName
  },
  {
    id: '99999999990032568003',
    staffId: 1,
    netDue: 24.0,
    netSent: 24.0,
    commission: 3.2,
    transactionDate: new Date(2025, 10, 13),
    createdBy: staffName(1)
  },
  {
    id: '99999999990192568001',
    staffId: 14,
    netDue: 163.25,
    netSent: 163.25,
    commission: 20.5,
    transactionDate: new Date(2025, 10, 13),
    createdBy: DEMO_USER.fullName
  },
  {
    id: '99999999990102568001',
    staffId: 15,
    netDue: 833.0,
    netSent: 833.0,
    commission: 74.75,
    transactionDate: new Date(2025, 10, 11),
    createdBy: DEMO_USER.fullName
  },
  {
    id: '99999999990172568001',
    staffId: 12,
    netDue: 833.0,
    netSent: 833.0,
    commission: 74.75,
    transactionDate: new Date(2025, 9, 28),
    createdBy: DEMO_USER.fullName
  },
  {
    id: '99999999990032568002',
    staffId: 1,
    netDue: 690.0,
    netSent: 690.0,
    commission: 105.0,
    transactionDate: new Date(2025, 9, 26),
    createdBy: staffName(19)
  }
].map((record) => ({ ...record, staffName: staffName(record.staffId) }));

/**
 * Older rounds, continuing backwards from the last reference row so the list
 * fills five pages at 10/page — enough to exercise paging and the filters.
 */
const GENERATED_RECORDS: SpPaymentRecord[] = Array.from({ length: 38 }, (_, index) => {
  const staffId = ((index * 7) % SP_STAFF.length) + 1;
  const transactionDate = new Date(2025, 9, 24 - index * 3);
  const netDue = round2(120 + seeded(index, 3, 24000) / 4);
  // Most rounds settle in full; every fourth one leaves a balance behind.
  const netSent = index % 4 === 3 ? round2(netDue * 0.4) : netDue;

  return {
    id: `${DEMO_USER.cvCode}${pad(staffId, 3)}${transactionDate.getFullYear() + 543}${pad(
      index + 1,
      3
    )}`,
    staffId,
    staffName: staffName(staffId),
    netDue,
    netSent,
    commission: round2(netDue * 0.09),
    transactionDate,
    createdBy: index % 3 === 0 ? staffName(staffId) : DEMO_USER.fullName
  };
});

/** Every clearing round on file, newest first. */
export const SP_PAYMENT_RECORDS: SpPaymentRecord[] = [
  ...REFERENCE_RECORDS,
  ...GENERATED_RECORDS
].sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

/** Distinct ชื่อผู้ทำรายการ values, for the list screen's filter. */
export const SP_PAYMENT_CREATORS = Array.from(
  new Set(SP_PAYMENT_RECORDS.map((record) => record.createdBy))
).sort((a, b) => a.localeCompare(b, 'th'));
