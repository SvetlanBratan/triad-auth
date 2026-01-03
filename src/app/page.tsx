

import { Suspense } from 'react';
import { UserSwitcher } from "@/components/auth/user-switcher";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from 'next/image';
import Link from 'next/link';

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
            <header className="absolute top-4 right-4 md:top-6 md:left-6 md:right-auto flex flex-col items-end md:items-start md:flex-row md:justify-start gap-4">
                <div className="flex flex-col items-end md:items-start gap-2">
                    <div className="bg-background/60 backdrop-blur-sm p-3 rounded-md">
                        <Link href="https://pumpkin-pandemonium.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-lg md:text-2xl font-bold font-headline text-primary hover:underline whitespace-nowrap">
                            Тыквенный Переполох
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm p-2 rounded-md">
                        <UserSwitcher />
                        <ThemeToggle />
                    </div>
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
