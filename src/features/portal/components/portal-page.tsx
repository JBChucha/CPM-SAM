import Image from 'next/image';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { PortalScreenCard } from './portal-screen-card';
import { PORTAL_SCREENS } from '../config/screens';

/**
 * Entry point for the CP SAM redesign prototype.
 *
 * Deliberately rendered outside the dashboard layout: the portal is a
 * presentation surface, not part of the product, so it carries no sidebar,
 * header, or breadcrumbs of its own.
 *
 * All eight entries have to be reachable without scrolling on the laptop this
 * gets presented from, so the page is pinned to the viewport and the grid takes
 * whatever height the slim top bar leaves. Below `xl` the cards would be too
 * small to read, so the page falls back to a normal scrolling grid.
 */
export default function PortalPage() {
  const total = PORTAL_SCREENS.length;

  return (
    <main className='flex min-h-svh flex-col xl:h-svh xl:overflow-hidden'>
      <header className='flex shrink-0 items-center justify-between gap-4 px-6 py-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='size-10 shrink-0 overflow-hidden rounded-xl'>
            <Image
              src='/meiji-icon.png'
              alt='CP-meiji'
              width={447}
              height={447}
              priority
              className='size-full object-cover'
            />
          </div>
          <div className='min-w-0'>
            <h1 className='truncate text-lg leading-tight font-bold tracking-tight'>
              CP SAM <span className='text-brand'>Redesign</span>
            </h1>
            <p className='text-muted-foreground truncate text-xs'>
              เปรียบเทียบหน้าจอเดิมกับหน้าจอที่ออกแบบใหม่ทั้ง {total} หน้า — คลิกการ์ดเพื่อเปิดหน้าจอใหม่
            </p>
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-3'>
          <span className='text-muted-foreground hidden text-xs tabular-nums sm:inline'>
            {total} หน้าจอ
          </span>
          <ThemeModeToggle />
        </div>
      </header>

      {/*
        Rows size to their content rather than splitting the viewport in two, so
        a card hugs what is inside it; whatever height is left over is spread
        around and between the rows instead of pooling inside every card.
      */}
      <div className='grid flex-1 gap-3 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3 xl:min-h-0 xl:grid-cols-4 xl:grid-rows-[auto_auto] xl:content-evenly'>
        {PORTAL_SCREENS.map((screen) => (
          <PortalScreenCard key={screen.no} screen={screen} />
        ))}
      </div>
    </main>
  );
}
