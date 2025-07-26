
import type { Reward, FamiliarCard, Achievement, GameSettings, WealthLevel, BankAccount, CapitalLevel } from './types';
import type { OptionType } from '@/components/ui/multi-select';

// Game Date is now fetched from Firestore. See UserProvider.
// This is a fallback/default value if nothing is in the database.
export const DEFAULT_GAME_SETTINGS: GameSettings = {
    gameDateString: "21 марта 2709 год",
    gameDate: new Date(2709, 2, 21), // Month is 0-indexed (2 = March)
}

export const WEALTH_LEVELS: { name: WealthLevel; salary: Partial<BankAccount>; description: string }[] = [
    { name: 'Нищий', salary: { copper: 10 }, description: '10 мед.' },
    { name: 'Бедный', salary: { silver: 18, copper: 200 }, description: '18 сер., 200 мед.' },
    { name: 'Просветленный', salary: { gold: 1, silver: 40, copper: 300 }, description: '1 зол., 40 сер., 300 мед.' },
    { name: 'Средний', salary: { gold: 10, silver: 60, copper: 500 }, description: '10 зол., 60 сер., 500 мед.' },
    { name: 'Выше среднего', salary: { gold: 20, silver: 100, copper: 1000 }, description: '20 зол., 100 сер., 1000 мед.' },
    { name: 'Высокий', salary: { gold: 35, silver: 200, copper: 1500 }, description: '35 зол., 200 сер., 1500 мед.' },
    { name: 'Сказочно богат', salary: { platinum: 100, gold: 1000, silver: 100, copper: 100 }, description: '100 пл., 1000 зол., 100 сер., 100 мед.' }
];

export const STARTING_CAPITAL_LEVELS: CapitalLevel[] = [
    { name: 'Нищие', amount: { copper: 100 } },
    { name: 'Очень бедные', amount: { silver: 7, copper: 180 } },
    { name: 'Бедные', amount: { gold: 1, silver: 35, copper: 400 } },
    { name: 'Со средним заработком', amount: { gold: 8, silver: 150, copper: 1200 } },
    { name: 'Богатенькие (ремесленники и гильдейские)', amount: { gold: 30, silver: 400, copper: 2500 } },
    { name: 'Богатые (бароны и графы)', amount: { platinum: 50, gold: 150, silver: 1500, copper: 5000 } },
    { name: 'Очень богатые (герцоги и выше)', amount: { platinum: 100, gold: 800, silver: 5000, copper: 15000 } },
    { name: 'Сказочно богат', amount: { platinum: 1000, gold: 10000, silver: 100000, copper: 100000 } }
];


// The 'id' for users now corresponds to the Firebase Auth UID.
// For initial users, these are placeholders. New users created via the app
// will get a real Firebase UID.
export const users: never[] = [];

export const rewards: Reward[] = [
    { id: 'r-race-1', title: 'Закрытая раса (ур. 1)', description: 'Безликие, неониды, нарраторы', cost: 8000, type: 'permanent', iconName: 'UserPlus' },
    { id: 'r-race-2', title: 'Закрытая раса (ур. 2)', description: 'Бракованные пересмешники, скелеты, астролоиды', cost: 10000, type: 'permanent', iconName: 'UserPlus' },
    { id: 'r-race-3', title: 'Закрытая раса (ур. 3)', description: 'Ларимы, антаресы, дарнатиаре и пересмешники', cost: 30000, type: 'permanent', iconName: 'UserPlus' },
    { id: 'r-race-4', title: 'Закрытая раса (ур. 4)', description: 'Жнецы, нетленные', cost: 100000, type: 'permanent', iconName: 'UserPlus' },
    { id: 'r-blessing', title: 'Благословение Богов', description: 'Ваш персонаж временно благословляется одним из Богов*', cost: 800, type: 'temporary', iconName: 'ShieldCheck', requiresCharacter: true },
    { id: 'r-newspaper', title: 'Попасть в газету', description: 'Ваш персонаж попадает в газету и повышает уровень известности', cost: 800, type: 'permanent', iconName: 'ScrollText', requiresCharacter: true },
    { id: 'r-extra-char', title: 'Дополнительный персонаж', description: 'Создание еще одного персонажа, если количество персонажей превысило 6', cost: 1000, type: 'permanent', iconName: 'UserRoundPlus' },
    { id: 'r-body-parts', title: 'Изменение тела', description: 'Приобретение иных конечностей (хвосты, крылья, клыки и пр.), независимо от расы персонажа', cost: 2000, type: 'permanent', iconName: 'GitBranchPlus', requiresCharacter: true },
    { id: 'r-wild-pet', title: 'Неприручаемый питомец', description: 'Неприручаемое животное в качестве питомца', cost: 3000, type: 'permanent', iconName: 'Cat', requiresCharacter: true },
    { id: 'r-crime-connections', title: 'Связи в преступном мире', description: '«Связи» в преступном мире', cost: 6000, type: 'permanent', iconName: 'KeyRound', requiresCharacter: true },
    { id: 'r-leviathan', title: 'Дружба с Левиафаном', description: '«Дружба» с Левиафаном (змей не нападает на ваши судна)', cost: 6000, type: 'permanent', iconName: 'HeartHandshake', requiresCharacter: true },
    { id: 'r-ship', title: 'Покупка судна', description: 'Покупка судна', cost: 10000, type: 'permanent', iconName: 'Ship' },
    { id: 'r-airship', title: 'Покупка дирижабля', description: 'Покупка дирижабля', cost: 30000, type: 'permanent', iconName: 'Rocket', requiresCharacter: true },
    { id: 'r-archmage', title: 'Большой магический резерв', description: 'Создание мага с большим магическим резервом, не зависимо от титула и месторождения (до уровня архимага)', cost: 15000, type: 'permanent', iconName: 'Flame', requiresCharacter: true },
    { id: 'r-court-position', title: 'Высокая должность при дворе', description: 'Получение высокой должности при дворе, независимо от титула и пола персонажа', cost: 7000, type: 'permanent', iconName: 'Crown', requiresCharacter: true },
    { id: 'r-baron', title: 'Титул Барона (+земля)', description: 'Получение титула барона (+земля)', cost: 30000, type: 'permanent', iconName: 'Landmark', requiresCharacter: true },
    { id: 'r-land-titled', title: 'Земля с титулом', description: 'Получение земли от аристократии (титул сэр, леди)', cost: 6000, type: 'permanent', iconName: 'Landmark', requiresCharacter: true },
    { id: 'r-land-no-title', title: 'Земля без титула', description: 'Получение земли от аристократии (без титула, торговля или семейные нужды)', cost: 3000, type: 'permanent', iconName: 'Landmark', requiresCharacter: true },
    { id: 'r-forbidden-magic', title: 'Запретная магия', description: 'Персонаж может владеть видом магии, недоступным для его расы', cost: 8000, type: 'permanent', iconName: 'Sparkles', requiresCharacter: true },
    { id: 'r-extra-doctrine', title: 'Дополнительное учение', description: 'Дополнительное учение', cost: 15000, type: 'permanent', iconName: 'BookPlus', requiresCharacter: true },
    { id: 'r-extra-element', title: 'Дополнительная стихия', description: 'Дополнительная стихия', cost: 50000, type: 'permanent', iconName: 'Waves', requiresCharacter: true },
    { id: 'r-ai-art', title: 'Арт от ИИ', description: 'Арты в нейросети для вашего персонажа', cost: 10000, type: 'permanent', iconName: 'BrainCircuit' },
    { id: 'r-guild', title: 'Собственная гильдия', description: 'Создать собственную преступную группировку/гильдию', cost: 50000, type: 'permanent', iconName: 'Building2' },
    { id: 'r-swap-element', title: 'Обмен стихии на учения', description: 'Поменять 1 стихию на 2 учения', cost: 100, type: 'permanent', iconName: 'Replace', requiresCharacter: true },
    { id: 'r-hybrid', title: 'Полукровка/гибрид', description: 'Полукровка/гибрид из двух рас', cost: 150000, type: 'permanent', iconName: 'Combine' },
    { id: 'r-pumpkin-wife', title: 'Приобрести Тыкво-Жену', description: 'Приобрести Тыкво-Жену', cost: 100000, type: 'permanent', iconName: 'Heart', requiresCharacter: true },
    { id: 'r-pumpkin-husband', title: 'Приобрести Тыкво-Мужа', cost: 100000, type: 'permanent', iconName: 'Heart', requiresCharacter: true },
];

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Automated
  { id: 'ach-first-gacha', name: 'Первый раз?', description: 'Даётся за первое использование рулетки, независимо от того, получили вы дубликат или нет.', iconName: 'Dices' },
  { id: 'ach-mythic-pull', name: 'Мифическое везение', description: 'Выдаётся за получение первого мифического фамильяра, которого нет ни у одного другого игрока.', iconName: 'Sparkles' },
  { id: 'ach-generous', name: 'Меценат', description: 'Даётся игроку, потратившему более 100,000 баллов на награды в магазине. Учитываются только одобренные запросы.', iconName: 'Gem' },
  { id: 'ach-forbes-list', name: 'В списке Forbes', description: 'Выдаётся за попадание в топ-3 таблицы лидеров.', iconName: 'Trophy' },
  { id: 'ach-unique-character', name: 'Владелец уникального персонажа', description: 'Выдаётся за покупку закрытой расы для персонажа. Любой уровень расы засчитывается.', iconName: 'VenetianMask' },
  { id: 'ach-multi-hand', name: 'Многоручка', description: 'Игрок, купивший дополнительного персонажа, когда лимит на бесплатных персонажей исчерпан.', iconName: 'Users' },
  { id: 'ach-tamer', name: 'Укротитель', description: 'Персонаж сумел завести себе неприручаемое в обычных условиях животное в качестве питомца.', iconName: 'Cat' },
  { id: 'ach-mafiosi', name: 'Мафиози', description: 'Даётся персонажу, который приобрёл связи в преступном мире через магазин наград.', iconName: 'KeyRound' },
  { id: 'ach-submariner', name: 'Люблю подводный мир', description: 'Персонажу удалось подружиться с Левиафаном, морским чудовищем, и теперь его суда в безопасности.', iconName: 'Anchor' },
  { id: 'ach-seaman', name: 'Мореход', description: 'Игрок имеет судно в своём распоряжении, приобретённое в магазине наград.', iconName: 'Ship' },
  { id: 'ach-sky-master', name: 'Освоил небо', description: 'Игрок купил дирижабль для собственных нужд, открыв новые горизонты для путешествий.', iconName: 'Rocket' },
  { id: 'ach-big-mage', name: 'Большой, большой!', description: 'Даётся за покупку большого магического резерва.', iconName: 'Flame' },
  { id: 'ach-important-person', name: 'Важный', description: 'Персонаж имеет высокую должность при дворе, независимо от его титула и пола.', iconName: 'Crown' },
  { id: 'ach-baron', name: 'Ваша Милость', description: 'Персонаж заработал титул Барона своим трудом и получил землю в придачу.', iconName: 'ChessKing' },
  { id: 'ach-sir-lady', name: 'Сэр/Леди', description: 'Персонаж получил признание от аристократии и землю вместе с почетным титулом.', iconName: 'Award' },
  { id: 'ach-warlock', name: 'Колдун', description: 'Даётся за получение дополнительной стихии для персонажа, что расширяет его магические возможности.', iconName: 'Waves' },
  { id: 'ach-wizard', name: 'Чародей', description: 'Даётся за получение дополнительного учения для персонажа, углубляя его познания в магии.', iconName: 'BookPlus' },
  { id: 'ach-guildmaster', name: 'Гильдмастер', description: 'Игрок создал собственную преступную группировку или гильдию, став её лидером.', iconName: 'Building2' },
  { id: 'ach-hybrid', name: 'Гибридная полукровка', description: 'Игрок создал персонажа, являющегося полукровкой или гибридом двух рас.', iconName: 'Combine' },
  { id: 'ach-pumpkin-spouse', name: 'Тыкво-Жена', description: 'Обладатель самой прекрасной супруги в мире Триады.', iconName: 'Heart' },
  { id: 'ach-pumpkin-husband', name: 'Тыкво-Муж', description: 'Обладатель самого прекрасного супруга в мире Триады.', iconName: 'Heart' },
  { id: 'ach-exchange-master', name: 'Мастер обмена', description: 'Персонаж обменял одну из своих магических стихий на два учения.', iconName: 'Replace' },
  { id: 'ach-dark-lord', name: 'Тёмный Владыка', description: 'Персонаж получил доступ к запретной магии, недоступной для его расы.', iconName: 'Skull' },
  { id: 'ach-chimera-mancer', name: 'Химеромант', description: 'Персонаж изменил своё тело до неузнаваемости, добавив иные конечности.', iconName: 'GitBranchPlus' },
  { id: 'ach-gods-favorite', name: 'Любимчик Богов', description: 'Даётся за покупку благословения богов.', iconName: 'Heart' },

  // Manual
  { id: 'ach-ruler', name: 'Правитель государства', description: 'Несёт тяжкое бремя правления и ответственности за судьбу всего государства в Триаде.', iconName: 'ShieldCheck' },
  { id: 'ach-august-family', name: 'Из семьи августейших особ', description: 'Связан семейными узами с правителем государства и несёт бремя известности.', iconName: 'Users' },
  { id: 'ach-your-grace', name: 'Ваша Светлость', description: 'Является вторым по важности землевладельцем в государстве, обладая огромным влиянием.', iconName: 'Landmark' },
  { id: 'ach-your-excellency', name: 'Ваше Сиятельство', description: 'Является третьим по важности землевладельцем в государстве, играя ключевую роль в политике.', iconName: 'Landmark' },
  { id: 'ach-event-master', name: 'Мастер ивентов', description: 'Тамада хороший и конкурсы интересные. Даётся за получение ивентового фамильяра.', iconName: 'PartyPopper' },
  { id: 'ach-light-god-watch', name: 'Светлый Бог следит за вами', description: 'Персонаж своими действиями и словами сумел заинтересовать Светлого Бога.', iconName: 'Sun' },
  { id: 'ach-dark-god-watch', name: 'Тёмный Бог следит за вами', description: 'Персонаж своими действиями и словами сумел заинтересовать Тёмного Бога.', iconName: 'Moon' },
  { id: 'ach-unknown-goddess-watch', name: 'Неизвестная Богиня следит за вами', description: 'Персонаж своими действиями и словами сумел заинтересовать Неизвестную Богиню.', iconName: 'Sparkles' },
  { id: 'ach-demigod-watch', name: 'Полубоги заинтересованы в вас', description: 'Персонаж привлёк внимание могущественных полубогов своими деяниями.', iconName: 'Star' },
  { id: 'ach-saturn-watch', name: 'Сатур следит за вашей судьбой', description: 'А ты думаешь, что сможешь скрыться от всевидящего ока папарацци? Не надейся!', iconName: 'Eye' },
  { id: 'ach-newspaper-regular', name: 'Завсегдатай газет', description: 'Персонаж, о котором написали не менее 10 статей в местной газете.', iconName: 'Newspaper' },
  { id: 'ach-landless', name: 'Безземельный', description: 'Он пятый брат вашего троюродного соседа. Беден, но горд!', iconName: 'Home' },
  { id: 'ach-beta-tester', name: 'Бета-тестер', description: 'За активное участие в бета-тестировании системы начисления баллов.', iconName: 'FlaskConical' },
  { id: 'ach-bug-hunter', name: 'Охотник за ошибками', description: 'За нахождение и своевременный репорт критической ошибки или бага в системе.', iconName: 'Bug' },
];

export const ACHIEVEMENTS_BY_ID: Record<string, Achievement> = ALL_ACHIEVEMENTS.reduce((acc, ach) => {
    acc[ach.id] = ach;
    return acc;
}, {} as Record<string, Achievement>);


export const MOODLETS_DATA = {
    'curse': { name: 'Проклятье', description: 'На персонаже лежит проклятье, которое может влиять на его удачу или способности.', iconName: 'Skull' },
    'blessing': { name: 'Благословение', description: 'Персонаж благословлен высшими силами, что может даровать ему временные преимущества.', iconName: 'Sparkles' },
    'light-god-watch': { name: 'Под наблюдением Светлого Бога', description: 'Светлый Бог пристально наблюдает за каждым шагом этого персонажа.', iconName: 'Sun' },
    'dark-god-watch': { name: 'Под наблюдением Тёмного Бога', description: 'Тёмный Бог пристально наблюдает за каждым шагом этого персонажа.', iconName: 'Moon' },
    'goddess-watch': { name: 'Под наблюдением Неизвестной Богини', description: 'Неизвестная Богиня наблюдает за этим персонажем, её мотивы неясны.', iconName: 'MilkyWay' },
    'mafia-target': { name: 'Цель мафии', description: 'Этот персонаж стал целью влиятельной преступной группировки. Опасность на каждом шагу.', iconName: 'Target' },
    'poisoned': { name: 'Отравлен', description: 'Персонаж отравлен и может испытывать негативные эффекты, пока не найдет противоядие.', iconName: 'Biohazard' },
    'love-spell': { name: 'Под любовным зельем', description: 'Персонаж находится под действием любовного приворота, его чувства и решения не принадлежат ему.', iconName: 'Heart' },
    'sick': { name: 'Болеет', description: 'Персонаж страдает от болезни, его состояние может ухудшаться со временем.', iconName: 'Thermometer' },
    'wanted': { name: 'В розыске', description: 'За поимку этого персонажа назначена награда, и охотники уже идут по его следу.', iconName: 'Handcuffs' },
    'death-mark': { name: 'Метка смерти', description: 'На персонажа наложена метка, предвещающая скорую и неотвратимую гибель.', iconName: 'Crosshair' },
    'family-protection': { name: 'Под защитой рода', description: 'Персонаж находится под защитой своего могущественного рода или семьи.', iconName: 'Shield' },
    'on-trial': { name: 'На испытании', description: 'Персонаж проходит важное испытание или проверку, от которой зависит его будущее.', iconName: 'Scaling' },
    'observed': { name: 'Наблюдаемый', description: 'За персонажем кто-то или что-то пристально наблюдает, оставаясь в тени.', iconName: 'Eye' },
    'secret-keeper': { name: 'Носитель тайны', description: 'Персонаж хранит важную и опасную тайну, которая может изменить мир.', iconName: 'Key' },
    'chosen-one': { name: 'Избранник', description: 'Персонаж был избран для великой цели или судьбы, хочет он того или нет.', iconName: 'Award' },
    'double-agent': { name: 'Двойной агент', description: 'Персонаж тайно работает на две или более стороны, рискуя быть раскрытым в любой момент.', iconName: 'Spy' },
    'prophecy-puppet': { name: 'Марионетка пророчества', description: 'Действия персонажа предопределены древним пророчеством, и он не в силах изменить свою судьбу.', iconName: 'Bot' },
    'soul-bond': { name: 'Связь с другой душой', description: 'Душа персонажа связана с другой душой, разделяя чувства, боль или даже судьбу.', iconName: 'Link' },
};


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

export const TRAINING_OPTIONS: OptionType[] = [
    { value: 'peasant_school', label: 'Крестьянская школа' },
    { value: 'noble_guesthouse', label: 'Пансион благородных девиц' },
    { value: 'knightly_training', label: 'Рыцарское обучение' },
    { value: 'mentor', label: 'Наставник' },
    { value: 'self_taught', label: 'Самообучение' },
    { value: 'military_school', label: 'Военная школа' },
    { value: 'navy_academy', label: 'Школа/Академия военно-морского флота' },
    { value: 'kozhemyaka_vocational', label: 'Ремесленное училище имени Кожемяки' },
    { value: 'trade_school', label: 'Торговое училище' },
    { value: 'many_faces_school', label: 'Училище Многоликих' },
    { value: 'magitech_construction_school', label: 'Училище магомеханики и строительства' },
    { value: 'fine_arts_school', label: 'Училище художественных искусств' },
    { value: 'culinary_school', label: 'Училище кулинарии' },
    { value: 'tech_design_school', label: 'Училище технологий и дизайна' },
    { value: 'medical_school', label: 'Медицинское училище' },
    { value: 'agricultural_school', label: 'Аграрное училище' },
    { value: 'spiritual_school', label: 'Духовное училище' },
    { value: 'dark_dreams_bordello', label: 'Бордель "Тёмные грёзы"' },
    { value: 'mind_management_school', label: 'Училище «Разум и управление»' },
    { value: 'ritual_burial_school', label: 'Ритуально-погребальное училище' },
    { value: 'geology_land_management_school', label: 'Училище геологии и землеустройства' },
    { value: 'light_god_academy', label: 'Академия имени Светлого Бога.' },
    { value: 'dark_god_academy', label: 'Академия имени Тёмного Бога' },
    { value: 'central_magic_academy', label: 'Центральная академия магов, ведьм и чародеев' },
];


const ALL_FAMILIAR_CARDS_RAW: Omit<FamiliarCard, 'data-ai-hint'>[] = [
    { id: 'fam-c-1', name: 'Анчутка', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197216/%D0%90%D0%BD%D1%87%D1%83%D1%82%D0%BA%D0%B0_hvas2s.png' },
    { id: 'fam-c-2', name: 'Божья тварь', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199171/%D0%91%D0%BE%D0%B6%D1%8C%D1%8F_%D1%82%D0%B2%D0%B0%D1%80%D1%8C_jbwjju.png' },
    { id: 'fam-c-3', name: 'Грызмар', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199418/%D0%93%D1%80%D1%8B%D0%B7%D0%BC%D0%B0%D1%80_siwn1a.png' },
    { id: 'fam-c-4', name: 'Золотце', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199420/%D0%97%D0%BE%D0%BB%D0%BE%D1%82%D1%86%D0%B5_kgu8ni.png'},
    { id: 'fam-c-lynx', name: 'Ледяная рысь', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199430/%D0%9B%D0%B5%D0%B4%D1%8F%D0%BD%D0%B0%D1%8F_%D1%80%D1%8B%D1%81%D1%8C_ziosz3.png' },
    { id: 'fam-c-ognemur', name: 'Огнемур', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199457/%D0%9E%D0%B3%D0%BD%D0%B5%D0%BC%D1%83%D1%80_dwnqqi.png' },
    { id: 'fam-c-pchelokot', name: 'Пчелокот', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199460/%D0%9F%D1%87%D0%B5%D0%BB%D0%BE%D0%BA%D0%BE%D1%82_hd1kqs.png' },
    { id: 'fam-c-sofil', name: 'Софил', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199463/%D0%A1%D0%BE%D1%84%D0%B8%D0%BB_yvixpo.png' },
    { id: 'fam-c-shvepsel', name: 'Швепсель', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199468/%D0%A8%D0%B2%D0%B5%D0%BF%D1%81%D0%B5%D0%BB%D1%8C_a33agc.png' },
    { id: 'fam-c-shorek', name: 'Шорёк', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199469/%D0%A8%D0%BE%D1%80%D1%91%D0%BA_j0t14o.png' },
    { id: 'fam-c-serissa', name: 'Серисса', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282462/7_j6wlza.jpg' },
    { id: 'fam-c-night-owl', name: 'Ночной сыч', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282462/3_lofskw.jpg' },
    { id: 'fam-c-bull-zebra', name: 'Быкозёбр', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282463/2_ir7ou5.jpg' },
    { id: 'fam-c-fire-fox', name: 'Огненная лисица', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282463/4_gjeocq.jpg' },
    { id: 'fam-c-clown-shark', name: 'Клоуарк', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282463/8_v81pvt.jpg' },
    { id: 'fam-c-deep-cutter', name: 'Глуборез', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282464/5_br9xrp.jpg' },
    { id: 'fam-c-fire-lizard', name: 'Огнеящер', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282464/6_ddn5jx.jpg' },
    { id: 'fam-c-owl-rat', name: 'Совурат', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282464/10_e6mtr6.jpg' },
    { id: 'fam-c-merinag', name: 'Меринаг', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282465/14_itfd7p.jpg' },
    { id: 'fam-c-krokun', name: 'Крокун', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282469/15_uefxmb.jpg' },
    { id: 'fam-c-leniko', name: 'Ленико', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282470/16_xanfvi.jpg' },
    { id: 'fam-c-krilopotam', name: 'Крылопотам', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282497/17_ipkhgy.jpg' },
    { id: 'fam-c-orkalen', name: 'Оркалень', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283333/18_gg2qyb.jpg' },
    { id: 'fam-c-medopus', name: 'Медопус', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283957/20_gmyek1.jpg' },
    { id: 'fam-c-varassas', name: 'Варассас', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283957/21_gvut5b.jpg' },
    { id: 'fam-c-kirafa', name: 'Кирафа', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283957/22_nxpyjq.jpg' },
    { id: 'fam-c-lotl', name: 'Лотль', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283963/30_gvu6ut.jpg' },
    { id: 'fam-c-oligr', name: 'Олигр', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283963/32_kvfdjr.jpg' },
    { id: 'fam-c-pupurita', name: 'Пупурита', rank: 'обычный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283963/31_zhlagq.jpg' },


    { id: 'fam-r-1', name: 'Артерианская гончая', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197216/%D0%90%D1%80%D1%82%D0%B5%D1%80%D0%B8%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D0%B3%D0%BE%D0%BD%D1%87%D0%B0%D1%8F_jjjx11.png' },
    { id: 'fam-r-2', name: 'Баргест', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197217/%D0%91%D0%B0%D1%80%D0%B3%D0%B5%D1%81%D1%82_nrlebe.png' },
    { id: 'fam-r-3', name: 'Браффа', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199172/%D0%91%D1%80%D0%B0%D1%84%D1%84%D0%B0_rydvub.png' },
    { id: 'fam-r-4', name: 'Грифон', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199173/%D0%93%D1%80%D0%B8%D1%84%D0%BE%D0%BD_iubu5v.png' },
    { id: 'fam-r-5', name: 'Зеленоградская гончая', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199419/%D0%97%D0%B5%D0%BB%D0%B5%D0%BD%D0%BE%D0%B3%D1%80%D0%B0%D0%B4%D1%81%D0%BA%D0%B0%D1%8F_%D0%B3%D0%BE%D0%BD%D1%87%D0%B0%D1%8F_oipvbr.png'},
    { id: 'fam-r-6', name: 'Златоуст', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199419/%D0%97%D0%BB%D0%B0%D1%82%D0%BE%D1%83%D1%81%D1%82_ljhotw.png'},
    { id: 'fam-r-wolves', name: 'Лёдинова и Огнова', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199428/%D0%9B%D1%91%D0%B4%D0%B8%D0%BD%D0%BE%D0%B2%D0%B0_%D0%B8_%D0%9E%D0%B3%D0%BD%D0%BE%D0%B2%D0%B0_ncfytg.png' },
    { id: 'fam-r-foxsquirrel', name: 'Лисобелка', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199430/%D0%9B%D0%B8%D1%81%D0%BE%D0%B1%D0%B5%D0%BB%D0%BA%D0%B0_xd2wz5.png' },
    { id: 'fam-r-firehound', name: 'Огнеславская гончая', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199458/%D0%9E%D0%B3%D0%BD%D0%B5%D1%81%D0%BB%D0%B0%D0%B2%D1%81%D0%BA%D0%B0%D1%8F_%D0%B3%D0%BE%D0%BD%D1%87%D0%B0%D1%8F_deofmm.png' },
    { id: 'fam-r-remoh', name: 'Ремох', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199461/%D0%A0%D0%B5%D0%BC%D0%BE%D1%85_fk06lc.png' },
    { id: 'fam-r-savokl', name: 'Савокль', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199462/%D0%A1%D0%B0%D0%B2%D0%BE%D0%BA%D0%BB%D1%8C_jaqcy9.png' },
    { id: 'fam-r-tykvohodka', name: 'Тыквоходка', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199464/%D0%A2%D1%8B%D0%BA%D0%B2%D0%BE%D1%85%D0%BE%D0%B4%D0%BA%D0%B0_bopaqu.png' },
    { id: 'fam-r-eikthyrnir', name: 'Эйктюрнир', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199470/%D1%8d%D0%B9%D0%BA%D1%82%D1%8E%D1%80%D0%BD%D0%B8%D1%80_n9hfrv.png' },
    { id: 'fam-r-elephwal', name: 'Элефваль', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282464/9_zqunlp.jpg' },
    { id: 'fam-r-griffondeer', name: 'Грифолень', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282464/11_lz5ro1.jpg' },
    { id: 'fam-r-drakoskorpius', name: 'Дракоскорпиус', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282465/12_ptw4qg.jpg' },
    { id: 'fam-r-skorgus', name: 'Скоргус', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282465/13_rknyfp.jpg' },
    { id: 'fam-r-lunoria', name: 'Лунория', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283958/25_btigbh.jpg' },
    { id: 'fam-r-fenortul', name: 'Фенортул', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283958/24_lftev7.jpg' },
    { id: 'fam-r-kitsuda', name: 'Кицуда', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283958/23_mur51x.jpg' },
    { id: 'fam-r-zevrogrif', name: 'Зеврогриф', rank: 'редкий', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283958/26_zul5wi.jpg' },


    { id: 'fam-l-1', name: 'Альви', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753194638/%D0%90%D0%BB%D1%8C%D0%B2%D0%B8_ggcs5g.png' },
    { id: 'fam-l-2', name: 'Альдуин', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197206/%D0%90%D0%BB%D1%8C%D0%B4%D1%83%D0%B8%D0%BD_waguju.png' },
    { id: 'fam-l-3', name: 'Артерианский бреллопир', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197217/%D0%90%D1%80%D1%82%D0%B5%D1%80%D0%B8%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9_%D0%B1%D1%80%D0%B5%D0%BB%D0%BB%D0%BE%D0%BF%D0%B8%D1%80_cpo0to.png' },
    { id: 'fam-l-4', name: 'Вивер', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199172/%D0%92%D0%B8%D0%B2%D0%B5%D1%80_osn8es.png' },
    { id: 'fam-l-5', name: 'Громовая птица', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199173/%D0%93%D1%80%D0%BE%D0%BC%D0%BE%D0%B2%D0%B0%D1%8F_%D0%BF%D1%82%D0%B8%D1%86%D0%B0_pjfpkz.png' },
    { id: 'fam-l-6', name: 'Грубас', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199173/%D0%93%D1%80%D1%83%D0%B1%D0%B0%D1%81_rjy1xw.png' },
    { id: 'fam-l-7', name: 'Единорог', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199418/%D0%95%D0%B4%D0%B8%D0%BD%D0%BE%D1%80%D0%BE%D0%B3_lfznrp.png'},
    { id: 'fam-l-8', name: 'Енот-некромант', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199419/%D0%95%D0%BD%D0%BE%D1%82-%D0%BD%D0%B5%D0%BA%D1%80%D0%BE%D0%BC%D0%B0%D0%BD%D1%82_rgq78b.png'},
    { id: 'fam-l-9', name: 'Зеленоградский бреллопир', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199420/%D0%97%D0%B5%D0%BB%D0%B5%D0%BD%D0%BE%D0%B3%D1%80%D0%B0%D0%B4%D1%81%D0%BA%D0%B8%D0%B9_%D0%B1%D1%80%D0%B5%D0%BB%D0%BB%D0%BE%D0%BF%D0%B8%D1%80_zoclho.png'},
    { id: 'fam-l-10', name: 'Келпи', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199421/%D0%9A%D0%B5%D0%BB%D0%BF%D0%B8_diw7xi.png'},
    { id: 'fam-l-11', name: 'Комаину', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199423/%D0%9A%D0%BE%D0%BC%D0%B0%D0%B8%D0%BD%D1%83_xamanx.png'},
    { id: 'fam-l-ognekus', name: 'Огнекус', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199456/%D0%9E%D0%B3%D0%BD%D0%B5%D0%BA%D1%83%D1%81_uwn6tt.png' },
    { id: 'fam-l-panzerflot', name: 'Панцефлот', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199459/%D0%9F%D0%B0%D0%BD%D1%86%D0%B5%D1%84%D0%BB%D0%BE%D1%82_x9yat1.png' },
    { id: 'fam-l-pegasus', name: 'Пегас', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199460/%D0%9F%D0%B5%D0%B3%D0%B0%D1%81_rp9fje.png' },
    { id: 'fam-l-serpopard', name: 'Серпопард', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199463/%D0%A1%D0%B5%D1%80%D0%BF%D0%BE%D0%BF%D0%B0%D1%80%D0%B4_ohokso.png' },
    { id: 'fam-l-faifi', name: 'Файфи', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199465/%D0%A4%D0%B0%D0%B9%D1%84%D0%B8_bdh1ww.png' },
    { id: 'fam-l-crystal-alicorn', name: 'Хрустальный Аликорн', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199467/%D1%85%D1%80%D1%83%D1%81%D1%82%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9_%D0%B0%D0%BB%D0%B8%D0%BA%D0%BE%D1%80%D0%BD_e8p30d.png' },
    { id: 'fam-l-chupacabra', name: 'Чупакабра', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199468/%D0%A7%D1%83%D0%BF%D0%B0%D0%BA%D0%B0%D0%B1%D1%80%D0%B0_cxkyus.png' },
    { id: 'fam-l-dark-elemental', name: 'Элементаль тьмы', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199471/%D0%AD%D0%BB%D0%B5%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BB%D1%8C_%D1%82%D1%8C%D0%BC%D1%8B_wvqmoe.png' },
    { id: 'fam-l-vioraksi', name: 'Виоракси', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283958/27_saolre.jpg' },
    { id: 'fam-l-ognennogriv', name: 'Огненногрив', rank: 'легендарный', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283960/28_pibahj.jpg' },


    { id: 'fam-m-1', name: 'Кирин', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199422/%D0%9A%D0%B8%D1%80%D0%B8%D0%BD_qpmqz5.png'},
    { id: 'fam-m-2', name: 'Кракен', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199426/%D0%9A%D1%80%D0%B0%D0%BA%D0%B5%D0%BD_yzn9xt.png'},
    { id: 'fam-m-icemare', name: 'Ледяная кобыла', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199430/%D0%9B%D0%B5%D0%B4%D1%8F%D0%BD%D0%B0%D1%8F_%D0%BA%D0%BE%D0%B1%D1%8B%D0%BB%D0%B0_q5cqyz.png' },
    { id: 'fam-m-mairi', name: 'Майри Кото', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199431/%D0%9C%D0%B0%D0%B9%D1%80%D0%B8-%D0%9A%D0%BE%D1%82%D0%BE_eyspjs.png' },
    { id: 'fam-m-nightmare', name: 'Найтмар', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199455/%D0%BD%D0%B0%D0%B9%D1%82%D0%BC%D0%B0%D1%80_axauir.png' },
    { id: 'fam-m-skywhale', name: 'Небесный кит', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199456/%D0%9D%D0%B5%D0%B1%D0%B5%D1%81%D0%BD%D1%8B%D0%B9_%D1%81%D0%BA%D0%B0%D1%82_yuvpwb.png' },
    { id: 'fam-m-flower-cat', name: 'Цветокот', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753282462/1_xcq8ff.jpg' },
    { id: 'fam-m-paukok', name: 'Паукок', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283956/19_swxogi.jpg' },
    { id: 'fam-m-ksanteal', name: 'Ксантеаль', rank: 'мифический', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753283962/29_kqkt58.jpg' },

];


export const EVENT_FAMILIARS_RAW: Omit<FamiliarCard, 'data-ai-hint'>[] = [
    { id: 'fam-e-anubis', name: 'Анубис', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753197215/%D0%90%D0%BD%D1%83%D0%B1%D0%B8%D1%81_sqmdss.png' },
    { id: 'fam-e-zhut', name: 'Жуть', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199419/%D0%96%D1%83%D1%82%D1%8C_hmausj.png'},
    { id: 'fam-e-blues', name: 'Колодезный дух Блюз', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199422/%D0%9A%D0%BE%D0%BB%D0%BE%D0%B4%D0%B5%D0%B7%D0%BD%D1%8B%D0%B9_%D0%B4%D1%83%D1%85_%D0%91%D0%BB%D1%8E%D0%B7_c9d8nc.png'},
    { id: 'fam-e-bone-crow', name: 'Костяная ворона', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199424/%D0%9A%D0%BE%D1%81%D1%82%D1%8F%D0%BD%D0%B0%D1%8F_%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0_u9vlpc.png'},
    { id: 'fam-e-bone-dog', name: 'Костяная собака', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199424/%D0%9A%D0%BE%D1%81%D1%82%D1%8F%D0%BD%D0%B0%D1%8F_%D1%81%D0%BE%D0%B1%D0%B0%D0%BA%D0%B0_cmdjk6.png'},
    { id: 'fam-e-bone-cat', name: 'Костяной кот', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199425/%D0%9A%D0%BE%D1%81%D1%82%D1%8F%D0%BD%D0%BE%D0%B9_%D0%BA%D0%BE%D1%82_hr2gmk.png'},
    { id: 'fam-e-leviathan', name: 'Левиафан', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199426/%D0%BB%D0%B5%D0%B2%D0%B8%D0%B0%D1%84%D0%B0%D0%BD_hr6tat.png' },
    { id: 'fam-e-ariana', name: 'Леди Ариана', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199427/%D0%9B%D0%B5%D0%B4%D0%B8_%D0%90%D1%80%D0%B8%D0%B0%D0%BD%D0%B0_w15swi.png' },
    { id: 'fam-e-cerberus', name: 'Цербер', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753199467/%D0%A6%D0%B5%D1%80%D0%B1%D0%B5%D1%80_rznwpc.png' },
    { id: 'fam-e-sherlas', name: 'Шерлас', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753272049/2131541243_sci3mx.jpg' },
    { id: 'fam-e-anhel', name: 'Анхель', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753272049/123123_oljkkn.jpg' },
    { id: 'fam-e-faust', name: 'Фауст', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753272049/312312412341_kl5exi.jpg' },
    { id: 'fam-e-pumpkin-wife', name: 'Тыкво-жена', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753276855/%D0%9A%D0%B0%D1%80%D1%82%D0%BE%D1%87%D0%BA%D0%B8%D0%9A%D0%9A%D0%98_sqv5if.png' },
    { id: 'fam-e-pumpkin-husband', name: 'Тыкво-муж', rank: 'ивентовый', imageUrl: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753286999/%D0%A2%D1%8B%D0%BA%D0%B2%D0%BE%D0%BC%D1%83%D0%B6_v9bpsg.png' },
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
    else if (lowerCaseName.includes('единорог')) hint = 'unicorn';
    else if (lowerCaseName.includes('енот-некромант')) hint = 'raccoon necromancer';
    else if (lowerCaseName.includes('зеленоградская гончая')) hint = 'green hound';
    else if (lowerCaseName.includes('жуть')) hint = 'terror beast';
    else if (lowerCaseName.includes('златоуст')) hint = 'golden dragon';
    else if (lowerCaseName.includes('золотце')) hint = 'golden creature';
    else if (lowerCaseName.includes('зеленоградский бреллопир')) hint = 'green antlered';
    else if (lowerCaseName.includes('келпи')) hint = 'kelpie horse';
    else if (lowerCaseName.includes('кирин')) hint = 'qilin beast';
    else if (lowerCaseName.includes('блюз')) hint = 'well spirit';
    else if (lowerCaseName.includes('комаину')) hint = 'komainu lion';
    else if (lowerCaseName.includes('костяная ворона')) hint = 'bone crow';
    else if (lowerCaseName.includes('костяная собака')) hint = 'bone dog';
    else if (lowerCaseName.includes('костяной кот')) hint = 'bone cat';
    else if (lowerCaseName.includes('кракен')) hint = 'kraken monster';
    else if (lowerCaseName.includes('левиафан')) hint = 'leviathan sea monster';
    else if (lowerCaseName.includes('леди ариана')) hint = 'lady ariana';
    else if (lowerCaseName.includes('лёдинова и огнова')) hint = 'ice fire wolves';
    else if (lowerCaseName.includes('ледяная кобыла')) hint = 'ice mare';
    else if (lowerCaseName.includes('ледяная рысь')) hint = 'ice lynx';
    else if (lowerCaseName.includes('лисобелка')) hint = 'fox squirrel';
    else if (lowerCaseName.includes('майри кото')) hint = 'mairi koto';
    else if (lowerCaseName.includes('найтмар')) hint = 'nightmare horse';
    else if (lowerCaseName.includes('небесный кит')) hint = 'sky whale';
    else if (lowerCaseName.includes('огнекус')) hint = 'fire biter';
    else if (lowerCaseName.includes('огнемур')) hint = 'fire lemur';
    else if (lowerCaseName.includes('огнеславская гончая')) hint = 'fire hound';
    else if (lowerCaseName.includes('панцефлот')) hint = 'armored fleet';
    else if (lowerCaseName.includes('пегас')) hint = 'pegasus';
    else if (lowerCaseName.includes('пчелокот')) hint = 'bee cat';
    else if (lowerCaseName.includes('ремох')) hint = 'remoh monster';
    else if (lowerCaseName.includes('савокль')) hint = 'owl creature';
    else if (lowerCaseName.includes('серпопард')) hint = 'sickle leopard';
    else if (lowerCaseName.includes('софил')) hint = 'sofil creature';
    else if (lowerCaseName.includes('тыквоходка')) hint = 'pumpkin walker';
    else if (lowerCaseName.includes('файфи')) hint = 'faifi creature';
    else if (lowerCaseName.includes('цербер')) hint = 'cerberus hound';
    else if (lowerCaseName.includes('хрустальный аликорн')) hint = 'crystal alicorn';
    else if (lowerCaseName.includes('чупакабра')) hint = 'chupacabra';
    else if (lowerCaseName.includes('швепсель')) hint = 'shvepsel creature';
    else if (lowerCaseName.includes('шорёк')) hint = 'shorek creature';
    else if (lowerCaseName.includes('эйктюрнир')) hint = 'eikthyrnir deer';
    else if (lowerCaseName.includes('элементаль тьмы')) hint = 'dark elemental';
    else if (lowerCaseName.includes('шерлас')) hint = 'sherlas portrait';
    else if (lowerCaseName.includes('анхель')) hint = 'anhel portrait';
    else if (lowerCaseName.includes('фауст')) hint = 'faust portrait';
    else if (lowerCaseName.includes('тыкво-жена')) hint = 'pumpkin wife';
    else if (lowerCaseName.includes('тыкво-муж')) hint = 'pumpkin husband';
    else if (lowerCaseName.includes('цветокот')) hint = 'flower cat';
    else if (lowerCaseName.includes('серисса')) hint = 'serissa creature';
    else if (lowerCaseName.includes('ночной сыч')) hint = 'night owl';
    else if (lowerCaseName.includes('быкозёбр')) hint = 'bull zebra';
    else if (lowerCaseName.includes('огненная лисица')) hint = 'fire fox';
    else if (lowerCaseName.includes('клоуарк')) hint = 'clown shark';
    else if (lowerCaseName.includes('глуборез')) hint = 'deep cutter';
    else if (lowerCaseName.includes('элефваль')) hint = 'elephwal creature';
    else if (lowerCaseName.includes('огнеящер')) hint = 'fire lizard';
    else if (lowerCaseName.includes('грифолень')) hint = 'griffon deer';
    else if (lowerCaseName.includes('совурат')) hint = 'owl rat';
    else if (lowerCaseName.includes('дракоскорпиус')) hint = 'dragon scorpion';
    else if (lowerCaseName.includes('меринаг')) hint = 'merinag creature';
    else if (lowerCaseName.includes('скоргус')) hint = 'skorgus creature';
    else if (lowerCaseName.includes('крокун')) hint = 'krokun creature';
    else if (lowerCaseName.includes('ленико')) hint = 'leniko creature';
    else if (lowerCaseName.includes('крылопотам')) hint = 'winged hippo';
    else if (lowerCaseName.includes('оркалень')) hint = 'orca deer';
    else if (lowerCaseName.includes('паукок')) hint = 'peacock spider';
    else if (lowerCaseName.includes('медопус')) hint = 'honey octopus';
    else if (lowerCaseName.includes('варассас')) hint = 'varassas creature';
    else if (lowerCaseName.includes('кирафа')) hint = 'kirafa creature';
    else if (lowerCaseName.includes('лунория')) hint = 'lunoria creature';
    else if (lowerCaseName.includes('фенортул')) hint = 'fenortul creature';
    else if (lowerCaseName.includes('кицуда')) hint = 'kitsuda creature';
    else if (lowerCaseName.includes('зеврогриф')) hint = 'zebrogriff';
    else if (lowerCaseName.includes('виоракси')) hint = 'vioraxi';
    else if (lowerCaseName.includes('огненногрив')) hint = 'firemane';
    else if (lowerCaseName.includes('ксантеаль')) hint = 'xantheal';
    else if (lowerCaseName.includes('лотль')) hint = 'lotl';
    else if (lowerCaseName.includes('олигр')) hint = 'oligr';
    else if (lowerCaseName.includes('пупурита')) hint = 'pupurita';
    return { ...card, 'data-ai-hint': hint };
};


export const ALL_FAMILIARS: FamiliarCard[] = ALL_FAMILIAR_CARDS_RAW.map(addHint);
export const EVENT_FAMILIARS: FamiliarCard[] = EVENT_FAMILIARS_RAW.map(addHint);


export const FAMILIARS_BY_ID: Record<string, FamiliarCard> = [...ALL_FAMILIARS, ...EVENT_FAMILIARS].reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
}, {} as Record<string, FamiliarCard>);

    
