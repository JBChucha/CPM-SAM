import { queryOptions } from '@tanstack/react-query';
import {
  DEFAULT_SP_PAYMENT_LIMIT,
  DEFAULT_SP_PAYMENT_SORT,
  getSpPaymentFilterOptions,
  getSpPayments
} from './service';
import type {
  SpPaymentFilters,
  SpPaymentRecord,
  SpPaymentSort,
  SpPaymentSortDirection,
  SpPaymentSortField
} from './types';

export type {
  SpPaymentFilters,
  SpPaymentRecord,
  SpPaymentSort,
  SpPaymentSortDirection,
  SpPaymentSortField
};
export { DEFAULT_SP_PAYMENT_SORT };

export const spPaymentKeys = {
  all: ['sp-payments'] as const,
  list: (filters: SpPaymentFilters) => [...spPaymentKeys.all, 'list', filters] as const,
  filterOptions: () => [...spPaymentKeys.all, 'filter-options'] as const
};

/**
 * One canonical shape per request.
 *
 * The server prefetches with `{}` while the client mounts with its own filter
 * state; without this, `{ createdBy: '' , page: 1 }` and `{}` would hash to two
 * different keys and the prefetched page would be thrown away on hydration.
 * Empty values are dropped and the defaults are filled in, so both sides land
 * on the same entry.
 */
function normalizeFilters(filters: SpPaymentFilters): SpPaymentFilters {
  return {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_SP_PAYMENT_LIMIT,
    sortBy: filters.sortBy ?? DEFAULT_SP_PAYMENT_SORT.field,
    sortDir: filters.sortDir ?? DEFAULT_SP_PAYMENT_SORT.direction,
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
    ...(filters.staffId ? { staffId: filters.staffId } : {})
  };
}

export const spPaymentsQueryOptions = (filters: SpPaymentFilters = {}) => {
  const normalized = normalizeFilters(filters);

  return queryOptions({
    queryKey: spPaymentKeys.list(normalized),
    queryFn: () => getSpPayments(normalized)
  });
};

export const spPaymentFilterOptionsQueryOptions = () =>
  queryOptions({
    queryKey: spPaymentKeys.filterOptions(),
    queryFn: () => getSpPaymentFilterOptions(),
    // The rep list and the distinct creators do not move while the tab is open.
    staleTime: Infinity
  });
