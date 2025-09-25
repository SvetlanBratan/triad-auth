"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hammer } from 'lucide-react';

export default function CraftingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer /> Ремесло
        </CardTitle>
        <CardDescription>
          Создавайте оружие, артефакты и зелья из собранных ингредиентов.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground py-16">
        <p>Раздел ремесла находится в разработке.</p>
        <p>Здесь вы сможете создавать предметы по рецептам.</p>
      </CardContent>
    </Card>
  );
}
