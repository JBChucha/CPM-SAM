'use client';

import * as React from 'react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { CatalogTable, type CatalogColumn } from '@/components/sam/catalog-table';
import { DatePickerField } from '@/components/sam/date-picker-field';
import { InfoGrid } from '@/components/sam/info-grid';
import { QuantityStepper } from '@/components/sam/quantity-stepper';
import { DEMO_USER } from '@/config/demo-user';
import {
  getOutstandingCycles,
  SP_CATEGORIES,
  SP_PRODUCTS,
  SP_STAFF,
  type SpProductItem
} from '@/features/sp/api/sp-catalog';
import { formatAmount, formatBaht, formatCount, formatDateTimeBEPlain } from '@/lib/format-date-be';
import { cn } from '@/lib/utils';

/**
 * สร้างใบเบิกสินค้า SP — a sales rep draws stock out of the agent's inventory.
 *
 * Mirrors `CreateWithDrawSP` in the legacy system: the same header fields, the
 * same arrears warning, and the same per-product measures, rebuilt on the
 * shared SAM components.
 */
export default function CreateSpWithdrawalPage() {
  // ─── Slip header ───
  const [staffId, setStaffId] = React.useState(SP_STAFF[0].id);
  const [transactionDate] = React.useState(() => new Date());
  const [withdrawDate, setWithdrawDate] = React.useState<Date | undefined>(() => new Date());

  // ─── Catalog ───
  const [activeTab, setActiveTab] = React.useState<string>(SP_CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showImages, setShowImages] = React.useState(false);
  const [quantities, setQuantities] = React.useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const outstandingCycles = getOutstandingCycles(staffId);
  const staffName = SP_STAFF.find((staff) => staff.id === staffId)?.name ?? '';

  const handleQuantityChange = (productId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  /**
   * Fills every tab at once, same as the purchase-order screen. Clamped to the
   * agent's stock because unlike a purchase order a withdrawal cannot exceed
   * what is on hand — the same ceiling each row's stepper enforces.
   */
  const handleApplyRecommended = () => {
    setQuantities(
      Object.fromEntries(
        SP_PRODUCTS.map((product) => [
          product.id,
          Math.min(product.recommended, Math.floor(product.stock))
        ])
      )
    );
    const count = SP_PRODUCTS.filter((product) => product.recommended > 0).length;
    toast.success(`กรอกจำนวนแนะนำสำหรับสินค้าจำนวน ${count} รายการแล้ว`);
  };

  const handleClearAll = () => {
    setQuantities({});
    toast.success('ล้างจำนวนที่เบิกทั้งหมดเรียบร้อยแล้ว');
  };

  /**
   * One pass over the catalog feeds both readers of these figures: the tab
   * badges want lines per category, the summary card wants units and value per
   * category. Every category is seeded at zero so the summary keeps all four
   * rows at a fixed height instead of reflowing as quantities come and go.
   */
  const totals = React.useMemo(() => {
    const byCategory = Object.fromEntries(
      SP_CATEGORIES.map((category) => [category, { lines: 0, qty: 0, value: 0 }])
    ) as Record<string, { lines: number; qty: number; value: number }>;

    let lineCount = 0;
    let totalQty = 0;
    let value = 0;

    SP_PRODUCTS.forEach((product) => {
      const qty = quantities[product.id] ?? 0;
      if (qty <= 0) return;
      const lineValue = product.spPrice * qty;

      lineCount += 1;
      totalQty += qty;
      value += lineValue;

      const bucket = byCategory[product.category];
      if (bucket) {
        bucket.lines += 1;
        bucket.qty += qty;
        bucket.value += lineValue;
      }
    });

    return { lineCount, totalQty, value, byCategory };
  }, [quantities]);

  const handleSubmit = () => {
    if (totals.totalQty === 0) {
      toast.error('กรุณาระบุจำนวนที่เบิกอย่างน้อย 1 รายการ');
      return;
    }
    if (!withdrawDate) {
      toast.error('กรุณาระบุวันที่เบิก');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('บันทึกใบเบิกสินค้า SP เรียบร้อยแล้ว', {
        description: `${staffName} · ${totals.lineCount} รายการ · มูลค่า ${formatBaht(totals.value)}`
      });
    }, 1200);
  };

  const columns: CatalogColumn<SpProductItem>[] = React.useMemo(
    () => [
      {
        // Blank header by design — the tick is self-explanatory in context, so
        // only the accessible name is rendered, matching the purchase-order table.
        id: 'ticked',
        header: <span className='sr-only'>เพิ่มในรายการเบิกแล้ว</span>,
        width: 'w-10',
        align: 'center',
        cell: (item) =>
          (quantities[item.id] ?? 0) > 0 ? (
            <Icons.check
              role='img'
              aria-label='เพิ่มในรายการเบิกแล้ว'
              className='mx-auto size-4 text-emerald-600 dark:text-emerald-400'
            />
          ) : null
      },
      {
        id: 'index',
        header: 'ลำดับ',
        width: 'w-14',
        align: 'center',
        cellClassName: 'text-muted-foreground text-sm',
        cell: (_item, index) => index + 1
      },
      // Sits between ลำดับ and รหัสสินค้า, same slot the purchase-order tables
      // give it. Spliced out entirely when off, so it costs no column width.
      ...(showImages
        ? [
            {
              id: 'image',
              header: 'รูปภาพ',
              width: 'w-20',
              align: 'center' as const,
              cell: (item: SpProductItem) => (
                <div className='bg-background mx-auto flex size-10 items-center justify-center overflow-hidden rounded-md border p-0.5'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className='size-full object-contain' />
                </div>
              )
            }
          ]
        : []),
      {
        id: 'code',
        header: 'รหัสสินค้า',
        width: 'w-24',
        cellClassName: 'text-muted-foreground font-mono text-sm',
        cell: (item) => item.code
      },
      {
        // The only auto-width column: it absorbs the slack on wide screens and
        // truncates instead of pushing the pinned columns over their neighbours.
        id: 'name',
        header: 'ชื่อสินค้า',
        cellClassName: 'text-foreground truncate py-1.5 text-sm font-semibold',
        cell: (item) => item.name
      },
      {
        id: 'unit',
        header: 'หน่วย',
        width: 'w-16',
        align: 'center',
        cellClassName: 'text-muted-foreground text-sm',
        cell: (item) => item.unit
      },
      {
        id: 'price',
        header: 'ราคา/หน่วย',
        fullHeader: 'ราคาต่อหน่วย',
        width: 'w-20',
        align: 'right',
        cellClassName: 'font-mono text-sm tabular-nums',
        cell: (item) => formatAmount(item.spPrice)
      },
      {
        id: 'spStock',
        header: 'สต็อก SP',
        fullHeader: 'จำนวนที่พนักงานถืออยู่ (สต็อก SP)',
        width: 'w-20',
        align: 'right',
        cellClassName: 'text-muted-foreground font-mono text-sm tabular-nums',
        cell: (item) => item.spStock
      },
      {
        id: 'deposited',
        header: 'ฝาก',
        fullHeader: 'จำนวนที่ฝาก',
        width: 'w-16',
        align: 'right',
        cellClassName: 'text-muted-foreground font-mono text-sm tabular-nums',
        cell: (item) => item.deposited
      },
      {
        id: 'regular',
        header: 'ลูกค้าประจำ',
        fullHeader: 'จำนวนที่กันไว้ให้ลูกค้าประจำ',
        width: 'w-24',
        align: 'right',
        cellClassName: 'text-muted-foreground font-mono text-sm tabular-nums',
        cell: (item) => item.regularCustomer
      },
      {
        id: 'recommended',
        header: 'แนะนำ',
        fullHeader: 'จำนวนแนะนำ',
        width: 'w-20',
        align: 'right',
        cell: (item) =>
          item.recommended > 0 ? (
            <Badge
              variant='outline'
              className='border-red-300 bg-red-50 font-mono text-red-700 tabular-nums dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
            >
              {item.recommended}
            </Badge>
          ) : (
            <span className='text-muted-foreground/50 font-mono text-sm tabular-nums'>0</span>
          )
      },
      {
        id: 'stock',
        header: 'สต็อก',
        fullHeader: 'จำนวนสต็อกคงเหลือของเอเยนต์',
        width: 'w-20',
        align: 'right',
        cellClassName: 'text-muted-foreground font-mono text-sm tabular-nums',
        cell: (item) => formatCount(item.stock)
      },
      {
        id: 'withdraw',
        header: 'จำนวนที่เบิก',
        width: 'w-36',
        align: 'center',
        cellClassName: 'px-1',
        cell: (item) => (
          <QuantityStepper
            label={item.name}
            fieldLabel='จำนวนที่เบิก'
            value={quantities[item.id] ?? 0}
            // A rep cannot draw more than the agent actually holds.
            max={Math.floor(item.stock)}
            onChange={(next) => handleQuantityChange(item.id, next)}
          />
        )
      },
      {
        id: 'total',
        header: 'มูลค่า',
        fullHeader: 'มูลค่าสินค้า',
        // Must stay a key of the catalog table's PIN_OFFSET map — the pinned
        // quantity column's right offset is derived from this width.
        width: 'w-24',
        align: 'right',
        cell: (item) => {
          const qty = quantities[item.id] ?? 0;
          return (
            <span
              className={cn(
                'font-mono text-sm tabular-nums',
                qty > 0 ? 'text-brand font-bold' : 'text-muted-foreground/50'
              )}
            >
              {formatAmount(item.spPrice * qty)}
            </span>
          );
        }
      }
    ],
    [quantities, showImages]
  );

  return (
    <PageContainer pageTitle='สร้างใบเบิกสินค้า SP'>
      <div className='min-w-0 space-y-4 pb-4'>
        {/* ─── Slip header ─── */}
        <Card size='sm' className='min-w-0 pb-0'>
          <CardHeader className='bg-muted/20 border-b pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
              <Icons.page className='size-4' />
              รายละเอียดใบเบิกสินค้า
            </CardTitle>
          </CardHeader>
          {/* No gutter on any side: -mt-3 cancels the card's flex gap under the
              header, px-0/pb-0 drop the rest, so the grid's dividers reach the
              card's edges. The cells carry the padding instead. */}
          <CardContent className='-mt-3 px-0 pb-0'>
            <InfoGrid
              columns={5}
              fields={[
                {
                  // 2 of the 5 columns: the longest value on the row, and the
                  // only one at headline size.
                  label: 'ชื่อพนักงาน',
                  value: DEMO_USER.fullName,
                  emphasis: true,
                  span: 2
                },
                {
                  label: 'พนักงานขาย',
                  required: true,
                  controlId: 'sp-withdraw-staff',
                  control: (
                    <NativeSelect
                      id='sp-withdraw-staff'
                      className='w-full'
                      value={staffId}
                      onChange={(event) => setStaffId(Number(event.target.value))}
                    >
                      {SP_STAFF.map((staff) => (
                        <NativeSelectOption key={staff.id} value={staff.id}>
                          {staff.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )
                },
                {
                  label: 'วันที่ทำรายการ',
                  value: (
                    <span className='tabular-nums'>{formatDateTimeBEPlain(transactionDate)}</span>
                  )
                },
                {
                  label: 'วันที่เบิก',
                  required: true,
                  controlId: 'sp-withdraw-date',
                  control: (
                    <DatePickerField
                      id='sp-withdraw-date'
                      value={withdrawDate}
                      onChange={setWithdrawDate}
                      className='h-9 w-full'
                    />
                  )
                }
              ]}
            />
          </CardContent>
        </Card>

        {/* Arrears warning — the reference screen surfaces this before letting
            any more stock leave with the rep. */}
        {outstandingCycles > 0 && (
          <Alert variant='destructive'>
            <Icons.warning />
            <AlertTitle className='text-base font-semibold'>
              พนักงานค้างเคลียร์หนี้ {outstandingCycles} รอบบิล
            </AlertTitle>
            <AlertDescription>
              {staffName} ยังไม่ได้เคลียร์เงินของรอบบิลก่อนหน้า กรุณาตรวจสอบก่อนอนุมัติการเบิกสินค้าเพิ่ม
            </AlertDescription>
          </Alert>
        )}

        {/* ─── Bottom section: 4-col grid (catalog 3/4 + summary 1/4) ───
            Same split as the purchase-order screen. The catalog carries five
            extra SP measures (สต็อก SP, ฝาก, ลูกค้าประจำ, แนะนำ, สต็อก) on top of
            the shared columns, so at 3/4 width it scrolls horizontally inside
            its own card with the quantity and total columns pinned. */}
        <div className='grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-4'>
          <Card className='min-w-0 lg:col-span-3'>
            <CardHeader className='bg-muted/20 border-b pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.truck className='size-4' />
                รายการสินค้าที่เบิก
              </CardTitle>
            </CardHeader>
            <CardContent className='min-w-0'>
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as string);
                  setSearchQuery('');
                }}
                className='gap-4'
              >
                <TabsList className='bg-muted/50 h-fit! flex-wrap justify-start gap-1.5 rounded-lg p-1 group-data-horizontal/tabs:h-fit!'>
                  {SP_CATEGORIES.map((category) => {
                    const isActive = activeTab === category;
                    return (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className='h-9! gap-2 rounded-md px-5 text-sm font-bold transition-all duration-200 data-active:bg-brand! data-active:text-brand-foreground! data-active:shadow-md'
                      >
                        {category}
                        {totals.byCategory[category].lines > 0 && (
                          <Badge
                            variant='secondary'
                            className={cn(
                              'px-2 py-0.5 font-mono text-xs font-bold transition-colors duration-200',
                              isActive
                                ? 'bg-white text-black'
                                : 'bg-muted-foreground/15 text-muted-foreground'
                            )}
                          >
                            {totals.byCategory[category].lines}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='relative w-full sm:max-w-sm'>
                    <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input
                      type='search'
                      placeholder='ค้นหาด้วยรหัสสินค้า หรือ ชื่อสินค้า...'
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      aria-label='ค้นหาสินค้า'
                      className='pl-9'
                    />
                  </div>

                  <div className='flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap'>
                    <div className='border-border mr-1 flex h-6 items-center gap-2 border-r pr-3'>
                      <Switch
                        id='sp-show-images'
                        checked={showImages}
                        onCheckedChange={setShowImages}
                      />
                      <Label
                        htmlFor='sp-show-images'
                        className='text-muted-foreground cursor-pointer text-xs font-normal whitespace-nowrap'
                      >
                        แสดงรูปภาพสินค้า
                      </Label>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleApplyRecommended}
                      >
                        <Icons.checks />
                        ใส่จำนวนแนะนำทั้งหมด
                      </Button>
                      <Button type='button' variant='outline' size='sm' onClick={handleClearAll}>
                        <Icons.trash />
                        ล้างทั้งหมด
                      </Button>
                    </div>
                  </div>
                </div>

                {SP_CATEGORIES.map((category) => (
                  <TabsContent key={category} value={category} className='min-w-0'>
                    <CatalogTable
                      items={SP_PRODUCTS.filter((product) => product.category === category)}
                      columns={columns}
                      searchQuery={searchQuery}
                      pinLastTwo
                      // Floor = fixed column widths + room for the name column.
                      // +80px (w-20) when the image column is spliced in, so the
                      // name column keeps its floor instead of absorbing the cost.
                      minWidthClass={showImages ? 'min-w-[1300px]' : 'min-w-[1220px]'}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Summary card — 1/4
              Same anatomy as the purchase-order summary: caption, large hero
              amount, then a shaded breakdown box. lg:top-[72px] clears the app's
              own sticky header (h-14 = 56px from md up). */}
          <Card size='sm' className='min-w-0 pt-4! lg:sticky lg:top-[72px] lg:col-span-1'>
            <CardHeader className='bg-muted/20 border-b pb-4!'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.invoice className='size-4' />
                สรุปใบเบิกสินค้า
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-5 pt-3'>
              <div className='rounded-lg bg-red-50 p-4 dark:bg-red-950/30'>
                <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  มูลค่าสินค้าที่เบิก
                </p>
                <p className='text-foreground font-mono text-4xl font-bold'>
                  {formatBaht(totals.value)}
                </p>
              </div>

              {/* Breakdown by the same four categories the catalog tabs use, so
                  the slip can be read back against the tab the rep filled it from.
                  Untouched categories stay listed but dimmed — the box keeps a
                  fixed height and the zero is itself the answer. */}
              {/* A grid, not a row of flex boxes: the two `auto` tracks size
                  themselves to the widest cell across every row, so the quantity
                  column lands on one edge instead of drifting with each row's
                  value width. The gutters are cell padding rather than a grid
                  gap, or the total row's rule would break at every column seam. */}
              <div className='bg-muted/40 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-y-2.5 rounded-lg p-4 text-sm'>
                {SP_CATEGORIES.map((category) => {
                  const bucket = totals.byCategory[category];
                  const dim = bucket.qty === 0 ? 'text-muted-foreground/50' : undefined;
                  return (
                    <React.Fragment key={category}>
                      <span className={cn('text-muted-foreground truncate', dim)}>{category}</span>
                      <span
                        className={cn(
                          'text-muted-foreground pl-3 text-right font-mono text-xs tabular-nums',
                          dim
                        )}
                      >
                        {formatCount(bucket.qty)} ชิ้น
                      </span>
                      <span className={cn('pl-3 text-right font-mono tabular-nums', dim)}>
                        {formatBaht(bucket.value)}
                      </span>
                    </React.Fragment>
                  );
                })}

                <span className='border-border/80 mt-0.5 border-t pt-2.5 font-semibold'>
                  มูลค่ารวม
                </span>
                <span className='border-border/80 text-muted-foreground mt-0.5 border-t pt-2.5 pl-3 text-right font-mono text-xs tabular-nums'>
                  {formatCount(totals.totalQty)} ชิ้น
                </span>
                <span className='border-border/80 mt-0.5 border-t pt-2.5 pl-3 text-right font-mono font-bold tabular-nums'>
                  {formatBaht(totals.value)}
                </span>
              </div>

              <Button
                type='button'
                size='lg'
                className='h-14! w-full gap-2 bg-black text-base font-semibold text-white hover:bg-black/85 dark:bg-black dark:text-white dark:hover:bg-black/85'
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Icons.spinner className='size-5 animate-spin' />
                ) : (
                  <Icons.check className='size-5' />
                )}
                บันทึกใบเบิกสินค้า
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
