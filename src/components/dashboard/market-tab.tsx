
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store, BadgeCheck, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import type { Shop } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../ui/input';

const CustomIcon = ({ src }: { src: string }) => (
    <div
      className="w-8 h-8 icon-primary"
      style={{
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
);


export default function MarketTab() {
  const { fetchAllShops } = useUser();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['allShops'],
    queryFn: fetchAllShops
  });

  const filteredShops = React.useMemo(() => {
    const sortedShops = [...shops].sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
    
    if (!searchQuery) {
        return sortedShops;
    }

    return sortedShops.filter(shop => 
        (shop.items || []).some(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [shops, searchQuery]);
  
  if (isLoading) {
      return <p>Загрузка магазинов...</p>
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-4"><CustomIcon src="/icons/market.svg" />Рынок</h1>
        <p className="text-muted-foreground">Добро пожаловать! Здесь вы найдете лучшие магазины и таверны города.</p>
        <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Найти товар во всех лавках..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {filteredShops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
            <Card key={shop.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0">
                <div className="relative aspect-video bg-muted">
                    {shop.image && (
                        <Image
                        src={shop.image}
                        alt={shop.title}
                        fill
                        style={{objectFit: "cover"}}
                        className="w-full h-full"
                        data-ai-hint={shop.aiHint}
                        />
                    )}
                </div>
                </CardHeader>
                <CardContent className="flex-grow p-6 space-y-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="font-headline text-xl">{shop.title}</CardTitle>
                    {shop.hasLicense && <BadgeCheck className="w-5 h-5 text-green-600 shrink-0" />}
                </div>
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
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground">По вашему запросу ничего не найдено.</p>
        </div>
      )}
    </div>
  );
}
