

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
            
            {/* Desktop Header */}
            <header className="absolute top-4 left-6 right-6 hidden md:flex justify-between items-start text-white">
                <div className="bg-black/30 backdrop-blur-sm p-3 rounded-md">
                    <Link href="https://pumpkin-pandemonium.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-2xl font-bold font-headline hover:underline whitespace-nowrap">
                        Тыквенный Переполох
                    </Link>
                </div>
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm p-2 rounded-md">
                    <UserSwitcher />
                    <ThemeToggle />
                </div>
            </header>

            {/* Mobile Header */}
            <header className="absolute top-4 right-4 flex md:hidden flex-col items-end gap-2 text-white">
                 <div className="bg-black/30 backdrop-blur-sm p-2 rounded-md">
                    <Link href="https://pumpkin-pandemonium.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-lg font-bold font-headline whitespace-nowrap">
                        Тыквенный Переполох
                    </Link>
                </div>
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm p-2 rounded-md">
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
