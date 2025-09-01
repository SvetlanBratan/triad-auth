

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
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Coins, Trash2, Repeat, Info, Send } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { BankAccount, Character, Currency, ExchangeRequest, User } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { SearchableSelect } from '../ui/searchable-select';
import { useQuery } from '@tanstack/react-query';
import { Textarea } from '../ui/textarea';

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
  const { currentUser, createExchangeRequest, fetchOpenExchangeRequests, acceptExchangeRequest, cancelExchangeRequest, fetchUsersForAdmin, transferCurrency } = useUser();
  const { toast } = useToast();

  const [fromCharacterId, setFromCharacterId] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<Currency>('gold');
  const [fromAmount, setFromAmount] = useState<number>(0);
  
  const [toCurrency, setToCurrency] = useState<Currency>('platinum');
  const [toAmount, setToAmount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);

  const [openRequests, setOpenRequests] = useState<ExchangeRequest[]>([]);
  
  const [selectedAcceptorCharId, setSelectedAcceptorCharId] = useState('');

  // State for direct transfer
  const [transferSourceCharId, setTransferSourceCharId] = useState('');
  const [transferTargetCharId, setTransferTargetCharId] = useState('');
  const [transferAmount, setTransferAmount] = useState<Partial<Omit<BankAccount, 'history'>>>({ platinum: 0, gold: 0, silver: 0, copper: 0});
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsersForAdmin,
  });


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
        // Floor the result to ensure whole numbers and avoid fractions
        setToAmount(Math.floor(result));
    } else {
        setToAmount(0);
    }
  }, [fromAmount, fromCurrency, toCurrency]);

  const selectedCharacter = useMemo(() => {
    return currentUser?.characters.find(c => c.id === fromCharacterId);
  }, [currentUser, fromCharacterId]);
  
  const myCharacterOptions = useMemo(() => {
    return (currentUser?.characters || []).map(char => ({
      value: char.id,
      label: char.name,
    }));
  }, [currentUser]);
  
   const allCharactersForSelection = useMemo(() => {
    return allUsers.flatMap(user => 
        user.characters.map(char => ({
            value: char.id,
            label: `${char.name} (${user.name})`
        }))
    );
  }, [allUsers]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFromAmount(isNaN(value) || value < 0 ? 0 : value);
  };
  
  const handleSubmit = async () => {
      if (!currentUser || !fromCharacterId || fromAmount <= 0 || toAmount <= 0) {
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, заполните все поля корректно. Сумма обмена должна быть больше нуля.' });
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
      if (!currentUser || !selectedAcceptorCharId) return;
      setIsAcceptingId(request.id);
      try {
          await acceptExchangeRequest(currentUser.id, selectedAcceptorCharId, request);
          toast({ title: 'Сделка совершена!', description: 'Обмен валюты прошел успешно.' });
          await fetchRequests();
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
          toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
      } finally {
          setIsAcceptingId(null);
          setSelectedAcceptorCharId('');
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
  
    const handleTransferAmountChange = (currency: keyof Omit<BankAccount, 'history'>, value: string) => {
      const numValue = parseInt(value, 10) || 0;
      setTransferAmount(prev => ({ ...prev, [currency]: numValue }));
  };

  const handleTransfer = async () => {
    if (!currentUser || !transferSourceCharId || !transferTargetCharId || Object.values(transferAmount).every(v => v === 0)) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите отправителя, получателя и укажите сумму.' });
        return;
    }
    setIsTransferring(true);
    try {
        await transferCurrency(currentUser.id, transferSourceCharId, transferTargetCharId, transferAmount, transferReason || 'Прямой перевод');
        toast({ title: 'Успех!', description: 'Средства успешно переведены.' });
        setTransferAmount({ platinum: 0, gold: 0, silver: 0, copper: 0 });
        setTransferReason('');
        setTransferTargetCharId('');
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка перевода', description: msg });
    } finally {
        setIsTransferring(false);
    }
  };


  const hasSufficientFunds = useMemo(() => {
      if (!selectedCharacter || !fromCurrency) return false;
      const account = selectedCharacter.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 };
      return account[fromCurrency] >= fromAmount;
  }, [selectedCharacter, fromCurrency, fromAmount]);
  
  const transferSourceCharacter = useMemo(() => {
    return currentUser?.characters.find(c => c.id === transferSourceCharId);
  }, [currentUser, transferSourceCharId]);

  const hasSufficientFundsForTransfer = useMemo(() => {
    if (!transferSourceCharacter) return false;
    const balance = transferSourceCharacter.bankAccount;
    return (balance.platinum >= (transferAmount.platinum || 0)) &&
           (balance.gold >= (transferAmount.gold || 0)) &&
           (balance.silver >= (transferAmount.silver || 0)) &&
           (balance.copper >= (transferAmount.copper || 0));
  }, [transferSourceCharacter, transferAmount]);


  const myOpenRequests = openRequests.filter(r => r.creatorUserId === currentUser?.id);
  const otherOpenRequests = openRequests.filter(r => r.creatorUserId !== currentUser?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Send /> Перевод средств</CardTitle>
                    <CardDescription>Отправьте деньги любому персонажу в игре.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label>Отправитель (ваш персонаж)</Label>
                         <SearchableSelect
                            options={myCharacterOptions}
                            value={transferSourceCharId}
                            onValueChange={setTransferSourceCharId}
                            placeholder="Выберите персонажа..."
                        />
                        {transferSourceCharacter && (
                            <div className="mt-2 p-2 bg-muted rounded-md text-sm text-muted-foreground">
                            {formatCurrency(transferSourceCharacter.bankAccount)}
                            </div>
                        )}
                    </div>
                     <div>
                        <Label>Получатель</Label>
                        <SearchableSelect
                            options={allCharactersForSelection.filter(opt => opt.value !== transferSourceCharId)}
                            value={transferTargetCharId}
                            onValueChange={setTransferTargetCharId}
                            placeholder="Выберите персонажа..."
                            disabled={!transferSourceCharId}
                        />
                    </div>
                     <div>
                        <Label>Сумма</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="number" placeholder="Платина" value={transferAmount.platinum || ''} onChange={e => handleTransferAmountChange('platinum', e.target.value)} disabled={!transferSourceCharId} />
                            <Input type="number" placeholder="Золото" value={transferAmount.gold || ''} onChange={e => handleTransferAmountChange('gold', e.target.value)} disabled={!transferSourceCharId} />
                            <Input type="number" placeholder="Серебро" value={transferAmount.silver || ''} onChange={e => handleTransferAmountChange('silver', e.target.value)} disabled={!transferSourceCharId} />
                            <Input type="number" placeholder="Медь" value={transferAmount.copper || ''} onChange={e => handleTransferAmountChange('copper', e.target.value)} disabled={!transferSourceCharId} />
                        </div>
                         {!hasSufficientFundsForTransfer && <p className="text-xs text-destructive mt-1">Недостаточно средств</p>}
                    </div>
                    <div>
                        <Label htmlFor="transfer-reason">Примечание (необязательно)</Label>
                        <Textarea id="transfer-reason" value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="Напр., оплата за товар" disabled={!transferSourceCharId} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleTransfer} disabled={isTransferring || !transferSourceCharId || !transferTargetCharId || !hasSufficientFundsForTransfer || Object.values(transferAmount).every(v => v === 0)}>
                        {isTransferring ? "Отправка..." : "Отправить"}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ArrowRightLeft /> Обмен на доске</CardTitle>
                    <CardDescription>Создайте запрос на обмен валюты, который будет виден всем игрокам.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Курс обмена</AlertTitle>
                        <AlertDescription className="text-xs">
                            1 платина = 100 золота<br/>
                            1 золото = 100 серебра<br/>
                            1 серебро = 100 меди
                        </AlertDescription>
                    </Alert>

                    <div>
                        <Label>Ваш персонаж и его счет</Label>
                         <SearchableSelect
                            options={myCharacterOptions}
                            value={fromCharacterId}
                            onValueChange={setFromCharacterId}
                            placeholder="Выберите персонажа..."
                        />
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
                            <SearchableSelect
                                options={CURRENCY_OPTIONS}
                                value={fromCurrency}
                                onValueChange={(v) => setFromCurrency(v as Currency)}
                                placeholder=""
                                disabled={!fromCharacterId}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <Coins className="text-muted-foreground" />
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="toAmount">Получаю (целое число)</Label>
                            <Input id="toAmount" type="number" value={toAmount || ''} readOnly disabled />
                        </div>
                        <div className="w-32 space-y-1.5">
                            <SearchableSelect
                                options={CURRENCY_OPTIONS}
                                value={toCurrency}
                                onValueChange={(v) => setToCurrency(v as Currency)}
                                placeholder=""
                                disabled={!fromCharacterId}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSubmit} disabled={isLoading || !fromCharacterId || !hasSufficientFunds || fromAmount <= 0 || toAmount <= 0}>
                        Создать запрос на обмен
                    </Button>
                </CardFooter>
            </Card>
             {myOpenRequests.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Мои активные запросы на обмен</h3>
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
                <h2 className="text-2xl font-bold">Доска объявлений обмена</h2>
                <Button variant="ghost" size="icon" onClick={fetchRequests}><Repeat className="h-4 w-4" /></Button>
             </div>
             {otherOpenRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {otherOpenRequests.map(req => {
                        const acceptingCharacters = currentUser?.characters.filter(c => (c.bankAccount?.[req.toCurrency] ?? 0) >= req.toAmount);
                        const canAccept = acceptingCharacters && acceptingCharacters.length > 0;
                        const isAccepting = isAcceptingId === req.id;
                        
                        const acceptingCharacterOptions = (acceptingCharacters || []).map(char => ({
                          value: char.id,
                          label: `${char.name} (Баланс: ${formatCurrency(char.bankAccount)})`
                        }))

                        return (
                        <Card key={req.id}>
                            <CardHeader>
                                <CardTitle className="text-base leading-tight">Обмен от {req.creatorCharacterName}</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-3">
                               <div className="flex justify-between items-center p-2 rounded-md bg-red-500/10 text-red-700">
                                 <span className="text-sm">Отдают:</span>
                                 <span className="font-bold">{req.fromAmount.toLocaleString()} {CURRENCY_OPTIONS.find(c => c.value === req.fromCurrency)?.label}</span>
                               </div>
                                <div className="flex justify-between items-center p-2 rounded-md bg-green-500/10 text-green-700">
                                  <span className="text-sm">Хотят получить:</span>
                                  <span className="font-bold">{req.toAmount.toLocaleString()} {CURRENCY_OPTIONS.find(c => c.value === req.toCurrency)?.label}</span>
                               </div>
                             </CardContent>
                             <CardFooter>
                                <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedAcceptorCharId('')}>
                                    <DialogTrigger asChild>
                                        <Button 
                                            className="w-full" 
                                            disabled={!canAccept || isAccepting}
                                        >
                                             {isAccepting ? 'Принимаем...' : (canAccept ? `Принять` : 'Недостаточно средств')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Принять запрос на обмен</DialogTitle>
                                            <DialogDescription>
                                                Выберите персонажа, от лица которого вы хотите совершить обмен. У персонажа должно быть достаточно средств.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-2">
                                            <Label htmlFor="acceptor-char">Ваш персонаж:</Label>
                                            <SearchableSelect
                                                options={acceptingCharacterOptions}
                                                value={selectedAcceptorCharId}
                                                onValueChange={setSelectedAcceptorCharId}
                                                placeholder="Выберите персонажа..."
                                                 renderSelected={(option) => {
                                                    const character = acceptingCharacters?.find(c => c.id === option.value);
                                                    if (!character) return option.label;
                                                    return (
                                                        <div className="flex flex-col items-start">
                                                            <span>{character.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatCurrency(character.bankAccount)}
                                                            </span>
                                                        </div>
                                                    );
                                                }}
                                                renderOption={(option) => {
                                                     const character = acceptingCharacters?.find(c => c.id === option.value);
                                                    if (!character) return option.label;
                                                    return (
                                                        <div>
                                                            <div>{character.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Баланс: {formatCurrency(character.bankAccount)}
                                                            </div>
                                                        </div>
                                                    )
                                                }}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="ghost">Отмена</Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button 
                                                    onClick={() => handleAccept(req)} 
                                                    disabled={!selectedAcceptorCharId}
                                                >
                                                    Подтвердить обмен
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
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
