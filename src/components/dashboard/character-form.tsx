
'use client';

import React from 'react';
import type { Character, User, Accomplishment, Relationship, RelationshipType } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { MultiSelect, OptionType } from '../ui/multi-select';
import { Trash2, PlusCircle } from 'lucide-react';
import { SearchableSelect } from '../ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


export type EditableSection = 
    | 'mainInfo' | 'accomplishments' | 'appearance' | 'personality' 
    | 'biography' | 'abilities' | 'weaknesses' | 'marriage' 
    | 'training' | 'lifeGoal' | 'pets' | 'diary';

export type EditingRelationship = {
    mode: 'add'
} | {
    mode: 'edit',
    relationship: Relationship
};

interface CharacterFormProps {
    character: Character | null;
    allUsers: User[];
    onSubmit: (data: Character) => void;
    closeDialog: () => void;
    editingSection: EditableSection | null;
    editingRelationship: EditingRelationship | null;
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
    marriage: 'Семейное положение',
    training: 'Обучение',
    lifeGoal: 'Жизненная цель',
    pets: 'Питомцы',
    diary: 'Личный дневник',
};

const relationshipTypeOptions: { value: RelationshipType, label: string }[] = [
    { value: 'романтика', label: 'Романтика' },
    { value: 'любовь', label: 'Любовь' },
    { value: 'дружба', label: 'Дружба' },
    { value: 'семья', label: 'Семья' },
    { value: 'вражда', label: 'Вражда' },
    { value: 'конкуренция', label: 'Конкуренция' },
    { value: 'нейтралитет', label: 'Нейтралитет' },
];


const RelationshipForm = ({ formData, setFormData, characterOptions, editingRelationship }: {
    formData: Character,
    setFormData: React.Dispatch<React.SetStateAction<Character>>,
    characterOptions: OptionType[],
    editingRelationship: EditingRelationship
}) => {
    const [localRelationship, setLocalRelationship] = React.useState<Relationship>(() => {
        if (editingRelationship.mode === 'edit') {
            return editingRelationship.relationship;
        }
        return {
            id: `rel-${Date.now()}`,
            targetCharacterId: '',
            targetCharacterName: '',
            type: 'нейтралитет',
            points: 0,
            history: [],
        };
    });

    const handleRelationshipChange = (field: keyof Omit<Relationship, 'id' | 'points' | 'history'>, value: any) => {
        const updatedRelationship = { ...localRelationship, [field]: value };
        
        if (field === 'targetCharacterId') {
            const targetChar = characterOptions.find(opt => opt.value === value);
            updatedRelationship.targetCharacterName = targetChar ? targetChar.label.split(' (')[0] : 'Неизвестно';
        }

        setLocalRelationship(updatedRelationship);

        if (editingRelationship.mode === 'add') {
             setFormData(prev => ({ ...prev, relationships: [updatedRelationship] }));
        } else {
            const newRelationships = (formData.relationships || []).map(r => 
                r.id === updatedRelationship.id ? updatedRelationship : r
            );
            setFormData(prev => ({ ...prev, relationships: newRelationships }));
        }
    };
    
    const handleRemove = () => {
         setFormData(prev => ({
            ...prev,
            relationships: (prev.relationships || []).filter(r => r.id !== localRelationship.id)
        }));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3 rounded-md border p-3 relative">
                {editingRelationship.mode === 'edit' && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7"
                        onClick={handleRemove}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}
                <div>
                    <Label>Персонаж</Label>
                    <Select
                        value={localRelationship.targetCharacterId}
                        onValueChange={(value) => handleRelationshipChange('targetCharacterId', value)}
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
                        value={localRelationship.type}
                        onValueChange={(value: RelationshipType) => handleRelationshipChange('type', value)}
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
        </div>
    );
};


const CharacterForm = ({ character, allUsers, onSubmit, closeDialog, editingSection, editingRelationship }: CharacterFormProps) => {
    const isCreating = !character;
    const [formData, setFormData] = React.useState<Character>(character || { ...initialFormData, id: `c-${Date.now()}`});

     React.useEffect(() => {
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

    const characterOptions = React.useMemo(() => {
        if (!allUsers) return [];
        let currentRelationships = new Set<string>();
        if(editingRelationship?.mode === 'edit'){
            currentRelationships = new Set((character?.relationships || []).filter(r => r.id !== editingRelationship?.relationship?.id).map(r => r.targetCharacterId))
        } else {
            currentRelationships = new Set((character?.relationships || []).map(r => r.targetCharacterId))
        }

        return allUsers.flatMap(user =>
            user.characters
                .filter(c => c.id !== formData.id && !currentRelationships.has(c.id))
                .map(c => ({
                    value: c.id,
                    label: `${c.name} (${user.name})`
                }))
        );
    }, [allUsers, formData.id, character, editingRelationship]);

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
        
        if (editingRelationship?.mode === 'add') {
            const newRel = formData.relationships[0];
            const existingRelationships = character?.relationships || [];
            const finalRelationships = [...existingRelationships, newRel];
            onSubmit({ ...character!, relationships: finalRelationships });

        } else if (editingRelationship?.mode === 'edit') {
            const editedRel = formData.relationships.find(r => r.id === editingRelationship.relationship.id);
            if(editedRel){
                const existingRelationships = (character?.relationships || []).map(r => r.id === editedRel.id ? editedRel : r);
                 onSubmit({ ...character!, relationships: existingRelationships });
            } else { // It was removed
                 const finalRelationships = (character?.relationships || []).filter(r => r.id !== editingRelationship.relationship.id);
                 onSubmit({ ...character!, relationships: finalRelationships });
            }
        } else {
            onSubmit(formData);
        }
    };

    const isFieldEmpty = (fieldName: keyof Character) => {
        const value = formData[fieldName];
        return value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);
    };

    const getDialogTitle = () => {
        if (isCreating) return 'Добавить нового персонажа';
        if (editingRelationship) {
             return editingRelationship.mode === 'add' ? 'Добавить отношение' : 'Редактировать отношение';
        }
        if (!editingSection) return '';
        
        const sectionIsEmpty = isFieldEmpty(editingSection as keyof Character);
        const titleAction = sectionIsEmpty ? "Добавить" : "Редактировать";

        return `${titleAction}: ${SectionTitles[editingSection]}`;
    }

    const renderSection = () => {
        const sectionToRender = isCreating ? 'mainInfo' : editingSection;

        if (editingRelationship) {
            return <RelationshipForm 
                        formData={formData} 
                        setFormData={setFormData} 
                        characterOptions={characterOptions} 
                        editingRelationship={editingRelationship}
                    />;
        }

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
            case 'marriage': return <div><Label htmlFor="marriedTo">В браке с</Label><MultiSelect options={characterOptions} selected={formData.marriedTo ?? []} onChange={(v) => handleMultiSelectChange('marriedTo', v)} /></div>;
            case 'training': return <div><Label htmlFor="training">Обучение</Label><MultiSelect options={TRAINING_OPTIONS} selected={formData.training ?? []} onChange={(v) => handleMultiSelectChange('training', v)} /></div>;
            case 'lifeGoal': return <div><Label htmlFor="lifeGoal">Жизненная цель</Label><Textarea id="lifeGoal" value={formData.lifeGoal ?? ''} onChange={handleChange} rows={4}/></div>;
            case 'pets': return <div><Label htmlFor="pets">Питомцы</Label><Textarea id="pets" value={formData.pets ?? ''} onChange={handleChange} rows={4}/></div>;
            case 'diary': return <div><Label htmlFor="diary">Личный дневник</Label><Textarea id="diary" value={formData.diary ?? ''} onChange={handleChange} rows={8}/></div>;
            default: return isCreating ? renderSection() : <p>Выберите секцию для редактирования.</p>
        }
    }
    
    return (
         <form onSubmit={handleSubmit} className="flex flex-col h-full">
             <DialogHeader>
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogDescription>
                    {isCreating 
                        ? 'Заполните основные данные. Остальную анкету можно будет заполнить позже.' 
                        : (editingRelationship ? 'Внесите изменения и нажмите "Сохранить".' : 'Внесите изменения и нажмите "Сохранить".')
                    }
                </DialogDescription>
             </DialogHeader>
            <div className="flex-1 py-4 overflow-hidden">
                <ScrollArea className="h-full pr-6">
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
