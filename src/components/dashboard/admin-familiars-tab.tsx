
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
import { PlusCircle, Trash2, CheckCircle2, Pencil, X, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { FamiliarCard, FamiliarRank, FamiliarReserve, FamiliarSummonCost, FamiliarGroup, DamageType } from '@/lib/types';
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

type FamiliarFormData = Omit<FamiliarCard, 'id' | 'data-ai-hint'> & {
  reserve: FamiliarReserve;
  summonCost: FamiliarSummonCost;
  threat: number;
  group: FamiliarGroup;
  familiarHasDamage: boolean;
  familiarDamageType: DamageType;
  familiarDamage: number;
  familiarHasMana: boolean;
  familiarMana: number;
  familiarHasHP: boolean;
  familiarHP: number;
  familiarHasDefense: boolean;
  familiarDefense: number;
};

const rankOptions: { value: FamiliarRank, label: string }[] = [
    { value: 'обычный', label: 'Обычный' },
    { value: 'редкий', label: 'Редкий' },
    { value: 'легендарный', label: 'Легендарный' },
    { value: 'мифический', label: 'Мифический' },
    { value: 'ивентовый', label: 'Ивентовый' },
];

const reserveOptions: { value: FamiliarReserve, label: string }[] = [
    { value: 'Н1', label: 'Н1 - неофит' },
    { value: 'А2', label: 'А2 - адепт' },
    { value: 'С3', label: 'С3 - специалист' },
    { value: 'М4', label: 'М4 - мастер' },
    { value: 'М5', label: 'М5 - магистр' },
    { value: 'А6', label: 'А6 - архимаг' },
    { value: 'А7', label: 'А7 - архимагистр' },
    { value: 'Б8', label: 'Б8 - божественный' },
];

const summonCostOptions: { value: FamiliarSummonCost, label: string }[] = [
    { value: 'Слабый ритуал', label: 'Слабый ритуал' },
    { value: 'Средний ритуал', label: 'Средний ритуал' },
    { value: 'Сильный ритуал', label: 'Сильный ритуал' },
];

const groupOptions: { value: FamiliarGroup, label: string }[] = [
    { value: 'Огнеславия', label: 'Огнеславия' },
    { value: 'Белоснежье', label: 'Белоснежье' },
    { value: 'Заприливье', label: 'Заприливье' },
    { value: 'Сан-Ликорис', label: 'Сан-Ликорис' },
    { value: 'Артерианск', label: 'Артерианск' },
    { value: 'Ивентовый', label: 'Ивентовый' },
];

export default function AdminFamiliarsTab() {
  const { fetchDbFamiliars, addFamiliarToDb, deleteFamiliarFromDb, updateFamiliarInDb } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dbFamiliars = [], isLoading: isLoadingFamiliars, refetch } = useQuery<FamiliarCard[]>({
    queryKey: ['dbFamiliars'],
    queryFn: fetchDbFamiliars,
  });

  const [newFamiliar, setNewFamiliar] = useState<FamiliarFormData>({
    name: '',
    rank: 'обычный',
    imageUrl: '',
    reserve: 'Н1',
    summonCost: 'Слабый ритуал',
    threat: 0,
    group: 'Огнеславия',
    familiarHasDamage: true,
    familiarDamageType: 'Физический',
    familiarDamage: 0,
    familiarHasMana: true,
    familiarMana: 0,
    familiarHasHP: true,
    familiarHP: 0,
    familiarHasDefense: true,
    familiarDefense: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFamiliars = useMemo(() => {
    return dbFamiliars.filter(fam => 
      fam.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dbFamiliars, searchQuery]);

  const handleAddFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamiliar.name || !newFamiliar.rank || !newFamiliar.imageUrl || !newFamiliar.reserve || !newFamiliar.summonCost || newFamiliar.threat === undefined || !newFamiliar.group) {
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
      setNewFamiliar({
        name: '',
        rank: 'обычный',
        imageUrl: '',
        reserve: 'Н1',
        summonCost: 'Слабый ритуал',
        threat: 0,
        group: 'Огнеславия',
        familiarHasDamage: true,
        familiarDamageType: 'Физический',
        familiarDamage: 0,
        familiarHasMana: true,
        familiarMana: 0,
        familiarHasHP: true,
        familiarHP: 0,
        familiarHasDefense: true,
        familiarDefense: 0,
      });
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
    setNewFamiliar({
      name: fam.name,
      rank: fam.rank,
      imageUrl: fam.imageUrl,
      reserve: fam.reserve || 'Н1',
      summonCost: fam.summonCost || 'Слабый ритуал',
      threat: fam.threat || 0,
      group: fam.group || 'Огнеславия',
      familiarHasDamage: fam.familiarHasDamage ?? true,
      familiarDamageType: fam.familiarDamageType || 'Физический',
      familiarDamage: fam.familiarDamage ?? 0,
      familiarHasMana: fam.familiarHasMana ?? true,
      familiarMana: fam.familiarMana ?? 0,
      familiarHasHP: fam.familiarHasHP ?? true,
      familiarHP: fam.familiarHP ?? 0,
      familiarHasDefense: fam.familiarHasDefense ?? true,
      familiarDefense: fam.familiarDefense ?? 0,
    });
    setEditingId(fam.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setNewFamiliar({
      name: '',
      rank: 'обычный',
      imageUrl: '',
      reserve: 'Н1',
      summonCost: 'Слабый ритуал',
      threat: 0,
      group: 'Огнеславия',
      familiarHasDamage: true,
      familiarDamageType: 'Физический',
      familiarDamage: 0,
      familiarHasMana: true,
      familiarMana: 0,
      familiarHasHP: true,
      familiarHP: 0,
      familiarHasDefense: true,
      familiarDefense: 0,
    });
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

  return (
    <div className="space-y-6">
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
            <div>
              <Label>Тип урона</Label>
              <SearchableSelect
                options={[
                  { value: 'Физический', label: 'Физический' },
                  { value: 'Магический', label: 'Магический' },
                  { value: 'Психический', label: 'Психический' },
                ]}
                value={newFamiliar.familiarDamageType}
                onValueChange={(v) => setNewFamiliar(p => ({ ...p, familiarDamageType: v as DamageType }))}
                placeholder="Выберите тип урона"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="fam-has-damage"
                  checked={newFamiliar.familiarHasDamage}
                  onCheckedChange={(checked) => setNewFamiliar(p => ({
                    ...p,
                    familiarHasDamage: checked,
                    familiarDamage: checked ? p.familiarDamage : 0,
                  }))}
                />
                <Label htmlFor="fam-has-damage">Урон</Label>
              </div>
              <div>
                <Label htmlFor="fam-damage">Значение урона</Label>
                <Input id="fam-damage" type="number" value={newFamiliar.familiarDamage} onChange={e => setNewFamiliar(p => ({ ...p, familiarDamage: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="fam-has-mana"
                  checked={newFamiliar.familiarHasMana}
                  onCheckedChange={(checked) => setNewFamiliar(p => ({
                    ...p,
                    familiarHasMana: checked,
                    familiarMana: checked ? p.familiarMana : 0,
                  }))}
                />
                <Label htmlFor="fam-has-mana">Мана</Label>
              </div>
              <div>
                <Label htmlFor="fam-mana">Значение маны</Label>
                <Input id="fam-mana" type="number" value={newFamiliar.familiarMana} onChange={e => setNewFamiliar(p => ({ ...p, familiarMana: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="fam-has-hp"
                  checked={newFamiliar.familiarHasHP}
                  onCheckedChange={(checked) => setNewFamiliar(p => ({
                    ...p,
                    familiarHasHP: checked,
                    familiarHP: checked ? p.familiarHP : 0,
                  }))}
                />
                <Label htmlFor="fam-has-hp">ОЗ</Label>
              </div>
              <div>
                <Label htmlFor="fam-hp">Значение ОЗ</Label>
                <Input id="fam-hp" type="number" value={newFamiliar.familiarHP} onChange={e => setNewFamiliar(p => ({ ...p, familiarHP: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="fam-has-defense"
                  checked={newFamiliar.familiarHasDefense}
                  onCheckedChange={(checked) => setNewFamiliar(p => ({
                    ...p,
                    familiarHasDefense: checked,
                    familiarDefense: checked ? p.familiarDefense : 0,
                  }))}
                />
                <Label htmlFor="fam-has-defense">Защита</Label>
              </div>
              <div>
                <Label htmlFor="fam-defense">Значение защиты</Label>
                <Input id="fam-defense" type="number" value={newFamiliar.familiarDefense} onChange={e => setNewFamiliar(p => ({ ...p, familiarDefense: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="fam-reserve">Резерв</Label>
              <SearchableSelect
                options={reserveOptions}
                value={newFamiliar.reserve}
                onValueChange={v => setNewFamiliar(p => ({ ...p, reserve: v as FamiliarReserve }))}
                placeholder="Выберите резерв"
              />
            </div>
            <div>
              <Label htmlFor="fam-summon-cost">Затрата на призыв</Label>
              <SearchableSelect
                options={summonCostOptions}
                value={newFamiliar.summonCost}
                onValueChange={v => setNewFamiliar(p => ({ ...p, summonCost: v as FamiliarSummonCost }))}
                placeholder="Выберите затрату"
              />
            </div>
            <div>
              <Label htmlFor="fam-threat">Угроза (%)</Label>
              <Input id="fam-threat" type="number" value={newFamiliar.threat} onChange={e => setNewFamiliar(p => ({ ...p, threat: parseInt(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="fam-group">Группа</Label>
              <SearchableSelect
                options={groupOptions}
                value={newFamiliar.group}
                onValueChange={v => setNewFamiliar(p => ({ ...p, group: v as FamiliarGroup }))}
                placeholder="Выберите группу"
              />
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
