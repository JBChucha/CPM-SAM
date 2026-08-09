'use client';

import Image from 'next/image';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

/**
 * Static brand header for the sidebar (CP-Meiji Smart Agent Management).
 * Replaces the Clerk-backed OrgSwitcher, which is not part of this product's
 * navigation and stays in a "Loading..." state without Clerk credentials.
 */
export function SidebarBrand() {
  const { state } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Inert until /dashboard/overview has a real page — see config/available-routes */}
        <SidebarMenuButton
          size='lg'
          className='h-14 gap-3 bg-white dark:bg-white/10 text-black dark:text-white hover:bg-white dark:hover:bg-white/10 active:bg-white dark:active:bg-white/10 rounded-xl'
          render={<button type='button' aria-label='Smart Agent Management' />}
        >
          {/* The artwork carries its own red field, so no background wrapper here */}
          <div className='aspect-square size-11 shrink-0 overflow-hidden rounded-xl group-data-[collapsible=icon]:size-8'>
            <Image
              src='/meiji-icon.png'
              alt='CP-meiji'
              width={447}
              height={447}
              loading='eager'
              className='size-full object-cover'
            />
          </div>
          <div
            className={`grid flex-1 text-left text-[15px] leading-tight font-bold transition-all duration-200 ease-in-out ${
              state === 'collapsed'
                ? 'invisible max-w-0 overflow-hidden opacity-0'
                : 'visible max-w-full opacity-100'
            }`}
          >
            <span className='truncate'>Smart Agent</span>
            <span className='truncate'>Management</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
