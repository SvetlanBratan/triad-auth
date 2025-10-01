import type { Potion, AlchemyIngredient } from './types';

export const POTIONS_LIST: Potion[] = [
    {
        id: 'potion-small-heal',
        name: 'Малое зелье лечения',
        tier: 'обычный',
        effects: [{ stat: 'hp', value: 25 }],
        note: 'Простое зелье, восстанавливающее немного здоровья.',
        image: 'https://i.postimg.cc/P5g1xG3G/image.png',
    },
    {
        id: 'potion-medium-heal',
        name: 'Среднее зелье лечения',
        tier: 'редкий',
        effects: [{ stat: 'hp', value: 100 }],
        note: 'Более мощное зелье для серьезных ран.',
        image: 'https://i.postimg.cc/P5g1xG3G/image.png',
    },
];

export const INGREDIENTS_LIST: AlchemyIngredient[] = [
    {
        id: 'ing-flower-fire',
        name: 'Огненный цветок',
        tags: ['растение', 'огонь'],
        image: 'https://i.postimg.cc/PqGy27G8/image.png',
    },
    {
        id: 'ing-crystal-water',
        name: 'Водный кристалл',
        tags: ['минерал', 'вода'],
        image: 'https://i.postimg.cc/J0RYGNzB/image.png',
    },
    {
        id: 'ing-herb-mountain',
        name: 'Горная трава',
        tags: ['растение', 'земля'],
        image: 'https://i.postimg.cc/y8YJpMWR/image.png',
    },
];
