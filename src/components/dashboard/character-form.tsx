
'use client';

import React, { useState, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CharacterFormProps {
    character: Omit<Character, 'id' | 'inventory' | 'appearance' | 'personality' | 'biography' | 'diary' | 'training' | 'relationships' | 'familiarCards' | 'moodlets'> | null;
    onSubmit: (data: Omit<Character, 'id' | 'inventory' | 'appearance' | 'personality' | 'biography' | 'diary' | 'training' | 'relationships' | 'familiarCards' | 'moodlets'> | Character) => void;
    closeDialog: () => void;
}

const CharacterForm = ({ character, onSubmit, closeDialog }: CharacterFormProps) => {
    const [name, setName] = useState('');
    const [activity, setActivity] = useState('');
    const [skillLevel, setSkillLevel] = useState('');
    const [currentFameLevel, setCurrentFameLevel] = useState('');
    const [workLocation, setWorkLocation] = useState('');

    useEffect(() => {
        if (character) {
            setName(character.name);
            setActivity(character.activity);
            setSkillLevel(character.skillLevel);
            setCurrentFameLevel(character.currentFameLevel);
            setWorkLocation(character.workLocation || '');
        } else {
            // Reset form for adding new character
            setName('');
            setActivity('');
            setSkillLevel('');
            setCurrentFameLevel('');
            setWorkLocation('');
        }
    }, [character]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !activity || !skillLevel || !currentFameLevel) {
          // Optional: Add a toast notification for missing fields
          return;
        }

        if (character && 'id' in character) {
             // Editing existing character
            onSubmit({ 
                ...character,
                name,
                activity,
                skillLevel,
                currentFameLevel,
                workLocation,
            });
        } else {
            // Adding new character
            onSubmit({ name, activity, skillLevel, currentFameLevel, workLocation });
        }
        
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="char-name">Имя персонажа</Label>
                <Input id="char-name" value={name} onChange={e => setName(e.target.value)} placeholder="например, Гидеон" required />
            </div>
            <div>
                <Label htmlFor="char-activity">Деятельность/профессия</Label>
                <Input id="char-activity" value={activity} onChange={e => setActivity(e.target.value)} placeholder="например, Кузнец" required />
            </div>
            <div>
                <Label htmlFor="char-skill">Уровень навыка</Label>
                 <Select onValueChange={setSkillLevel} value={skillLevel}>
                    <SelectTrigger id="char-skill">
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
                <Label htmlFor="char-fame">Текущая известность</Label>
                 <Select onValueChange={setCurrentFameLevel} value={currentFameLevel}>
                    <SelectTrigger id="char-fame">
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
                <Label htmlFor="char-location">Место работы (необязательно)</Label>
                <Input id="char-location" value={workLocation} onChange={e => setWorkLocation(e.target.value)} placeholder="например, Железная кузница" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Отмена</Button>
              </DialogClose>
              <Button type="submit">{character ? 'Сохранить изменения' : 'Добавить персонажа'}</Button>
            </div>
        </form>
    );
};

export default CharacterForm;

    
