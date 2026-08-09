'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { getNavGroupsForPath } from '@/config/nav-config';
import { isAvailableRoute } from '@/config/available-routes';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { SidebarBrand } from './sidebar-brand';

/**
 * Roomy menu row: the active one is a grey pill with a brand-red bar pinned to
 * the left edge of the pill itself.
 */
const MENU_BUTTON_CLASS = cn(
  'relative h-11 gap-3 rounded-lg px-3 [&_svg]:size-5 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white data-active:bg-white/20 data-active:text-white dark:data-active:bg-white/20 dark:data-active:text-white dark:data-[active=true]:bg-white/20 dark:data-[active=true]:text-white',
  'group-data-[collapsible=icon]:[&_svg]:size-4',
  'data-active:before:absolute data-active:before:top-1/2 data-active:before:left-1 data-active:before:h-6 data-active:before:w-1 data-active:before:-translate-y-1/2 data-active:before:rounded-full data-active:before:bg-white',
  'group-data-[collapsible=icon]:data-active:before:hidden'
);

// -mt-6 (instead of the primitive's -mt-8) leaves the hidden label an 8px gap,
// so groups stay visually separated in the icon rail.
const GROUP_LABEL_CLASS =
  'text-white/70 mt-3 px-3 text-sm font-normal group-data-[collapsible=icon]:-mt-6';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const [activeMenu, setActiveMenu] = React.useState('หน้าหลัก');
  // The menu itself is route-dependent: order-detail screens show a trimmed one.
  const filteredGroups = useFilteredNavGroups(getNavGroupsForPath(pathname));

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar
      collapsible='icon'
      variant='floating'
      // The floating panel reads as a panel through its fill alone: rounder than
      // the primitive's rounded-lg, and without the shadow/ring it adds.
      className='text-white [&>[data-slot=sidebar-inner]]:bg-gradient-to-b [&>[data-slot=sidebar-inner]]:from-[#D8433E] [&>[data-slot=sidebar-inner]]:from-60% [&>[data-slot=sidebar-inner]]:to-[#8B0000] dark:[&>[data-slot=sidebar-inner]]:bg-gradient-to-b dark:[&>[data-slot=sidebar-inner]]:from-[#660000] dark:[&>[data-slot=sidebar-inner]]:from-60% dark:[&>[data-slot=sidebar-inner]]:to-[#330000] [&>[data-slot=sidebar-inner]]:rounded-2xl [&>[data-slot=sidebar-inner]]:shadow-[0_8px_30px_rgb(0,0,0,0.08)] [&>[data-slot=sidebar-inner]]:ring-0 [&>[data-slot=sidebar-inner]]:overflow-hidden [&>[data-slot=sidebar-inner]]:relative'
    >
      <div className='relative z-10 flex flex-col h-full'>
        <SidebarHeader className='p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-4'>
          <SidebarBrand />
        </SidebarHeader>
        <SidebarContent className='overflow-x-hidden'>
          {filteredGroups.map((group) => (
            <SidebarGroup key={group.label || 'ungrouped'} className='gap-1 py-0'>
              {group.label && (
                <SidebarGroupLabel className={GROUP_LABEL_CLASS}>{group.label}</SidebarGroupLabel>
              )}
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                  return item?.items && item?.items?.length > 0 ? (
                    <Collapsible
                      key={item.title}
                      defaultOpen={item.isActive}
                      render={<SidebarMenuItem />}
                    >
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={activeMenu === item.title}
                            className={cn('group/collapsible', MENU_BUTTON_CLASS)}
                          />
                        }
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <Icons.chevronRight className='ml-auto size-4! transition-transform duration-200 group-data-panel-open/collapsible:rotate-90' />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                render={
                                  <button
                                    type='button'
                                    aria-label={subItem.title}
                                    onClick={() => setActiveMenu(subItem.title)}
                                  />
                                }
                                isActive={activeMenu === subItem.title}
                                className='h-9 rounded-lg px-3 text-sm hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white data-active:bg-white/20 data-active:text-white dark:data-[active=true]:bg-white/20 dark:data-[active=true]:text-white dark:data-active:bg-white/20 dark:data-active:text-white'
                              >
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        // Placeholder destinations stay put rather than bouncing to Clerk sign-in.
                        render={
                          <button
                            type='button'
                            aria-label={item.title}
                            onClick={() => setActiveMenu(item.title)}
                          />
                        }
                        tooltip={item.title}
                        isActive={activeMenu === item.title}
                        className={MENU_BUTTON_CLASS}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className='p-3'>
          {/* Mascot and Brand */}
          <div className='flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 px-4 py-6 group-data-[collapsible=icon]:hidden'>
            <Image
              src='/mj.png'
              alt='Mascot'
              width={600}
              height={600}
              loading='eager'
              className='h-auto w-[150px] drop-shadow-md'
            />
            <Image
              src='/cp-meiji-logo.png'
              alt='CP-meiji'
              width={400}
              height={141}
              loading='eager'
              className='h-auto w-[120px]'
            />
          </div>
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
