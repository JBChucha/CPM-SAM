'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/icons';
import { formatAmount, formatDateBE } from '@/lib/format-date-be';
import { cn } from '@/lib/utils';
import type { SpPaymentRecord, SpPaymentSort, SpPaymentSortField } from '../api/types';
import { fromISODate } from '../lib/iso-date';

/**
 * The row-per-clearing-round view of รายการเคลียร์เงิน — every column the
 * legacy screen shows, which is why it needs a min-width and its own
 * horizontal scroll.
 *
 * Selection lives on the list page rather than here so that it survives a
 * switch to the card view and back; this component only reports the toggles.
 * Sorting is held there too, and for the same reason it is held rather than
 * applied here: the service orders the whole result before it pages it, so a
 * header click reorders every page and not just the rows currently on screen.
 */
export interface SpPaymentsTableProps {
  rows: SpPaymentRecord[];
  /** 1-based index of `rows[0]` across the whole result — the ลำดับที่ column. */
  rangeStart: number;
  selectedIds: string[];
  sort: SpPaymentSort;
  onSortChange: (sort: SpPaymentSort) => void;
  onToggleRow: (id: string, checked: boolean) => void;
  onToggleAllOnPage: (checked: boolean) => void;
  onView: (record: SpPaymentRecord) => void;
  onDownload: (record: SpPaymentRecord) => void;
}

export function SpPaymentsTable({
  rows,
  rangeStart,
  selectedIds,
  sort,
  onSortChange,
  onToggleRow,
  onToggleAllOnPage,
  onView,
  onDownload
}: SpPaymentsTableProps) {
  const pageIds = rows.map((record) => record.id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id));
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;

  return (
    <div className='min-w-0 overflow-hidden rounded-lg border'>
      <Table className='min-w-[1100px]'>
        <TableHeader className='bg-muted dark:bg-background'>
          <TableRow>
            <TableHead className='w-10'>
              <Checkbox
                checked={allOnPageSelected}
                indeterminate={selectedOnPage.length > 0 && !allOnPageSelected}
                onCheckedChange={onToggleAllOnPage}
                aria-label='เลือกทุกรายการในหน้านี้'
              />
            </TableHead>
            <TableHead className='w-16 text-center'>ลำดับที่</TableHead>
            <SortableHead field='id' sort={sort} onSortChange={onSortChange} className='w-48'>
              เลขที่ใบเคลียร์เงิน
            </SortableHead>
            <SortableHead
              field='staffName'
              sort={sort}
              onSortChange={onSortChange}
              className='w-40'
            >
              ชื่อ SP
            </SortableHead>
            <SortableHead
              field='netDue'
              sort={sort}
              onSortChange={onSortChange}
              align='right'
              className='w-32'
            >
              ยอดสุทธิที่ต้องส่ง
            </SortableHead>
            <SortableHead
              field='netSent'
              sort={sort}
              onSortChange={onSortChange}
              align='right'
              className='w-28'
            >
              ยอดส่งจริง
            </SortableHead>
            <SortableHead
              field='commission'
              sort={sort}
              onSortChange={onSortChange}
              align='right'
              className='w-28'
            >
              ค่าคอมฯ SP
            </SortableHead>
            <SortableHead
              field='transactionDate'
              sort={sort}
              onSortChange={onSortChange}
              align='center'
              className='w-32'
            >
              วันที่ทำรายการ
            </SortableHead>
            <SortableHead field='createdBy' sort={sort} onSortChange={onSortChange}>
              ชื่อผู้ทำรายการ
            </SortableHead>
            <TableHead className='w-24 text-center'>จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((record, index) => {
            const isSelected = selectedIds.includes(record.id);
            return (
              <TableRow key={record.id} data-selected={isSelected || undefined}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleRow(record.id, checked === true)}
                    aria-label={`เลือกใบเคลียร์เงิน ${record.id}`}
                  />
                </TableCell>
                <TableCell className='text-muted-foreground text-center text-sm tabular-nums'>
                  {rangeStart + index}
                </TableCell>
                <TableCell className='font-mono text-sm'>{record.id}</TableCell>
                <TableCell className='text-sm font-medium'>{record.staffName}</TableCell>
                <TableCell className='text-right font-mono text-sm font-semibold tabular-nums'>
                  {formatAmount(record.netDue)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono text-sm tabular-nums',
                    record.netSent < record.netDue
                      ? 'text-destructive'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {formatAmount(record.netSent)}
                </TableCell>
                <TableCell className='text-muted-foreground text-right font-mono text-sm tabular-nums'>
                  {formatAmount(record.commission)}
                </TableCell>
                <TableCell className='text-center font-mono text-sm tabular-nums'>
                  {formatDateBE(fromISODate(record.transactionDate))}
                </TableCell>
                <TableCell className='text-muted-foreground truncate text-sm'>
                  {record.createdBy}
                </TableCell>
                <TableCell>
                  <div className='flex items-center justify-center gap-1'>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => onView(record)}
                            aria-label={`ดูรายละเอียดใบเคลียร์เงิน ${record.id}`}
                          />
                        }
                      >
                        <Icons.search />
                      </TooltipTrigger>
                      <TooltipContent>ดูรายละเอียด</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => onDownload(record)}
                            aria-label={`ดาวน์โหลดเอกสารใบเคลียร์เงิน ${record.id}`}
                          />
                        }
                      >
                        <Icons.download />
                      </TooltipTrigger>
                      <TooltipContent>ดาวน์โหลดเอกสาร</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * The direction a column starts on when it is first clicked.
 *
 * Money and dates are read newest/largest first — that is what someone sorting
 * by ยอดสุทธิที่ต้องส่ง is looking for — while the text columns start at ก→ฮ.
 */
const INITIAL_DIRECTION: Record<SpPaymentSortField, SpPaymentSort['direction']> = {
  id: 'asc',
  staffName: 'asc',
  createdBy: 'asc',
  netDue: 'desc',
  netSent: 'desc',
  commission: 'desc',
  transactionDate: 'desc'
};

const ALIGNMENT = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end'
} as const;

/**
 * A column header that orders the list by its own column.
 *
 * There is always a sort — the list opens on วันที่ทำรายการ, newest first — so
 * this toggles between the two directions rather than cycling through an
 * unsorted state that the rows could not actually show. The header of the
 * active column carries the direction both as an arrow and as `aria-sort`, so
 * a screen reader announces the order without the arrow.
 */
function SortableHead({
  field,
  sort,
  onSortChange,
  align = 'left',
  className,
  children
}: {
  field: SpPaymentSortField;
  sort: SpPaymentSort;
  onSortChange: (sort: SpPaymentSort) => void;
  align?: keyof typeof ALIGNMENT;
  className?: string;
  children: React.ReactNode;
}) {
  const isActive = sort.field === field;
  const direction = isActive ? sort.direction : INITIAL_DIRECTION[field];

  const SortIcon = isActive
    ? direction === 'asc'
      ? Icons.chevronUp
      : Icons.chevronDown
    : Icons.chevronsUpDown;

  return (
    <TableHead
      className={cn('px-0', className)}
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className={cn(
          'text-foreground h-8 w-full px-2 font-medium',
          ALIGNMENT[align],
          !isActive && '[&_svg]:text-muted-foreground/60'
        )}
        onClick={() =>
          onSortChange({
            field,
            // The active column flips; a new one starts on its own direction.
            direction: isActive ? (direction === 'asc' ? 'desc' : 'asc') : direction
          })
        }
      >
        {children}
        <SortIcon />
      </Button>
    </TableHead>
  );
}
