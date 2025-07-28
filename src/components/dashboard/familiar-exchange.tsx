

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Repeat, Check, X, Trash2, Send } from 'lucide-react';
import type { Character, FamiliarCard, FamiliarTradeRequest, User, FamiliarRank } from '@/lib/types';
import { FAMILIARS_BY_ID } from '@/lib/data';
import Image from 'next/image';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифический',
    'ивентовый': 'Ивентовый',
    'легендарный': 'Легендарный',
    'редкий': 'Редкий',
    'обычный': 'Обычный'
};

const MiniFamiliarCard = ({ cardId }: { cardId: string }) => {
    const card = FAMILIARS_BY_ID[cardId];
    if (!card) return null;
    return (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
            <Image src={card.imageUrl} alt={card.name} width={32} height={48} className="rounded-sm" data-ai-hint={card['data-ai-hint']} />
            <div>
                <p className="font-semibold">{card.name}</p>
                <p className="text-xs text-muted-foreground">{rankNames[card.rank]}</p>
            </div>
        </div>
    );
};


export default function FamiliarExchange() {
  const { currentUser, fetchUsersForAdmin, createFamiliarTradeRequest, fetchFamiliarTradeRequestsForUser, acceptFamiliarTradeRequest, declineOrCancelFamiliarTradeRequest } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsersForAdmin,
  });

  const { data: tradeRequests = [], isLoading: isRequestsLoading, refetch: refetchRequests } = useQuery<FamiliarTradeRequest[]>({
    queryKey: ['familiarTrades', currentUser?.id],
    queryFn: fetchFamiliarTradeRequestsForUser,
    enabled: !!currentUser,
  });

  // Form state
  const [initiatorCharId, setInitiatorCharId] = useState('');
  const [initiatorFamiliarId, setInitiatorFamiliarId] = useState('');
  const [targetCharId, setTargetCharId] = useState('');
  const [targetFamiliarId, setTargetFamiliarId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // --- Memos for form options ---
  const myCharacters = useMemo(() => currentUser?.characters || [], [currentUser]);
  
  const mySelectedChar = useMemo(() => myCharacters.find(c => c.id === initiatorCharId), [myCharacters, initiatorCharId]);
  
  const myFamiliarsOptions = useMemo(() => {
    if (!mySelectedChar) return [];
    return (mySelectedChar.inventory?.familiarCards || [])
        .map(owned => FAMILIARS_BY_ID[owned.id])
        .filter(Boolean)
        .map(fam => ({ value: fam.id, label: `${fam.name} (${rankNames[fam.rank]})` }));
  }, [mySelectedChar]);

  const selectedFamiliarRank = useMemo(() => {
    if (!initiatorFamiliarId) return null;
    return FAMILIARS_BY_ID[initiatorFamiliarId]?.rank;
  }, [initiatorFamiliarId]);

  const getTargetRanks = (rank: FamiliarRank | null): FamiliarRank[] => {
    if (!rank) return [];
    if (rank === 'мифический') return ['ивентовый', 'мифический'];
    if (rank === 'ивентовый') return ['мифический', 'ивентовый'];
    return [rank];
  };

  const targetRanks = useMemo(() => getTargetRanks(selectedFamiliarRank), [selectedFamiliarRank]);

  const otherCharactersOptions = useMemo(() => {
    if (targetRanks.length === 0) return [];
    const ownerMap = new Map<string, string>();
    allUsers.forEach(u => u.characters.forEach(c => ownerMap.set(c.id, u.name)));

    return allUsers.flatMap(u => u.characters.filter(c => 
        c.id !== initiatorCharId && (c.inventory?.familiarCards || []).some(f => {
            const card = FAMILIARS_BY_ID[f.id];
            return card && targetRanks.includes(card.rank);
        })
    )).map(c => ({ value: c.id, label: `${c.name} (${ownerMap.get(c.id)})` }));
  }, [allUsers, initiatorCharId, targetRanks]);
  
  const targetSelectedChar = useMemo(() => {
      if(!targetCharId) return null;
      for (const user of allUsers) {
          const char = user.characters.find(c => c.id === targetCharId);
          if (char) return char;
      }
      return null;
  }, [allUsers, targetCharId]);

  const targetFamiliarsOptions = useMemo(() => {
      if (!targetSelectedChar || targetRanks.length === 0) return [];
      return (targetSelectedChar.inventory?.familiarCards || [])
          .map(owned => FAMILIARS_BY_ID[owned.id])
          .filter((card): card is FamiliarCard => !!card && targetRanks.includes(card.rank))
          .map(fam => ({ value: fam.id, label: `${fam.name} (${rankNames[fam.rank]})` }));
  }, [targetSelectedChar, targetRanks]);


  const handleSubmit = async () => {
    if (!initiatorCharId || !initiatorFamiliarId || !targetCharId || !targetFamiliarId) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, заполните все поля для обмена.' });
        return;
    }
    setIsSubmitting(true);
    try {
        await createFamiliarTradeRequest(initiatorCharId, initiatorFamiliarId, targetCharId, targetFamiliarId);
        toast({ title: 'Успех!', description: 'Запрос на обмен отправлен.' });
        // Reset form
        setInitiatorFamiliarId('');
        setTargetCharId('');
        setTargetFamiliarId('');
        await refetchRequests();
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAccept = async (req: FamiliarTradeRequest) => {
      setIsProcessingId(req.id);
      try {
        await acceptFamiliarTradeRequest(req);
        toast({ title: 'Обмен состоялся!', description: 'Фамильяры успешно обменены.' });
        await refetchRequests();
        await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      } catch(e) {
          const msg = e instanceof Error ? e.message : 'Произошла неизвестная ошибка.';
          toast({ variant: 'destructive', title: 'Ошибка', description: msg });
      } finally {
          setIsProcessingId(null);
      }
  };

  const handleDecline = async (req: FamiliarTradeRequest) => {
      setIsProcessingId(req.id);
      try {
        await declineOrCancelFamiliarTradeRequest(req, 'отклонено');
        toast({ title: 'Запрос отклонен', variant: 'destructive' });
        await refetchRequests();
      } catch(e) {
          const msg = e instanceof Error ? e.message : 'Произошла неизвестная ошибка.';
          toast({ variant: 'destructive', title: 'Ошибка', description: msg });
      } finally {
          setIsProcessingId(null);
      }
  };

  const handleCancel = async (req: FamiliarTradeRequest) => {
      setIsProcessingId(req.id);
      try {
        await declineOrCancelFamiliarTradeRequest(req, 'отменено');
        toast({ title: 'Запрос отменен' });
        await refetchRequests();
      } catch(e) {
          const msg = e instanceof Error ? e.message : 'Произошла неизвестная ошибка.';
          toast({ variant: 'destructive', title: 'Ошибка', description: msg });
      } finally {
          setIsProcessingId(null);
      }
  }


  const incomingRequests = tradeRequests.filter(r => r.targetUserId === currentUser?.id && r.status === 'в ожидании');
  const outgoingRequests = tradeRequests.filter(r => r.initiatorUserId === currentUser?.id && r.status === 'в ожидании');

  if (isUsersLoading || isRequestsLoading) {
    return <p>Загрузка данных обмена...</p>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Repeat /> Обмен Фамильярами</CardTitle>
                <CardDescription>Создайте запрос на обмен фамильярами. Обмен возможен между картами одного ранга, а также между ивентовыми и мифическими картами.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Step 1: My side */}
                <div className="space-y-2 p-3 border rounded-md">
                    <h4 className="font-semibold text-sm">Ваше предложение</h4>
                    <Select value={initiatorCharId} onValueChange={id => { setInitiatorCharId(id); setInitiatorFamiliarId(''); setTargetCharId(''); setTargetFamiliarId(''); }}>
                        <SelectTrigger><SelectValue placeholder="Выберите вашего персонажа..." /></SelectTrigger>
                        <SelectContent>
                            {myCharacters.map(char => <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <SearchableSelect
                        options={myFamiliarsOptions}
                        value={initiatorFamiliarId}
                        onValueChange={id => { setInitiatorFamiliarId(id); setTargetCharId(''); setTargetFamiliarId(''); }}
                        placeholder="Выберите вашего фамильяра..."
                        disabled={!initiatorCharId}
                    />
                </div>
                 {/* Step 2: Their side */}
                <div className="space-y-2 p-3 border rounded-md">
                     <h4 className="font-semibold text-sm">Предложение игроку</h4>
                     <SearchableSelect
                        options={otherCharactersOptions}
                        value={targetCharId}
                        onValueChange={id => { setTargetCharId(id); setTargetFamiliarId(''); }}
                        placeholder="Выберите персонажа для обмена..."
                        disabled={!selectedFamiliarRank}
                    />
                     <SearchableSelect
                        options={targetFamiliarsOptions}
                        value={targetFamiliarId}
                        onValueChange={setTargetFamiliarId}
                        placeholder="Выберите их фамильяра..."
                        disabled={!targetCharId}
                    />
                </div>

            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting || !targetFamiliarId}><Send className="mr-2"/>Отправить запрос</Button>
            </CardFooter>
        </Card>
        
        <div className="lg:col-span-2 space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-4">Входящие запросы</h2>
                <div className="space-y-4">
                    {incomingRequests.length > 0 ? incomingRequests.map(req => (
                        <Card key={req.id}>
                            <CardContent className="p-4 space-y-3">
                                <p className="text-sm text-muted-foreground">Запрос от <span className="font-bold text-foreground">{req.initiatorCharacterName}</span>:</p>
                                <div className="flex items-center justify-center gap-4">
                                    <MiniFamiliarCard cardId={req.initiatorFamiliarId} />
                                    <ArrowRightLeft className="text-primary"/>
                                    <MiniFamiliarCard cardId={req.targetFamiliarId} />
                                </div>
                            </CardContent>
                             <CardFooter className="flex gap-2">
                                <Button className="flex-1" onClick={() => handleAccept(req)} disabled={isProcessingId === req.id}><Check className="mr-2"/>Принять</Button>
                                <Button className="flex-1" variant="destructive" onClick={() => handleDecline(req)} disabled={isProcessingId === req.id}><X className="mr-2"/>Отклонить</Button>
                            </CardFooter>
                        </Card>
                    )) : <p className="text-muted-foreground">Нет входящих запросов.</p>}
                </div>
            </div>
             <div>
                <h2 className="text-2xl font-bold mb-4">Исходящие запросы</h2>
                <div className="space-y-4">
                    {outgoingRequests.length > 0 ? outgoingRequests.map(req => (
                        <Card key={req.id}>
                            <CardContent className="p-4 space-y-3">
                                 <p className="text-sm text-muted-foreground">Запрос для <span className="font-bold text-foreground">{req.targetCharacterName}</span>:</p>
                                 <div className="flex items-center justify-center gap-4">
                                    <MiniFamiliarCard cardId={req.initiatorFamiliarId} />
                                    <ArrowRightLeft className="text-primary"/>
                                    <MiniFamiliarCard cardId={req.targetFamiliarId} />
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button className="w-full" variant="outline" onClick={() => handleCancel(req)} disabled={isProcessingId === req.id}><Trash2 className="mr-2"/>Отменить запрос</Button>
                            </CardFooter>
                        </Card>
                    )) : <p className="text-muted-foreground">Нет исходящих запросов.</p>}
                </div>
            </div>
        </div>

    </div>
  );
}
