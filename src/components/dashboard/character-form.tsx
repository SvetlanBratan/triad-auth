

'use client';

import React from 'react';
import type { Character, User, Accomplishment, Relationship, RelationshipType, CrimeLevel, CitizenshipStatus, Inventory, GalleryImage, Magic } from '@/lib/types';
import { SKILL_LEVELS, FAME_LEVELS, TRAINING_OPTIONS, CRIME_LEVELS, COUNTRIES, RACE_OPTIONS, MAGIC_PERCEPTION_OPTIONS, ADMIN_ELEMENTAL_MAGIC_OPTIONS, ELEMENTAL_MAGIC_OPTIONS, ADMIN_RESERVE_LEVEL_OPTIONS, RESERVE_LEVEL_OPTIONS, FAITH_LEVEL_OPTIONS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Trash2, PlusCircle, Check } from 'lucide-react';
import { SearchableSelect } from '../ui/searchable-select';
import ImageUploader from './image-uploader';
import { SearchableMultiSelect } from '../ui/searchable-multi-select';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useUser } from '@/hooks/use-user';


export type EditableSection = 
    | 'appearance' | 'personality' 
    | 'biography' | 'abilities' | 'weaknesses' | 'marriage' 
    | 'training' | 'lifeGoal' | 'diary' | 'criminalRecords' | 'mainInfo'
    | 'gallery' | 'magic';

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
    raceIsConfirmed: false,
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
        документы: [],
        ингредиенты: [],
        ключи: [],
    },
    bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
    wealthLevel: 'Бедный',
    popularity: 0,
    popularityHistory: [],
    pets: '',
    galleryImages: [],
    bannerImage: '',
    magic: {
        perception: [],
        elements: [],
        teachings: [],
        reserveLevel: '',
        faithLevel: '',
    }
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
    gallery: 'Баннер и галерея',
    magic: 'Магия',
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
        Форматирование: **жирный**, *курсив*, &lt;s&gt;зачеркнутый&lt;/s&gt;, &lt;u&gt;подчеркнутый&lt;/u&gt;.
    </p>
);

const CharacterForm = ({ character, allUsers, onSubmit, closeDialog, editingState }: CharacterFormProps) => {
    const isCreating = editingState?.type === 'createCharacter';
    const { currentUser, gameDate } = useUser();
    const isAdmin = currentUser?.role === 'admin';
    const [formData, setFormData] = React.useState<Character>({ ...initialFormData, id: `c-${Date.now()}`});
    
    const [currentItem, setCurrentItem] = React.useState<Relationship | Accomplishment | null>(null);

    const [baseRace, setBaseRace] = React.useState('');
    const [raceDetails, setRaceDetails] = React.useState('');
    const [ageInput, setAgeInput] = React.useState('');

     React.useEffect(() => {
        const initializeState = () => {
            if (isCreating) {
                const newCharacterWithId = { ...initialFormData, id: `c-${Date.now()}` };
                setFormData(newCharacterWithId);
                setBaseRace('');
                setRaceDetails('');
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
                    galleryImages: (character.galleryImages || []).map(img => ({...img, id: img.id || `img-${Date.now()}-${Math.random()}`})),
                    magic: character.magic || initialFormData.magic,
                };
                setFormData(initializedCharacter);

                const raceString = initializedCharacter.race || '';
                const match = raceString.match(/^(.*?)\s*\((.*)\)$/);
                if (match) {
                    setBaseRace(match[1].trim());
                    setRaceDetails(match[2].trim());
                } else {
                    setBaseRace(raceString);
                    setRaceDetails('');
                }
            }
        };

        initializeState();
        setAgeInput('');

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

    React.useEffect(() => {
        if (editingState?.type === 'createCharacter' || (editingState?.type === 'field' && editingState.field === 'race') || (editingState?.type === 'section' && editingState.section === 'mainInfo')) {
            let combinedRace = baseRace.trim();
            if (raceDetails.trim()) {
                combinedRace += ` (${raceDetails.trim()})`;
            }
            if (formData.race !== combinedRace) {
                handleFieldChange('race', combinedRace);
            }
        }
    }, [baseRace, raceDetails, editingState, formData.race]);
    

    const characterOptions = React.useMemo(() => {
        if (!allUsers) return [];
        const existingTargetIds = new Set<string>();

        if (editingState?.type === 'relationship') {
            (formData.relationships || []).forEach(r => {
                if (editingState.mode === 'add' || (editingState.mode === 'edit' && r.id !== editingState.relationship.id)) {
                    existingTargetIds.add(r.targetCharacterId);
                }
            });
        }

        return allUsers.flatMap(user =>
            user.characters
                .filter(c => c.id !== formData.id && !existingTargetIds.has(c.id))
                .map(c => ({
                    value: c.id,
                    label: `${c.name} (${user.name})`
                }))
        );
    }, [allUsers, formData.id, formData.relationships, editingState]);
    
    const allCharacterOptionsForGallery = React.useMemo(() => {
        return allUsers.flatMap(user =>
            user.characters.map(c => ({
                value: c.id,
                label: `${c.name} (${user.name})`
            }))
        );
    }, [allUsers]);


    const handleFieldChange = (field: keyof Character, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleMagicChange = (field: keyof Magic, value: any) => {
        setFormData(prev => ({
            ...prev,
            magic: {
                ...(prev.magic || {}),
                [field]: value,
            },
        }));
    };
    
    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const ageStr = e.target.value;
        setAgeInput(ageStr);
        const age = parseInt(ageStr, 10);
        if (!isNaN(age) && age >= 0 && gameDate) {
            let birthYear = gameDate.getFullYear() - age;
            const currentParts = (formData.birthDate || 'ДД.ММ.ГГГГ').split('.');
            const dayPart = currentParts[0];
            const monthPart = currentParts[1];

            const birthDay = parseInt(dayPart, 10);
            const birthMonth = parseInt(monthPart, 10); // month is 1-12

            if (!isNaN(birthDay) && !isNaN(birthMonth) && birthDay > 0 && birthMonth > 0) {
                const gameMonth = gameDate.getMonth() + 1; // getMonth is 0-11, so +1
                const gameDay = gameDate.getDate();
                
                // If birthday for this year hasn't happened yet, subtract a year
                if (birthMonth > gameMonth || (birthMonth === gameMonth && birthDay > gameDay)) {
                    birthYear -= 1;
                }
            }
            
            const day = /^\d{1,2}$/.test(dayPart) && parseInt(dayPart) > 0 && parseInt(dayPart) <= 31 ? dayPart : 'ДД';
            const month = /^\d{1,2}$/.test(monthPart) && parseInt(monthPart) > 0 && parseInt(monthPart) <= 12 ? monthPart : 'ММ';
            
            handleFieldChange('birthDate', `${day}.${month}.${birthYear}`);
        }
    };

    const handleGalleryImageChange = (index: number, field: keyof GalleryImage, value: any) => {
        const newImages = [...(formData.galleryImages || [])];
        (newImages[index] as any)[field] = value;
        handleFieldChange('galleryImages', newImages);
    };

    const addGalleryImageField = () => {
        const newImage: GalleryImage = { id: `img-${Date.now()}-${Math.random()}`, url: '', taggedCharacterIds: [] };
        handleFieldChange('galleryImages', [...(formData.galleryImages || []), newImage]);
    };

    const removeGalleryImageField = (index: number) => {
        handleFieldChange('galleryImages', (formData.galleryImages || []).filter((_, i) => i !== index));
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
                 if (!SectionTitles[sectionKey]) {
                    return "Редактирование";
                 }
                 let sectionIsEmpty: boolean;
                 if (sectionKey === 'marriage') {
                    sectionIsEmpty = !formData.marriedTo || formData.marriedTo.length === 0;
                 } else if (sectionKey === 'magic') {
                    sectionIsEmpty = !formData.magic;
                 } else {
                    const sectionData = formData[sectionKey as keyof Omit<Character, 'marriedTo' | 'magic'>];
                    sectionIsEmpty = !sectionData || (Array.isArray(sectionData) && sectionData.length === 0);
                 }
                 const titleAction = sectionIsEmpty ? "Добавить" : "Редактировать";
                 return `${titleAction}: ${SectionTitles[sectionKey]}`;
            }
            case 'field': {
                if (editingState.field === 'countryOfResidence' || editingState.field === 'citizenshipStatus' || editingState.field === 'residenceLocation') {
                    return 'Редактировать: Место жительства';
                }
                 if (editingState.field === 'race') {
                    return 'Редактировать: Раса';
                }
                return `Редактировать: ${FieldLabels[editingState.field] || 'поле'}`;
            }
        }
    }

    const renderBirthDateField = () => (
         <div className="space-y-4">
            <div>
                <Label htmlFor="birthDate">Дата рождения</Label>
                <Input id="birthDate" value={formData.birthDate ?? ''} onChange={(e) => handleFieldChange('birthDate', e.target.value)} placeholder="ДД.ММ.ГГГГ"/>
            </div>
            <div>
                <Label htmlFor="age-calculator" className="text-sm text-muted-foreground">или возраст для расчета года</Label>
                <Input id="age-calculator" type="number" value={ageInput} onChange={handleAgeChange} placeholder="Напр., 25" />
            </div>
        </div>
    );

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
                            <div className="space-y-2">
                                <Label htmlFor="race">Раса</Label>
                                <SearchableSelect
                                    options={RACE_OPTIONS}
                                    value={baseRace}
                                    onValueChange={setBaseRace}
                                    placeholder="Выберите расу..."
                                    disabled={!isAdmin && formData.raceIsConfirmed}
                                />
                                <Input
                                    value={raceDetails}
                                    onChange={(e) => setRaceDetails(e.target.value)}
                                    placeholder="Уточнение в скобках (необязательно)"
                                    disabled={!isAdmin && formData.raceIsConfirmed}
                                />
                                {isAdmin && (
                                     <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="race-confirmed-switch"
                                            checked={formData.raceIsConfirmed}
                                            onCheckedChange={(checked) => handleFieldChange('raceIsConfirmed', checked)}
                                        />
                                        <Label htmlFor="race-confirmed-switch">Раса подтверждена</Label>
                                    </div>
                                )}
                            </div>
                            {renderBirthDateField()}
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
                    case 'gallery': return (
                        <div className="space-y-6">
                            <div>
                                <Label>URL Баннера</Label>
                                <Input value={formData.bannerImage ?? ''} onChange={(e) => handleFieldChange('bannerImage', e.target.value)} placeholder="https://..."/>
                            </div>
                            <div className="space-y-4">
                                <Label>Изображения галереи</Label>
                                {(formData.galleryImages || []).map((image, index) => (
                                    <div key={image.id} className="flex flex-col gap-3 p-3 border rounded-md">
                                        <div className="flex items-center gap-2">
                                            <Input value={image.url} onChange={(e) => handleGalleryImageChange(index, 'url', e.target.value)} placeholder="URL..."/>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeGalleryImageField(index)}>
                                                <Trash2 className="w-4 h-4 text-destructive"/>
                                            </Button>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Отмеченные персонажи</Label>
                                            <SearchableMultiSelect
                                                placeholder="Выберите персонажей..."
                                                options={allCharacterOptionsForGallery}
                                                selected={image.taggedCharacterIds || []}
                                                onChange={(v) => handleGalleryImageChange(index, 'taggedCharacterIds', v)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addGalleryImageField}>Добавить изображение</Button>
                            </div>
                        </div>
                    );
                    case 'magic':
                        return (
                            <div className="space-y-4">
                                <div>
                                    <Label>Восприятие магии (не более 3)</Label>
                                    <SearchableMultiSelect
                                        options={MAGIC_PERCEPTION_OPTIONS}
                                        selected={formData.magic?.perception || []}
                                        onChange={(v) => v.length <= 3 && handleMagicChange('perception', v)}
                                        placeholder='Выберите восприятие...'
                                    />
                                </div>
                                <div>
                                    <Label>Стихийная магия (не более 4)</Label>
                                    <SearchableMultiSelect
                                        options={isAdmin ? ADMIN_ELEMENTAL_MAGIC_OPTIONS : ELEMENTAL_MAGIC_OPTIONS}
                                        selected={formData.magic?.elements || []}
                                        onChange={(v) => v.length <= 4 && handleMagicChange('elements', v)}
                                        placeholder='Выберите стихии...'
                                    />
                                </div>
                                <div>
                                    <Label>Учения (не более 3)</Label>
                                    <SearchableMultiSelect
                                        options={[]} // TODO: Populate from RTDB
                                        selected={formData.magic?.teachings || []}
                                        onChange={(v) => v.length <= 3 && handleMagicChange('teachings', v)}
                                        placeholder='Выберите учения...'
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Список учений будет подгружаться из базы данных.
                                    </p>
                                </div>
                                <div>
                                    <Label>Уровень резерва</Label>
                                    <SearchableSelect
                                        options={isAdmin ? ADMIN_RESERVE_LEVEL_OPTIONS : RESERVE_LEVEL_OPTIONS}
                                        value={formData.magic?.reserveLevel || ''}
                                        onValueChange={(v) => handleMagicChange('reserveLevel', v)}
                                        placeholder="Выберите уровень..."
                                    />
                                </div>
                                <div>
                                    <Label>Уровень веры</Label>
                                    <SearchableSelect
                                        options={FAITH_LEVEL_OPTIONS}
                                        value={formData.magic?.faithLevel || ''}
                                        onValueChange={(v) => handleMagicChange('faithLevel', v)}
                                        placeholder="Выберите уровень..."
                                    />
                                </div>
                            </div>
                        );

                    default: return <p>Неизвестная секция для редактирования.</p>;
                }

            case 'field':
                const field = editingState.field;
                if (field === 'birthDate') {
                    return renderBirthDateField();
                }
                if (field === 'race') {
                    return (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="race">Раса</Label>
                                <SearchableSelect
                                    options={RACE_OPTIONS}
                                    value={baseRace}
                                    onValueChange={setBaseRace}
                                    placeholder="Выберите расу..."
                                    disabled={!isAdmin && formData.raceIsConfirmed}
                                />
                                <Input
                                    value={raceDetails}
                                    onChange={(e) => setRaceDetails(e.target.value)}
                                    placeholder="Уточнение в скобках (необязательно)"
                                    disabled={!isAdmin && formData.raceIsConfirmed}
                                />
                            </div>
                            {isAdmin && (
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="race-confirmed-switch"
                                        checked={formData.raceIsConfirmed}
                                        onCheckedChange={(checked) => handleFieldChange('raceIsConfirmed', checked)}
                                    />
                                    <Label htmlFor="race-confirmed-switch">Раса подтверждена</Label>
                                </div>
                            )}
                        </div>
                    );
                }
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
                                    <Trash2 className="h-4 h-4 text-destructive" />
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
                                    <Trash2 className="h-4 h-4 text-destructive" />
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
         <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh] overflow-hidden">
             <DialogHeader>
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogDescription>
                    {isCreating 
                        ? 'Заполните основные данные. Остальную анкету можно будет заполнить позже.' 
                        : 'Внесите изменения и нажмите "Сохранить".'
                    }
                </DialogDescription>
             </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4 -mr-4">
                <ScrollArea className="h-full pr-4">
                        {renderContent()}
                </ScrollArea>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Отмена</Button>
              </DialogClose>
              <Button type="submit">{isCreating ? 'Создать персонажа' : 'Сохранить изменения'}</Button>
            </div>
        </form>
    );
};

export default CharacterForm;

    

