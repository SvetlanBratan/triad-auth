

import { Suspense } from 'react';
import { UserSwitcher } from "@/components/auth/user-switcher";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-7xl flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">
            Личный кабинет
          </h1>
          <p className="text-muted-foreground">Получайте баллы и обменивайте их на награды</p>
        </div>
        <div className="flex items-center gap-2">
           <UserSwitcher />
           <ThemeToggle />
        </div>
      </header>
      <div className="w-full max-w-7xl space-y-6">
        <div className="relative w-full h-40 md:h-56 rounded-lg overflow-hidden">
            <Image
                src="/banner.png"
                alt="Кабинет игрока"
                fill
                priority
                style={{ objectFit: 'cover' }}
            />
        </div>
        <Suspense fallback={<div>Загрузка...</div>}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
