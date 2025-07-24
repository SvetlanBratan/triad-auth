
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Character, User, Relationship, RelationshipType } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { MultiSelect, OptionType } from '../ui/multi-select';
import { useUser } from '@/hooks/use-user';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';

interface CharacterFormProps {
    character: Character | null;
    allUsers: User[];
    onSubmit: (data: Character) => void;
    closeDialog: () => void;
}

const initialFormData: Character = {
    id: '',
    name: '',
    activity: '',
    race: '',
    birthDate: '',
    skillLevel: [],
    skillDescription: '',
    currentFameLevel: [],
    workLocation: '',
    appearance: '',
    personality: '',
    biography: '',
    diary: '',
    training: [],
    relationships: [],
    marriedTo: [],
    abilities: '',
    weaknesses: '',
    lifeGoal: '',
    pets: '',
    pumpkins: 0,
    bankAccount: 0,
    // familiarCards is deprecated at top level, use inventory.familiarCards
    familiarCards: [],
    moodlets: [],
    inventory: {
        оружие: [],
        гардероб: [],
        еда: [],
        подарки: [],
        артефакты: [],
        зелья: [],
        недвижимость: [],
        транспорт: [],
        familiarCards: [],
    }
};

const fameLevelOptions: OptionType[] = FAME_LEVELS.map(level => ({ value: level, label: level }));
const skillLevelOptions: OptionType[] = SKILL_LEVELS.map(level => ({ value: level, label: level }));
const relationshipTypeOptions: { value: RelationshipType, label: string }[] = [
    { value: 'романтика', label: 'Романтика' },
    { value: 'любовь', label: 'Любовь' },
    { value: 'дружба', label: 'Дружба' },
    { value: 'семья', label: 'Семья' },
    { value: 'вражда', label: 'Вражда' },
    { value: 'конкуренция', label: 'Конкуренция' },
    { value: 'нейтралитет', label: 'Нейтралитет' },
];


const CharacterForm = ({ character, allUsers, onSubmit, closeDialog }: CharacterFormProps) => {
    const [formData, setFormData] = useState<Character>(initialFormData);
    const { currentUser } = useUser();

     useEffect(() => {
        if (character) {
            // Create a deeply merged character object to ensure no data is lost
            const initializedCharacter = {
                ...initialFormData,
                ...character,
                // Ensure nested inventory object is merged, not overwritten
                inventory: {
                    ...initialFormData.inventory,
                    ...(character.inventory || {}),
                    // Prioritize inventory.familiarCards, fallback to root-level for backward compatibility
                    familiarCards: character.inventory?.familiarCards || character.familiarCards || [],
                },
                // The root-level familiarCards should also be consistent
                familiarCards: character.inventory?.familiarCards || character.familiarCards || [],
                // Ensure fields that are now arrays are correctly initialized
                currentFameLevel: Array.isArray(character.currentFameLevel) ? character.currentFameLevel : (character.currentFameLevel ? [character.currentFameLevel] : []),
                skillLevel: Array.isArray(character.skillLevel) ? character.skillLevel : (character.skillLevel ? [character.skillLevel] : []),
                training: Array.isArray(character.training) ? character.training : [],
                marriedTo: Array.isArray(character.marriedTo) ? character.marriedTo : [],
                // Ensure relationships have a temporary client-side ID for list rendering
                relationships: (Array.isArray(character.relationships) ? character.relationships : []).map(r => ({...r, id: r.id || `rel-${Math.random()}`})),
                pumpkins: character.pumpkins || 0,
                bankAccount: character.bankAccount || 0,
            };
            setFormData(initializedCharacter);
        } else {
             const newCharacterWithId = { ...initialFormData, id: `c-${Date.now()}` };
             setFormData(newCharacterWithId);
        }
    }, [character]);

    const characterOptions = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.flatMap(user =>
            user.characters
                // Exclude the current character from their own relationship/spouse list
                .filter(c => c.id !== formData.id)
                .map(c => ({
                    value: c.id,
                    label: `${c.name} (${user.name})`
                }))
        );
    }, [allUsers, formData.id]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleMultiSelectChange = (id: keyof Omit<Character, 'relationships'>, values: string[]) => {
        setFormData(prev => ({ ...prev, [id]: values }));
    };
    
    const handleSingleSelectChange = (id: keyof Character, value: string) => {
         setFormData(prev => ({ ...prev, [id]: value ? [value] : [] }));
    };

    const handleRelationshipChange = (index: number, field: keyof Relationship, value: any) => {
        const newRelationships = [...formData.relationships];
        const updatedRelationship = { ...newRelationships[index], [field]: value };
        
        // If target character changes, update the name
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
        const newRelationships = formData.relationships.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, relationships: newRelationships }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure data consistency before submitting
        const finalData = {
            ...formData,
            // Make sure inventory.familiarCards is the source of truth
            inventory: {
                ...formData.inventory,
                familiarCards: formData.inventory.familiarCards || [],
            },
            // Also update the root familiarCards for any legacy logic that might still use it
            familiarCards: formData.inventory.familiarCards || [],
            // Remove temporary client-side ID from relationships before submitting
            relationships: formData.relationships.map(({ id, ...rest }) => rest) as Omit<Relationship, 'id'>[],
        };
        onSubmit(finalData as Character);
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="space-y-4">
                    {/* Basic Info */}
                    <div>
                        <Label htmlFor="name">Имя персонажа</Label>
                        <Input id="name" value={formData.name ?? ''} onChange={handleChange} placeholder="например, Гидеон" required />
                    </div>
                    <div>
                        <Label htmlFor="activity">Деятельность/профессия</Label>
                        <Input id="activity" value={formData.activity ?? ''} onChange={handleChange} placeholder="например, Кузнец" required />
                    </div>
                     <div>
                        <Label htmlFor="race">Раса</Label>
                        <Input id="race" value={formData.race ?? ''} onChange={handleChange} placeholder="например, Человек" required />
                    </div>
                     <div>
                        <Label htmlFor="birthDate">Дата рождения</Label>
                        <Input id="birthDate" value={formData.birthDate ?? ''} onChange={handleChange} placeholder="например, 15.06.2680" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="pumpkins">Тыквины</Label>
                            <Input id="pumpkins" type="number" value={formData.pumpkins ?? 0} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="bankAccount">Счет в банке</Label>
                            <Input id="bankAccount" type="number" value={formData.bankAccount ?? 0} onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="currentFameLevel">Текущая известность</Label>
                         <MultiSelect
                            options={fameLevelOptions}
                            selected={formData.currentFameLevel}
                            onChange={(selected) => handleSingleSelectChange('currentFameLevel', selected[selected.length - 1] || '')}
                            placeholder="Выберите уровень известности..."
                            className="w-full"
                        />
                    </div>
                    <div>
                        <Label htmlFor="skillLevel">Уровень навыка</Label>
                         <MultiSelect
                            options={skillLevelOptions}
                            selected={formData.skillLevel}
                            onChange={(selected) => handleSingleSelectChange('skillLevel', selected[selected.length - 1] || '')}
                            placeholder="Выберите уровень навыка..."
                            className="w-full"
                        />
                    </div>
                     <div>
                        <Label htmlFor="skillDescription">Описание навыка (необязательно)</Label>
                        <Input id="skillDescription" value={formData.skillDescription ?? ''} onChange={handleChange} placeholder="например, в области конструкта" />
                    </div>
                    <div>
                        <Label htmlFor="workLocation">Место работы (необязательно)</Label>
                        <Input id="workLocation" value={formData.workLocation ?? ''} onChange={handleChange} placeholder="например, Железная кузница" />
                    </div>
                    
                    {/* Main Section */}
                    <div>
                        <Label htmlFor="appearance">Внешность</Label>
                        <Textarea id="appearance" value={formData.appearance ?? ''} onChange={handleChange} placeholder="Подробное описание внешности персонажа..." rows={5}/>
                    </div>
                    <div>
                        <Label htmlFor="personality">Характер</Label>
                        <Textarea id="personality" value={formData.personality ?? ''} onChange={handleChange} placeholder="Описание характера, привычек, мировоззрения..." rows={5}/>
                    </div>
                     <div>
                        <Label htmlFor="biography">Биография</Label>
                        <Textarea id="biography" value={formData.biography ?? ''} onChange={handleChange} placeholder="История жизни персонажа..." rows={8}/>
                    </div>
                    <div>
                        <Label htmlFor="abilities">Способности</Label>
                        <Textarea id="abilities" value={formData.abilities ?? ''} onChange={handleChange} placeholder="Магические или физические способности..." rows={4}/>
                    </div>
                     <div>
                        <Label htmlFor="weaknesses">Слабости</Label>
                        <Textarea id="weaknesses" value={formData.weaknesses ?? ''} onChange={handleChange} placeholder="Физические или психологические уязвимости..." rows={4}/>
                    </div>

                    {/* Relationships Section */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium">Отношения</h3>
                        <Separator />
                        <div className="space-y-6">
                            {formData.relationships.map((rel, index) => (
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
                                                <SelectGroup>
                                                    {characterOptions.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
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
                        </div>
                        <Button type="button" variant="outline" onClick={addRelationship}>
                            Добавить отношение
                        </Button>
                    </div>

                    {/* Additional Section */}
                     <div>
                        <Label htmlFor="marriedTo">В браке с</Label>
                        <MultiSelect
                            options={characterOptions}
                            selected={formData.marriedTo ?? []}
                            onChange={(selectedValues) => handleMultiSelectChange('marriedTo', selectedValues)}
                            placeholder="Выберите персонажей..."
                        />
                    </div>
                     <div>
                        <Label htmlFor="training">Обучение</Label>
                        <MultiSelect
                            options={TRAINING_OPTIONS}
                            selected={formData.training ?? []}
                            onChange={(selectedValues) => handleMultiSelectChange('training', selectedValues)}
                            placeholder="Выберите учебные заведения..."
                        />
                    </div>
                     <div>
                        <Label htmlFor="lifeGoal">Жизненная цель</Label>
                        <Textarea id="lifeGoal" value={formData.lifeGoal ?? ''} onChange={handleChange} placeholder="Главная цель или мечта персонажа..." rows={4}/>
                    </div>
                     <div>
                        <Label htmlFor="pets">Питомцы</Label>
                        <Textarea id="pets" value={formData.pets ?? ''} onChange={handleChange} placeholder="Список и описание питомцев..." rows={3}/>
                    </div>
                    <div>
                        <Label htmlFor="diary">Личный дневник</Label>
                        <Textarea id="diary" value={formData.diary ?? ''} onChange={handleChange} placeholder="Мысли, секреты и личные записи персонажа..." rows={6}/>
                    </div>
                </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-6">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Отмена</Button>
              </DialogClose>
              <Button type="submit">Сохранить изменения</Button>
            </div>
        </form>
    );
};

export default CharacterForm;

    

  
