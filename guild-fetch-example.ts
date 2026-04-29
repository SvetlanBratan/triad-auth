/**
 * Пример получения информации о гильдии персонажа
 * 
 * Улучшенная версия, которая:
 * 1. Получает пользователя из Firestore
 * 2. Находит персонажа в массиве characters
 * 3. Если у персонажа заполнена гильдия (factions), загружает её данные
 */

import { db, fetchCharacterGuild } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ============================================
// Версия 1: Базовый способ (как вы это делали)
// ============================================
export async function getCharacterGuildSimple(userId: string, characterId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const characters = userDoc.data().characters;
      const character = characters.find((c: any) => c.id === characterId);
      
      if (character?.factions) {
        console.log(`Персонаж "${character.name}" состоит в гильдии: ${character.factions}`);
        return character.factions; // Вернёт только ID или название гильдии
      } else {
        console.log(`Персонаж "${character?.name}" не состоит ни в какой гильдии`);
        return null;
      }
    }
  } catch (error) {
    console.error('Ошибка при получении персонажа:', error);
  }
}

// ============================================
// Версия 2: Улучшенный способ (рекомендуется)
// Получает полные данные о гильдии, если она заполнена
// ============================================
export async function getCharacterGuildFull(userId: string, characterId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const characters = userDoc.data().characters;
      const character = characters.find((c: any) => c.id === characterId);
      
      if (!character) {
        console.log('Персонаж не найден');
        return null;
      }

      // Если гильдия не заполнена, вернём null
      if (!character.factions) {
        console.log(`Персонаж "${character.name}" не состоит ни в какой гильдии`);
        return null;
      }

      // Загружаем полные данные о гильдии
      const guild = await fetchCharacterGuild(character.factions);
      
      if (guild) {
        console.log(`Персонаж "${character.name}" состоит в гильдии:`, guild);
        console.log(`  Название: ${guild.name}`);
        console.log(`  Лидер: ${guild.leader || 'не указан'}`);
        console.log(`  Описание: ${guild.description || 'нет'}`);
        console.log(`  Уровень: ${guild.level || 0}`);
      } else {
        console.log(`Гильдия с ID "${character.factions}" не найдена в Firestore`);
      }

      return guild;
    }
  } catch (error) {
    console.error('Ошибка при получении гильдии персонажа:', error);
    return null;
  }
}

// ============================================
// Версия 3: Самая оптимальная для компонентов
// Вызывается когда уже известен объект персонажа
// ============================================
import { Character, Guild } from '@/lib/types';

export async function getCharacterGuild(character: Character): Promise<Guild | null> {
  if (!character.factions) {
    return null;
  }
  return fetchCharacterGuild(character.factions);
}

// ============================================
// Пример использования в компоненте React
// ============================================
/**
 * Пример использования в React компоненте:
 * 
 * import { useEffect, useState } from 'react';
 * import { getCharacterGuild } from '@/guild-fetch-example';
 * import { Character, Guild } from '@/lib/types';
 * 
 * export function CharacterProfile({ character }: { character: Character }) {
 *   const [guild, setGuild] = useState<Guild | null>(null);
 *   const [loading, setLoading] = useState(false);
 * 
 *   useEffect(() => {
 *     const loadGuild = async () => {
 *       if (character.factions) {
 *         setLoading(true);
 *         const guildData = await getCharacterGuild(character);
 *         setGuild(guildData);
 *         setLoading(false);
 *       }
 *     };
 * 
 *     loadGuild();
 *   }, [character.factions]);
 * 
 *   if (!character.factions) {
 *     return <div>Персонаж не состоит в гильдии</div>;
 *   }
 * 
 *   if (loading) {
 *     return <div>Загрузка информации о гильдии...</div>;
 *   }
 * 
 *   if (!guild) {
 *     return <div>Гильдия не найдена</div>;
 *   }
 * 
 *   return (
 *     <div className="guild-info">
 *       <h2>{guild.name}</h2>
 *       <p>{guild.description}</p>
 *       <p>Лидер: {guild.leader}</p>
 *       <p>Уровень: {guild.level}</p>
 *       <p>Члены: {guild.members?.length || 0}</p>
 *     </div>
 *   );
 * }
 */
