/**
 * Cloudinary Custom Loader для Next.js
 * 
 * Этот файл обрабатывает оптимизацию изображений через Cloudinary CDN.
 * - Трансформирует только Cloudinary URL
 * - Безопасно возвращает оригинальные URL для неподдерживаемых типов
 * - Предотвращает двойную трансформацию старых Cloudinary ссылок
 */

const DEFAULT_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxac8lq4f';

/**
 * Проверяет, является ли URL Cloudinary ссылкой
 */
function isCloudinaryUrl(src) {
  if (!src || typeof src !== 'string') return false;
  return src.includes('res.cloudinary.com');
}

/**
 * Проверяет, есть ли в URL уже трансформации
 */
function hasTransformations(src) {
  if (!src || typeof src !== 'string') return false;
  // Cloudinary URL с трансформациями имеет формат: /image/upload/TRANSFORMATIONS/
  // Трансформации содержат символы как: f_auto, q_auto, w_800, c_limit (содержат запятые и подчеркивания)
  // Версия имеет формат v{timestamp} - только буква v и цифры
  const uploadMatch = src.match(/\/image\/upload\/([^/]+)\//);
  if (!uploadMatch || !uploadMatch[1]) return false;
  
  const token = uploadMatch[1];
  // Если это только версия (v + цифры), то трансформаций нет
  if (/^v\d+$/.test(token)) return false;
  
  // Если содержит подчеркивания (f_auto, q_auto и т.д.) - это трансформации
  if (token.includes('_') || token.includes(',')) return true;
  
  return false;
}

/**
 * Извлекает cloud name из Cloudinary URL
 */
function extractCloudName(src) {
  const match = src.match(/res\.cloudinary\.com\/([^/]+)\//);
  return match ? match[1] : DEFAULT_CLOUD_NAME;
}

/**
 * Извлекает путь файла из Cloudinary URL (без трансформаций и версий)
 */
function extractFilePath(src) {
  // Формат: https://res.cloudinary.com/{cloud}/image/upload/[v123456789]/path/to/file
  // или: https://res.cloudinary.com/{cloud}/image/upload/TRANSFORMATIONS/path/to/file
  // Нам нужна часть после /upload/ (опционально с версией и/или трансформациями)
  
  // Сначала пробуем с версией и без трансформаций
  let match = src.match(/\/image\/upload\/v\d+\/(.+)$/);
  if (match) return match[1];
  
  // Потом пробуем без версии и без трансформаций
  match = src.match(/\/image\/upload\/(.+)$/);
  if (match) return match[1];
  
  return '';
}

/**
 * Проверяет, нужно ли пропустить трансформацию URL
 */
function shouldSkipTransformation(src) {
  if (!src || typeof src !== 'string') return true;

  // Пропускаем SVG
  if (src.toLowerCase().endsWith('.svg')) return true;

  // Пропускаем GIF (обычно анимированные)
  if (src.toLowerCase().endsWith('.gif')) return true;

  // Пропускаем data URL
  if (src.startsWith('data:')) return true;

  // Пропускаем blob URL
  if (src.startsWith('blob:')) return true;

  // Пропускаем localhost
  if (src.includes('localhost') || src.includes('127.0.0.1')) return true;

  return false;
}

/**
 * Кастомный Cloudinary loader для Next.js
 * 
 * @param {Object} params - Параметры от Next.js Image компонента
 * @param {string} params.src - Оригинальный URL картинки
 * @param {number} params.width - Требуемая ширина
 * @param {number} params.quality - Требуемое качество (auto по умолчанию)
 * @returns {string} Оптимизированный URL или оригинальный URL
 */
export default function cloudinaryLoader({ src, width, quality = 'auto' }) {
  // Защита от пустых значений
  if (!src) {
    console.warn('[cloudinary-loader] src is empty');
    return '';
  }

  // Если нужно пропустить трансформацию, возвращаем оригинал
  if (shouldSkipTransformation(src)) {
    return src;
  }

  // Если это не Cloudinary URL, возвращаем его как есть
  // (Next.js должен был проверить remotePatterns)
  if (!isCloudinaryUrl(src)) {
    return src;
  }

  try {
    // Если в URL уже есть трансформации, не добавляем новые
    // (это может быть старый URL с ручными трансформациями)
    if (hasTransformations(src)) {
      return src;
    }

    // Извлекаем параметры из URL
    const cloudName = extractCloudName(src);
    const filePath = extractFilePath(src);

    if (!filePath) {
      // Не смогли распарсить путь файла, возвращаем оригинал
      console.warn('[cloudinary-loader] Could not extract file path from:', src);
      return src;
    }

    // Формируем набор трансформаций:
    // f_auto - автоматический выбор оптимального формата (WebP для современных браузеров)
    // q_auto - автоматическое качество (Cloudinary выбирает оптимальное)
    // c_limit - ограничение размера (не увеличивает меньшие картинки)
    // w_{width} - размер по ширине
    const params = [
      'f_auto',           // Автоматический формат
      `q_${quality}`,     // Качество (auto или конкретное значение)
      'c_limit',          // Ограничение размера
      `w_${width}`,       // Ширина
    ];

    // Формируем финальный URL
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(',')}/${filePath}`;

    return url;
  } catch (error) {
    console.error('[cloudinary-loader] Error processing URL:', src, error);
    // В случае любой ошибки возвращаем оригинальный URL
    return src;
  }
}
