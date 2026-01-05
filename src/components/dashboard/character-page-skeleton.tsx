
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"

export default function CharacterPageSkeleton() {
    const isMobile = useIsMobile();
    
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-40" />
                </div>
            </header>
            <div className="max-w-5xl mx-auto">
                 <Skeleton className="relative w-full h-48 sm:h-56 md:h-64 rounded-lg mb-6" />
                 
                {isMobile ? (
                    <div className="w-full space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="w-full lg:w-2/3 space-y-6 order-2 lg:order-1">
                             <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
                             <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                             <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
                        </div>
                        <div className="w-full lg:w-1/3 flex flex-col space-y-6 order-1 lg:order-2">
                            <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
                            <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                            <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
