'use client';

import React from 'react';
import Link from 'next/link';
import { Waves, ArrowLeft, FileText } from 'lucide-react';

export default function OfferPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">
              Райский<span className="text-blue-600">Пляж</span>
            </span>
          </Link>

          <Link href="/" className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" /> На главную
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="bg-white p-6 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          
          <div className="border-b border-slate-100 pb-6 space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              <FileText className="w-3.5 h-3.5" />
              <span>Юридический документ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Публичная оферта на оказание услуг онлайн-бронирования
            </h1>
            <p className="text-xs text-slate-400">Редакция действует с 16 августа 2026 г.</p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-6">
            
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">1. Общие положения</h2>
              <p>
                1.1. Настоящий документ является официальным публичным предложением (Публичной офертой в соответствии с п. 2 ст. 437 Гражданского кодекса РФ) Индивидуального предпринимателя Джабраилова Багаудина Казимагомедовича (далее — «Агент» / «Сервис») заключить Агентский договор на оказание услуг по поиску и онлайн-бронированию объектов временного проживания на условиях, изложенных ниже.
              </p>
              <p>
                1.2. Акцептом (полным и безоговорочным принятием условий настоящей Оферты в соответствии со ст. 438 ГК РФ) признается совершение Пользователем любого из следующих действий:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>оформление заказа и онлайн-оплата обеспечительного платежа (предоплаты/брони) на Сайте;</li>
                <li>регистрация учетной записи на Сайте.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">2. Термины и определения</h2>
              <p><strong>Сервис (Платформа)</strong> — программный комплекс Сайта, позволяющий выбирать, бронировать и оплачивать услуги временного проживания.</p>
              <p><strong>Пользователь (Гость / Принципал)</strong> — дееспособное физическое лицо, осуществляющее поиск и бронирование объекта на Сайте.</p>
              <p><strong>Владелец (Арендодатель)</strong> — физическое или юридическое лицо, обладающее правом на сдачу Объекта и поручившее Агенту привлечение гостей.</p>
              <p><strong>Вознаграждение Агента (Комиссия)</strong> — плата за посреднические услуги Сервиса по фиксации бронирования, составляющая 7% от стоимости проживания.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">3. Предмет договора</h2>
              <p>
                3.1. Агент обязуется по поручению Пользователя совершить комплекс действий по онлайн-бронированию выбранного Объекта у Владельца, а также обеспечить информационное и технологическое взаимодействие Сторон при совершении расчетов через платежную систему Robokassa.
              </p>
              <p>
                3.2. Права и обязанности по непосредственному оказанию услуг проживания (состояние жилья, заезд, правила пользования помещением) возникают напрямую между Пользователем и Владельцем Объекта.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">4. Порядок оплаты и фискализация</h2>
              <p>
                4.1. Оплата бронирования осуществляется в безналичном порядке через авторизованного платежного агрегатора Robokassa с использованием защищенных протоколов.
              </p>
              <p>
                4.2. Электронный кассовый чек в соответствии с Федеральным законом № 54-ФЗ формируется автоматически сервисом Robokassa и направляется на контактные данные Пользователя.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">5. Правила отмены и возврата</h2>
              <p>
                5.1. При отмене бронирования в установленный правилами Объекта срок бесплатной отмены сумма внесенной предоплаты подлежит возврату в полном объеме тем же способом, которым была совершена оплата.
              </p>
              <p>
                5.2. При несвоевременной отмене или незаезде Гостя внесенная сумма может быть удержана в качестве компенсации фактических расходов в соответствии с законодательством РФ.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">6. Конфиденциальность и защита данных</h2>
              <p>
                Обработка персональных данных Пользователя осуществляется в строгом соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».
              </p>
            </section>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide">7. Реквизиты Исполнителя (Агента)</h3>
              <p><strong>Индивидуальный предприниматель:</strong> Джабраилов Багаудин Казимагомедович</p>
              <p><strong>ИНН:</strong> 056002553388</p>
              <p><strong>ОГРНИП:</strong> 323050000010499</p>
              <p><strong>Телефон:</strong> +7 (964) 571-46-06</p>
              <p><strong>E-mail:</strong> Baga1071@yandex.ru</p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}