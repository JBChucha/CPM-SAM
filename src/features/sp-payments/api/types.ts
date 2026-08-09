/**
 * Wire types for the เคลียร์เงิน list screen (legacy: ManageSpPayment).
 *
 * These describe what the service hands back, not what the mock module happens
 * to hold — `api/sp-payment-data.ts` stays the fixture store for the wizard and
 * is mapped into these shapes by `api/service.ts`.
 */

/** One clearing round as the list renders it. */
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
  /** วันที่ทำรายการ as `yyyy-MM-dd` — see `lib/iso-date.ts` for why not a `Date`. */
  transactionDate: string;
  /** ชื่อผู้ทำรายการ — the agent, or the rep when they filed it themselves. */
  createdBy: string;
}

/**
 * The columns the list can be ordered by — every column that holds a value of
 * its own. ลำดับที่ is not one of them: it is the row's position in the result,
 * so it renumbers with the order rather than defining it.
 */
export type SpPaymentSortField =
  | 'id'
  | 'staffName'
  | 'netDue'
  | 'netSent'
  | 'commission'
  | 'transactionDate'
  | 'createdBy';

export type SpPaymentSortDirection = 'asc' | 'desc';

export type SpPaymentSort = {
  field: SpPaymentSortField;
  direction: SpPaymentSortDirection;
};

/**
 * Everything the list screen can narrow by. Empty strings are normalised away
 * in `api/queries.ts` before the filters reach a query key, so
 * `{ createdBy: '' }` and `{}` are the same request and share one cache entry.
 */
export type SpPaymentFilters = {
  /** Inclusive lower bound, `yyyy-MM-dd`. */
  from?: string;
  /** Inclusive upper bound, `yyyy-MM-dd`. */
  to?: string;
  /** ชื่อผู้ทำรายการ; omitted = ทั้งหมด. */
  createdBy?: string;
  /** ชื่อพนักงานขาย, as the rep's id in string form; omitted = ทั้งหมด. */
  staffId?: string;
  /** Column to order by; omitted = the default sort in `api/service.ts`. */
  sortBy?: SpPaymentSortField;
  /** Order direction; omitted = the default sort's direction. */
  sortDir?: SpPaymentSortDirection;
  /** 1-based. */
  page?: number;
  limit?: number;
};

export type SpPaymentsResponse = {
  /** The rows on `page` — already filtered and sliced. */
  records: SpPaymentRecord[];
  /** Rows matching the filters across every page. */
  total: number;
  /**
   * The page actually served. A filter can shrink the result under the page the
   * caller asked for, in which case this is the clamped page rather than the
   * requested one, and the paginator follows it.
   */
  page: number;
  limit: number;
  pageCount: number;
};

/** The two dropdowns above the table, so the screen never reads the fixtures itself. */
export type SpPaymentFilterOptions = {
  /** Distinct ชื่อผู้ทำรายการ on file. */
  creators: string[];
  staff: { id: number; name: string }[];
};
