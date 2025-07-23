
"use client";

import { useUser } from '@/hooks/use-user';
import { Button } from '../ui/button';
import { useAuth } from '../providers/user-provider';
import { CalendarDays } from 'lucide-react';

export function UserSwitcher() {
  const { currentUser, gameDateString } = useUser();
  const { signOutUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2 md:gap-4 flex-wrap">
       <div className="text-sm text-left">
         <div className="font-medium">
            <span className="text-muted-foreground">Вы вошли как</span>
            <span className="text-primary font-bold ml-1.5">{currentUser.name}</span>
         </div>
         <div className="text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{gameDateString}</span>
         </div>
      </div>
      <Button onClick={signOutUser} variant="outline" size="sm">Выйти</Button>
    </div>
  );
}
