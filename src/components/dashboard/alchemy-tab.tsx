
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConical } from 'lucide-react';

export default function AlchemyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical /> Алхимия
        </CardTitle>
        <CardDescription>
          Создавайте мощные зелья из собранных ингредиентов.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground py-16">
        <p>Раздел алхимии и ремесла находится в разработке.</p>
        <p>Здесь вы сможете варить зелья и создавать предметы по рецептам.</p>
      </CardContent>
    </Card>
  );
}
