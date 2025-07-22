"use client";

import { useUser } from '@/hooks/use-user';
import { Button } from '../ui/button';
import { useAuth } from '../providers/user-provider';

export function UserSwitcher() {
  const { currentUser } = useUser();
  const { signOutUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2 md:gap-4 flex-wrap">
       <div className="text-sm font-medium text-left">
        <span>Вы вошли как</span>
        <br className="sm:hidden" />
        <span className="text-primary font-bold ml-1 sm:ml-0">{currentUser.name}</span>
      </div>
      <Button onClick={signOutUser} variant="outline" size="sm">Выйти</Button>
    </div>
  );
}
