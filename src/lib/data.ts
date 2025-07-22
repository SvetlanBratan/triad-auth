
import type { Reward, FamiliarCard } from './types';

// The 'id' for users now corresponds to the Firebase Auth UID.
// For initial users, these are placeholders. New users created via the app
// will get a real Firebase UID.
export const users: never[] = [];

export const rewards: Reward[] = [
    { id: 'r1', title: 'Создать персонажа закрытой расы', description: 'Безликие, Неониды, Нарраторы (8000) и т.д.', cost: 8000, type: 'permanent', iconName: 'UserPlus' },
    { id: 'r2', title: 'Благословение Богов', description: 'Временное усиление на 5 дней.', cost: 800, type: 'temporary', iconName: 'ShieldCheck', requiresCharacter: true },
    { id: 'r3', title: 'Появиться в газете', description: 'Увеличьте известность вашего персонажа.', cost: 800, type: 'permanent', iconName: 'ScrollText', requiresCharacter: true },
    { id: 'r4', title: 'Создать дополнительного персонажа', description: 'Если у вас более 6 персонажей.', cost: 300, type: 'permanent', iconName: 'UserPlus' },
    { id: 'r5', title: 'Пользовательские части тела', description: 'Хвосты, крылья, клыки и т.д.', cost: 2000, type: 'permanent', iconName: 'GitBranchPlus', requiresCharacter: true },
    { id: 'r6', title: 'Неприручаемый питомец', description: 'Получите дикое животное в качестве компаньона.', cost: 3000, type: 'permanent', iconName: 'Cat', requiresCharacter: true },
    { id: 'r8', title: 'Связи в преступном мире', description: 'Заведите "друзей" в низших кругах.', cost: 6000, type: 'permanent', iconName: 'KeyRound', requiresCharacter: true },
    { id: 'r9', title: 'Дружба с Левиафаном', description: 'Великий змей не будет атаковать ваши корабли.', cost: 6000, type: 'permanent', iconName: 'HeartHandshake', requiresCharacter: true },
    { id: 'r10', title: 'Купить корабль', description: 'Станьте капитаном морей.', cost: 10000, type: 'permanent', iconName: 'Ship' },
    { id: 'r11', title: 'Купить дирижабль', description: 'Правьте небесами.', cost: 30000, type: 'permanent', iconName: 'Rocket', requiresCharacter: true },
    { id: 'r13', title: 'Приобрести землю', description: 'От аристократии, с титулом или без.', cost: 3000, type: 'permanent', iconName: 'Landmark', requiresCharacter: true },
    { id: 'r14', title: 'Запретная магия', description: 'Изучите магию, недоступную вашей расе.', cost: 8000, type: 'permanent', iconName: 'Sparkles', requiresCharacter: true },
    { id: 'r15', title: 'Арт персонажа от ИИ', description: 'Получите арт вашего персонажа, созданный нейросетью.', cost: 10000, type: 'permanent', iconName: 'BrainCircuit' },
    { id: 'r16', title: 'Создать гильдию', description: 'Основать собственную преступную группу или гильдию.', cost: 50000, type: 'permanent', iconName: 'Building2' },
    { id: 'r17', title: 'Гибридная раса', description: 'Создайте персонажа двух рас.', cost: 150000, type: 'permanent', iconName: 'Combine' },
    { id: 'r18', title: 'Приобрести жену-тыкву', description: 'Уникальная и таинственная награда.', cost: 100000, type: 'permanent', iconName: 'Heart' },
];

export const SKILL_LEVELS: string[] = [
    'Рукожоп', 'Посмешище', 'Дилетант', 'Новичок', 'Ученик', 'Энтузиаст',
    'Любитель', 'Умелец', 'Знаток', 'Специалист', 'Эксперт', 'Мастер',
    'Виртуоз', 'Гуру', 'Магистр', 'Гений'
];

export const FAME_LEVELS: string[] = [
    'Незаметный', 'Неизвестный', 'Непризнанный', 'Заметный в узких кругах',
    'Обсуждаемый соратниками', 'Проверенный', 'Узнаваемый', 'Уважаемый',
    'Почитаемый', 'Известный среди горожан', 'Прославленный среди Высшего Общества',
    'Знаменитый на весь мир', 'Вошедший в историю'
];

export const FAME_LEVELS_POINTS = {
    'Незаметный': 100,
    'Неизвестный': 100,
    'Непризнанный': 100,
    'Заметный в узких кругах': 200,
    'Обсуждаемый соратниками': 300,
    'Проверенный': 400,
    'Узнаваемый': 400,
    'Уважаемый': 400,
    'Почитаемый': 500,
    'Известный среди горожан': 600,
    'Прославленный среди Высшего Общества': 700,
    'Знаменитый на весь мир': 800,
    'Вошедший в историю': 1000,
};

const ALL_FAMILIAR_CARDS_RAW: Omit<FamiliarCard, 'data-ai-hint'>[] = [
    { id: 'fam-c-1', name: 'Анчутка', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197216/%D0%90%D0%BD%D1%87%D1%83%D1%82%D0%BA%D0%B0_hvas2s.png' },
    { id: 'fam-c-2', name: 'Божья тварь', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199171/%D0%91%D0%BE%D0%B6%D1%8C%D1%8F_%D1%82%D0%B2%D0%B0%D1%80%D1%8C_jbwjju.png' },
    { id: 'fam-c-3', name: 'Грызмар', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199418/%D0%93%D1%80%D1%8B%D0%B7%D0%BC%D0%B0%D1%80_siwn1a.png' },
    
    { id: 'fam-r-1', name: 'Артерианская гончая', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197216/%D0%90%D1%80%D1%82%D0%B5%D1%80%D0%B8%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D0%B3%D0%BE%D0%BD%D1%87%D0%B0%D1%8F_jjjx11.png' },
    { id: 'fam-r-2', name: 'Баргест', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197217/%D0%91%D0%B0%D1%80%D0%B3%D0%B5%D1%81%D1%82_nrlebe.png' },
    { id: 'fam-r-3', name: 'Браффа', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199172/%D0%91%D1%80%D0%B0%D1%84%D1%84%D0%B0_rydvub.png' },
    { id: 'fam-r-4', name: 'Грифон', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199173/%D0%93%D1%80%D0%B8%D1%84%D0%BE%D0%BD_iubu5v.png' },

    { id: 'fam-l-1', name: 'Альви', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753194638/%D0%90%D0%BB%D1%8C%D0%B2%D0%B8_ggcs5g.png' },
    { id: 'fam-l-2', name: 'Альдуин', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197206/%D0%90%D0%BB%D1%8C%D0%B4%D1%83%D0%B8%D0%BD_waguju.png' },
    { id: 'fam-l-3', name: 'Артерианский бреллопир', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197217/%D0%90%D1%80%D1%82%D0%B5%D1%80%D0%B8%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9_%D0%B1%D1%80%D0%B5%D0%BB%D0%BB%D0%BE%D0%BF%D0%B8%D1%80_cpo0to.png' },
    { id: 'fam-l-4', name: 'Вивер', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199172/%D0%92%D0%B8%D0%B2%D0%B5%D1%80_osn8es.png' },
    { id: 'fam-l-5', name: 'Громовая птица', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199173/%D0%93%D1%80%D0%BE%D0%BC%D0%BE%D0%B2%D0%B0%D1%8F_%D0%BF%D1%82%D0%B8%D1%86%D0%B0_pjfpkz.png' },
    { id: 'fam-l-6', name: 'Грубас', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199173/%D0%93%D1%80%D1%83%D0%B1%D0%B0%D1%81_rjy1xw.png' },

];


export const EVENT_FAMILIARS_RAW: Omit<FamiliarCard, 'data-ai-hint'>[] = [
    { id: 'fam-e-anubis', name: 'Анубис', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197215/%D0%90%D0%BD%D1%83%D0%B1%D0%B8%D1%81_sqmdss.png' },
];

const addHint = (card: Omit<FamiliarCard, 'data-ai-hint'>): FamiliarCard => {
    let hint = '';
    const lowerCaseName = card.name.toLowerCase();
    if (lowerCaseName.includes('анчутка')) hint = 'imp demon';
    else if (lowerCaseName.includes('артерианская гончая')) hint = 'arterian hound';
    else if (lowerCaseName.includes('альви')) hint = 'elf girl';
    else if (lowerCaseName.includes('альдуин')) hint = 'dragon';
    else if (lowerCaseName.includes('тыквенный')) hint = 'pumpkin monster';
    else if (lowerCaseName.includes('дух рождества')) hint = 'christmas spirit';
    else if (lowerCaseName.includes('анубис')) hint = 'anubis god';
    else if (lowerCaseName.includes('баргест')) hint = 'barghest hound';
    else if (lowerCaseName.includes('артерианский бреллопир')) hint = 'antlered beast';
    else if (lowerCaseName.includes('браффа')) hint = 'fluffy creature';
    else if (lowerCaseName.includes('божья тварь')) hint = 'divine beast';
    else if (lowerCaseName.includes('вивер')) hint = 'wyvern dragon';
    else if (lowerCaseName.includes('грифон')) hint = 'gryphon';
    else if (lowerCaseName.includes('громовая птица')) hint = 'thunderbird';
    else if (lowerCaseName.includes('грубас')) hint = 'fat beast';
    else if (lowerCaseName.includes('грызмар')) hint = 'grizzly monster';
    return { ...card, 'data-ai-hint': hint };
};


export const ALL_FAMILIARS: FamiliarCard[] = ALL_FAMILIAR_CARDS_RAW.map(addHint);
export const EVENT_FAMILIARS: FamiliarCard[] = EVENT_FAMILIARS_RAW.map(addHint);


export const FAMILIARS_BY_ID: Record<string, FamiliarCard> = [...ALL_FAMILIARS, ...EVENT_FAMILIARS].reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
}, {} as Record<string, FamiliarCard>);
