"use client";

import { useUser } from '@/hooks/use-user';
import { Button } from '../ui/button';
import { useAuth } from '../providers/user-provider';

export function UserSwitcher() {
  const { currentUser } = useUser();
  const { signOutUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-4">
       <span className="text-sm font-medium">
        Вы вошли как <span className="text-primary font-bold">{currentUser.name}</span>
      </span>
      <Button onClick={signOutUser} variant="outline" size="sm">Выйти</Button>
    </div>
  );
}
