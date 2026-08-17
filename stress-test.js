import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 10 }, // Разгон до 10 пользователей
    { duration: '30s', target: 30 }, // Нагрузка 30 пользователей
    { duration: '20s', target: 0 },  // Спад нагрузки
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Ошибок должно быть меньше 1%
    http_req_duration: ['p(95)<2000'], // 95% ответов быстрее 2 секунд
  },
};

export default function () {
  // Укажите URL вашего рабочего сайта
  const BASE_URL = 'https://dagbooking.vercel.app';

  // Проверяем главную страницу каталога
  const res = http.get(`${BASE_URL}/`);
  check(res, {
    'Статус 200 (OK)': (r) => r.status === 200,
  });

  sleep(1);
}