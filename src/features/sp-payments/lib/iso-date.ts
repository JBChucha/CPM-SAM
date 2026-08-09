/**
 * `Date` ⇄ `yyyy-MM-dd` at the API boundary of the เคลียร์เงิน feature.
 *
 * The list is prefetched on the server and dehydrated into the HTML, and
 * dehydrate serialises with JSON — a `Date` on a row would arrive on the client
 * as a string under a type claiming otherwise, and the first `formatDateBE`
 * call after hydration would throw. So rows cross the boundary as ISO strings
 * and are parsed at the point of use.
 *
 * Both helpers work in local time on purpose: the dates here are calendar days
 * (วันที่ทำรายการ), never instants, so a UTC round trip could shift them a day.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/** 2025-12-14 — sorts and compares lexicographically, which the filters rely on. */
export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Midnight, local time, of the day the string names. */
export function fromISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
