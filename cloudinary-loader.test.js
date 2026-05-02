/**
 * Тестовый файл для cloudinary-loader.js
 * 
 * Проверяет правильность работы loader на различных типах URL
 * Запуск: node cloudinary-loader.test.js
 */

// Мокируем process.env для теста
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'dxac8lq4f';

// Импортируем loader - преобразуем CommonJS exports в обычный объект
const cloudinaryLoader = require('./cloudinary-loader.js').default;

// Данные для тестирования
const testCases = [
  {
    name: 'Cloudinary URL без трансформаций',
    src: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753194638/%D0%90%D0%BB%D1%8C%D0%B2%D0%B8_ggcs5g.png',
    width: 800,
    expected: 'преобразуется с f_auto,q_auto,c_limit,w_800',
    shouldContain: ['f_auto', 'q_auto', 'w_800'],
  },
  {
    name: 'SVG файл (должен пропуститься)',
    src: '/icons/ach-test.svg',
    width: 32,
    expected: 'вернуться без изменений',
    shouldEqual: '/icons/ach-test.svg',
  },
  {
    name: 'GIF файл (должен пропуститься)',
    src: 'https://example.com/animation.gif',
    width: 600,
    expected: 'вернуться без изменений',
    shouldEqual: 'https://example.com/animation.gif',
  },
  {
    name: 'Data URL (должен пропуститься)',
    src: 'data:image/png;base64,iVBORw0KG...',
    width: 100,
    expected: 'вернуться без изменений',
    shouldEqual: 'data:image/png;base64,iVBORw0KG...',
  },
  {
    name: 'Blob URL (должен пропуститься)',
    src: 'blob:http://localhost:3000/abc123',
    width: 200,
    expected: 'вернуться без изменений',
    shouldEqual: 'blob:http://localhost:3000/abc123',
  },
  {
    name: 'LocalHost (должен пропуститься)',
    src: 'http://localhost:3000/image.png',
    width: 400,
    expected: 'вернуться без изменений',
    shouldEqual: 'http://localhost:3000/image.png',
  },
  {
    name: 'PostImg URL (не Cloudinary)',
    src: 'https://i.postimg.cc/rFpDDx5B/image.png',
    width: 500,
    expected: 'вернуться без изменений',
    shouldEqual: 'https://i.postimg.cc/rFpDDx5B/image.png',
  },
  {
    name: 'Cloudinary URL с явным качеством',
    src: 'https://res.cloudinary.com/dxac8lq4f/image/upload/v1753194638/photo.jpg',
    width: 1200,
    quality: 90,
    expected: 'преобразуется с q_90',
    shouldContain: ['q_90', 'w_1200'],
  },
  {
    name: 'Пустой src',
    src: '',
    width: 100,
    expected: 'вернуться пустой строкой',
    shouldEqual: '',
  },
  {
    name: 'null src',
    src: null,
    width: 100,
    expected: 'вернуться пустой строкой',
    shouldEqual: '',
  },
];

// Функция для проверки результата
function testCase(testData) {
  let result;
  try {
    result = cloudinaryLoader({ 
      src: testData.src, 
      width: testData.width,
      quality: testData.quality 
    });
  } catch (error) {
    console.log(`❌ ${testData.name}`);
    console.log(`   Ошибка: ${error.message}`);
    return false;
  }

  let passed = false;

  if (testData.shouldEqual !== undefined) {
    passed = result === testData.shouldEqual;
    if (!passed) {
      console.log(`❌ ${testData.name}`);
      console.log(`   Ожидалось: ${testData.shouldEqual}`);
      console.log(`   Получено: ${result}`);
    }
  } else if (testData.shouldContain) {
    passed = testData.shouldContain.every(str => result.includes(str));
    if (!passed) {
      console.log(`❌ ${testData.name}`);
      console.log(`   Ожидалось содержание: ${testData.shouldContain.join(', ')}`);
      console.log(`   Получено: ${result}`);
    }
  }

  if (passed) {
    console.log(`✅ ${testData.name}`);
    console.log(`   Результат: ${result.substring(0, 80)}${result.length > 80 ? '...' : ''}`);
  }

  return passed;
}

// Запуск тестов
console.log('🧪 Тестирование cloudinary-loader.js\n');
console.log('━'.repeat(70));

let passed = 0;
let total = testCases.length;

testCases.forEach(testData => {
  if (testCase(testData)) {
    passed++;
  }
  console.log();
});

console.log('━'.repeat(70));
console.log(`\nРезультат: ${passed}/${total} тестов пройдено ✅\n`);

if (passed === total) {
  console.log('✨ Все тесты прошли успешно!');
  process.exit(0);
} else {
  console.log(`⚠️  ${total - passed} тестов не прошло`);
  process.exit(1);
}
