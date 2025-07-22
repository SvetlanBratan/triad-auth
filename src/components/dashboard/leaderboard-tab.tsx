"use client";

import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function LeaderboardTab() {
  const { users } = useUser();

  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  const getStatusClass = (status: UserStatus) => {
    switch (status) {
      case 'активный':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'неактивный':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'отпуск':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Таблица лидеров
        </CardTitle>
        <CardDescription>
            Список <s>Forbes</s> Тыквенного Переполоха.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Ранг</TableHead>
              <TableHead>Игрок</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Баллы</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-bold text-lg text-muted-foreground">
                  {index === 0 && <Trophy className="w-6 h-6 text-yellow-400 inline-block" />}
                  {index === 1 && <Trophy className="w-6 h-6 text-slate-400 inline-block" />}
                  {index === 2 && <Trophy className="w-6 h-6 text-amber-700 inline-block" />}
                  {index > 2 && index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={'outline'} className={cn("capitalize", getStatusClass(user.status))}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-primary">{user.points.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
