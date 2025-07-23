
'use client';

import React, { useState, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { MultiSelect } from '../ui/multi-select';

interface CharacterFormProps {
    character: Omit<Character, 'id' | 'inventory' | 'familiarCards' | 'moodlets'> | Character | null;
    onSubmit: (data: Character) => void;
    closeDialog: () => void;
}

const CharacterForm = ({ character, onSubmit, closeDialog }: CharacterFormProps) => {
    const [formData, setFormData] = useState<Omit<Character, 'id' | 'inventory' | 'familiarCards' | 'moodlets'>>({
        name: '',
        activity: '',
        skillLevel: '',
        skillDescription: '',
        currentFameLevel: '',
        workLocation: '',
        appearance: '',
        personality: '',
        biography: '',
        diary: '',
        training: [],
        relationships: '',
        abilities: '',
        weaknesses: '',
        lifeGoal: '',
        pets: '',
    });

    useEffect(() => {
        if (character) {
            setFormData({
                name: character.name,
                activity: character.activity,
                skillLevel: character.skillLevel,
                skillDescription: character.skillDescription || '',
                currentFameLevel: character.currentFameLevel,
                workLocation: character.workLocation || '',
                appearance: character.appearance || '',
                personality: character.personality || '',
                biography: character.biography || '',
                diary: character.diary || '',
                training: character.training || [],
                relationships: character.relationships || '',
                abilities: character.abilities || '',
                weaknesses: character.weaknesses || '',
                lifeGoal: character.lifeGoal || '',
                pets: character.pets || '',
            });
        } else {
             setFormData({
                name: '', activity: '', skillLevel: '', skillDescription: '', currentFameLevel: '', workLocation: '',
                appearance: '', personality: '', biography: '', diary: '', training: [], relationships: '',
                abilities: '', weaknesses: '', lifeGoal: '', pets: ''
            });
        }
    }, [character]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.activity || !formData.skillLevel || !formData.currentFameLevel) {
          // Optional: Add a toast notification for missing fields
          return;
        }

        const fullCharacterData: Character = {
            ...(character as Character), // Keep existing fields like id, inventory etc.
            ...formData,
        };
        
        onSubmit(fullCharacterData);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="space-y-4">
                    {/* Basic Info */}
                    <div>
                        <Label htmlFor="name">Имя персонажа</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} placeholder="например, Гидеон" required />
                    </div>
                    <div>
                        <Label htmlFor="activity">Деятельность/профессия</Label>
                        <Input id="activity" value={formData.activity} onChange={handleChange} placeholder="например, Кузнец" required />
                    </div>
                    <div>
                        <Label htmlFor="currentFameLevel">Текущая известность</Label>
                         <Select onValueChange={(value) => handleSelectChange('currentFameLevel', value)} value={formData.currentFameLevel}>
                            <SelectTrigger id="currentFameLevel">
                                <SelectValue placeholder="Выберите уровень известности" />
                            </SelectTrigger>
                            <SelectContent>
                                {FAME_LEVELS.map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="skillLevel">Уровень навыка</Label>
                         <Select onValueChange={(value) => handleSelectChange('skillLevel', value)} value={formData.skillLevel}>
                            <SelectTrigger id="skillLevel">
                                <SelectValue placeholder="Выберите уровень навыка" />
                            </SelectTrigger>
                            <SelectContent>
                                {SKILL_LEVELS.map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="skillDescription">Описание навыка (необязательно)</Label>
                        <Input id="skillDescription" value={formData.skillDescription} onChange={handleChange} placeholder="например, в области конструкта" />
                    </div>
                    <div>
                        <Label htmlFor="workLocation">Место работы (необязательно)</Label>
                        <Input id="workLocation" value={formData.workLocation} onChange={handleChange} placeholder="например, Железная кузница" />
                    </div>
                    
                    {/* Main Section */}
                    <div>
                        <Label htmlFor="appearance">Внешность</Label>
                        <Textarea id="appearance" value={formData.appearance} onChange={handleChange} placeholder="Подробное описание внешности персонажа..." rows={5}/>
                    </div>
                    <div>
                        <Label htmlFor="personality">Характер</Label>
                        <Textarea id="personality" value={formData.personality} onChange={handleChange} placeholder="Описание характера, привычек, мировоззрения..." rows={5}/>
                    </div>
                     <div>
                        <Label htmlFor="biography">Биография</Label>
                        <Textarea id="biography" value={formData.biography} onChange={handleChange} placeholder="История жизни персонажа..." rows={8}/>
                    </div>
                    <div>
                        <Label htmlFor="abilities">Способности</Label>
                        <Textarea id="abilities" value={formData.abilities} onChange={handleChange} placeholder="Магические или физические способности..." rows={4}/>
                    </div>
                     <div>
                        <Label htmlFor="weaknesses">Слабости</Label>
                        <Textarea id="weaknesses" value={formData.weaknesses} onChange={handleChange} placeholder="Физические или психологические уязвимости..." rows={4}/>
                    </div>
                    
                    {/* Additional Section */}
                     <div>
                        <Label htmlFor="training">Обучение</Label>
                        <MultiSelect
                            options={TRAINING_OPTIONS}
                            selected={formData.training.map(t => TRAINING_OPTIONS.find(o => o.label === t)?.value).filter(Boolean) as string[]}
                            onChange={(selectedValues) => {
                                const selectedLabels = selectedValues.map(v => TRAINING_OPTIONS.find(o => o.value === v)?.label).filter(Boolean) as string[];
                                handleSelectChange('training', selectedLabels);
                            }}
                            placeholder="Выберите учебные заведения..."
                        />
                    </div>
                     <div>
                        <Label htmlFor="relationships">Отношения</Label>
                        <Textarea id="relationships" value={formData.relationships} onChange={handleChange} placeholder="Значимые связи и отношения с другими персонажами..." rows={4}/>
                    </div>
                     <div>
                        <Label htmlFor="lifeGoal">Жизненная цель</Label>
                        <Textarea id="lifeGoal" value={formData.lifeGoal} onChange={handleChange} placeholder="Главная цель или мечта персонажа..." rows={4}/>
                    </div>
                     <div>
                        <Label htmlFor="pets">Питомцы</Label>
                        <Textarea id="pets" value={formData.pets} onChange={handleChange} placeholder="Список и описание питомцев..." rows={3}/>
                    </div>
                    <div>
                        <Label htmlFor="diary">Личный дневник</Label>
                        <Textarea id="diary" value={formData.diary} onChange={handleChange} placeholder="Мысли, секреты и личные записи персонажа..." rows={6}/>
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
