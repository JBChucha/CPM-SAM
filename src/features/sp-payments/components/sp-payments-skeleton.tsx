import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Streaming fallback for the เคลียร์เงิน list.
 *
 * Mirrors the real layout row for row — the results header, the filter chips
 * and ten table rows — so the page does not jump when the prefetched data
 * lands. The page title and the เพิ่มรายการ action live on the server page
 * above the Suspense boundary and are painted immediately.
 */
export function SpPaymentsSkeleton() {
  return (
    <div className='min-w-0 space-y-4 pb-4' role='status' aria-label='กำลังโหลดรายการเคลียร์เงิน'>
      <Card className='min-w-0'>
        <CardHeader className='bg-muted/20 border-b pb-3'>
          <CardTitle className='flex flex-wrap items-center justify-between gap-3'>
            <span className='flex items-center gap-2'>
              <Skeleton className='size-4 rounded' />
              <Skeleton className='h-4 w-32' />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='min-w-0 space-y-4'>
          {/* ─── Filter chips ─── */}
          <div className='flex flex-wrap items-center gap-2'>
            <Skeleton className='h-7 w-32' />
            <Skeleton className='h-7 w-36' />
            <Skeleton className='h-7 w-36' />
          </div>

          <div className='min-w-0 overflow-hidden rounded-lg border'>
            <div className='bg-muted dark:bg-background flex h-11 items-center gap-4 border-b px-4'>
              <Skeleton className='h-4 w-full max-w-[46rem]' />
            </div>
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={index}
                className='flex h-14 items-center gap-4 border-b px-4 last:border-b-0'
              >
                <Skeleton className='size-4 shrink-0 rounded-sm' />
                <Skeleton className='h-4 w-44 shrink-0' />
                <Skeleton className='h-4 w-32 shrink-0' />
                <Skeleton className='h-4 flex-1' />
                <Skeleton className='h-4 w-24 shrink-0' />
              </div>
            ))}
          </div>

          <div className='flex items-center justify-between gap-3'>
            <Skeleton className='h-4 w-40' />
            <div className='flex items-center gap-3'>
              <Skeleton className='h-8 w-32' />
              <Skeleton className='h-8 w-64' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
