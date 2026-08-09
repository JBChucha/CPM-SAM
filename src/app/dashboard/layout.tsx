import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider, InfobarInset } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <KBar>
      {/* Roomier than the primitive's 14rem so the menu rows breathe */}
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{ '--sidebar-width': '16rem' } as React.CSSProperties}
      >
        <AppSidebar />
        {/* A transparent gutter: the header and the page each float as their own
            card, matching the sidebar panel. Left padding is the sidebar's own. */}
        <SidebarInset className='gap-2 bg-transparent p-2 md:pl-2'>
          <Header />
          <InfobarProvider defaultOpen={false}>
            {/* No card around the page: content sits straight on the body's wash */}
            <InfobarInset className='bg-transparent'>{children}</InfobarInset>
            <InfoSidebar side='right' />
          </InfobarProvider>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
