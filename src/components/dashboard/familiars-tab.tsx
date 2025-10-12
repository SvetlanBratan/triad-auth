
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RouletteTab from './gacha-tab';
import FamiliarExchange from './familiar-exchange';
import { Dices, Repeat } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import AdminFamiliarsTab from './admin-familiars-tab';
import { Shield } from 'lucide-react';

export default function FamiliarsTab() {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Tabs defaultValue="roulette" className="w-full">
      <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} max-w-md mx-auto`}>
        <TabsTrigger value="roulette" className="flex items-center gap-2">
            <Dices className="w-4 h-4"/> Рулетка
        </TabsTrigger>
        <TabsTrigger value="exchange" className="flex items-center gap-2">
            <Repeat className="w-4 h-4"/> Обмен
        </TabsTrigger>
        {isAdmin && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4"/> Админ
            </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="roulette" className="mt-4">
        <RouletteTab />
      </TabsContent>
      <TabsContent value="exchange" className="mt-4">
        <FamiliarExchange />
      </TabsContent>
      {isAdmin && (
        <TabsContent value="admin" className="mt-4">
            <AdminFamiliarsTab />
        </TabsContent>
      )}
    </Tabs>
  );
}
