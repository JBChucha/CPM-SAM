'use client';

import * as React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/icons';
import { DateRangeFilter } from '@/components/sam/filters/date-range-filter';
import { FacetedFilter } from '@/components/sam/filters/faceted-filter';
import { cn } from '@/lib/utils';
import {
  DEFAULT_SP_PAYMENT_SORT,
  spPaymentFilterOptionsQueryOptions,
  spPaymentsQueryOptions,
  type SpPaymentFilters,
  type SpPaymentRecord,
  type SpPaymentSort
} from '../api/queries';
import { toISODate } from '../lib/iso-date';
import { SpPaymentDetailDialog } from './sp-payment-detail-dialog';
import { SpPaymentsCardGrid } from './sp-payments-card-grid';
import { SpPaymentsTable } from './sp-payments-table';

/**
 * รายการเคลียร์เงิน — the clearing rounds on file (legacy: ManageSpPayment).
 *
 * Filters are shadcn data-table filter chips above the table and apply as soon
 * as they change, so there is no search button and a single piece of filter
 * state. The one case that cannot filter as it is typed is the date range — a
 * half-picked one would filter the table twice on the way to the range the user
 * meant — so `DateRangeFilter` holds a partial range back until both ends are
 * set.
 *
 * Filtering and paging both happen in the service, so every one of them is a
 * new query key. Each change is wrapped in a transition: without it
 * `useSuspenseQuery` would suspend and hand the page back to the Suspense
 * fallback on every filter change, instead of leaving the current rows up —
 * dimmed — until the next page arrives.
 *
 * The rows render either as the full table or as summary cards. Only the middle
 * swaps — filters, the loading dim, the paginator and the detail dialog are
 * shared — and the selection is deliberately left alone across a switch, so a
 * set picked in the table survives a look at the cards and back.
 */

/** The filter chips' own state — `Date` here, ISO at the API boundary. */
type FilterForm = {
  range?: DateRange;
  /** '' = ทั้งหมด. */
  createdBy: string;
  /** '' = ทั้งหมด; otherwise the rep's id as a string. */
  staffId: string;
};

const EMPTY_FILTERS: FilterForm = { range: undefined, createdBy: '', staffId: '' };

const PAGE_SIZES = [10, 25, 50];

/** How the rows are laid out. Not persisted — every visit starts on the table. */
type ViewMode = 'table' | 'card';

export default function SpPaymentsListPage() {
  const [view, setView] = React.useState<ViewMode>('table');
  const [applied, setApplied] = React.useState<FilterForm>(EMPTY_FILTERS);
  const [sort, setSort] = React.useState<SpPaymentSort>(DEFAULT_SP_PAYMENT_SORT);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZES[0]);
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [detailRecord, setDetailRecord] = React.useState<SpPaymentRecord | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const filters = React.useMemo<SpPaymentFilters>(
    () => ({
      from: applied.range?.from ? toISODate(applied.range.from) : undefined,
      to: applied.range?.to ? toISODate(applied.range.to) : undefined,
      createdBy: applied.createdBy || undefined,
      staffId: applied.staffId || undefined,
      sortBy: sort.field,
      sortDir: sort.direction,
      page,
      limit: pageSize
    }),
    [applied, sort, page, pageSize]
  );

  const { data } = useSuspenseQuery(spPaymentsQueryOptions(filters));
  const { data: options } = useSuspenseQuery(spPaymentFilterOptionsQueryOptions());

  // The combobox compares options by value, so these only need to be stable
  // enough not to churn the list on every keystroke in another field.
  const creatorOptions = React.useMemo(
    () => options.creators.map((creator) => ({ value: creator, label: creator })),
    [options.creators]
  );
  const staffOptions = React.useMemo(
    () => options.staff.map((staff) => ({ value: String(staff.id), label: staff.name })),
    [options.staff]
  );

  const rows = data.records;
  // `data.page` rather than `page`: the service clamps a page that a narrower
  // filter has left past the end, and the paginator has to follow what it served.
  const rangeStart = (data.page - 1) * data.limit + 1;

  const pageIds = rows.map((record) => record.id);

  const isSortDefault =
    sort.field === DEFAULT_SP_PAYMENT_SORT.field &&
    sort.direction === DEFAULT_SP_PAYMENT_SORT.direction;

  // What รีเซ็ต would actually undo. The button only shows when there is
  // something to undo — on a screen the user has not touched it would do
  // nothing, and a control that does nothing reads as a broken one.
  const canReset =
    Boolean(applied.range?.from || applied.range?.to || applied.createdBy || applied.staffId) ||
    !isSortDefault;

  // Any filter change re-filters from the first page: the page the user was on
  // is meaningless against a different result set, and so is a selection made
  // out of rows the narrower filter may no longer serve.
  const handleFilterChange = (patch: Partial<FilterForm>) => {
    startTransition(() => {
      setApplied((previous) => ({ ...previous, ...patch }));
      setPage(1);
      setSelectedIds([]);
    });
  };

  /**
   * Back to the screen as it opens — every filter cleared and the order back to
   * วันที่ทำรายการ, newest first. The selection goes with them: it was made out
   * of a result the user is throwing away.
   */
  const handleReset = () => {
    startTransition(() => {
      setApplied(EMPTY_FILTERS);
      setSort(DEFAULT_SP_PAYMENT_SORT);
      setPage(1);
      setSelectedIds([]);
    });
  };

  // Reordering keeps the selection — the rows picked are still the same rows —
  // but not the page: page 3 of one order has nothing to do with page 3 of
  // another, so a re-sort starts from the top of the new order.
  const handleSortChange = (next: SpPaymentSort) => {
    startTransition(() => {
      setSort(next);
      setPage(1);
    });
  };

  const handlePageChange = (next: number) => {
    startTransition(() => setPage(next));
  };

  const handlePageSizeChange = (next: number) => {
    startTransition(() => {
      setPageSize(next);
      setPage(1);
    });
  };

  const toggleAllOnPage = (checked: boolean) => {
    setSelectedIds((previous) =>
      checked
        ? Array.from(new Set([...previous, ...pageIds]))
        : previous.filter((id) => !pageIds.includes(id))
    );
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((previous) =>
      checked ? [...previous, id] : previous.filter((value) => value !== id)
    );
  };

  const handleDownload = (record: SpPaymentRecord) => {
    toast.success(`ดาวน์โหลดเอกสารใบเคลียร์เงิน ${record.id} แล้ว`);
  };

  const handleDownloadSelected = () => {
    toast.success(`ดาวน์โหลดเอกสารที่เลือกจำนวน ${selectedIds.length} รายการแล้ว`);
    setSelectedIds([]);
  };

  return (
    <div className='min-w-0 space-y-4 pb-4'>
      <Card className='min-w-0'>
        <CardHeader className='bg-muted/20 border-b pb-3'>
          <CardTitle className='flex flex-wrap items-center justify-between gap-3 text-sm font-semibold'>
            <span className='flex items-center gap-2'>
              <Icons.billing className='size-4' />
              รายการเคลียร์เงิน
              <span className='text-muted-foreground font-mono text-xs font-normal tabular-nums'>
                {data.total} รายการ
              </span>
            </span>

            {selectedIds.length > 0 && (
              <Button type='button' variant='outline' size='sm' onClick={handleDownloadSelected}>
                <Icons.download />
                ดาวน์โหลดที่เลือก ({selectedIds.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className='min-w-0 space-y-4'>
          <TooltipProvider delay={0}>
            {/* ─── Filters ─── */}
            <div
              role='toolbar'
              aria-orientation='horizontal'
              aria-label='ตัวกรองรายการเคลียร์เงิน'
              className='flex flex-wrap items-center gap-2'
            >
              <DateRangeFilter
                title='วันที่ทำรายการ'
                value={applied.range}
                onValueChange={(range) => handleFilterChange({ range })}
              />
              <FacetedFilter
                title='ชื่อผู้ทำรายการ'
                options={creatorOptions}
                value={applied.createdBy}
                onValueChange={(createdBy) => handleFilterChange({ createdBy })}
              />
              <FacetedFilter
                title='ชื่อพนักงานขาย'
                options={staffOptions}
                value={applied.staffId}
                onValueChange={(staffId) => handleFilterChange({ staffId })}
              />
              {canReset && (
                <Button type='button' variant='ghost' size='sm' onClick={handleReset}>
                  <Icons.close />
                  รีเซ็ต
                </Button>
              )}

              <ViewModeToggle className='ml-auto' value={view} onValueChange={setView} />
            </div>

            {rows.length === 0 ? (
              <Empty className='border border-dashed'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <Icons.search />
                  </EmptyMedia>
                  <EmptyTitle>ไม่พบใบเคลียร์เงิน</EmptyTitle>
                  <EmptyDescription>
                    ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา ลองปรับช่วงวันที่หรือล้างตัวกรอง
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              /* The rows stay up while the next page loads, dimmed rather than replaced. */
              <div
                aria-busy={isPending || undefined}
                className={cn(
                  'min-w-0 space-y-4 transition-opacity duration-150',
                  isPending && 'pointer-events-none opacity-60'
                )}
              >
                {view === 'table' ? (
                  <SpPaymentsTable
                    rows={rows}
                    rangeStart={rangeStart}
                    selectedIds={selectedIds}
                    sort={sort}
                    onSortChange={handleSortChange}
                    onToggleRow={toggleRow}
                    onToggleAllOnPage={toggleAllOnPage}
                    onView={setDetailRecord}
                    onDownload={handleDownload}
                  />
                ) : (
                  <SpPaymentsCardGrid
                    rows={rows}
                    rangeStart={rangeStart}
                    onView={setDetailRecord}
                  />
                )}

                <SpPaymentsPagination
                  page={data.page}
                  pageCount={data.pageCount}
                  onPageChange={handlePageChange}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  rangeStart={rangeStart}
                  rangeEnd={rangeStart + rows.length - 1}
                  total={data.total}
                />
              </div>
            )}
          </TooltipProvider>
        </CardContent>
      </Card>

      <SpPaymentDetailDialog record={detailRecord} onOpenChange={() => setDetailRecord(null)} />
    </div>
  );
}

/**
 * ตาราง / การ์ด, at the end of the filter row.
 *
 * `ToggleGroup` is array-valued and lets the pressed item be pressed again to
 * unpress it, which here would leave the list with no layout at all — so an
 * empty selection is ignored and the current view stays.
 */
function ViewModeToggle({
  value,
  onValueChange,
  className
}: {
  value: ViewMode;
  onValueChange: (view: ViewMode) => void;
  className?: string;
}) {
  const items: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'table', label: 'มุมมองตาราง', icon: <Icons.table /> },
    { value: 'card', label: 'มุมมองการ์ด', icon: <Icons.grid /> }
  ];

  return (
    <ToggleGroup
      variant='outline'
      size='sm'
      spacing={0}
      className={className}
      aria-label='รูปแบบการแสดงผล'
      value={[value]}
      onValueChange={(next) => {
        const [selected] = next;
        if (selected) onValueChange(selected as ViewMode);
      }}
    >
      {items.map((item) => (
        <Tooltip key={item.value}>
          <TooltipTrigger render={<ToggleGroupItem value={item.value} aria-label={item.label} />}>
            {item.icon}
          </TooltipTrigger>
          <TooltipContent>{item.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}

/**
 * First / previous / numbers / next / last, the same control the legacy screen
 * puts under the table. The window is capped at five numbers so a 40-page
 * result does not push the control off the card.
 *
 * รายการต่อหน้า sits here rather than above the table, which is where the
 * shadcn data-table keeps it — next to the paging it belongs to.
 */
function SpPaymentsPagination({
  page,
  pageCount,
  onPageChange,
  pageSize,
  onPageSizeChange,
  rangeStart,
  rangeEnd,
  total
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  rangeStart: number;
  rangeEnd: number;
  total: number;
}) {
  const windowSize = Math.min(5, pageCount);
  const firstInWindow = Math.max(
    1,
    Math.min(page - Math.floor(windowSize / 2), pageCount - windowSize + 1)
  );
  const pages = Array.from({ length: windowSize }, (_, index) => firstInWindow + index);

  return (
    <div className='flex flex-col-reverse items-center justify-between gap-3 sm:flex-row sm:gap-8'>
      <p className='text-muted-foreground text-xs tabular-nums'>
        แสดง {rangeStart}–{rangeEnd} จาก {total} รายการ
      </p>

      <div className='flex flex-wrap items-center justify-end gap-3 sm:gap-6'>
        <div className='flex items-center gap-2'>
          <Label
            htmlFor='sp-payment-page-size'
            className='text-muted-foreground text-xs font-normal whitespace-nowrap'
          >
            รายการต่อหน้า
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              id='sp-payment-page-size'
              className='h-8 w-[4.5rem] [&[data-size]]:h-8'
              aria-label='จำนวนรายการต่อหน้า'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent side='top'>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className='flex items-center gap-1' aria-label='แบ่งหน้ารายการเคลียร์เงิน'>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            disabled={page === 1}
            onClick={() => onPageChange(1)}
            aria-label='หน้าแรก'
          >
            <Icons.chevronsLeft />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label='หน้าก่อนหน้า'
          >
            <Icons.chevronLeft />
          </Button>

          {pages.map((value) => (
            <Button
              key={value}
              type='button'
              variant={value === page ? 'default' : 'outline'}
              size='icon-sm'
              className='font-mono tabular-nums'
              onClick={() => onPageChange(value)}
              aria-label={`หน้า ${value}`}
              aria-current={value === page ? 'page' : undefined}
            >
              {value}
            </Button>
          ))}

          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            disabled={page === pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label='หน้าถัดไป'
          >
            <Icons.chevronRight />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            disabled={page === pageCount}
            onClick={() => onPageChange(pageCount)}
            aria-label='หน้าสุดท้าย'
          >
            <Icons.chevronsRight />
          </Button>
        </nav>
      </div>
    </div>
  );
}
