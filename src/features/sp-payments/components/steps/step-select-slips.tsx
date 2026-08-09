'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { SP_PRODUCTS } from '@/features/sp/api/sp-catalog';
import { formatAmount, formatBaht, formatCount, formatDateBE } from '@/lib/format-date-be';
import type { WithdrawalSlip } from '../../api/sp-payment-data';

/**
 * ขั้นตอนที่ 1 — เลือกพนักงานและเลขที่ใบเบิก.
 *
 * The rep is picked in the wizard's shared header; this step lists every open
 * withdrawal slip the clearing round covers. Like the legacy screen, the round
 * always clears all of them — the rows are read-only, with the magnifier as the
 * only action.
 */

const productsById = new Map(SP_PRODUCTS.map((product) => [product.id, product]));

const slipValue = (slip: WithdrawalSlip) =>
  slip.lines.reduce(
    (sum, line) => sum + line.qty * (productsById.get(line.productId)?.spPrice ?? 0),
    0
  );

const slipUnits = (slip: WithdrawalSlip) => slip.lines.reduce((sum, line) => sum + line.qty, 0);

export interface StepSelectSlipsProps {
  slips: WithdrawalSlip[];
}

export function StepSelectSlips({ slips }: StepSelectSlipsProps) {
  const [openSlip, setOpenSlip] = React.useState<WithdrawalSlip | null>(null);

  if (slips.length === 0) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.truck />
          </EmptyMedia>
          <EmptyTitle>ไม่มีใบเบิกสินค้าที่รอเคลียร์</EmptyTitle>
          <EmptyDescription>พนักงานขายคนนี้ไม่มีใบเบิกสินค้าที่ยังไม่ได้เคลียร์เงิน</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='min-w-0 space-y-3'>
      <Card size='sm' className='min-w-0 border ring-0'>
        <CardHeader className='bg-muted/20 border-b pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <Icons.invoice className='size-4' />
            ใบเบิกสินค้าที่รอเคลียร์
          </CardTitle>

          <CardAction>
            <Badge variant='outline' className='font-mono tabular-nums'>
              {slips.length} ใบเบิก
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className='min-w-0 overflow-x-auto px-0 py-0'>
          <Table className='min-w-[720px] [&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4'>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead className='w-20 text-center'>ลำดับที่</TableHead>
                <TableHead>เลขที่ใบเบิกสินค้า</TableHead>
                <TableHead className='w-36 text-center'>วันที่เบิกสินค้า</TableHead>
                <TableHead className='w-28 text-right'>จำนวนรายการ</TableHead>
                <TableHead className='w-32 text-right'>มูลค่าเบิก</TableHead>
                <TableHead className='w-20 text-center'>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.map((slip, index) => {
                return (
                  <TableRow key={slip.id}>
                    <TableCell className='text-muted-foreground text-center text-sm tabular-nums'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono text-sm font-medium'>{slip.id}</TableCell>
                    <TableCell className='text-center font-mono text-sm tabular-nums'>
                      {formatDateBE(slip.date)}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-right font-mono text-sm tabular-nums'>
                      {slip.lines.length} รายการ
                    </TableCell>
                    <TableCell className='text-right font-mono text-sm tabular-nums'>
                      {formatAmount(slipValue(slip))}
                    </TableCell>
                    <TableCell className='text-center'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        onClick={() => setOpenSlip(slip)}
                        aria-label={`ดูรายการสินค้าในใบเบิกเลขที่ ${slip.id}`}
                      >
                        <Icons.search />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className='text-muted-foreground text-xs'>รายการสินค้าทั้งหมดจะถูกนำไปคำนวณในขั้นตอนถัดไป</p>

      <SlipLinesDialog slip={openSlip} onOpenChange={() => setOpenSlip(null)} />
    </div>
  );
}

/** The products behind one slip — the magnifier on each row. */
function SlipLinesDialog({
  slip,
  onOpenChange
}: {
  slip: WithdrawalSlip | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!slip) return null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>รายการสินค้าในใบเบิก</DialogTitle>
          <DialogDescription>
            เลขที่ <span className='font-mono'>{slip.id}</span> · วันที่เบิก{' '}
            <span className='font-mono'>{formatDateBE(slip.date)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[55vh] overflow-y-auto rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted dark:bg-background'>
              <TableRow>
                <TableHead className='w-28'>รหัสสินค้า</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead className='w-20 text-right'>จำนวน</TableHead>
                <TableHead className='w-24 text-right'>มูลค่า</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slip.lines.map((line) => {
                const product = productsById.get(line.productId);
                if (!product) return null;
                return (
                  <TableRow key={line.productId}>
                    <TableCell className='text-muted-foreground font-mono text-sm'>
                      {product.code}
                    </TableCell>
                    <TableCell className='text-sm font-medium'>{product.name}</TableCell>
                    <TableCell className='text-right font-mono text-sm tabular-nums'>
                      {formatCount(line.qty)}
                    </TableCell>
                    <TableCell className='text-right font-mono text-sm tabular-nums'>
                      {formatAmount(line.qty * product.spPrice)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className='flex items-center justify-between gap-3 text-sm'>
          <span className='text-muted-foreground'>
            รวม {slip.lines.length} รายการ · {formatCount(slipUnits(slip))} ชิ้น
          </span>
          <Badge variant='outline' className='font-mono tabular-nums'>
            {formatBaht(slipValue(slip))}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
