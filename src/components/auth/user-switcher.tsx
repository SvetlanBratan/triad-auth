
"use client";

import { useUser } from '@/hooks/use-user';
import { Button } from '../ui/button';
import { useAuth } from '../providers/user-provider';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserSwitcher() {
  const { currentUser, gameDateString } = useUser();
  const { signOutUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
       <div className="text-sm text-left flex-shrink min-w-0">
         <div className="font-medium flex items-center flex-wrap">
            <span className="text-muted-foreground mr-1.5 shrink-0">Вы вошли как</span>
            <span className="text-primary font-bold truncate min-w-0">{currentUser.name}</span>
         </div>
         <div className="text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{gameDateString}</span>
         </div>
      </div>
      <Button onClick={signOutUser} variant="outline" size="sm" className="shrink-0">Выйти</Button>
    </div>
  );
}
