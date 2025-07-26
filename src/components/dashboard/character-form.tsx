
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Character, User, Accomplishment, WealthLevel } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS, WEALTH_LEVELS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { MultiSelect, OptionType } from '../ui/multi-select';
import { useUser } from '@/hooks/use-user';
import { Trash2, PlusCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { SearchableSelect } from '../ui/searchable-select';
import RelationshipForm from './relationship-form';
import FinanceForm from './finance-form';

export type EditableSection = 'mainInfo' | 'accomplishments' | 'appearance' | 'personality' | 'biography' | 'abilities' | 'weaknesses' | 'relationships' | 'marriage' | 'additionalInfo';

interface CharacterFormProps {
    character: Character | null;
    allUsers: User[];
    onSubmit: (data: Character) => void;
    closeDialog: () => void;
    editingSection: EditableSection | null;
}

const initialFormData: Omit<Character, 'id'> = {
    name: '',
    activity: '',
    race: '',
    birthDate: '',
    accomplishments: [],
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
    bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
    wealthLevel: 'Бедный',
};

const fameLevelOptions: OptionType[] = FAME_LEVELS.map(level => ({ value: level, label: level }));
const skillLevelOptions: OptionType[] = SKILL_LEVELS.map(level => ({ value: level, label: level }));

const SectionTitles: Record<EditableSection, string> = {
    mainInfo: 'Основная информация',
    accomplishments: 'Достижения',
    appearance: 'Внешность',
    personality: 'Характер',
    biography: 'Биография',
    abilities: 'Способности',
    weaknesses: 'Слабости',
    relationships: 'Отношения',
    marriage: 'Семейное положение',
    additionalInfo: 'Дополнительно',
};


const CharacterForm = ({ character, allUsers, onSubmit, closeDialog, editingSection }: CharacterFormProps) => {
    const isCreating = !character;
    const [formData, setFormData] = useState<Character>(character || { ...initialFormData, id: `c-${Date.now()}`});

     useEffect(() => {
        if (character) {
             const initializedCharacter = {
                ...initialFormData,
                ...character,
                accomplishments: character.accomplishments || [],
                inventory: { ...initialFormData.inventory, ...(character.inventory || {}) },
                training: Array.isArray(character.training) ? character.training : [],
                marriedTo: Array.isArray(character.marriedTo) ? character.marriedTo : [],
                relationships: (Array.isArray(character.relationships) ? character.relationships : []).map(r => ({...r, id: r.id || `rel-${Math.random()}`})),
                bankAccount: character.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
                wealthLevel: character.wealthLevel || 'Бедный',
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
    
    const handleAccomplishmentChange = (index: number, field: keyof Omit<Accomplishment, 'id'>, value: string) => {
        const newAccomplishments = [...(formData.accomplishments || [])];
        newAccomplishments[index] = { ...newAccomplishments[index], [field]: value };
        setFormData(prev => ({ ...prev, accomplishments: newAccomplishments }));
    };
    
    const addAccomplishment = () => {
        const newAccomplishment: Accomplishment = { 
            id: `acc-${Date.now()}`, 
            fameLevel: '', 
            skillLevel: '', 
            description: '' 
        };
        setFormData(prev => ({ ...prev, accomplishments: [...(prev.accomplishments || []), newAccomplishment] }));
    };

    const removeAccomplishment = (index: number) => {
        const newAccomplishments = (formData.accomplishments || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, accomplishments: newAccomplishments }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isFieldEmpty = (fieldName: keyof Character) => {
        const value = formData[fieldName];
        return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
    };

    const getDialogTitle = () => {
        if (isCreating) return 'Добавить нового персонажа';
        if (!editingSection) return '';
        
        let titleAction = "Редактировать";

        switch(editingSection) {
            case 'abilities':
                if (isFieldEmpty('abilities')) titleAction = "Добавить";
                break;
            case 'weaknesses':
                if (isFieldEmpty('weaknesses')) titleAction = "Добавить";
                break;
            case 'additionalInfo':
                 if (isFieldEmpty('lifeGoal') && isFieldEmpty('pets') && isFieldEmpty('diary')) {
                     titleAction = "Добавить";
                 }
                break;
        }

        return `${titleAction}: ${SectionTitles[editingSection]}`;
    }

    const renderSection = () => {
        const sectionToRender = isCreating ? 'mainInfo' : editingSection;
        switch(sectionToRender) {
            case 'mainInfo':
                return (
                    <div className="space-y-4">
                        <div><Label htmlFor="name">Имя персонажа</Label><Input id="name" value={formData.name ?? ''} onChange={handleChange} required /></div>
                        <div><Label htmlFor="activity">Деятельность/профессия</Label><Input id="activity" value={formData.activity ?? ''} onChange={handleChange} required /></div>
                        <div><Label htmlFor="race">Раса</Label><Input id="race" value={formData.race ?? ''} onChange={handleChange} required /></div>
                        <div><Label htmlFor="birthDate">Дата рождения</Label><Input id="birthDate" value={formData.birthDate ?? ''} onChange={handleChange} placeholder="например, 15.06.2680" required /></div>
                        <div><Label htmlFor="workLocation">Место работы</Label><Input id="workLocation" value={formData.workLocation ?? ''} onChange={handleChange} /></div>
                    </div>
                );
            case 'accomplishments':
                return (
                    <div className="space-y-4">
                        {(formData.accomplishments || []).map((acc, index) => (
                            <div key={acc.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end p-2 border rounded-md relative">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAccomplishment(index)} className="absolute -top-2 -right-2 h-6 w-6 bg-background"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                <div><Label>Известность</Label><SearchableSelect options={fameLevelOptions} value={acc.fameLevel} onValueChange={(v) => handleAccomplishmentChange(index, 'fameLevel', v)} placeholder="Уровень..." /></div>
                                <div><Label>Навык</Label><SearchableSelect options={skillLevelOptions} value={acc.skillLevel} onValueChange={(v) => handleAccomplishmentChange(index, 'skillLevel', v)} placeholder="Уровень..." /></div>
                                <div className="md:col-span-3"><Label>Пояснение</Label><Input value={acc.description} onChange={(e) => handleAccomplishmentChange(index, 'description', e.target.value)} /></div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addAccomplishment}><PlusCircle className="mr-2 h-4 w-4"/>Добавить</Button>
                    </div>
                );
            case 'appearance': return <div><Label htmlFor="appearance">Внешность</Label><Textarea id="appearance" value={formData.appearance ?? ''} onChange={handleChange} rows={10}/></div>;
            case 'personality': return <div><Label htmlFor="personality">Характер</Label><Textarea id="personality" value={formData.personality ?? ''} onChange={handleChange} rows={10}/></div>;
            case 'biography': return <div><Label htmlFor="biography">Биография</Label><Textarea id="biography" value={formData.biography ?? ''} onChange={handleChange} rows={15}/></div>;
            case 'abilities': return <div><Label htmlFor="abilities">Способности</Label><Textarea id="abilities" value={formData.abilities ?? ''} onChange={handleChange} rows={8}/></div>;
            case 'weaknesses': return <div><Label htmlFor="weaknesses">Слабости</Label><Textarea id="weaknesses" value={formData.weaknesses ?? ''} onChange={handleChange} rows={8}/></div>;
            case 'relationships': return <RelationshipForm formData={formData} setFormData={setFormData} characterOptions={characterOptions} />;
            case 'marriage': return <div><Label htmlFor="marriedTo">В браке с</Label><MultiSelect options={characterOptions} selected={formData.marriedTo ?? []} onChange={(v) => handleMultiSelectChange('marriedTo', v)} /></div>;
            case 'additionalInfo':
                return (
                    <div className="space-y-4">
                        <div><Label htmlFor="training">Обучение</Label><MultiSelect options={TRAINING_OPTIONS} selected={formData.training ?? []} onChange={(v) => handleMultiSelectChange('training', v)} /></div>
                        <div><Label htmlFor="lifeGoal">Жизненная цель</Label><Textarea id="lifeGoal" value={formData.lifeGoal ?? ''} onChange={handleChange} rows={4}/></div>
                        <div><Label htmlFor="pets">Питомцы</Label><Textarea id="pets" value={formData.pets ?? ''} onChange={handleChange} rows={4}/></div>
                        <div><Label htmlFor="diary">Личный дневник</Label><Textarea id="diary" value={formData.diary ?? ''} onChange={handleChange} rows={8}/></div>
                    </div>
                );
            default: return isCreating ? renderSection() : <p>Выберите секцию для редактирования.</p>
        }
    }
    
    return (
         <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
             <DialogHeader>
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogDescription>
                    {isCreating 
                        ? 'Заполните основные данные. Остальную анкету можно будет заполнить позже.' 
                        : 'Внесите изменения и нажмите "Сохранить".'
                    }
                </DialogDescription>
             </DialogHeader>
             <div className="relative flex-1 py-4">
                 <ScrollArea className="absolute inset-0 pr-6">
                    {renderSection()}
                 </ScrollArea>
             </div>
            <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Отмена</Button>
              </DialogClose>
              <Button type="submit">{isCreating ? 'Создать персонажа' : 'Сохранить изменения'}</Button>
            </div>
        </form>
    );
};

export default CharacterForm;
