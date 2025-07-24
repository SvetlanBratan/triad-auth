
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Coins, Trash2, Repeat } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { BankAccount, Currency, ExchangeRequest } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '../ui/separator';

const CURRENCY_OPTIONS: { value: Currency, label: string }[] = [
    { value: 'platinum', label: 'Платина' },
    { value: 'gold', label: 'Золото' },
    { value: 'silver', label: 'Серебро' },
    { value: 'copper', label: 'Медь' },
];

const EXCHANGE_RATE: Record<Currency, Record<Currency, number>> = {
    platinum: { platinum: 1, gold: 100, silver: 10000, copper: 1000000 },
    gold: { platinum: 0.01, gold: 1, silver: 100, copper: 10000 },
    silver: { platinum: 0.0001, gold: 0.01, silver: 1, copper: 100 },
    copper: { platinum: 0.000001, gold: 0.0001, silver: 0.01, copper: 1 },
};

export default function CurrencyExchange() {
  const { currentUser, createExchangeRequest, fetchOpenExchangeRequests, acceptExchangeRequest, cancelExchangeRequest } = useUser();
  const { toast } = useToast();

  const [fromCharacterId, setFromCharacterId] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<Currency>('gold');
  const [fromAmount, setFromAmount] = useState<number>(0);
  
  const [toCurrency, setToCurrency] = useState<Currency>('platinum');
  const [toAmount, setToAmount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);

  const [openRequests, setOpenRequests] = useState<ExchangeRequest[]>([]);

  const fetchRequests = async () => {
    try {
        const requests = await fetchOpenExchangeRequests();
        setOpenRequests(requests);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить запросы на обмен.' });
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (fromAmount > 0 && fromCurrency && toCurrency) {
        const rate = EXCHANGE_RATE[fromCurrency][toCurrency];
        const result = fromAmount * rate;
        // Format to avoid floating point issues and excessive decimals
        setToAmount(parseFloat(result.toFixed(6)));
    } else {
        setToAmount(0);
    }
  }, [fromAmount, fromCurrency, toCurrency]);

  const selectedCharacter = useMemo(() => {
    return currentUser?.characters.find(c => c.id === fromCharacterId);
  }, [currentUser, fromCharacterId]);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFromAmount(isNaN(value) ? 0 : value);
  };
  
  const handleSubmit = async () => {
      if (!currentUser || !fromCharacterId || fromAmount <= 0 || toAmount <= 0) {
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, заполните все поля корректно.' });
          return;
      }
      setIsLoading(true);
      try {
          await createExchangeRequest(currentUser.id, fromCharacterId, fromCurrency, fromAmount, toCurrency, toAmount);
          toast({ title: 'Успешно!', description: 'Ваш запрос на обмен создан и виден другим игрокам.' });
          setFromAmount(0);
          await fetchRequests(); // Refresh list
      } catch(error) {
           const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
           toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
      } finally {
          setIsLoading(false);
      }
  }

  const handleAccept = async (request: ExchangeRequest) => {
      if (!currentUser) return;
      setIsAcceptingId(request.id);
      try {
          await acceptExchangeRequest(currentUser.id, request);
          toast({ title: 'Сделка совершена!', description: 'Обмен валюты прошел успешно.' });
          await fetchRequests();
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
          toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
      } finally {
          setIsAcceptingId(null);
      }
  };

  const handleCancel = async (request: ExchangeRequest) => {
      setIsLoading(true);
      try {
          await cancelExchangeRequest(request);
          toast({ title: 'Запрос отменен', description: 'Ваш запрос на обмен удален, средства возвращены.' });
          await fetchRequests();
      } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
          toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
      } finally {
          setIsLoading(false);
      }
  }

  const hasSufficientFunds = useMemo(() => {
      if (!selectedCharacter || !fromCurrency) return false;
      const account = selectedCharacter.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 };
      return account[fromCurrency] >= fromAmount;
  }, [selectedCharacter, fromCurrency, fromAmount]);

  const myOpenRequests = openRequests.filter(r => r.creatorUserId === currentUser?.id);
  const otherOpenRequests = openRequests.filter(r => r.creatorUserId !== currentUser?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ArrowRightLeft /> Васильковый Банк</CardTitle>
                    <CardDescription>Создайте запрос на обмен валюты, который будет виден всем игрокам.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Ваш персонаж и его счет</Label>
                        <Select value={fromCharacterId} onValueChange={setFromCharacterId}>
                            <SelectTrigger><SelectValue placeholder="Выберите персонажа..." /></SelectTrigger>
                            <SelectContent>
                                {currentUser?.characters.map(char => (
                                    <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedCharacter && (
                            <div className="mt-2 p-2 bg-muted rounded-md text-sm text-muted-foreground">
                            {formatCurrency(selectedCharacter.bankAccount)}
                            </div>
                        )}
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="fromAmount">Отдаю</Label>
                            <Input id="fromAmount" type="number" value={fromAmount || ''} onChange={handleAmountChange} disabled={!fromCharacterId} />
                            {!hasSufficientFunds && fromAmount > 0 && (
                                <p className="text-xs text-destructive">Недостаточно средств</p>
                            )}
                        </div>
                        <div className="w-32 space-y-1.5">
                            <Select value={fromCurrency} onValueChange={(v) => setFromCurrency(v as Currency)} disabled={!fromCharacterId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CURRENCY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <Coins className="text-muted-foreground" />
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="toAmount">Получаю</Label>
                            <Input id="toAmount" type="number" value={toAmount || ''} readOnly disabled />
                        </div>
                        <div className="w-32 space-y-1.5">
                            <Select value={toCurrency} onValueChange={(v) => setToCurrency(v as Currency)} disabled={!fromCharacterId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CURRENCY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSubmit} disabled={isLoading || !fromCharacterId || !hasSufficientFunds || fromAmount <= 0}>
                        Создать запрос на обмен
                    </Button>
                </CardFooter>
            </Card>
             {myOpenRequests.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Мои активные запросы</h3>
                     {myOpenRequests.map(req => (
                        <Card key={req.id} className="bg-muted/50">
                             <CardContent className="p-4 space-y-2">
                                <p className="text-sm">Вы хотите обменять <span className="font-bold">{req.fromAmount} {CURRENCY_OPTIONS.find(c => c.value === req.fromCurrency)?.label}</span> на <span className="font-bold">{req.toAmount} {CURRENCY_OPTIONS.find(c => c.value === req.toCurrency)?.label}</span>.</p>
                                <p className="text-xs text-muted-foreground">От имени: {req.creatorCharacterName}</p>
                                <Button size="sm" variant="destructive" onClick={() => handleCancel(req)} disabled={isLoading}><Trash2 className="mr-2 h-4 w-4" />Отменить</Button>
                            </CardContent>
                        </Card>
                     ))}
                </div>
             )}
        </div>
        <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Доска объявлений</h2>
                <Button variant="ghost" size="icon" onClick={fetchRequests}><Repeat className="h-4 w-4" /></Button>
             </div>
             {otherOpenRequests.length > 0 ? (
                <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
                    {otherOpenRequests.map(req => {
                        const acceptorCharacter = currentUser?.characters.find(c => c.bankAccount[req.toCurrency] >= req.toAmount);
                        const canAccept = !!acceptorCharacter;
                        const isAccepting = isAcceptingId === req.id;

                        return (
                        <Card key={req.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">Обмен от {req.creatorCharacterName}</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-3">
                               <div className="flex justify-between items-center p-2 rounded-md bg-destructive/10 text-destructive">
                                 <span className="text-sm">Отдают:</span>
                                 <span className="font-bold">{req.fromAmount.toLocaleString()} {CURRENCY_OPTIONS.find(c => c.value === req.fromCurrency)?.label}</span>
                               </div>
                                <div className="flex justify-between items-center p-2 rounded-md bg-green-600/10 text-green-700">
                                  <span className="text-sm">Хотят получить:</span>
                                  <span className="font-bold">{req.toAmount.toLocaleString()} {CURRENCY_OPTIONS.find(c => c.value === req.toCurrency)?.label}</span>
                               </div>
                             </CardContent>
                             <CardFooter>
                                 <Button 
                                    className="w-full" 
                                    onClick={() => handleAccept(req)}
                                    disabled={!canAccept || isAccepting}
                                >
                                     {isAccepting ? 'Принимаем...' : (canAccept ? `Принять (от ${acceptorCharacter.name})` : 'Недостаточно средств')}
                                </Button>
                             </CardFooter>
                        </Card>
                        )
                    })}
                </div>
             ) : (
                <p className="text-muted-foreground text-center py-8">Открытых запросов на обмен нет.</p>
             )}
        </div>
    </div>
  );
}
