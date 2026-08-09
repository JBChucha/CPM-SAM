'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { Icons } from '@/components/icons';
import { DEMO_USER } from '@/config/demo-user';
import { isAvailableRoute } from '@/config/available-routes';
import { LANGUAGE_LABELS, useLanguage, type Language } from '@/hooks/use-language';
import { startThemeTransition } from '@/lib/theme-transition';

/**
 * Signed-in user control in the header's top-right: an avatar-only button whose
 * dropdown carries the account links plus the appearance and language settings
 * (the header has no separate toolbar for those).
 */
export function UserProfileMenu() {
  const router = useRouter();
  const user = DEMO_USER;
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  // Menu destinations without a real page stay on the current page instead of
  // being bounced to Clerk sign-in. See config/available-routes.
  const go = (url: string) => {
    if (isAvailableRoute(url)) router.push(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`บัญชีผู้ใช้ ${user.fullName}`}
        render={<Button variant='ghost' size='icon' className='size-9 rounded-full p-0' />}
      >
        <UserAvatarProfile className='size-8 rounded-full' user={user} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-64 rounded-lg' side='bottom' align='end' sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='p-0 font-normal'>
            <div className='flex flex-col gap-1.5 px-1 py-1.5'>
              <UserAvatarProfile className='h-8 w-8 rounded-lg' showInfo user={user} />
              <div className='text-muted-foreground flex items-center justify-between text-xs'>
                <span>{user.role}</span>
                <span className='font-mono'>CV {user.cvCode}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => go('/dashboard/profile')}>
            <Icons.account className='mr-2 h-4 w-4' />
            โปรไฟล์
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => go('/dashboard/notifications')}>
            <Icons.notification className='mr-2 h-4 w-4' />
            การแจ้งเตือน
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => go('/dashboard/change-password')}>
            <Icons.key className='mr-2 h-4 w-4' />
            เปลี่ยนรหัสผ่าน
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-muted-foreground text-xs'>
            โหมดการแสดงผล
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme ?? 'system'}
            onValueChange={(next) => startThemeTransition(() => setTheme(next as string))}
          >
            <DropdownMenuRadioItem value='light'>
              <Icons.sun className='mr-2 h-4 w-4' />
              สว่าง (Light)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='dark'>
              <Icons.moon className='mr-2 h-4 w-4' />
              มืด (Dark)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='system'>
              <Icons.laptop className='mr-2 h-4 w-4' />
              ตามระบบ (System)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-muted-foreground text-xs'>ภาษา</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={language}
            onValueChange={(next) => setLanguage(next as Language)}
          >
            <DropdownMenuRadioItem value='th'>{LANGUAGE_LABELS.th}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='en'>{LANGUAGE_LABELS.en}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => go('/auth/sign-in')}>
            <Icons.logout className='mr-2 h-4 w-4' />
            ออกจากระบบ
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
