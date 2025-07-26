
'use client';

import React from 'react';
import type { Character, Relationship, RelationshipType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import type { OptionType } from '../ui/multi-select';

interface RelationshipFormProps {
    formData: Character;
    setFormData: React.Dispatch<React.SetStateAction<Character>>;
    characterOptions: OptionType[];
}

const relationshipTypeOptions: { value: RelationshipType, label: string }[] = [
    { value: 'романтика', label: 'Романтика' },
    { value: 'любовь', label: 'Любовь' },
    { value: 'дружба', label: 'Дружба' },
    { value: 'семья', label: 'Семья' },
    { value: 'вражда', label: 'Вражда' },
    { value: 'конкуренция', label: 'Конкуренция' },
    { value: 'нейтралитет', label: 'Нейтралитет' },
];

const RelationshipForm = ({ formData, setFormData, characterOptions }: RelationshipFormProps) => {

    const handleRelationshipChange = (index: number, field: keyof Relationship, value: any) => {
        const newRelationships = [...(formData.relationships || [])];
        const updatedRelationship = { ...newRelationships[index], [field]: value };
        
        if (field === 'targetCharacterId') {
            const targetChar = characterOptions.find(opt => opt.value === value);
            updatedRelationship.targetCharacterName = targetChar ? targetChar.label.split(' (')[0] : 'Неизвестно';
        }

        newRelationships[index] = updatedRelationship;
        setFormData(prev => ({ ...prev, relationships: newRelationships }));
    };

    const addRelationship = () => {
        const newRelationship: Relationship = {
            id: `rel-${Date.now()}`,
            targetCharacterId: '',
            targetCharacterName: '',
            type: 'нейтралитет',
            points: 0,
            history: [],
        };
        setFormData(prev => ({ ...prev, relationships: [...(prev.relationships || []), newRelationship] }));
    };

    const removeRelationship = (index: number) => {
        const newRelationships = (formData.relationships || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, relationships: newRelationships }));
    };

    return (
        <div className="space-y-4">
            {(formData.relationships || []).map((rel, index) => (
                <div key={rel.id} className="space-y-3 rounded-md border p-3 relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7"
                        onClick={() => removeRelationship(index)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    
                    <div>
                        <Label>Персонаж</Label>
                        <Select
                            value={rel.targetCharacterId}
                            onValueChange={(value) => handleRelationshipChange(index, 'targetCharacterId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите персонажа..." />
                            </SelectTrigger>
                            <SelectContent>
                                {characterOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Тип отношений</Label>
                        <Select
                            value={rel.type}
                            onValueChange={(value: RelationshipType) => handleRelationshipChange(index, 'type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите тип..." />
                            </SelectTrigger>
                            <SelectContent>
                                {relationshipTypeOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRelationship}>
                <PlusCircle className="mr-2 h-4 w-4"/>Добавить отношение
            </Button>
        </div>
    );
};

export default RelationshipForm;
