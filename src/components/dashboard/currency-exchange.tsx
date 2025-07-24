
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
import { ArrowRightLeft, Coins } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { BankAccount } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type Currency = keyof BankAccount;

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
  const { currentUser } = useUser();
  const { toast } = useToast();

  const [fromCharacterId, setFromCharacterId] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<Currency>('gold');
  const [fromAmount, setFromAmount] = useState<number>(0);
  
  const [toCurrency, setToCurrency] = useState<Currency>('platinum');
  const [toAmount, setToAmount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);

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
  
  const handleSubmit = () => {
      // TODO: Implement request logic to another player
      toast({
          title: "Функция в разработке",
          description: "Возможность отправлять запросы на обмен другим игрокам появится в будущем.",
          variant: "default"
      });
  }

  const hasSufficientFunds = useMemo(() => {
      if (!selectedCharacter || !fromCurrency) return false;
      return selectedCharacter.bankAccount[fromCurrency] >= fromAmount;
  }, [selectedCharacter, fromCurrency, fromAmount]);


  return (
    <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowRightLeft /> Васильковый Банк</CardTitle>
            <CardDescription>Обмен валюты по официальному курсу. Отправьте запрос на обмен другому игроку.</CardDescription>
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
                <div className="flex-1 space-y-1.5">
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
                 <div className="flex-1 space-y-1.5">
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
                Отправить запрос на обмен
            </Button>
        </CardFooter>
    </Card>
  );
}
