/**
 * Thai Buddhist Era (BE) date and currency helpers shared across SAM screens.
 *
 * The purchase-order feature keeps its own copy at
 * `features/purchase-orders/lib/format-date-be.ts`; that one is intentionally
 * left untouched so the two shipped screens cannot regress. New screens import
 * from here.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/** 05/08/2569 */
export function formatDateBE(date?: Date) {
  if (!date) return '-';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() + 543}`;
}

/** 05/08/2569 (14:30) */
export function formatDateTimeBE(date?: Date) {
  if (!date) return '-';
  return `${formatDateBE(date)} (${pad(date.getHours())}:${pad(date.getMinutes())})`;
}

/** 05/08/2569 - 12:37 — the dash-separated form the withdrawal screen uses. */
export function formatDateTimeBEPlain(date?: Date) {
  if (!date) return '-';
  return `${formatDateBE(date)} - ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * 13,595.00 — the amount format used everywhere in the reference screens
 * (always two decimals, always thousands separators, no currency symbol since
 * the unit "บาท" is printed in its own column).
 */
export function formatAmount(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/** 14,696 — whole-unit counts (stock, quantities): no decimals. */
export function formatCount(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

/** ฿958.35 — used where an amount stands alone without a "บาท" column. */
export function formatBaht(value: number) {
  return `฿${formatAmount(value)}`;
}

/** CV code + prefix + YYMMDD, e.g. 9999999999PO260805 or 9999999999SP260805 */
export function generateDocumentNumber(cvCode: string, prefix: string, date = new Date()) {
  const yy = String(date.getFullYear()).slice(2);
  return `${cvCode}${prefix}${yy}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}
