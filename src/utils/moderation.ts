/**
 * Умная система фильтрации нецензурной лексики, мата, спама и запрещенного контента
 */

// Базовые корни и шаблоны ненормативной лексики (с учетом частых замен букв на латиницу и символы)
const PROFANITY_PATTERNS = [
  /х[уy][йjеяёи]/i,
  /п[иеe][зz]д/i,
  /[еeё]б[аеёийл]/i,
  /б[лl][яy][дd]/i,
  /с[уy]ч?к/i,
  /г[аo][вv]н/i,
  /м[уy]д[аaкk]/i,
  /чм[оo]/i,
  /п[ие][дd][аo]р/i,
  /шл[юy][хx]/i,
  /залуп/i,
  /дроч/i,
  /интим/i,
  /эскорт/i,
  /наркот/i,
  /мефедрон/i,
  /закладк/i,
  /шмаль/i,
  /соли/i,
  /казино/i,
  /ставки/i,
  /1xbet/i,
  /онлайн-казино/i,
];

// Паттерн поиска спам-ссылок на сторонние подозрительные сайты
const SPAM_URL_PATTERN = /(https?:\/\/[^\s]+|t\.me\/[^\s]+|wa\.me\/[^\s]+)/i;

/**
 * Нормализация текста (замена похожих английских букв на русские, удаление повторяющихся спецсимволов)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@#$%\^&*()_+=\[\]{}|\\;:'",.<>?/`~]/g, ' ')
    .replace(/[aа]/g, 'а')
    .replace(/[bв]/g, 'в')
    .replace(/[eе]/g, 'е')
    .replace(/[kк]/g, 'к')
    .replace(/[mм]/g, 'м')
    .replace(/[hн]/g, 'н')
    .replace(/[oо]/g, 'о')
    .replace(/[pр]/g, 'р')
    .replace(/[cс]/g, 'с')
    .replace(/[tт]/g, 'т')
    .replace(/[yу]/g, 'у')
    .replace(/[xх]/g, 'х')
    .replace(/\s+/g, ' ');
}

/**
 * Проверка текста на наличие мата или запрещенного контента
 */
export function checkContentProfanity(text: string): { isValid: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { isValid: true };

  const normalized = normalizeText(text);

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isValid: false,
        reason: 'Текст содержит ненормативную лексику или запрещенные выражения.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Проверка текста на наличие контактных данных (телефоны, ссылки, соцсети)
 */
export function checkForContacts(text: string): { isValid: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { isValid: true };

  const lower = text.toLowerCase();

  // 1. Поиск последовательностей цифр (телефонов)
  // Маскирует: 8-900-123-45-67, +7 900 123 4567, 89001234567, 8.9.0.0.1...
  const phonePattern = /(?:\+?7|8)[\s_.-]*\(?\d{3}\)?[\s_.-]*\d{3}[\s_.-]*\d{2}[\s_.-]*\d{2}/;
  const consecutiveDigitsPattern = /(?:\d[\s_.-]*){7,}/;

  if (phonePattern.test(lower) || consecutiveDigitsPattern.test(lower)) {
    return {
      isValid: false,
      reason: 'Указывать контактные телефоны в описании запрещено. Гость получит ваш номер автоматически после бронирования.',
    };
  }

  // 2. Мессенджеры, соцсети и призывы связаться напрямую
  const contactKeywords = [
    /t\.me/i,
    /wa\.me/i,
    /viber/i,
    /instagram/i,
    /инстаграм/i,
    /инста\b/i,
    /телеграм/i,
    /ватсап/i,
    /вацап/i,
    /вконтакте/i,
    /авито/i,
    /avito/i,
    /vk\.com/i,
    /пишите на/i,
    /звоните на/i,
    /номер для связи/i,
    /связаться напрямую/i,
    /tg:/i,
    /тг:/i,
  ];

  for (const keyword of contactKeywords) {
    if (keyword.test(lower)) {
      return {
        isValid: false,
        reason: 'Указывать ссылки на соцсети, мессенджеры или призывы к связи напрямую в описании запрещено.',
      };
    }
  }

  // 3. Юзернеймы через @
  if (/@\w{3,}/.test(lower)) {
    return {
      isValid: false,
      reason: 'Указывать юзернеймы мессенджеров (через @) в тексте запрещено.',
    };
  }

  return { isValid: true };
}

/**
 * Комплексная валидация всех полей объекта недвижимости
 */
export function validatePropertyContent({
  title,
  description,
  address,
}: {
  title: string;
  description?: string;
  address?: string;
}): { isValid: boolean; error?: string } {
  const titleCheck = checkContentProfanity(title);
  if (!titleCheck.isValid) {
    return {
      isValid: false,
      error: `В названии объявления обнаружены недопустимые слова. Пожалуйста, измените заголовок.`,
    };
  }

  const titleContactCheck = checkForContacts(title);
  if (!titleContactCheck.isValid) {
    return {
      isValid: false,
      error: titleContactCheck.reason,
    };
  }

  if (address) {
    const addressCheck = checkContentProfanity(address);
    if (!addressCheck.isValid) {
      return {
        isValid: false,
        error: `В адресе объекта обнаружены недопустимые выражения.`,
      };
    }
  }

  if (description) {
    const descCheck = checkContentProfanity(description);
    if (!descCheck.isValid) {
      return {
        isValid: false,
        error: `В описании объекта обнаружена ненормативная лексика или запрещенный контент.`,
      };
    }

    const descContactCheck = checkForContacts(description);
    if (!descContactCheck.isValid) {
      return {
        isValid: false,
        error: descContactCheck.reason,
      };
    }
  }

  return { isValid: true };
}
