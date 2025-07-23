
'use client';

import React, { useState, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { MultiSelect, OptionType } from '../ui/multi-select';

interface CharacterFormProps {
    character: Character | null;
    onSubmit: (data: Character) => void;
    closeDialog: () => void;
}

const initialFormData: Character = {
    id: '',
    name: '',
    activity: '',
    skillLevel: [],
    skillDescription: '',
    currentFameLevel: [],
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


const CharacterForm = ({ character, onSubmit, closeDialog }: CharacterFormProps) => {
    const [formData, setFormData] = useState<Character>(initialFormData);

    useEffect(() => {
        if (character) {
            // Ensure all fields are initialized to prevent controlled/uncontrolled errors
            const initializedCharacter = {
                ...initialFormData,
                ...character,
                currentFameLevel: Array.isArray(character.currentFameLevel) ? character.currentFameLevel : (character.currentFameLevel ? [character.currentFameLevel] : []),
                skillLevel: Array.isArray(character.skillLevel) ? character.skillLevel : (character.skillLevel ? [character.skillLevel] : []),
            };
            setFormData(initializedCharacter);
        } else {
            setFormData(initialFormData);
        }
    }, [character]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleMultiSelectChange = (id: keyof Character, values: string[]) => {
        setFormData(prev => ({ ...prev, [id]: values }));
    };
    
    const handleSingleSelectChange = (id: keyof Character, value: string) => {
         setFormData(prev => ({ ...prev, [id]: value ? [value] : [] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
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
                        <Label htmlFor="currentFameLevel">Текущая известность</Label>
                         <MultiSelect
                            options={fameLevelOptions}
                            selected={formData.currentFameLevel}
                            onChange={(selected) => handleSingleSelectChange('currentFameLevel', selected[selected.length - 1])}
                            placeholder="Выберите уровень известности..."
                            className="w-full"
                        />
                    </div>
                    <div>
                        <Label htmlFor="skillLevel">Уровень навыка</Label>
                         <MultiSelect
                            options={skillLevelOptions}
                            selected={formData.skillLevel}
                            onChange={(selected) => handleSingleSelectChange('skillLevel', selected[selected.length - 1])}
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
                    
                    {/* Additional Section */}
                     <div>
                        <Label htmlFor="training">Обучение</Label>
                        <MultiSelect
                            options={TRAINING_OPTIONS}
                            selected={formData.training}
                            onChange={(selectedValues) => handleMultiSelectChange('training', selectedValues)}
                            placeholder="Выберите учебные заведения..."
                        />
                    </div>
                     <div>
                        <Label htmlFor="relationships">Отношения</Label>
                        <Textarea id="relationships" value={formData.relationships ?? ''} onChange={handleChange} placeholder="Значимые связи и отношения с другими персонажами..." rows={4}/>
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
