
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Character, User, Relationship, RelationshipType, WealthLevel, CharacterLevel } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS, WEALTH_LEVELS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { MultiSelect, OptionType } from '../ui/multi-select';
import { useUser } from '@/hooks/use-user';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { Separator } from '../ui/separator';

interface CharacterFormProps {
    character: Character | null;
    allUsers: User[];
    onSubmit: (data: Character) => void;
    closeDialog: () => void;
}

const initialFormData: Omit<Character, 'id'> = {
    name: '',
    activity: '',
    race: '',
    birthDate: '',
    skillLevels: [],
    fameLevels: [],
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
    },
    bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0 },
    wealthLevel: 'Бедный',
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
    const [formData, setFormData] = useState<Character>(character || { ...initialFormData, id: `c-${Date.now()}`});
    const { currentUser } = useUser();
    const isAdmin = currentUser?.role === 'admin';

     useEffect(() => {
        if (character) {
             const skillLevels = (Array.isArray(character.skillLevels) && character.skillLevels.length > 0)
                ? character.skillLevels
                : (Array.isArray(character.skillLevel) && character.skillLevel.length > 0
                    ? [{ id: `skill-${Date.now()}`, level: character.skillLevel[0], description: character.skillDescription || '' }]
                    : []);

            const fameLevels = (Array.isArray(character.fameLevels) && character.fameLevels.length > 0)
                ? character.fameLevels
                : (Array.isArray(character.currentFameLevel) && character.currentFameLevel.length > 0
                    ? [{ id: `fame-${Date.now()}`, level: character.currentFameLevel[0], description: '' }]
                    : []);
            
            const initializedCharacter = {
                ...initialFormData,
                ...character,
                inventory: {
                    ...initialFormData.inventory,
                    ...(character.inventory || {}),
                    familiarCards: character.inventory?.familiarCards || character.familiarCards || [],
                },
                familiarCards: character.inventory?.familiarCards || character.familiarCards || [],
                training: Array.isArray(character.training) ? character.training : [],
                marriedTo: Array.isArray(character.marriedTo) ? character.marriedTo : [],
                relationships: (Array.isArray(character.relationships) ? character.relationships : []).map(r => ({...r, id: r.id || `rel-${Math.random()}`})),
                bankAccount: character.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 },
                wealthLevel: character.wealthLevel || 'Бедный',
                skillLevels,
                fameLevels,
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
                .filter(c => c.id !== formData.id)
                .map(c => ({
                    value: c.id,
                    label: `${c.name} (${user.name})`
                }))
        );
    }, [allUsers, formData.id]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleMultiSelectChange = (id: 'marriedTo' | 'training', values: string[]) => {
        setFormData(prev => ({ ...prev, [id]: values }));
    };
    
    // --- Handlers for Skill and Fame Levels ---
    const handleLevelChange = (type: 'skillLevels' | 'fameLevels', index: number, field: 'level' | 'description', value: string) => {
        const newLevels = [...formData[type]];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setFormData(prev => ({ ...prev, [type]: newLevels }));
    };
    
    const addLevel = (type: 'skillLevels' | 'fameLevels') => {
        const newLevel: CharacterLevel = { id: `${type.slice(0, 4)}-${Date.now()}`, level: '', description: '' };
        setFormData(prev => ({ ...prev, [type]: [...(prev[type] || []), newLevel] }));
    };

    const removeLevel = (type: 'skillLevels' | 'fameLevels', index: number) => {
        const newLevels = formData[type].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [type]: newLevels }));
    };


    const handleRelationshipChange = (index: number, field: keyof Relationship, value: any) => {
        const newRelationships = [...formData.relationships];
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
        const newRelationships = formData.relationships.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, relationships: newRelationships }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = {
            ...formData,
            inventory: {
                ...formData.inventory,
                familiarCards: formData.inventory.familiarCards || [],
            },
            familiarCards: formData.inventory.familiarCards || [],
            relationships: formData.relationships.map(({ id, ...rest }) => rest) as Omit<Relationship, 'id'>[],
             // Cleanup deprecated fields before submitting
            skillLevel: undefined,
            skillDescription: undefined,
            currentFameLevel: undefined,
        };
        // Remove deprecated fields from the object
        delete finalData.skillLevel;
        delete finalData.skillDescription;
        delete finalData.currentFameLevel;

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
                    <div>
                        <Label htmlFor="workLocation">Место работы (необязательно)</Label>
                        <Input id="workLocation" value={formData.workLocation ?? ''} onChange={handleChange} placeholder="например, Железная кузница" />
                    </div>

                     {/* Fame Levels */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium">Известность</h3>
                        <Separator />
                        <div className="space-y-4">
                            {(formData.fameLevels || []).map((fame, index) => (
                                <div key={fame.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                                    <div className="flex-grow">
                                        <Label>Уровень</Label>
                                        <Select value={fame.level} onValueChange={(value) => handleLevelChange('fameLevels', index, 'level', value)}>
                                            <SelectTrigger><SelectValue placeholder="Выберите уровень..." /></SelectTrigger>
                                            <SelectContent>{fameLevelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-grow">
                                        <Label>Пояснение</Label>
                                        <Input value={fame.description} onChange={(e) => handleLevelChange('fameLevels', index, 'description', e.target.value)} placeholder="например, среди воров"/>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLevel('fameLevels', index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => addLevel('fameLevels')}><PlusCircle className="mr-2 h-4 w-4"/>Добавить уровень известности</Button>
                    </div>
                    
                    {/* Skill Levels */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium">Навыки</h3>
                        <Separator />
                        <div className="space-y-4">
                            {(formData.skillLevels || []).map((skill, index) => (
                                <div key={skill.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                                    <div className="flex-grow">
                                        <Label>Уровень</Label>
                                        <Select value={skill.level} onValueChange={(value) => handleLevelChange('skillLevels', index, 'level', value)}>
                                            <SelectTrigger><SelectValue placeholder="Выберите уровень..." /></SelectTrigger>
                                            <SelectContent>{skillLevelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-grow">
                                        <Label>Пояснение</Label>
                                        <Input value={skill.description} onChange={(e) => handleLevelChange('skillLevels', index, 'description', e.target.value)} placeholder="например, в области конструкта"/>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLevel('skillLevels', index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => addLevel('skillLevels')}><PlusCircle className="mr-2 h-4 w-4"/>Добавить навык</Button>
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
