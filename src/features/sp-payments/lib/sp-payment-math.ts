import { SP_PRODUCTS, type SpProductItem } from '@/features/sp/api/sp-catalog';
import {
  getAccumulatedCommission,
  getCarriedDebt,
  getCarriedOtherDebt,
  getCenterDiscount,
  getLineCommission,
  type WithdrawalSlip
} from '../api/sp-payment-data';

/**
 * The arithmetic behind the เคลียร์เงิน wizard, kept out of the step components
 * so every step reads the same numbers and the rules can be checked in one
 * place against the reference captures.
 *
 * Two chains run through the wizard and meet only in the final summary:
 *
 *   ข้อมูลส่งเงินสุทธิพนักงาน (rows 1–12) — what the rep owes for the goods.
 *   สรุปหนี้/รายได้อื่นๆ (rows 1–6)      — debts and extra income beside the goods.
 */

const round2 = (value: number) => Math.round(value * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// Product lines
// ─────────────────────────────────────────────────────────────────────────────

/** What ขั้นตอนที่ 2 records against one product of the selected slips. */
export interface DepositReturnEntry {
  /** จำนวนที่ฝาก — left on consignment with a shop. */
  deposited: number;
  /** จำนวนที่คืน — handed back to the agent unsold. */
  returned: number;
}

export interface ClearingLine {
  product: SpProductItem;
  /** จำนวนที่เบิก — summed across every selected slip. */
  withdrawn: number;
  deposited: number;
  returned: number;
  /** จำนวนที่ขายได้จริง = เบิก − ฝาก − คืน. */
  sold: number;
  /** มูลค่า — sold units at the rep's selling price. */
  value: number;
  /** คอมมิชชั่น earned on `value`. */
  commission: number;
}

const productsById = new Map(SP_PRODUCTS.map((product) => [product.id, product]));

/**
 * Merges the selected slips into one line per product, then applies whatever
 * ฝาก/คืน the user has entered.
 *
 * A product taken out on two slips in the same round is one line here, not two:
 * the rep clears goods, not paperwork, and the reference summary shows a single
 * row per รหัสสินค้า.
 */
export function buildClearingLines(
  slips: WithdrawalSlip[],
  entries: Record<number, DepositReturnEntry>
): ClearingLine[] {
  const withdrawnByProduct = new Map<number, number>();
  slips.forEach((slip) => {
    slip.lines.forEach((line) => {
      withdrawnByProduct.set(
        line.productId,
        (withdrawnByProduct.get(line.productId) ?? 0) + line.qty
      );
    });
  });

  return Array.from(withdrawnByProduct, ([productId, withdrawn]) => {
    const product = productsById.get(productId)!;
    const entry = entries[productId];
    const deposited = entry?.deposited ?? 0;
    const returned = entry?.returned ?? 0;
    // Never negative: the steppers cap ฝาก+คืน at what was withdrawn, but the
    // slip selection can change after the fact and shrink `withdrawn`.
    const sold = Math.max(0, withdrawn - deposited - returned);
    const value = round2(sold * product.spPrice);

    return {
      product,
      withdrawn,
      deposited,
      returned,
      sold,
      value,
      commission: getLineCommission(product, value)
    };
  }).sort((a, b) => a.product.id - b.product.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// ข้อมูลส่งเงินสุทธิพนักงาน — rows 1–12
// ─────────────────────────────────────────────────────────────────────────────

/** The rows of the net-payment block the user fills in themselves. */
export interface NetPaymentInput {
  /** 2. ลูกค้าประจำ — sold on credit to a standing customer. */
  regularCredit: number;
  /** 3. ลูกค้าทั่วไป — sold on credit to a walk-in customer. */
  generalCredit: number;
  /** 5. เก็บเงินลูกค้าประจำ — credit from an earlier round, collected now. */
  regularCollect: number;
  /** 6. เก็บเงินลูกค้าทั่วไป. */
  generalCollect: number;
  /** 11. ยอดเงินชำระจริง — what the rep actually hands over. */
  paidAmount: number;
}

export const EMPTY_NET_PAYMENT_INPUT: NetPaymentInput = {
  regularCredit: 0,
  generalCredit: 0,
  regularCollect: 0,
  generalCollect: 0,
  paidAmount: 0
};

export type { WithdrawalSlip } from '../api/sp-payment-data';

export interface NetPaymentTotals {
  /** มูลค่าสินค้าเบิก — everything that left the agent, at selling price. */
  withdrawnValue: number;
  /** 1. มูลค่าสินค้าขายจริง. */
  soldValue: number;
  /** 4. สรุปจำนวนเงินที่ได้รับจริง (1,2,3) — sales minus what went out on credit. */
  cashFromSales: number;
  /** 7. รวมยอดเงินที่ได้รับจริงสุทธิ (4,5,6). */
  netReceived: number;
  /** 8. ยอดหนี้คงค้างยกมา. */
  carriedDebt: number;
  /** 9. ส่วนลด(จากทางศูนย์นม). */
  centerDiscount: number;
  /** 10. รวมยอดเงินที่ต้องส่งสุทธิ (7,8,9). */
  netDue: number;
  /** 11. ยอดเงินชำระจริง. */
  paidAmount: number;
  /** 12. ยอดคงค้างยกไป (10,11). */
  carryForward: number;
  /** ค่าคอมมิชชั่นที่ได้ this round. */
  commission: number;
  /** คอมมิชชั่นสะสมสุทธิ carried in from the rep's earlier rounds. */
  accumulatedCommissionBefore: number;
  /** คอมมิชชั่นสะสมสุทธิ once this round's commission is added on. */
  accumulatedCommission: number;
}

export function computeNetPayment(
  lines: ClearingLine[],
  input: NetPaymentInput,
  staffId: number
): NetPaymentTotals {
  const withdrawnValue = round2(
    lines.reduce((sum, line) => sum + line.withdrawn * line.product.spPrice, 0)
  );
  const soldValue = round2(lines.reduce((sum, line) => sum + line.value, 0));
  const commission = round2(lines.reduce((sum, line) => sum + line.commission, 0));

  // Goods sold on credit brought in no cash, so they come off the sales figure;
  // credit collected from earlier rounds is cash in hand and goes back on.
  const cashFromSales = round2(soldValue - input.regularCredit - input.generalCredit);
  const netReceived = round2(cashFromSales + input.regularCollect + input.generalCollect);

  const carriedDebt = getCarriedDebt(staffId);
  const centerDiscount = getCenterDiscount(staffId);
  const netDue = round2(netReceived + carriedDebt - centerDiscount);

  const accumulatedCommissionBefore = getAccumulatedCommission(staffId);

  return {
    withdrawnValue,
    soldValue,
    cashFromSales,
    netReceived,
    carriedDebt,
    centerDiscount,
    netDue,
    paidAmount: input.paidAmount,
    carryForward: round2(netDue - input.paidAmount),
    commission,
    accumulatedCommissionBefore,
    accumulatedCommission: round2(accumulatedCommissionBefore + commission)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// สรุปหนี้/รายได้อื่นๆ — rows 1–6
// ─────────────────────────────────────────────────────────────────────────────

/** A row of ข้อมูลหนี้อื่นๆ or ข้อมูลรายได้เพิ่มเติมพนักงาน. */
export interface OtherEntry {
  id: string;
  label: string;
  amount: number;
}

export interface OtherTotals {
  /** 1. หนี้ยกมา. */
  carriedDebt: number;
  /** 2. หนี้อื่นๆ. */
  otherDebt: number;
  /** 3. รายได้. */
  income: number;
  /** 4. จำนวนเงินที่ต้องชำระ. */
  payable: number;
  /** 5. จำนวนเงินที่ส่งจริง. */
  sent: number;
  /** 6. หนี้ยกไป. */
  carryForward: number;
}

export function computeOtherTotals(
  debts: OtherEntry[],
  incomes: OtherEntry[],
  sent: number,
  staffId: number
): OtherTotals {
  const carriedDebt = getCarriedOtherDebt(staffId);
  const otherDebt = round2(debts.reduce((sum, entry) => sum + entry.amount, 0));
  const income = round2(incomes.reduce((sum, entry) => sum + entry.amount, 0));
  // Extra income the rep is owed nets off against what they owe.
  const payable = round2(carriedDebt + otherDebt - income);

  return {
    carriedDebt,
    otherDebt,
    income,
    payable,
    sent,
    carryForward: round2(payable - sent)
  };
}
