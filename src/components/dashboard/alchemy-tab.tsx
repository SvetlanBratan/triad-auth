
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ALCHEMY_RECIPES } from '@/lib/alchemy-data';
import { SearchableSelect } from '../ui/searchable-select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AlchemyTab() {
  const { currentUser } = useUser();
  const router = useRouter();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');

  const characterOptions = useMemo(() => {
    return (currentUser?.characters || []).map(char => ({
      value: char.id,
      label: char.name,
    }));
  }, [currentUser]);

  const handleNavigateToAlchemy = () => {
    if (selectedCharacterId) {
      router.push(`/characters/${selectedCharacterId}/alchemy`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Алхимия</CardTitle>
        <CardDescription>Выберите персонажа, чтобы перейти к столу для крафта зелий.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {characterOptions.length > 0 ? (
          <>
            <SearchableSelect
              options={characterOptions}
              value={selectedCharacterId}
              onValueChange={setSelectedCharacterId}
              placeholder="Выберите персонажа..."
            />
            <Button
              className="w-full"
              disabled={!selectedCharacterId}
              onClick={handleNavigateToAlchemy}
            >
              Перейти к алхимии
            </Button>
          </>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Нет персонажей</AlertTitle>
            <AlertDescription>
              Чтобы заняться алхимией, сначала создайте персонажа во вкладке "Профиль".
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
