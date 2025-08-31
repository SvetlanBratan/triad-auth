

'use client';

import React from 'react';
import type { Character, User, Accomplishment, Relationship, RelationshipType, CrimeLevel, CitizenshipStatus, Inventory } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS, CRIME_LEVELS, COUNTRIES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { SearchableSelect } from '../ui/searchable-select';
import ImageUploader from './image-uploader';
import { SearchableMultiSelect } from '../ui/searchable-multi-select';
import { Switch } from '../ui/switch';


export type EditableSection = 
    | 'appearance' | 'personality' 
    | 'biography' | 'abilities' | 'weaknesses' | 'marriage' 
    | 'training' | 'lifeGoal' | 'diary' | 'criminalRecords' | 'mainInfo';

export type EditingState = {
    type: 'section',
    section: EditableSection
} | {
    type: 'field',
    section: EditableSection,
    field: keyof Character
} | {
    type: 'relationship',
    mode: 'add'
} | {
    type: 'relationship',
    mode: 'edit',
    relationship: Relationship
} | {
    type: 'accomplishment',
    mode: 'add'
} | {
    type: 'accomplishment',
    mode: 'edit',
    accomplishment: Accomplishment
} | {
    type: 'createCharacter'
};


interface CharacterFormProps {
    character: Character | null;
    allUsers: User[];
    onSubmit: (data: Character) => void;
    closeDialog: () => void;
    editingState: EditingState | null;
}

const initialFormData: Omit<Character, 'id'> = {
    name: '',
    activity: '',
    race: '',
    birthDate: '',
    crimeLevel: 5,
    countryOfResidence: '',
    residenceLocation: '',
    citizenshipStatus: 'non-citizen',
    taxpayerStatus: 'taxable',
    accomplishments: [],
    workLocation: '',
    factions: '',
    appearance: '',
    appearanceImage: '',
    personality: '',
    biography: '',
    biographyIsHidden: false,
    diary: '',
    training: [],
    relationships: [],
    marriedTo: [],
    abilities: '',
    weaknesses: '',
    lifeGoal: '',
    criminalRecords: '',
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
        драгоценности: [],
        книгиИСвитки: [],
        прочее: [],
        предприятия: [],
        души: [],
        мебель: [],
        доспехи: [],
        инструменты: [],
        питомцы: [],
        проживание: [],
        услуги: [],
    },
    bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
    wealthLevel: 'Бедный',
    popularity: 0,
    popularityHistory: [],
    pets: '',
};

const fameLevelOptions = FAME_LEVELS.map(level => ({ value: level, label: level }));
const skillLevelOptions = SKILL_LEVELS.map(level => ({ value: level, label: level }));
const crimeLevelOptions = CRIME_LEVELS.map(cl => ({ value: String(cl.level), label: cl.title }));
const countryOptions = COUNTRIES.map(c => ({ value: c, label: c }));
const citizenshipStatusOptions: { value: CitizenshipStatus, label: string }[] = [
    { value: 'citizen', label: 'Гражданин' },
    { value: 'non-citizen', label: 'Не гражданин' },
    { value: 'refugee', label: 'Беженец' },
];

const SectionTitles: Record<EditableSection, string> = {
    mainInfo: 'Основная информация',
    appearance: 'Внешность',
    personality: 'Характер',
    biography: 'Биография',
    abilities: 'Способности',
    weaknesses: 'Слабости',
    marriage: 'Семейное положение',
    training: 'Обучение',
    lifeGoal: 'Жизненная цель',
    diary: 'Личный дневник',
    criminalRecords: 'Судимости',
};

const FieldLabels: Partial<Record<keyof Character, string>> = {
    name: 'Имя персонажа',
    activity: 'Деятельность/профессия',
    race: 'Раса',
    birthDate: 'Дата рождения',
    workLocation: 'Место работы',
    crimeLevel: 'Уровень преступности',
    factions: 'Фракции/гильдии',
    countryOfResidence: 'Страна проживания',
    citizenshipStatus: 'Статус гражданства',
    residenceLocation: 'Место проживания',
};

const relationshipTypeOptions: { value: RelationshipType, label: string }[] = [
    { value: 'романтика', label: 'Романтика' },
    { value: 'любовь', label: 'Любовь' },
    { value: 'дружба', label: 'Дружба' },
    { value: 'семья', label: 'Семья' },
    { value: 'вражда', label: 'Вражда' },
    { value: 'конкуренция', label: 'Конкуренция' },
    { value: 'нейтралитет', label: 'Нейтралитет' },
    { value: 'уважение', label: 'Уважение' },
    { value: 'страсть', label: 'Страсть' },
    { value: 'заинтересованность', label: 'Заинтересованность' },
    { value: 'сотрудничество', label: 'Сотрудничество' },
];

const FormattingHelp = () => (
    <p className="text-xs text-muted-foreground mt-2">
        Форматирование: '''жирный''', ''курсив'', *жирный*, <s>зачеркнутый</s>, <u>подчеркнутый</u>.
    </p>
);

const CharacterForm = ({ character, allUsers, onSubmit, closeDialog, editingState }: CharacterFormProps) => {
    const isCreating = editingState?.type === 'createCharacter';
    const [formData, setFormData] = React.useState<Character>({ ...initialFormData, id: `c-${Date.now()}`});
    
    // State for the single item being edited/added
    const [currentItem, setCurrentItem] = React.useState<Relationship | Accomplishment | null>(null);

     React.useEffect(() => {
        const initializeState = () => {
            if (isCreating) {
                const newCharacterWithId = { ...initialFormData, id: `c-${Date.now()}` };
                setFormData(newCharacterWithId);
            } else if (character) {
                const initializedCharacter = {
                    ...initialFormData,
                    ...character,
                    crimeLevel: character.crimeLevel || 5,
                    accomplishments: character.accomplishments || [],
                    inventory: { ...initialFormData.inventory, ...(character.inventory || {}) },
                    familiarCards: character.familiarCards || [],
                    training: Array.isArray(character.training) ? character.training : [],
                    marriedTo: Array.isArray(character.marriedTo) ? character.marriedTo : [],
                    relationships: (Array.isArray(character.relationships) ? character.relationships : []).map(r => ({...r, id: r.id || `rel-${Math.random()}`})),
                    bankAccount: character.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
                    wealthLevel: character.wealthLevel || 'Бедный',
                };
                setFormData(initializedCharacter);
            }
        };

        initializeState();

        if (editingState?.type === 'relationship') {
            if (editingState.mode === 'edit') setCurrentItem(editingState.relationship);
            else setCurrentItem({ id: `rel-${Date.now()}`, targetCharacterId: '', targetCharacterName: '', type: 'нейтралитет', points: 0, history: [] });
        } else if (editingState?.type === 'accomplishment') {
            if (editingState.mode === 'edit') setCurrentItem(editingState.accomplishment);
            else setCurrentItem({ id: `acc-${Date.now()}`, fameLevel: '', skillLevel: '', description: '' });
        } else {
            setCurrentItem(null);
        }
    }, [editingState, character, isCreating]);
    

    const characterOptions = React.useMemo(() => {
        if (!allUsers) return [];
        const currentRelationshipIds = new Set<string>((formData.relationships || []).map(r => r.targetCharacterId));

        if (editingState?.type === 'relationship' && editingState.mode === 'edit') {
            currentRelationshipIds.delete(editingState.relationship.targetCharacterId);
        }

        return allUsers.flatMap(user =>
            user.characters
                .filter(c => c.id !== formData.id && !currentRelationshipIds.has(c.id)) // Cannot have relationship with self or existing ones
                .map(c => ({
                    value: c.id,
                    label: `${c.name} (${user.name})`
                }))
        );
    }, [allUsers, formData.id, formData.relationships, editingState]);

    const handleFieldChange = (field: keyof Character, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMultiSelectChange = (id: 'marriedTo' | 'training', values: string[]) => {
        setFormData(prev => ({ ...prev, [id]: values }));
    };
    
    const handleItemChange = (field: string, value: any) => {
        if (!currentItem) return;
        const updatedItem = { ...currentItem, [field]: value };
        
        if ('targetCharacterId' in updatedItem && field === 'targetCharacterId') {
            const targetChar = characterOptions.find(opt => opt.value === value);
            updatedItem.targetCharacterName = targetChar ? targetChar.label.split(' (')[0] : 'Неизвестно';
        }

        setCurrentItem(updatedItem);
    };

    const handleRemoveItem = () => {
        if (!currentItem || !editingState) return;

        let updatedData = { ...formData };
        if (editingState.type === 'relationship' && 'targetCharacterId' in currentItem) {
            updatedData.relationships = (formData.relationships || []).filter(r => r.id !== currentItem.id);
        } else if (editingState.type === 'accomplishment' && 'fameLevel' in currentItem) {
            updatedData.accomplishments = (formData.accomplishments || []).filter(a => a.id !== currentItem.id);
        }
        onSubmit(updatedData);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingState?.type === 'relationship' || editingState?.type === 'accomplishment') {
             if (!currentItem) return;
             
             let updatedData = { ...formData };
             if (editingState.type === 'relationship' && 'targetCharacterId' in currentItem) {
                // Only add/update if a target character is selected
                if (currentItem.targetCharacterId) {
                    const items = [...(formData.relationships || [])];
                    const index = items.findIndex(r => r.id === currentItem.id);
                    if (index > -1) items[index] = currentItem as Relationship;
                    else items.push(currentItem as Relationship);
                    updatedData.relationships = items;
                }
             } else if (editingState.type === 'accomplishment' && 'fameLevel' in currentItem) {
                 const items = [...(formData.accomplishments || [])];
                 const index = items.findIndex(a => a.id === currentItem.id);
                 if (index > -1) items[index] = currentItem as Accomplishment;
                 else items.push(currentItem as Accomplishment);
                 updatedData.accomplishments = items;
             }
             onSubmit(updatedData);
        } else {
             onSubmit(formData);
        }
    };


    const getDialogTitle = () => {
        if (!editingState) return '';
        switch(editingState.type) {
            case 'createCharacter': return 'Добавить нового персонажа';
            case 'relationship': return editingState.mode === 'add' ? 'Добавить отношение' : 'Редактировать отношение';
            case 'accomplishment': return editingState.mode === 'add' ? 'Добавить достижение' : 'Редактировать достижение';
            case 'section': {
                 const sectionKey = editingState.section;
                 if (sectionKey === 'mainInfo') {
                     return SectionTitles.mainInfo;
                 }
                 let sectionIsEmpty: boolean;
                 if (sectionKey === 'marriage') {
                    sectionIsEmpty = !formData.marriedTo || formData.marriedTo.length === 0;
                 } else {
                    const sectionData = formData[sectionKey as keyof Omit<Character, 'marriedTo'>];
                    sectionIsEmpty = !sectionData || (Array.isArray(sectionData) && sectionData.length === 0);
                 }
                 const titleAction = sectionIsEmpty ? "Добавить" : "Редактировать";
                 return `${titleAction}: ${SectionTitles[sectionKey]}`;
            }
            case 'field': {
                if (editingState.field === 'countryOfResidence' || editingState.field === 'citizenshipStatus' || editingState.field === 'residenceLocation') {
                    return 'Редактировать: Место жительства';
                }
                return `Редактировать: ${FieldLabels[editingState.field] || 'поле'}`;
            }
        }
    }

    const renderContent = () => {
        if (!editingState) return null;
        
        switch(editingState.type) {
            case 'createCharacter':
                 return (
                    <div className="space-y-4">
                        <div><Label htmlFor="name">Имя персонажа</Label><Input id="name" value={formData.name ?? ''} onChange={(e) => handleFieldChange('name', e.target.value)} required placeholder="Например, Артас Менетил"/></div>
                        <div><Label htmlFor="activity">Деятельность/профессия</Label><Input id="activity" value={formData.activity ?? ''} onChange={(e) => handleFieldChange('activity', e.target.value)} required placeholder="Например, Охотник на чудовищ"/></div>
                    </div>
                );
            
            case 'section':
                if (editingState.section === 'mainInfo') {
                    return (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Имя персонажа</Label>
                                <Input id="name" value={formData.name ?? ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="activity">Деятельность/профессия</Label>
                                <Input id="activity" value={formData.activity ?? ''} onChange={(e) => handleFieldChange('activity', e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="countryOfResidence">Страна проживания</Label>
                                 <SearchableSelect
                                    options={countryOptions}
                                    value={String(formData.countryOfResidence ?? '')}
                                    onValueChange={(v) => handleFieldChange('countryOfResidence', v)}
                                    placeholder="Выберите страну..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="residenceLocation">{FieldLabels['residenceLocation']}</Label>
                                <Input id="residenceLocation" value={(formData['residenceLocation'] as string) ?? ''} onChange={(e) => handleFieldChange('residenceLocation', e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="citizenshipStatus">Статус гражданства</Label>
                                <SearchableSelect
                                    options={citizenshipStatusOptions}
                                    value={formData.citizenshipStatus ?? 'non-citizen'}
                                    onValueChange={(v) => handleFieldChange('citizenshipStatus', v as CitizenshipStatus)}
                                    placeholder="Выберите статус..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="race">Раса</Label>
                                <Input id="race" value={formData.race ?? ''} onChange={(e) => handleFieldChange('race', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="birthDate">Дата рождения</Label>
                                <Input id="birthDate" value={formData.birthDate ?? ''} onChange={(e) => handleFieldChange('birthDate', e.target.value)} placeholder="ДД.ММ.ГГГГ"/>
                            </div>
                             <div>
                                <Label htmlFor="crimeLevel">Уровень преступности</Label>
                                 <SearchableSelect
                                    options={crimeLevelOptions}
                                    value={String(formData.crimeLevel || 5)}
                                    onValueChange={(v) => handleFieldChange('crimeLevel', Number(v) as CrimeLevel)}
                                    placeholder="Выберите уровень..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="workLocation">Место работы</Label>
                                <Input id="workLocation" value={formData.workLocation ?? ''} onChange={(e) => handleFieldChange('workLocation', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="factions">Фракции/гильдии</Label>
                                <Input id="factions" value={formData.factions ?? ''} onChange={(e) => handleFieldChange('factions', e.target.value)} />
                            </div>
                        </div>
                    );
                }
                 // The rest of the section cases
                switch(editingState.section) {
                    case 'appearance': return <div className="space-y-4"><ImageUploader
                                    currentImageUrl={formData.appearanceImage}
                                    onUpload={(url) => handleFieldChange('appearanceImage', url)}
                                    uploadPreset="ankets"
                                />
                                <div><Label htmlFor="appearance">Описание внешности</Label><Textarea id="appearance" value={formData.appearance ?? ''} onChange={(e) => handleFieldChange('appearance', e.target.value)} rows={10} placeholder="Опишите внешность вашего персонажа..."/> <FormattingHelp /></div></div>;
                    case 'personality': return <div><Label htmlFor="personality">Характер</Label><Textarea id="personality" value={formData.personality ?? ''} onChange={(e) => handleFieldChange('personality', e.target.value)} rows={10} placeholder="Опишите характер персонажа..."/> <FormattingHelp /></div>;
                    case 'biography': return (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="biography">Биография</Label>
                                <Textarea id="biography" value={formData.biography ?? ''} onChange={(e) => handleFieldChange('biography', e.target.value)} rows={15} placeholder="Расскажите историю вашего персонажа..."/>
                                <FormattingHelp />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="biography-hidden-switch"
                                    checked={formData.biographyIsHidden}
                                    onCheckedChange={(checked) => handleFieldChange('biographyIsHidden', checked)}
                                />
                                <Label htmlFor="biography-hidden-switch">Скрыть биографию от других игроков</Label>
                            </div>
                        </div>
                    );
                    case 'abilities': return <div><Label htmlFor="abilities">Способности</Label><Textarea id="abilities" value={formData.abilities ?? ''} onChange={(e) => handleFieldChange('abilities', e.target.value)} rows={8} placeholder="Опишите уникальные способности или навыки..."/> <FormattingHelp /></div>;
                    case 'weaknesses': return <div><Label htmlFor="weaknesses">Слабости</Label><Textarea id="weaknesses" value={formData.weaknesses ?? ''} onChange={(e) => handleFieldChange('weaknesses', e.target.value)} rows={8} placeholder="Укажите слабости, уязвимости или страхи..."/> <FormattingHelp /></div>;
                    case 'marriage': return <div><Label htmlFor="marriedTo">В браке с</Label><SearchableMultiSelect placeholder="Выберите персонажей..." options={characterOptions} selected={formData.marriedTo ?? []} onChange={(v) => handleMultiSelectChange('marriedTo', v)} /></div>;
                    case 'training': return <div><Label htmlFor="training">Обучение</Label><SearchableMultiSelect placeholder="Выберите варианты..." options={TRAINING_OPTIONS} selected={formData.training ?? []} onChange={(v) => handleMultiSelectChange('training', v)} /></div>;
                    case 'lifeGoal': return <div><Label htmlFor="lifeGoal">Жизненная цель</Label><Textarea id="lifeGoal" value={formData.lifeGoal ?? ''} onChange={(e) => handleFieldChange('lifeGoal', e.target.value)} rows={4} placeholder="Какова главная цель или мечта вашего персонажа?"/></div>;
                    case 'criminalRecords': return <div><Label htmlFor="criminalRecords">Судимости</Label><Textarea id="criminalRecords" value={formData.criminalRecords ?? ''} onChange={(e) => handleFieldChange('criminalRecords', e.target.value)} rows={4} placeholder="Опишите судимости персонажа."/></div>;
                    case 'diary': return <div><Label htmlFor="diary">Личный дневник</Label><Textarea id="diary" value={formData.diary ?? ''} onChange={(e) => handleFieldChange('diary', e.target.value)} rows={8} placeholder="Здесь можно вести записи от лица персонажа. Этот раздел виден только вам и администраторам."/></div>;
                    default: return <p>Неизвестная секция для редактирования.</p>;
                }

            case 'field':
                const field = editingState.field;
                 if(field === 'countryOfResidence' || field === 'citizenshipStatus' || field === 'residenceLocation') {
                     return (
                         <div className="space-y-4">
                            <div>
                                <Label htmlFor="countryOfResidence">Страна проживания</Label>
                                <SearchableSelect
                                    options={countryOptions}
                                    value={String(formData.countryOfResidence ?? '')}
                                    onValueChange={(v) => handleFieldChange('countryOfResidence', v)}
                                    placeholder="Выберите страну..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="residenceLocation">{FieldLabels['residenceLocation']}</Label>
                                <Input id="residenceLocation" value={(formData['residenceLocation'] as string) ?? ''} onChange={(e) => handleFieldChange('residenceLocation', e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="citizenshipStatus">Статус гражданства</Label>
                                <SearchableSelect
                                    options={citizenshipStatusOptions}
                                    value={formData.citizenshipStatus ?? 'non-citizen'}
                                    onValueChange={(v) => handleFieldChange('citizenshipStatus', v as CitizenshipStatus)}
                                    placeholder="Выберите статус..."
                                />
                            </div>
                         </div>
                     )
                }
                if(field === 'crimeLevel') {
                     return (
                         <div>
                             <Label htmlFor="crimeLevel">{FieldLabels[field]}</Label>
                              <SearchableSelect
                                options={crimeLevelOptions}
                                value={String(formData.crimeLevel || 5)}
                                onValueChange={(v) => handleFieldChange('crimeLevel', Number(v) as CrimeLevel)}
                                placeholder="Выберите уровень..."
                            />
                         </div>
                     )
                }
                return (
                    <div>
                        <Label htmlFor={field as string}>{FieldLabels[field] || 'Значение'}</Label>
                        <Input id={field as string} value={(formData[field] as string) ?? ''} onChange={(e) => handleFieldChange(field, e.target.value)} />
                    </div>
                );
            
            case 'accomplishment':
                const acc = currentItem as Accomplishment;
                if (!acc) return null;
                 return (
                    <div className="space-y-4">
                        <div className="space-y-3 rounded-md border p-3 relative">
                            {editingState.mode === 'edit' && (
                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={handleRemoveItem}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                             <div>
                                <Label>Известность</Label>
                                 <SearchableSelect
                                    options={fameLevelOptions}
                                    value={acc.fameLevel}
                                    onValueChange={(v) => handleItemChange('fameLevel', v)}
                                    placeholder="Уровень..."
                                />
                            </div>
                            <div>
                                <Label>Навык</Label>
                                <SearchableSelect
                                    options={skillLevelOptions}
                                    value={acc.skillLevel}
                                    onValueChange={(v) => handleItemChange('skillLevel', v)}
                                    placeholder="Уровень..."
                                />
                            </div>
                            <div><Label>Пояснение</Label><Input value={acc.description} onChange={(e) => handleItemChange('description', e.target.value)} placeholder="Например, в области зельеварения"/></div>
                        </div>
                    </div>
                );

            case 'relationship':
                const rel = currentItem as Relationship;
                if (!rel) return null;
                return (
                    <div className="space-y-4">
                        <div className="space-y-3 rounded-md border p-3 relative">
                            {editingState.mode === 'edit' && (
                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={handleRemoveItem}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                            <div>
                                <Label>Персонаж</Label>
                                <SearchableSelect
                                    options={characterOptions}
                                    value={rel.targetCharacterId}
                                    onValueChange={(value) => handleItemChange('targetCharacterId', value)}
                                    placeholder="Выберите персонажа..."
                                />
                            </div>
                            <div>
                                <Label>Тип отношений</Label>
                                 <SearchableSelect
                                    options={relationshipTypeOptions}
                                    value={rel.type}
                                    onValueChange={(value: string) => handleItemChange('type', value as RelationshipType)}
                                    placeholder="Выберите тип..."
                                />
                            </div>
                        </div>
                    </div>
                );
        }
    }
    
    return (
         <form onSubmit={handleSubmit} className="flex flex-col h-full">
             <DialogHeader>
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogDescription>
                    {isCreating 
                        ? 'Заполните основные данные. Остальную анкету можно будет заполнить позже.' 
                        : 'Внесите изменения и нажмите "Сохранить".'
                    }
                </DialogDescription>
             </DialogHeader>
            <ScrollArea className="flex-1 py-4 pr-6">
                {renderContent()}
            </ScrollArea>
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
