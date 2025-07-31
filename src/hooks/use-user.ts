
"use client";

import { useContext } from 'react';
import { UserContext } from '@/components/providers/user-provider';
import type { UserContextType } from '@/lib/types';

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
