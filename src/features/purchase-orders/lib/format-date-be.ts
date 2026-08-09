// Thai Buddhist Era (BE) date helpers shared across the purchase order feature.

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

/** CV code + "PO" + YYMMDD, e.g. 9999999999PO260805 */
export function generateSystemPoNumber(cvCode: string, date = new Date()) {
  const yy = String(date.getFullYear()).slice(2);
  return `${cvCode}PO${yy}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
