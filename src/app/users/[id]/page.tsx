'use client';

import React from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@/lib/types';
import UserProfileDialog from '@/components/dashboard/user-profile-dialog';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/user-provider';
import AuthPage from '@/components/auth/auth-page';

export default function UserProfilePage() {
    const { id } = useParams();
    const { fetchUserById, currentUser } = useUser();
    const { loading: authLoading } = useAuth();

    const { data: user, isLoading: userIsLoading, isError, refetch } = useQuery<User | null, Error>({
        queryKey: ['user', id],
        queryFn: () => fetchUserById(id as string),
        enabled: !!id,
    });
    
    if (authLoading) {
        return <div className="container mx-auto p-4 md:p-8"><p>Загрузка профиля...</p></div>;
    }

    if (!currentUser) {
        return <AuthPage />;
    }

    if (userIsLoading) {
        return <div className="container mx-auto p-4 md:p-8"><p>Загрузка профиля...</p></div>;
    }

    if (isError || !user) {
        return notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
             <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                Вернуться в личный кабинет
            </Link>
            <UserProfileDialog user={user} refetch={refetch} />
        </div>
    );
}
