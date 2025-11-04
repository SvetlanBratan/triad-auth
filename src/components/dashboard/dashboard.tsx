

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import ProfileTab from "./profile-tab";
import LeaderboardTab from "./leaderboard-tab";
import RewardsTab from "./rewards-tab";
import AdminTab from "./admin-tab";
import RequestsTab from "./requests-tab";
import AuthPage from "../auth/auth-page";
import { useAuth } from "../providers/user-provider";
import CurrencyExchange from "./currency-exchange";
import FamiliarsTab from "./familiars-tab";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import MarketTab from "./market-tab";
import MailTab from "./mail-tab";
import React from "react";
import Image from 'next/image';
import AlchemyTab from "./alchemy-tab";

const CustomIcon = ({ src }: { src: string }) => (
    <div
      className="w-4 h-4 icon-primary"
      style={{
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
);


export function Dashboard() {
  const { currentUser } = useUser();
  const { loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('tab', value);
    router.replace(`${pathname}?${newSearchParams.toString()}`);
  };

  if (loading) {
    return (
       <div className="flex items-center justify-center h-64">
        <p>Загрузка данных пользователя...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  const isAdmin = currentUser.role === 'admin';
  const unreadMailCount = (currentUser.mail || []).filter(m => !m.isRead).length;
  
  const tabs = [
    { value: 'profile', label: 'Профиль', icon: () => <CustomIcon src="/icons/profile.svg" /> },
    { value: 'mail', label: 'Почта', icon: () => <CustomIcon src="/icons/mail.svg" />, notificationCount: unreadMailCount },
    { value: 'leaderboard', label: 'Лидеры', icon: () => <CustomIcon src="/icons/leaderboard.svg" /> },
    { value: 'familiars', label: 'Фамильяры', icon: () => <CustomIcon src="/icons/familiars.svg" />, className: "shrink-0" },
    { value: 'alchemy', label: 'Алхимия', icon: () => <CustomIcon src="/icons/alchemy.svg" /> },
    { value: 'rewards', label: 'Награды', icon: () => <CustomIcon src="/icons/rewards.svg" /> },
    { value: 'bank', label: 'Банк', icon: () => <CustomIcon src="/icons/bank.svg" /> },
    { value: 'market', label: 'Рынок', icon: () => <CustomIcon src="/icons/market.svg" /> },
    ...(isAdmin ? [{ value: 'requests', label: 'Запросы', icon: () => <CustomIcon src="/icons/requests.svg" /> }] : []),
    ...(isAdmin ? [{ value: 'admin', label: 'Админ', icon: () => <CustomIcon src="/icons/admin.svg" /> }] : []),
  ];
  
  return (
      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex flex-wrap h-auto min-h-12 justify-around sm:justify-center sm:gap-1">
          {tabs.map(({ value, label, icon: Icon, className, notificationCount }) => {
            return (
              <TabsTrigger key={value} value={value} className="flex-row items-center justify-center p-1 sm:p-2 sm:gap-1.5 text-xs sm:text-sm relative">
                <Icon />
                <span className="hidden [@media(min-width:400px)]:sm:inline">{label}</span>
                {notificationCount && notificationCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                    {notificationCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>
         <TabsContent value="mail" className="mt-4">
          <MailTab />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTab />
        </TabsContent>
        <TabsContent value="familiars" className="mt-4">
          <FamiliarsTab />
        </TabsContent>
         <TabsContent value="alchemy" className="mt-4">
          <AlchemyTab />
        </TabsContent>
        <TabsContent value="rewards" className="mt-4">
          <RewardsTab />
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          <CurrencyExchange />
        </TabsContent>
         <TabsContent value="market" className="mt-4">
          <MarketTab />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="requests" className="mt-4">
            <RequestsTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="admin" className="mt-4">
            <AdminTab />
          </TabsContent>
        )}
      </Tabs>
  );
}

