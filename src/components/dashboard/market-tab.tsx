
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const shops = [
  {
    title: "Магазинчик зелий 'Ликорис'",
    description: "Уютная лавка, где воздух пропитан ароматами сушеных трав и магических эссенций. Здесь можно найти зелья на любой случай жизни.",
    image: "https://placehold.co/600x400.png",
    aiHint: "potion shop"
  },
  {
    title: "Портной-башмачник 'Павло'",
    description: "Мастерская, где пахнет кожей и свежей тканью. Павло может сшить как прочную походную одежду, так и роскошный бальный наряд.",
    image: "https://placehold.co/600x400.png",
    aiHint: "tailor workshop"
  },
  {
    title: "Бар 'Три саламандры'",
    description: "Полумрачное заведение с тихой музыкой и крепкими напитками. Идеальное место для тайных встреч и спокойных бесед.",
    image: "https://placehold.co/600x400.png",
    aiHint: "fantasy tavern"
  },
  {
    title: "Трактир 'Весёлый Джокер'",
    description: "Шумное и веселое место, где всегда можно найти выпивку, еду и последние сплетни. Излюбленное место встреч авантюристов и местных жителей.",
    image: "https://placehold.co/600x400.png",
    aiHint: "jolly inn"
  },
  {
    title: "Пельменная 'Тесто и мясо'",
    description: "Простое, но очень популярное место. Аромат свежесваренных пельменей слышен за квартал и привлекает всех, от стражников до аристократов.",
    image: "https://placehold.co/600x400.png",
    aiHint: "dumpling house"
  },
  {
    title: "Ювелирная Лавка",
    description: "Витрины этой лавки сверкают блеском драгоценных камней и благородных металлов. Здесь можно найти украшения на любой вкус и кошелек.",
    image: "https://placehold.co/600x400.png",
    aiHint: "jewelry store"
  },
  {
    title: "Агентство недвижимости 'Гнездо Дракона'",
    description: "Ищете уютный домик в лесу или роскошный особняк в центре города? Мы подберем идеальное жилье для вас и вашей семьи.",
    image: "https://placehold.co/600x400.png",
    aiHint: "real estate"
  },
  {
    title: "Транспортная лавка 'Путь и Поводья'",
    description: "От быстрых скакунов до надежных карет. Все, что нужно для комфортного и безопасного путешествия по землям Триады.",
    image: "https://placehold.co/600x400.png",
    aiHint: "carriage shop"
  },
  {
    title: "Ритуальное бюро 'Последний праздник'",
    description: "Мы позаботимся о том, чтобы проводы в последний путь были достойными и запоминающимися. Все виды ритуальных услуг.",
    image: "https://placehold.co/600x400.png",
    aiHint: "funeral home"
  },
  {
    title: "Касса развлечений",
    description: "Продажа билетов в парки аттракционов, зоопарки, аквапарки, на экскурсии и другие захватывающие мероприятия города.",
    image: "https://placehold.co/600x400.png",
    aiHint: "ticket booth"
  },
  {
    title: "Сувенирная лавка 'Сюрприз-Мадам'",
    description: "Удивительные и необычные сувениры со всего света! Найдите идеальный подарок для себя или своих близких.",
    image: "https://placehold.co/600x400.png",
    aiHint: "souvenir shop"
  },
  {
    title: "Лавка артефактов и зелий Шерласа Вихельмского",
    description: "Редчайшие магические артефакты и мощные зелья от известного мастера. Качество гарантировано именем Шерласа.",
    image: "https://placehold.co/600x400.png",
    aiHint: "artifact shop"
  },
  {
    title: "Оружейная лавка 'Покойник в Доспехах'",
    description: "Лучшее оружие и доспехи для любого воина. Каждый клинок проверен в бою, каждый щит готов выдержать удар.",
    image: "https://placehold.co/600x400.png",
    aiHint: "weapon shop"
  },
];

export default function MarketTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Рынок</h1>
        <p className="text-muted-foreground">Добро пожаловать! Здесь вы найдете лучшие магазины и таверны города.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop, index) => (
          <Card key={index} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <div className="relative aspect-video">
                <Image
                  src={shop.image}
                  alt={shop.title}
                  layout="fill"
                  objectFit="cover"
                  className="w-full h-full"
                  data-ai-hint={shop.aiHint}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-6 space-y-2">
              <CardTitle className="font-headline text-xl">{shop.title}</CardTitle>
              <CardDescription>{shop.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button className="w-full">
                Войти <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
