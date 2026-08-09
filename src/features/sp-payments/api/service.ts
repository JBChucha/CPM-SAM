// ============================================================
// SP Payment Service — Data Access Layer (เคลียร์เงิน / ManageSpPayment)
// ============================================================
// This is the ONLY file to modify when the screen is connected to a backend.
// `queries.ts` and the components import from here and do not change.
//
// Current: mock — the in-memory fixtures in `sp-payment-data.ts`, filtered and
// paged here so the call signature already matches what a real endpoint takes.
// ============================================================

import { SP_STAFF } from '@/features/sp/api/sp-catalog';
import { toISODate } from '../lib/iso-date';
import { SP_PAYMENT_CREATORS, SP_PAYMENT_RECORDS } from './sp-payment-data';
import type {
  SpPaymentFilterOptions,
  SpPaymentFilters,
  SpPaymentRecord,
  SpPaymentSort,
  SpPaymentSortField,
  SpPaymentsResponse
} from './types';

/** 10/page, the size the legacy screen opens on. */
export const DEFAULT_SP_PAYMENT_LIMIT = 10;

/** Newest round first — the order the legacy screen opens on. */
export const DEFAULT_SP_PAYMENT_SORT: SpPaymentSort = {
  field: 'transactionDate',
  direction: 'desc'
};

/**
 * The value each column sorts on. Numbers sort numerically and everything else
 * as Thai text, so ชื่อ SP and ชื่อผู้ทำรายการ collate the way a Thai reader
 * expects rather than by code point.
 */
const SORT_VALUES: Record<SpPaymentSortField, (record: SpPaymentRecord) => string | number> = {
  id: (record) => record.id,
  staffName: (record) => record.staffName,
  netDue: (record) => record.netDue,
  netSent: (record) => record.netSent,
  commission: (record) => record.commission,
  transactionDate: (record) => record.transactionDate,
  createdBy: (record) => record.createdBy
};

function compareBy(field: SpPaymentSortField, a: SpPaymentRecord, b: SpPaymentRecord) {
  const left = SORT_VALUES[field](a);
  const right = SORT_VALUES[field](b);

  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : // `numeric` so the digits inside เลขที่ใบเคลียร์เงิน order as numbers.
      String(left).localeCompare(String(right), 'th', { numeric: true });
}

/**
 * Ordered copy of `records`.
 *
 * Ties fall back to เลขที่ใบเคลียร์เงิน, which is unique — without it a column
 * with repeats (a rep with several rounds, or one day's worth of them) would
 * leave those rows in whatever order the filter happened to yield, and they
 * could shuffle between pages of the same result.
 */
function sortRecords(records: SpPaymentRecord[], sort: SpPaymentSort) {
  const sign = sort.direction === 'asc' ? 1 : -1;

  return records.toSorted((a, b) => sign * compareBy(sort.field, a, b) || compareBy('id', a, b));
}

/** The fixtures in wire shape — `Date` flattened to `yyyy-MM-dd`. Newest first. */
const ALL_RECORDS: SpPaymentRecord[] = SP_PAYMENT_RECORDS.map((record) => ({
  id: record.id,
  staffId: record.staffId,
  staffName: record.staffName,
  netDue: record.netDue,
  netSent: record.netSent,
  commission: record.commission,
  transactionDate: toISODate(record.transactionDate),
  createdBy: record.createdBy
}));

export async function getSpPayments(filters: SpPaymentFilters = {}): Promise<SpPaymentsResponse> {
  const { from, to, createdBy, staffId } = filters;
  const limit = filters.limit ?? DEFAULT_SP_PAYMENT_LIMIT;

  const matched = sortRecords(
    ALL_RECORDS.filter((record) => {
      // Both bounds are inclusive; `yyyy-MM-dd` compares correctly as a string.
      if (from && record.transactionDate < from) return false;
      if (to && record.transactionDate > to) return false;
      if (createdBy && record.createdBy !== createdBy) return false;
      if (staffId && String(record.staffId) !== staffId) return false;
      return true;
    }),
    {
      field: filters.sortBy ?? DEFAULT_SP_PAYMENT_SORT.field,
      direction: filters.sortDir ?? DEFAULT_SP_PAYMENT_SORT.direction
    }
  );

  const pageCount = Math.max(1, Math.ceil(matched.length / limit));
  const page = Math.min(Math.max(filters.page ?? 1, 1), pageCount);
  const offset = (page - 1) * limit;

  return {
    records: matched.slice(offset, offset + limit),
    total: matched.length,
    page,
    limit,
    pageCount
  };
}

export async function getSpPaymentFilterOptions(): Promise<SpPaymentFilterOptions> {
  return {
    creators: SP_PAYMENT_CREATORS,
    staff: SP_STAFF.map((staff) => ({ id: staff.id, name: staff.name }))
  };
}
