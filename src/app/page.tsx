"use client";

import { Dashboard } from "@/components/dashboard/dashboard";
import { UserProvider, useAuth } from "@/components/providers/user-provider";
import { UserSwitcher } from "@/components/auth/user-switcher";
import AuthPage from "@/components/auth/auth-page";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">Баллы и награды</h1>
          <p className="text-muted-foreground">Получайте баллы и обменивайте их на награды</p>
        </div>
        <div className="self-start md:self-center">
          <UserSwitcher />
        </div>
      </header>
      <Dashboard />
    </main>
  );
}


export default function Home() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
