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

/**
 * Product catalog table grouped by pack size, shared by every SAM screen that
 * lists products (ใบเบิกสินค้า SP, ฝาก/คืน สินค้า …).
 *
 * The purchase-order screens ship their own hard-coded version of this table;
 * this one takes its columns as data so the withdrawal and clearing screens can
 * show different measures over the same layout.
 */

/** The fields the table itself needs; callers extend this with their own. */
export interface CatalogItem {
  id: number;
  code: string;
  name: string;
  /** e.g. "ขนาด 200 cc" — the grouping key. */
  size: string;
  /** e.g. "49 / ลัง" — shown as a badge on the group header. */
  packSize: string;
}

export type CatalogColumn<T extends CatalogItem> = {
  id: string;
  /** Visible header. Keep it short; put the long form in `fullHeader`. */
  header: React.ReactNode;
  /**
   * Full Thai label when `header` is abbreviated. Shown on hover and announced
   * to screen readers — the abbreviation alone is not an accessible name.
   */
  fullHeader?: string;
  /** Tailwind width class. Omit on exactly one column to let it absorb slack. */
  width?: string;
  align?: 'left' | 'center' | 'right';
  cell: (item: T, indexInGroup: number) => React.ReactNode;
  /** Extra classes for the body cell (font, color …). */
  cellClassName?: string;
};

/**
 * Right-edge offsets for the pinned pair. A pinned column's `right-*` offset
 * MUST equal the total width of the pinned columns to its right, or the two
 * overlap. Only widths listed here can be used by the last column.
 */
const PIN_OFFSET: Record<string, string> = {
  'w-20': 'right-20',
  'w-24': 'right-24',
  'w-28': 'right-28',
  'w-32': 'right-32'
};

// <Table> renders its own `overflow-x-auto` wrapper, which makes that wrapper
// (not the page) the offset parent for this sticky <thead> — so top-0, not the
// app header's height, is the correct offset here. z-[15]/z-[19] keep the
// header above the pinned body cells while staying under the app header's z-20.
const STICKY_HEAD = 'sticky top-0 z-[15] bg-muted dark:bg-background';
const STICKY_HEAD_PINNED = 'sticky top-0 z-[19] bg-muted dark:bg-background';
const PINNED_CELL = 'transition-colors z-10 bg-card group-hover/row:bg-muted/50';

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
} as const;

function HeadLabel({ short, full }: { short: React.ReactNode; full: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className='decoration-muted-foreground/40 cursor-help underline decoration-dotted underline-offset-4' />
        }
      >
        <span aria-hidden='true'>{short}</span>
        <span className='sr-only'>{full}</span>
      </TooltipTrigger>
      <TooltipContent>{full}</TooltipContent>
    </Tooltip>
  );
}

export interface CatalogTableProps<T extends CatalogItem> {
  items: T[];
  columns: CatalogColumn<T>[];
  /** Filters on product name and code before grouping. */
  searchQuery?: string;
  /**
   * Pins the last two columns (the input and its computed total) to the right
   * edge. The last column's `width` must be a key of PIN_OFFSET.
   */
  pinLastTwo?: boolean;
  /** Floor for the table so the auto-width name column cannot collapse. */
  minWidthClass?: string;
  /**
   * Groups the rows by pack size under collapsible headers. Turn it off for
   * read-only screens that just list every row in one flat table.
   */
  grouped?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function CatalogTable<T extends CatalogItem>({
  items,
  columns,
  searchQuery = '',
  pinLastTwo = false,
  minWidthClass = 'min-w-[970px]',
  grouped = true,
  emptyTitle = 'ไม่พบรายการสินค้า',
  emptyDescription = 'ไม่มีสินค้าที่ตรงกับคำค้นหาของคุณในหมวดหมู่นี้'
}: CatalogTableProps<T>) {
  const groups = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = items.filter(
      (item) => item.name.toLowerCase().includes(query) || item.code.includes(searchQuery.trim())
    );

    const bySize = new Map<string, { packSize: string; items: T[] }>();
    filtered.forEach((item) => {
      const group = bySize.get(item.size) ?? { packSize: item.packSize, items: [] };
      group.items.push(item);
      bySize.set(item.size, group);
    });

    return Array.from(bySize, ([size, data]) => ({ size, ...data }));
  }, [items, searchQuery]);

  // Track collapsed groups so open/closed state survives search and tab changes.
  const [collapsedGroups, setCollapsedGroups] = React.useState<string[]>([]);

  const openGroups = groups
    .map((group) => group.size)
    .filter((size) => !collapsedGroups.includes(size));

  const handleOpenChange = (nextOpen: string[]) => {
    setCollapsedGroups(
      groups.map((group) => group.size).filter((size) => !nextOpen.includes(size))
    );
  };

  // Resolve the pinned pair once — the offset depends on the last column's width.
  const lastIndex = columns.length - 1;
  const totalWidth = columns[lastIndex]?.width;
  const pinOffset = totalWidth ? PIN_OFFSET[totalWidth] : undefined;
  const canPin = pinLastTwo && columns.length >= 2 && Boolean(pinOffset);

  const getPinClass = (index: number) => {
    if (!canPin) return undefined;
    if (index === lastIndex) return 'sticky right-0';
    if (index === lastIndex - 1) {
      // The left-edge shadow marks the pinned group as a layer floating above
      // the scrollable columns, so it reads as "scroll for more" rather than as
      // missing values.
      return cn(
        'sticky border-l shadow-[-6px_0_10px_-6px_rgb(0_0_0/0.12)] dark:shadow-[-6px_0_10px_-6px_rgb(0_0_0/0.55)]',
        pinOffset
      );
    }
    return undefined;
  };

  if (groups.length === 0) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.search />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  /* No extra overflow wrapper — <Table> already renders one. A second scroll
     container would break the pinned columns' sticky offsets. table-fixed makes
     the browser honor each `w-*` class exactly, which those offsets depend on
     to align flush. */
  const renderTable = (rows: T[], withTopBorder: boolean) => (
    <Table
      className={cn('border-border/60 table-fixed', withTopBorder && 'border-t', minWidthClass)}
    >
      <TableHeader className={STICKY_HEAD}>
        <TableRow>
          {columns.map((column, index) => {
            const pin = getPinClass(index);
            return (
              <TableHead
                key={column.id}
                className={cn(
                  column.width,
                  ALIGN_CLASS[column.align ?? 'left'],
                  pin ? STICKY_HEAD_PINNED : STICKY_HEAD,
                  pin
                )}
              >
                {column.fullHeader ? (
                  <HeadLabel short={column.header} full={column.fullHeader} />
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((item, index) => (
          <TableRow key={item.id} className='group/row transition-colors'>
            {columns.map((column, columnIndex) => {
              const pin = getPinClass(columnIndex);
              return (
                <TableCell
                  key={column.id}
                  className={cn(
                    ALIGN_CLASS[column.align ?? 'left'],
                    column.cellClassName,
                    pin,
                    pin && PINNED_CELL
                  )}
                >
                  {column.cell(item, index)}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  // No TooltipProvider at the app root, so the abbreviated headers get one here.
  if (!grouped) {
    const flatRows = groups.flatMap((group) => group.items);
    return (
      <TooltipProvider delay={0}>
        <div className='bg-card min-w-0 overflow-hidden rounded-lg border'>
          {renderTable(flatRows, false)}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delay={0}>
      <Accordion multiple value={openGroups} onValueChange={handleOpenChange} className='gap-3'>
        {groups.map((group) => (
          <AccordionItem
            key={group.size}
            value={group.size}
            className='bg-card min-w-0 overflow-hidden rounded-lg border not-last:border-b'
          >
            <AccordionTrigger className='text-foreground hover:bg-muted/50 rounded-none bg-white px-4 py-3 hover:no-underline dark:bg-zinc-950 dark:text-zinc-50 [&[aria-expanded=true]]:border-b'>
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

            <AccordionContent className='p-0'>{renderTable(group.items, true)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </TooltipProvider>
  );
}
