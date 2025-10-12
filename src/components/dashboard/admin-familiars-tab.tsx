
"use client";

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FamiliarCard, FamiliarRank } from '@/lib/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchableSelect } from '../ui/searchable-select';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const rankOptions: { value: FamiliarRank, label: string }[] = [
    { value: 'обычный', label: 'Обычный' },
    { value: 'редкий', label: 'Редкий' },
    { value: 'легендарный', label: 'Легендарный' },
    { value: 'мифический', label: 'Мифический' },
    { value: 'ивентовый', label: 'Ивентовый' },
];

export default function AdminFamiliarsTab() {
  const { fetchDbFamiliars, addFamiliarToDb, deleteFamiliarFromDb } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dbFamiliars = [], isLoading: isLoadingFamiliars, refetch } = useQuery<FamiliarCard[]>({
    queryKey: ['dbFamiliars'],
    queryFn: fetchDbFamiliars,
  });

  const [newFamiliar, setNewFamiliar] = useState<Omit<FamiliarCard, 'id'>>({
    name: '',
    rank: 'обычный',
    imageUrl: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamiliar.name || !newFamiliar.rank || !newFamiliar.imageUrl) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, заполните все поля.' });
      return;
    }
    setIsAdding(true);
    try {
      await addFamiliarToDb(newFamiliar);
      toast({ title: 'Фамильяр добавлен!', description: `"${newFamiliar.name}" добавлен в базу данных.` });
      setNewFamiliar({ name: '', rank: 'обычный', imageUrl: '' });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['allFamiliars'] });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
      toast({ variant: 'destructive', title: 'Ошибка добавления', description: msg });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteFamiliar = async (familiarId: string) => {
    try {
        await deleteFamiliarFromDb(familiarId);
        toast({ title: 'Фамильяр удален' });
        await refetch();
        await queryClient.invalidateQueries({ queryKey: ['allFamiliars'] });
    } catch(error) {
        const msg = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка удаления', description: msg });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Добавить нового фамильяра</CardTitle>
          <CardDescription>Новый фамильяр будет добавлен в базу данных и станет доступен в рулетке.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFamiliar} className="space-y-4">
            <div>
              <Label htmlFor="fam-name">Название</Label>
              <Input id="fam-name" value={newFamiliar.name} onChange={e => setNewFamiliar(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="fam-rank">Ранг</Label>
              <SearchableSelect
                options={rankOptions}
                value={newFamiliar.rank}
                onValueChange={v => setNewFamiliar(p => ({ ...p, rank: v as FamiliarRank }))}
                placeholder="Выберите ранг"
              />
            </div>
            <div>
              <Label htmlFor="fam-image">URL изображения</Label>
              <Input id="fam-image" value={newFamiliar.imageUrl} onChange={e => setNewFamiliar(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <Button type="submit" disabled={isAdding}>
              <PlusCircle className="mr-2" /> {isAdding ? 'Добавление...' : 'Добавить фамильяра'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Фамильяры в базе данных</CardTitle>
          <CardDescription>Список фамильяров, добавленных через эту панель.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingFamiliars ? (
                <p>Загрузка...</p>
            ) : dbFamiliars.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {dbFamiliars.map(fam => (
                        <div key={fam.id} className="relative group p-2 border rounded-md">
                            <Image src={fam.imageUrl} alt={fam.name} width={100} height={150} className="w-full h-auto rounded-md" />
                            <p className="text-sm font-semibold mt-2 truncate">{fam.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{fam.rank}</p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие необратимо удалит фамильяра "{fam.name}" из базы данных. Он перестанет выпадать в рулетке, но останется у игроков, которые его уже получили.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteFamiliar(fam.id)} className="bg-destructive hover:bg-destructive/90">
                                        Удалить
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">В базе данных пока нет фамильяров.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
