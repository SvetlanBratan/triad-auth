"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import ProfileTab from "./profile-tab";
import LeaderboardTab from "./leaderboard-tab";
import RewardsTab from "./rewards-tab";
import AdminTab from "./admin-tab";
import RequestsTab from "./requests-tab";
import GachaTab from "./gacha-tab";
import { User, Trophy, Award, Shield, GitPullRequest, Dices } from "lucide-react";
import AuthPage from "../auth/auth-page";
import { useAuth } from "../providers/user-provider";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

export function Dashboard() {
  const { currentUser } = useUser();
  const { loading } = useAuth();
  const isMobile = useIsMobile();

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
  const gridColsClass = isAdmin ? "grid-cols-6" : "grid-cols-4";
  
  const tabs = [
    { value: 'profile', label: 'Мой профиль', icon: User },
    { value: 'leaderboard', label: 'Таблица лидеров', icon: Trophy },
    { value: 'gacha', label: 'Гача', icon: Dices },
    { value: 'rewards', label: 'Награды', icon: Award },
    ...(isAdmin ? [{ value: 'requests', label: 'Запросы', icon: GitPullRequest }] : []),
    ...(isAdmin ? [{ value: 'admin', label: 'Админ-панель', icon: Shield }] : []),
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${gridColsClass}`}>
          {tabs.map(({ value, label, icon: Icon }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <TabsTrigger value={value} className="flex-1">
                  <Icon className={isMobile ? "h-5 w-5" : "w-4 h-4 mr-2"} />
                  {!isMobile && label}
                </TabsTrigger>
              </TooltipTrigger>
              {isMobile && <TooltipContent><p>{label}</p></TooltipContent>}
            </Tooltip>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTab />
        </TabsContent>
        <TabsContent value="gacha" className="mt-4">
          <GachaTab />
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
    </TooltipProvider>
  );
}
