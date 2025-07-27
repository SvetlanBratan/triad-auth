
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import type { Shop } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowLeft, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
    const { id } = useParams();
    const router = useRouter();
    const { fetchShopById } = useUser();
    const [shop, setShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        
        const loadShop = async () => {
            setIsLoading(true);
            try {
                const fetchedShop = await fetchShopById(Array.isArray(id) ? id[0] : id);
                if (fetchedShop) {
                    setShop(fetchedShop);
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Failed to load shop data", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };
        loadShop();
    }, [id, fetchShopById]);

    if (isLoading) {
        return <div className="container mx-auto p-8"><p>Загрузка магазина...</p></div>;
    }

    if (!shop) {
        return notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад на рынок
            </Button>

            <Card className="overflow-hidden">
                <div className="relative h-64 w-full">
                    <Image
                        src={shop.image}
                        alt={shop.title}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={shop.aiHint}
                    />
                </div>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">{shop.title}</CardTitle>
                    <CardDescription>{shop.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {shop.ownerCharacterName ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <UserCircle className="h-5 w-5" />
                             <span>Владелец: 
                                <Link href={`/characters/${shop.ownerCharacterId}`} className="font-semibold text-primary hover:underline ml-1">
                                    {shop.ownerCharacterName}
                                </Link>
                             </span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">У этого магазина пока нет владельца.</p>
                    )}
                    
                    {/* Future content for the shop can go here */}
                    <div className="mt-8 text-center text-muted-foreground">
                        <p>Ассортимент товаров скоро появится...</p>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
