'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

/** Padding for one cell of the order-info grid — matches the card's own gutter. */
const CELL = 'px-3 py-3.5';

/**
 * From `lg` up the bottom row sits flush against the card edge — the card drops
 * its own bottom padding so the dividers reach it — so the row carries that
 * gutter itself. Stacked below `lg` every cell keeps the same rhythm.
 */
const CELL_LAST = 'px-3 py-3.5 lg:pb-6';

/** Caption above every value in the grid. */
const CAPTION = 'text-sm text-muted-foreground';

// Exported so other cards on the page (e.g. the order-summary status pill)
// can render the same status with matching colors.
export function getStatusStyles(status: string) {
  switch (status) {
    case 'รอ CP รับข้อมูล':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50';
    case 'CP รับข้อมูลแล้ว':
    case 'ยืนยันการสั่งซื้อ':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50';
    case 'ฉบับร่าง':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700';
    case 'ยกเลิก':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50';
    default:
      return 'bg-muted/50 text-muted-foreground border-border';
  }
}

/** Label-above-value pair for glance-only reference data. */
function InfoField({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className={CAPTION}>{label}</p>
      <div className='mt-1 truncate text-sm font-medium text-foreground'>{children}</div>
    </div>
  );
}

export interface PurchaseOrderInfoGridProps {
  poNumber: string;
  /** Provided → the PO number becomes an input once the source is 'ผู้ใช้ระบุ'. */
  onPoNumberChange?: (val: string) => void;
  poSource: 'system' | 'learner';
  /** Provided → the source renders as a radio group instead of static text. */
  onPoSourceChange?: (val: 'system' | 'learner') => void;
  cvCode: string;
  customerName: string;
  /** Preformatted — the caller owns Buddhist-era conversion. */
  transactionDate: string;
  orderRound: string;
  /** Either preformatted text (detail) or a date picker (create). */
  deliveryDate: React.ReactNode;
  /** Id of the control inside `deliveryDate`, so its caption can label it. */
  deliveryFieldId?: string;
  cpReceivedDate?: string | null;
  status: string;
}

/**
 * Cell grid of a purchase order's header data, shared by the create and detail
 * screens. Dividers run edge to edge, so the padding lives on the cells — drop
 * this straight into a `<CardContent className='px-0'>`.
 */
export default function PurchaseOrderInfoGrid({
  poNumber,
  onPoNumberChange,
  poSource,
  onPoSourceChange,
  cvCode,
  customerName,
  transactionDate,
  orderRound,
  deliveryDate,
  deliveryFieldId,
  cpReceivedDate,
  status
}: PurchaseOrderInfoGridProps) {
  const isPoNumberEditable = Boolean(onPoNumberChange) && poSource === 'learner';

  return (
    <div className='divide-y'>
      {/* Row 1 — PO number, with its source called out on the far right */}
      <div
        className={cn(
          CELL,
          'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'
        )}
      >
        <div className='min-w-0 flex-1'>
          {isPoNumberEditable ? (
            <>
              <Label htmlFor='po-number' className={cn(CAPTION, 'font-normal')}>
                เลขที่ใบสั่งซื้อ
              </Label>
              <Input
                id='po-number'
                value={poNumber}
                onChange={(e) => onPoNumberChange?.(e.target.value.toUpperCase())}
                placeholder='ระบุเลขที่ใบสั่งซื้อ'
                autoFocus
                // `md:text-xl` is required: the Input base sets `md:text-sm`,
                // which otherwise wins back over `text-xl` from `md` up.
                className='mt-1 h-auto w-full max-w-md rounded-md border-2 border-input bg-transparent px-3 py-1.5 font-mono text-xl font-bold tracking-tight shadow-none focus-visible:border-primary focus-visible:ring-0 md:text-xl'
              />
            </>
          ) : (
            <>
              <p className={CAPTION}>เลขที่ใบสั่งซื้อ</p>
              <p className='mt-1 truncate font-mono text-xl font-bold tracking-tight text-foreground'>
                {poNumber}
              </p>
            </>
          )}
        </div>

        {onPoSourceChange ? (
          <div className='shrink-0'>
            <p className={CAPTION}>เลขที่ใบสั่งซื้อจาก</p>
            <RadioGroup
              value={poSource}
              onValueChange={(val) => onPoSourceChange(val as 'system' | 'learner')}
              className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1'
            >
              <div className='flex items-center gap-1.5'>
                <RadioGroupItem value='system' id='po-system' />
                <Label
                  htmlFor='po-system'
                  className='cursor-pointer text-sm font-normal whitespace-nowrap'
                >
                  ระบบ
                </Label>
              </div>
              <div className='flex items-center gap-1.5'>
                <RadioGroupItem value='learner' id='po-learner' />
                <Label
                  htmlFor='po-learner'
                  className='cursor-pointer text-sm font-normal whitespace-nowrap'
                >
                  ผู้ใช้ระบุ
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : (
          <p className='shrink-0 text-sm text-muted-foreground'>
            เลขที่ใบสั่งซื้อจาก :{' '}
            <span className='font-semibold text-foreground'>
              {poSource === 'system' ? 'ระบบ' : 'ผู้ใช้ระบุ'}
            </span>
          </p>
        )}
      </div>

      {/* Row 2 — customer + order dates */}
      <div className='grid grid-cols-1 divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0'>
        <InfoField label='CV CODE' className={CELL}>
          {cvCode}
        </InfoField>
        <InfoField label='ชื่อลูกค้า' className={CELL}>
          {customerName}
        </InfoField>
        <InfoField label='วันที่ทำรายการ' className={CELL}>
          {transactionDate}
        </InfoField>
        <InfoField label='รอบสั่งซื้อสินค้า' className={CELL}>
          {orderRound}
        </InfoField>
      </div>

      {/* Row 3 — delivery, CP receipt, status */}
      <div className='grid grid-cols-1 divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0'>
        <div className={cn(CELL_LAST, 'min-w-0 lg:col-span-2')}>
          {deliveryFieldId ? (
            <Label htmlFor={deliveryFieldId} className={cn(CAPTION, 'font-normal')}>
              วันที่รับสินค้า
            </Label>
          ) : (
            <p className={CAPTION}>วันที่รับสินค้า</p>
          )}
          <div className='mt-1 text-sm font-medium text-foreground'>{deliveryDate}</div>
        </div>
        <InfoField label='วันที่ CP รับข้อมูล' className={CELL_LAST}>
          {cpReceivedDate ?? '-'}
        </InfoField>
        <div className={CELL_LAST}>
          <p className={CAPTION}>สถานะ</p>
          <Badge
            variant='outline'
            className={cn(
              'mt-1.5 gap-1 rounded-full px-2 py-0 text-[11px] font-medium',
              getStatusStyles(status)
            )}
          >
            <Icons.clock className='size-3 animate-pulse' />
            {status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
