'use client';

import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { QuantityInput } from './quantity-input';
import { type ProductItem } from '../api/mock-products';

// Pinned column helpers for order entry. The two right-hand columns are pinned,
// so PINNED_QTY's `right-*` offset MUST equal the total column's own width
// (TOTAL_W below) — otherwise the two pinned columns overlap or leave a gap.
const TOTAL_W = 'w-24';
const PINNED_TOTAL = 'sticky right-0';
// The left-edge shadow marks the pinned group as a layer floating above the
// scrollable columns, so it reads as "there is more data underneath, scroll"
// rather than as missing values.
const PINNED_QTY =
  'sticky right-24 border-l shadow-[-6px_0_10px_-6px_rgb(0_0_0/0.12)] dark:shadow-[-6px_0_10px_-6px_rgb(0_0_0/0.55)]';

// <Table>'s own wrapper renders `overflow-x-auto` (data-slot="table-container"),
// which per the CSS overflow spec forces its overflow-y to compute as `auto`
// too — making that wrapper (not the page) the nearest scroll container and
// therefore the offset parent for this sticky <thead>. A top-16/top-14 offset
// (meant to clear the app's own sticky header assuming the page scrolls past
// it) instead gets applied from the *wrapper's* own top edge, permanently
// shoving the header down into the first row(s) of every table. top-0 sticks
// it flush with the wrapper's top, which is the correct offset for this
// containing block. The z-[15]/z-[19] arbitrary values keep the existing
// header-above-pinned-cells ordering while staying under the app header's z-20.
const STICKY_HEAD = 'sticky top-0 z-[15] bg-muted dark:bg-background';
const STICKY_HEAD_PINNED = 'sticky top-0 z-[19] bg-muted dark:bg-background';

const getPinnedCellClass = (_isOrdered: boolean) =>
  cn('transition-colors z-10 bg-card group-hover/row:bg-muted/50');

/**
 * Column header with an abbreviated visible label. Full Thai labels
 * ("จำนวนแนะนำ", "มูลค่าสินค้า", …) cost ~60px of table width between them,
 * which is what pushed the table past its card and let the pinned columns cover
 * the numbers. The short label is shown, the full one stays available on hover
 * and is the version screen readers announce for the column.
 */
function HeadLabel({ short, full }: { short: string; full: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className='cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-4' />
        }
      >
        <span aria-hidden='true'>{short}</span>
        <span className='sr-only'>{full}</span>
      </TooltipTrigger>
      <TooltipContent>{full}</TooltipContent>
    </Tooltip>
  );
}

export interface PurchaseOrderTableProps {
  products: ProductItem[];
  quantities: Record<number, number>;
  onQuantityChange: (productId: number, qty: number) => void;
  showImages: boolean;
  searchQuery: string;
}

export default function PurchaseOrderTable({
  products,
  quantities,
  onQuantityChange,
  showImages,
  searchQuery
}: PurchaseOrderTableProps) {
  // Group the (search-filtered) products by pack size, e.g. "ขนาด 200 cc".
  const groupedProducts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = products.filter(
      (p) => p.name.toLowerCase().includes(query) || p.code.includes(searchQuery.trim())
    );

    const groups = new Map<string, { packSize: string; items: ProductItem[] }>();
    filtered.forEach((p) => {
      const group = groups.get(p.size) ?? { packSize: p.packSize, items: [] };
      group.items.push(p);
      groups.set(p.size, group);
    });

    return Array.from(groups, ([size, data]) => ({ size, ...data }));
  }, [products, searchQuery]);

  // Track collapsed groups so the open/closed state survives search + tab changes.
  const [collapsedGroups, setCollapsedGroups] = React.useState<string[]>([]);

  const openGroups = groupedProducts
    .map((group) => group.size)
    .filter((size) => !collapsedGroups.includes(size));

  const handleOpenChange = (nextOpen: string[]) => {
    setCollapsedGroups(
      groupedProducts.map((group) => group.size).filter((size) => !nextOpen.includes(size))
    );
  };

  if (groupedProducts.length === 0) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.search />
          </EmptyMedia>
          <EmptyTitle>ไม่พบรายการสินค้า</EmptyTitle>
          <EmptyDescription>ไม่มีสินค้าที่ตรงกับคำค้นหาของคุณในหมวดหมู่นี้</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    // No TooltipProvider at the app root, so the abbreviated column headers get
    // their own here rather than one provider per header cell.
    <TooltipProvider delay={0}>
      <Accordion multiple value={openGroups} onValueChange={handleOpenChange} className='gap-3'>
        {groupedProducts.map((group) => (
          <AccordionItem
            key={group.size}
            value={group.size}
            className='bg-card min-w-0 overflow-hidden rounded-lg border not-last:border-b'
          >
            <AccordionTrigger className='rounded-none bg-white px-4 py-3 text-foreground hover:bg-muted/50 hover:no-underline dark:bg-zinc-950 dark:text-zinc-50 [&[aria-expanded=true]]:border-b'>
              <div className='flex flex-1 items-center gap-2 pr-3'>
                <span className='text-sm font-semibold'>{group.size}</span>
                <Badge variant='outline' className='border-border bg-muted text-foreground'>
                  {group.packSize}
                </Badge>
                <span className='text-muted-foreground ml-auto text-xs font-normal'>
                  {group.items.length} รายการ
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className='p-0'>
              {/* No extra overflow-x-auto wrapper here — <Table> already renders one
                (data-slot="table-container"). Nesting a second scroll container broke
                the sticky-right offsets on the pinned columns below. table-fixed makes
                the browser honor each column's `w-*` class exactly, which the pinned
                columns' `right-24`/`right-0` offsets depend on to align flush. */}
              <Table
                className={cn(
                  'table-fixed border-t border-border/60',
                  // Floor for the auto-width name column. `min-width` on the cell
                  // itself is ignored by fixed table layout, which will collapse
                  // that column to a few pixels once the fixed columns eat the
                  // available space. Putting the floor on the table (sum of the
                  // fixed column widths + 170px for the name) makes the container
                  // scroll instead of squashing the product name away.
                  showImages ? 'min-w-[1050px]' : 'min-w-[970px]'
                )}
              >
                <TableHeader className={STICKY_HEAD}>
                  <TableRow>
                    <TableHead
                      aria-label='เพิ่มในรายการสั่งซื้อแล้ว'
                      className={cn('w-10 text-center', STICKY_HEAD)}
                    />
                    <TableHead className={cn('w-14 text-center', STICKY_HEAD)}>ลำดับ</TableHead>
                    {showImages && (
                      <TableHead className={cn('w-20 text-center', STICKY_HEAD)}>รูปภาพ</TableHead>
                    )}
                    <TableHead className={cn('w-24', STICKY_HEAD)}>รหัสสินค้า</TableHead>
                    {/* The only auto-width column: it absorbs the leftover space on
                      wide screens and gives it back (truncating instead of pushing
                      the pinned columns over their neighbours) when the image column
                      is toggled on. Its lower bound lives on the <Table> min-w below,
                      not here — see the comment there. */}
                    <TableHead className={STICKY_HEAD}>ชื่อสินค้า</TableHead>
                    <TableHead className={cn('w-16 text-center', STICKY_HEAD)}>หน่วย</TableHead>
                    <TableHead className={cn('w-20 text-right', STICKY_HEAD)}>
                      <HeadLabel short='ราคา/หน่วย' full='ราคาต่อหน่วย' />
                    </TableHead>
                    <TableHead className={cn('w-16 text-right', STICKY_HEAD)}>Vat (%)</TableHead>
                    <TableHead className={cn('w-20 text-right', STICKY_HEAD)}>
                      <HeadLabel short='สต็อก' full='จำนวนสต็อก' />
                    </TableHead>
                    <TableHead className={cn('w-20 text-right', STICKY_HEAD)}>
                      <HeadLabel short='แนะนำ' full='จำนวนแนะนำ' />
                    </TableHead>
                    <TableHead
                      className={cn('w-36 px-1 text-center', STICKY_HEAD_PINNED, PINNED_QTY)}
                    >
                      จำนวนที่สั่ง
                    </TableHead>
                    <TableHead
                      className={cn(TOTAL_W, 'text-right', STICKY_HEAD_PINNED, PINNED_TOTAL)}
                    >
                      <HeadLabel short='มูลค่า' full='มูลค่าสินค้า' />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((item, index) => {
                    const qty = quantities[item.id] ?? 0;
                    const subtotal = item.price * qty;
                    const isOrdered = qty > 0;

                    return (
                      <TableRow key={item.id} className='group/row transition-colors'>
                        <TableCell className='text-center'>
                          {isOrdered && (
                            <Icons.check
                              role='img'
                              aria-label='เพิ่มในรายการสั่งซื้อแล้ว'
                              className='mx-auto size-4 text-emerald-600 dark:text-emerald-400'
                            />
                          )}
                        </TableCell>

                        <TableCell className='text-muted-foreground text-center text-sm'>
                          {index + 1}
                        </TableCell>

                        {showImages && (
                          <TableCell>
                            <div className='bg-background mx-auto flex size-10 items-center justify-center overflow-hidden rounded-md border p-0.5'>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt={item.name}
                                className='size-full object-contain'
                              />
                            </div>
                          </TableCell>
                        )}

                        <TableCell className='text-muted-foreground font-mono text-sm'>
                          {item.code}
                        </TableCell>

                        {/* No max-w here: the column is auto-width, so its size comes
                          from the header cell; truncate keeps long names inside it. */}
                        <TableCell className='truncate text-sm font-semibold text-foreground py-1.5'>
                          {item.name}
                        </TableCell>

                        <TableCell className='text-muted-foreground text-center text-sm'>
                          {item.unit}
                        </TableCell>

                        <TableCell className='text-right font-mono text-sm tabular-nums'>
                          {item.price.toFixed(2)}
                        </TableCell>

                        <TableCell className='text-muted-foreground text-right font-mono text-sm tabular-nums'>
                          {item.vat}%
                        </TableCell>

                        {/* Stock is a count of whole units — no decimals, and no
                            thousands separator (matches the reference screens). */}
                        <TableCell className='text-muted-foreground text-right font-mono text-sm tabular-nums'>
                          {Math.round(item.stock)}
                        </TableCell>

                        <TableCell className='text-right'>
                          {item.recommended > 0 ? (
                            <Badge
                              variant='outline'
                              className='border-red-300 bg-red-50 font-mono text-red-700 tabular-nums dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
                            >
                              {item.recommended}
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground/50 font-mono text-sm tabular-nums'>
                              0
                            </span>
                          )}
                        </TableCell>

                        <TableCell
                          className={cn('px-1', PINNED_QTY, getPinnedCellClass(isOrdered))}
                        >
                          <QuantityInput
                            label={item.name}
                            value={qty}
                            onChange={(next) => onQuantityChange(item.id, next)}
                          />
                        </TableCell>

                        <TableCell
                          className={cn(
                            'text-right font-mono text-sm font-bold tabular-nums',
                            qty > 0 ? 'text-brand' : 'text-muted-foreground/50 font-normal',
                            PINNED_TOTAL,
                            getPinnedCellClass(isOrdered)
                          )}
                        >
                          {qty > 0 ? (
                            subtotal.toFixed(2)
                          ) : (
                            <span className='text-muted-foreground/50 font-normal'>0.00</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </TooltipProvider>
  );
}
