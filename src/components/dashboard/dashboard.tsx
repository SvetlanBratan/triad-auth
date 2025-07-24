
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import ProfileTab from "./profile-tab";
import LeaderboardTab from "./leaderboard-tab";
import RewardsTab from "./rewards-tab";
import AdminTab from "./admin-tab";
import RequestsTab from "./requests-tab";
import RouletteTab from "./gacha-tab";
import { User, Trophy, Award, Shield, GitPullRequest, Dices } from "lucide-react";
import AuthPage from "../auth/auth-page";
import { useAuth } from "../providers/user-provider";

export function Dashboard() {
  const { currentUser } = useUser();
  const { loading } = useAuth();

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
    { value: 'roulette', label: 'Рулетка', icon: Dices },
    { value: 'rewards', label: 'Награды', icon: Award },
    ...(isAdmin ? [{ value: 'requests', label: 'Запросы', icon: GitPullRequest }] : []),
    ...(isAdmin ? [{ value: 'admin', label: 'Админ', icon: Shield }] : []),
  ];
  
  const gridColsClass = isAdmin ? 'grid-cols-6' : 'grid-cols-4';

  return (
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${gridColsClass}`}>
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-row items-center justify-center p-1 sm:p-2 sm:gap-1.5 text-xs sm:text-sm">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTab />
        </TabsContent>
        <TabsContent value="roulette" className="mt-4">
          <RouletteTab />
        </TabsContent>
        <TabsContent value="rewards" className="mt-4">
          <RewardsTab />
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
