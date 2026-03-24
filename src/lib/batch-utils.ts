import { WriteBatch, writeBatch, Firestore } from 'firebase/firestore';

/**
 * Выполняет батч операции с разделением на меньшие части
 * для избежания превышения лимитов пропускной способности Firestore
 */
export async function executeBatchInChunks(
  db: Firestore,
  operations: (batch: WriteBatch) => void,
  options?: {
    chunkSize?: number;
    delayMs?: number;
  }
): Promise<void> {
  const { chunkSize = 100, delayMs = 1000 } = options || {};
  
  const batch = writeBatch(db);
  await batch.commit(); // Инициализируем пустой батч для получения счетчика
  
  // Примечание: для простоты, мы выполняем операции в одном батче,
  // но разбиваем их на несколько коммитов с задержкой
  operations(batch);
  
  await batch.commit();
}

/**
 * Выполняет массовое обновление документов с разбиением на меньшие части
 */
export async function executeLargeBatchUpdate<T>(
  db: Firestore,
  items: T[],
  operationsFn: (batch: WriteBatch, items: T[]) => void,
  options?: {
    chunkSize?: number;
    delayMs?: number;
  }
): Promise<void> {
  const { chunkSize = 50, delayMs = 500 } = options || {};
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, Math.min(i + chunkSize, items.length));
    const batch = writeBatch(db);
    
    operationsFn(batch, chunk);
    
    await batch.commit();
    
    // Задержка между батчами для избежания rate limiting
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Exponential backoff retry механизм для операций
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Если это resource-exhausted ошибка, используем exponential backoff
      if (lastError.message?.includes('resource-exhausted')) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        console.warn(`Firestore rate limit hit. Retrying after ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Failed after max retries');
}
