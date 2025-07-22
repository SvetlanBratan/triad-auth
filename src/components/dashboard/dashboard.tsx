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
  const gridColsClass = isAdmin ? "grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-4";

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className={`grid w-full ${gridColsClass}`}>
        <TabsTrigger value="profile">
          <User className="w-4 h-4 mr-2" />
          Мой профиль
        </TabsTrigger>
        <TabsTrigger value="leaderboard">
          <Trophy className="w-4 h-4 mr-2" />
          Таблица лидеров
        </TabsTrigger>
        <TabsTrigger value="gacha">
          <Dices className="w-4 h-4 mr-2" />
          Гача
        </TabsTrigger>
        <TabsTrigger value="rewards">
          <Award className="w-4 h-4 mr-2" />
          Награды
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="requests">
            <GitPullRequest className="w-4 h-4 mr-2" />
            Запросы
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="admin">
            <Shield className="w-4 h-4 mr-2" />
            Админ-панель
          </TabsTrigger>
        )}
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
  );
}
