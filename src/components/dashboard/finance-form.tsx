

'use client';

import React from 'react';
import type { Character, WealthLevel } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { WEALTH_LEVELS } from '@/lib/data';
import { SearchableSelect } from '../ui/searchable-select';

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

    const wealthLevelOptions = WEALTH_LEVELS.map(level => ({
        value: level.name,
        label: level.name,
    }));
    
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="wealthLevel">Уровень достатка</Label>
                <SearchableSelect
                    options={wealthLevelOptions}
                    value={formData.wealthLevel}
                    onValueChange={(value) => handleWealthLevelChange(value as WealthLevel)}
                    placeholder="Выберите уровень достатка..."
                />
                 <p className="text-xs text-muted-foreground mt-2">
                    Изменение этого поля не влияет на баланс в банке. Банковский счет и зарплата управляются администратором.
                </p>
            </div>
        </div>
    );
};

export default FinanceForm;
