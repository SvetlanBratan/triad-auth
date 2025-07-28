
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import ProfileTab from "./profile-tab";
import LeaderboardTab from "./leaderboard-tab";
import RewardsTab from "./rewards-tab";
import AdminTab from "./admin-tab";
import RequestsTab from "./requests-tab";
import { User, Trophy, Award, Shield, GitPullRequest, Landmark, Cat, Store } from "lucide-react";
import AuthPage from "../auth/auth-page";
import { useAuth } from "../providers/user-provider";
import CurrencyExchange from "./currency-exchange";
import FamiliarsTab from "./familiars-tab";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import MarketTab from "./market-tab";

export function Dashboard() {
  const { currentUser } = useUser();
  const { loading } = useAuth();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';


  if (loading) {
    return (
       <div className="flex items-center justify-center h-64">
        <p>Загрузка данных пользователя...</p>
      </div>
    )
  }

  if (!currentUser) {
    // This case should theoretically be handled by the root page now,
    // but as a fallback, we can show the AuthPage or a message.
    return <AuthPage />;
  }

  const isAdmin = currentUser.role === 'admin';
  
  const tabs = [
    { value: 'profile', label: 'Профиль', icon: User },
    { value: 'leaderboard', label: 'Лидеры', icon: Trophy },
    { value: 'familiars', label: 'Фамильяры', icon: Cat, className: "shrink-0" },
    { value: 'rewards', label: 'Награды', icon: Award },
    { value: 'bank', label: 'Банк', icon: Landmark },
    { value: 'market', label: 'Рынок', icon: Store },
    ...(isAdmin ? [{ value: 'requests', label: 'Запросы', icon: GitPullRequest }] : []),
    ...(isAdmin ? [{ value: 'admin', label: 'Админ', icon: Shield }] : []),
  ];
  
  return (
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto min-h-20 justify-start sm:justify-center gap-1.5 sm:gap-1">
          {tabs.map(({ value, label, icon: Icon, className }) => (
            <TabsTrigger key={value} value={value} className="flex-row items-center justify-center p-1 sm:p-2 sm:gap-1.5 text-xs sm:text-sm">
              <Icon className={cn("w-4 h-4", className)} />
              <span className="hidden [@media(min-width:400px)]:sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTab />
        </TabsContent>
        <TabsContent value="familiars" className="mt-4">
          <FamiliarsTab />
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
