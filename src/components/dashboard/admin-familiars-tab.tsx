
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
import { PlusCircle, Trash2, DatabaseZap, CheckCircle2, Pencil, X, Search } from 'lucide-react';
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
import { Separator } from '../ui/separator';

const rankOptions: { value: FamiliarRank, label: string }[] = [
    { value: 'обычный', label: 'Обычный' },
    { value: 'редкий', label: 'Редкий' },
    { value: 'легендарный', label: 'Легендарный' },
    { value: 'мифический', label: 'Мифический' },
    { value: 'ивентовый', label: 'Ивентовый' },
];

export default function AdminFamiliarsTab() {
  const { fetchDbFamiliars, addFamiliarToDb, deleteFamiliarFromDb, migrateAllFamiliarsToDb, updateFamiliarInDb } = useUser();
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFamiliars = useMemo(() => {
    return dbFamiliars.filter(fam => 
      fam.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dbFamiliars, searchQuery]);

  const handleAddFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamiliar.name || !newFamiliar.rank || !newFamiliar.imageUrl) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, заполните все поля.' });
      return;
    }
    setIsAdding(true);
    try {
      if (editingId) {
        await updateFamiliarInDb({ id: editingId, ...newFamiliar });
        toast({ title: 'Карточка обновлена!' });
      } else {
        await addFamiliarToDb(newFamiliar);
        toast({ title: 'Фамильяр добавлен!', description: `"${newFamiliar.name}" добавлен в базу данных.` });
      }
      setNewFamiliar({ name: '', rank: 'обычный', imageUrl: '' });
      setEditingId(null);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['allFamiliars'] });
      await queryClient.invalidateQueries({ queryKey: ['dbFamiliars'] });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
      toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (fam: FamiliarCard) => {
    setNewFamiliar({ name: fam.name, rank: fam.rank, imageUrl: fam.imageUrl });
    setEditingId(fam.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setNewFamiliar({ name: '', rank: 'обычный', imageUrl: '' });
    setEditingId(null);
  };

  const handleDeleteFamiliar = async (familiarId: string) => {
    try {
        await deleteFamiliarFromDb(familiarId);
        toast({ title: 'Фамильяр удален' });
        await refetch();
        await queryClient.invalidateQueries({ queryKey: ['allFamiliars'] });
        await queryClient.invalidateQueries({ queryKey: ['dbFamiliars'] });
    } catch(error) {
        const msg = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка удаления', description: msg });
    }
  }

  const handleMigrateAll = async () => {
      setIsMigrating(true);
      try {
          await migrateAllFamiliarsToDb();
          await refetch();
          await queryClient.invalidateQueries({ queryKey: ['dbFamiliars'] });
      } catch (e) {
          console.error(e);
      } finally {
          setIsMigrating(false);
      }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DatabaseZap className="w-5 h-5 text-primary" /> Перенос данных</CardTitle>
          <CardDescription>Перенесите все системные карты фамильяров в базу данных Firestore для возможности их редактирования.</CardDescription>
        </CardHeader>
        <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isMigrating} className="w-full sm:w-auto">
                        {isMigrating ? "Перенос..." : "Перенести все системные карты в БД"}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие скопирует все карты, определенные в коде приложения, в вашу базу данных Firestore. 
                            Если карта с таким ID уже существует в БД, она будет обновлена данными из кода.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMigrateAll}>Начать перенос</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Редактировать фамильяра' : 'Добавить нового фамильяра'}</CardTitle>
          <CardDescription>
            {editingId 
              ? `Вы редактируете карточку: ${newFamiliar.name}` 
              : 'Новый фамильяр будет добавлен в базу данных и станет доступен в рулетке.'
            }
          </CardDescription>
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
            <div className="flex gap-2">
              <Button type="submit" disabled={isAdding}>
                {editingId ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isAdding ? 'Сохранение...' : (editingId ? 'Сохранить изменения' : 'Добавить фамильяра')}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" /> Отмена
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Фамильяры в базе данных</CardTitle>
              <CardDescription>Список фамильяров, которыми можно управлять через эту панель.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Поиск по названию..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoadingFamiliars ? (
                <p>Загрузка...</p>
            ) : filteredFamiliars.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredFamiliars.map(fam => (
                        <div key={fam.id} className="relative group p-2 border rounded-md">
                            <Image src={fam.imageUrl} alt={fam.name} width={100} height={150} className="w-full h-auto rounded-md" />
                            <p className="text-sm font-semibold mt-2 truncate">{fam.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{fam.rank}</p>
                            
                            <div className="flex gap-1 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="secondary" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => handleEditClick(fam)}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button variant="destructive" size="icon" className="h-7 w-7">
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
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? "По вашему запросу ничего не найдено." : "В базе данных пока нет фамильяров."}
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
