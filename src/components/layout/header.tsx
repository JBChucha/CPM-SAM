import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Breadcrumbs } from '../breadcrumbs';
import { UserProfileMenu } from './user-profile-menu';
import { NotificationCenter } from '@/features/notifications/components/notification-center';

/**
 * App header: sidebar toggle + breadcrumbs on the left, notifications and the
 * signed-in user on the right. The user control is an avatar-only button;
 * light/dark mode and the language switch live inside its dropdown.
 *
 * It is its own rounded block on the page's gradient wash — a flat surface
 * fill, no border and no shadow, matching the sidebar panel.
 */
export default function Header() {
  return (
    <header
      data-slot='app-header'
      className='bg-white dark:bg-card shadow-[0_8px_30px_rgb(0,0,0,0.08)] sticky top-2 z-20 flex h-16 shrink-0 items-center justify-between gap-2 rounded-2xl md:h-14'
    >
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='border-border/70 size-9 rounded-full border' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <NotificationCenter />
        <UserProfileMenu />
      </div>
    </header>
  );
}
