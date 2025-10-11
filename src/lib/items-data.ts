import type { Potion, AlchemyIngredient } from "./types";

export const POTIONS_LIST: Potion[] = [
    {
        id: 'potion-minor-healing',
        name: 'Малое зелье лечения',
        note: 'Слабое зелье, восстанавливающее небольшое количество здоровья.',
        effects: [{ stat: 'hp', value: 25 }],
        tier: 'обычный',
        image: 'https://i.postimg.cc/9M3R0zB5/image.png'
    },
    {
        id: 'potion-medium-healing',
        name: 'Среднее зелье лечения',
        note: 'Более сильное зелье, восстанавливающее значительное количество здоровья.',
        effects: [{ stat: 'hp', value: 75 }],
        tier: 'обычный',
        image: 'https://i.postimg.cc/9M3R0zB5/image.png'
    },
    {
        id: 'potion-greater-healing',
        name: 'Большое зелье лечения',
        note: 'Очень мощное зелье, способное почти полностью восстановить здоровье.',
        effects: [{ stat: 'hp', value: 150 }],
        tier: 'редкий',
        image: 'https://i.postimg.cc/9M3R0zB5/image.png'
    },
    {
        id: 'potion-minor-mana',
        name: 'Малое зелье маны',
        note: 'Слабое зелье, восстанавливающее небольшое количество маны.',
        effects: [{ stat: 'mana', value: 25 }],
        tier: 'обычный',
        image: 'https://i.postimg.cc/0j3SkK1R/image.png'
    },
    {
        id: 'potion-luck',
        name: 'Зелье удачи',
        note: 'Временно повышает удачу выпившего.',
        effects: [{ stat: 'luck', value: 10, durationSec: 3600 }],
        tier: 'редкий',
        image: 'https://i.postimg.cc/44D3vDkS/image.png'
    },
     {
        id: 'potion-anti-cold',
        name: 'Антипростудное зелье «Вылечись сегодня»',
        note: 'Быстро излечивает от обычной простуды.',
        effects: [],
        tier: 'обычный',
        image: 'https://i.postimg.cc/0j3SkK1R/image.png'
    },
];

export const INGREDIENTS_LIST: AlchemyIngredient[] = [
    { id: 'ing-spring-water', name: 'Родниковая вода', note: 'Чистейшая вода из горного источника.', tags: ['вода', 'основа'], image: 'https://i.postimg.cc/L6s81xJ9/image.png' },
    { id: 'ing-mountain-flower', name: 'Горный цветок', note: 'Редкий цветок с лечебными свойствами.', tags: ['трава', 'лечение'], image: 'https://i.postimg.cc/Hxb4V1pX/image.png' },
    { id: 'ing-fire-salt', name: 'Огненная соль', note: 'Кристаллы соли, которые тлеют при контакте с воздухом.', tags: ['минерал', 'огонь'], image: 'https://i.postimg.cc/J0P7sF6C/image.png' },
    { id: 'ing-mandrake-root', name: 'Корень мандрагоры', note: 'Корень, издающий крик, когда его вырывают.', tags: ['корень', 'магия'], image: 'https://i.postimg.cc/3N1xW0pY/image.png' },
    { id: 'ing-glowing-mushroom', name: 'Светящийся гриб', note: 'Гриб, испускающий тусклый свет. Часто используется для зелий маны.', tags: ['гриб', 'магия'], image: 'https://i.postimg.cc/k5hF8L4S/image.png' },
    { id: 'ing-troll-blood', name: 'Кровь тролля', note: 'Обладает мощными регенеративными свойствами.', tags: ['животное', 'регенерация'], image: 'https://i.postimg.cc/B6qK7HwZ/image.png' },
    { id: 'ing-phoenix-feather', name: 'Перо феникса', note: 'Перо мифической птицы, наполненное жизненной силой.', tags: ['мифический', 'жизнь'], image: 'https://i.postimg.cc/3JjDq30J/image.png' },
    { id: 'ing-dragon-scale', name: 'Чешуя дракона', note: 'Невероятно прочная чешуя, используемая в защитных зельях.', tags: ['мифический', 'защита'], image: 'https://i.postimg.cc/brY4M0M1/image.png' },
    { id: 'ing-sage-leaves', name: 'Листья шалфея', note: 'Ароматные листья, часто используемые в очищающих зельях.', tags: ['трава', 'очищение'], image: 'https://i.postimg.cc/6p2sYwBY/sage-leaves.png' },
    { id: 'ing-forest-mint', name: 'Мята лесная', note: 'Освежающая мята с легким магическим оттенком.', tags: ['трава', 'охлаждение'], image: 'https://i.postimg.cc/wMKD2R5P/forest-mint.png' },
    { id: 'ing-ginger-root', name: 'Корень имбиря', note: 'Жгучий корень, добавляющий зельям согревающий эффект.', tags: ['корень', 'огонь'], image: 'https://i.postimg.cc/NfG4hM9W/ginger-root.png' },
    { id: 'ing-pure-spring-water', name: 'Вода из чистого источника', note: 'Основа для многих зелий.', tags: ['вода', 'основа'], image: 'https://i.postimg.cc/L6s81xJ9/image.png' },
];
