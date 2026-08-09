import { Suspense } from 'react';
import Link from 'next/link';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  spPaymentFilterOptionsQueryOptions,
  spPaymentsQueryOptions
} from '@/features/sp-payments/api/queries';
import SpPaymentsListPage from '@/features/sp-payments/components/sp-payments-list-page';
import { SpPaymentsSkeleton } from '@/features/sp-payments/components/sp-payments-skeleton';
import { getQueryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard: รายการเคลียร์เงิน SP'
};

export default function Page() {
  const queryClient = getQueryClient();

  // The screen mounts unfiltered on page 1, so `{}` normalises to exactly the
  // key the client asks for first and the table renders from the prefetch.
  void queryClient.prefetchQuery(spPaymentsQueryOptions());
  void queryClient.prefetchQuery(spPaymentFilterOptionsQueryOptions());

  return (
    <PageContainer
      pageTitle='เคลียร์เงิน'
      pageDescription='ค้นหาใบเคลียร์เงินตามช่วงวันที่และพนักงานขาย ดูรายละเอียดหรือดาวน์โหลดเอกสาร'
      pageHeaderAction={
        // Neutral rather than the brand red, and larger than a stock button:
        // this is the one action on the screen. `foreground`/`background` rather
        // than a literal black so it inverts to white on the dark theme instead
        // of disappearing into the page.
        <Link
          href='/dashboard/sp-payments/create'
          className={cn(
            buttonVariants(),
            'bg-foreground text-background hover:bg-foreground/85 h-10 gap-2 px-5 text-base',
            "[&_svg:not([class*='size-'])]:size-5"
          )}
        >
          <Icons.add />
          เพิ่มรายการ
        </Link>
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<SpPaymentsSkeleton />}>
          <SpPaymentsListPage />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
