

import { Suspense } from 'react';
import { UserSwitcher } from "@/components/auth/user-switcher";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-7xl space-y-6">
        <div className="relative w-full h-40 md:h-56 rounded-lg overflow-hidden">
            <Image
                src="/banner.png"
                alt="Кабинет игрока"
                fill
                priority
                style={{ objectFit: 'cover' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <header className="absolute inset-0 w-full p-4 md:p-6 flex justify-between items-start">
                <div className="bg-background/60 backdrop-blur-sm p-3 rounded-md">
                    <h1 className="text-xl md:text-2xl font-bold font-headline text-primary">
                        Личный кабинет
                    </h1>
                    <p className="text-muted-foreground text-sm">Получайте баллы и обменивайте их на награды</p>
                </div>
                <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm p-2 rounded-md">
                    <UserSwitcher />
                    <ThemeToggle />
                </div>
            </header>
        </div>
        <Suspense fallback={<div>Загрузка...</div>}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
