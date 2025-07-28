

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store } from 'lucide-react';
import Image from 'next/image';
import { ALL_SHOPS } from '@/lib/data';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import type { Shop } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';


export default function MarketTab() {
  const { fetchAllShops } = useUser();
  
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['allShops'],
    queryFn: fetchAllShops
  });
  
  if (isLoading) {
      return <p>Загрузка магазинов...</p>
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-4"><Store />Рынок</h1>
        <p className="text-muted-foreground">Добро пожаловать! Здесь вы найдете лучшие магазины и таверны города.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <Card key={shop.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <div className="relative aspect-video">
                <Image
                  src={shop.image}
                  alt={shop.title}
                  layout="fill"
                  objectFit="cover"
                  className="w-full h-full"
                  data-ai-hint={shop.aiHint}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-6 space-y-2">
              <CardTitle className="font-headline text-xl">{shop.title}</CardTitle>
              <CardDescription>{shop.description}</CardDescription>
              {shop.ownerCharacterName && <p className="text-sm text-muted-foreground pt-2">Владелец: <span className="font-semibold text-primary">{shop.ownerCharacterName}</span></p>}
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button asChild className="w-full">
                <Link href={`/market/${shop.id}`}>
                    Войти <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
