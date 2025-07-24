
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RouletteTab from './gacha-tab';
import FamiliarExchange from './familiar-exchange';
import { Dices, Repeat } from 'lucide-react';

export default function FamiliarsTab() {
  return (
    <Tabs defaultValue="roulette" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
        <TabsTrigger value="roulette" className="flex items-center gap-2">
            <Dices className="w-4 h-4"/> Рулетка
        </TabsTrigger>
        <TabsTrigger value="exchange" className="flex items-center gap-2">
            <Repeat className="w-4 h-4"/> Обмен
        </TabsTrigger>
      </TabsList>
      <TabsContent value="roulette" className="mt-4">
        <RouletteTab />
      </TabsContent>
      <TabsContent value="exchange" className="mt-4">
        <FamiliarExchange />
      </TabsContent>
    </Tabs>
  );
}
