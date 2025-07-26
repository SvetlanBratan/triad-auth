
'use client';

import React from 'react';
import type { Character, WealthLevel } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WEALTH_LEVELS } from '@/lib/data';

interface FinanceFormProps {
    formData: Character;
    setFormData: React.Dispatch<React.SetStateAction<Character>>;
}

const FinanceForm = ({ formData, setFormData }: FinanceFormProps) => {

    const handleWealthLevelChange = (value: WealthLevel) => {
        setFormData(prev => ({
            ...prev,
            wealthLevel: value,
        }));
    };
    
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="wealthLevel">Уровень достатка</Label>
                <Select
                    value={formData.wealthLevel}
                    onValueChange={handleWealthLevelChange}
                >
                    <SelectTrigger id="wealthLevel">
                        <SelectValue placeholder="Выберите уровень достатка..." />
                    </SelectTrigger>
                    <SelectContent>
                        {WEALTH_LEVELS.map(level => (
                            <SelectItem key={level.name} value={level.name}>
                                {level.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground mt-2">
                    Изменение этого поля не влияет на баланс в банке. Банковский счет и зарплата управляются администратором.
                </p>
            </div>
        </div>
    );
};

export default FinanceForm;
