'use client';

import React from 'react';
import Link from 'next/link';
import { Waves, ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

export default function OfferPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Шапка */}
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
            <p className="text-xs text-slate-400">Редакция действует с 22 августа 2026 г.</p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-6">
            
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">1. Общие положения</h2>
              <p>
                1.1. Настоящий документ является официальным публичным предложением (Публичной офертой в соответствии с п. 2 ст. 437 Гражданского кодекса РФ) Индивидуального предпринимателя Ибрагимова Завура Абдурагимовича (далее — «Агент» / «Сервис») заключить Агентский договор на оказание услуг по поиску и онлайн-бронированию объектов временного проживания на условиях, изложенных ниже.
              </p>
              <p>
                1.2. Акцептом (полным и безоговорочным принятием условий настоящей Оферты в соответствии со ст. 438 ГК РФ) признается совершение Пользователем любого из следующих действий:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>оформление заказа и онлайн-оплата обеспечительного платежа (аванса/брони) на Сайте;</li>
                <li>регистрация учетной записи на Сайте;</li>
                <li>размещение Объекта недвижимости в каталоге Сайта.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">2. Термины и определения</h2>
              <p><strong>Сервис (Платформа «Райский Пляж»)</strong> — программный комплекс Сайта (райскийпляж.рф), предоставляющий функционал для поиска, выбора, онлайн-бронирования и управления занятостью объектов временного проживания.</p>
              <p><strong>Пользователь (Гость / Турист)</strong> — дееспособное физическое лицо, осуществляющее бронирование объекта на Сайте для личных целей временного проживания.</p>
              <p><strong>Владелец (Арендодатель)</strong> — физическое или юридическое лицо, законно распоряжающееся Объектом и использующее Сервис для привлечения гостей.</p>
              <p><strong>Вознаграждение Агента (Сервисный сбор)</strong> — плата за посреднические и информационно-технологические услуги Сервиса по фиксации бронирования, составляющая <strong>5% (пять процентов)</strong> от общей стоимости проживания.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">3. Предмет договора</h2>
              <p>
                3.1. Агент обязуется по поручению Гостя совершить комплекс действий по онлайн-бронированию выбранного Объекта у Владельца, фиксации дат в интерактивном календаре и обеспечению информационного взаимодействия Сторон при безналичных расчетах.
              </p>
              <p>
                3.2. Непосредственные услуги временного проживания, предоставление помещения, заселение и выселение оказываются напрямую Владельцем Объекта. Договор аренды (найма) заключается между Гостем и Владельцем.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">4. Порядок расчетов и фискализация</h2>
              <p>
                4.1. При оформлении онлайн-бронирования Гость вносит авансовый платеж в размере 5% от общей стоимости проживания посредством интернет-эквайринга с использованием банковских карт платежных систем МИР, Visa, Mastercard или через Систему быстрых платежей (СБП).
              </p>
              <p>
                4.2. Оставшаяся часть стоимости проживания (95%) оплачивается Гостем непосредственно Владельцу при заселении в Объект наличным или безналичным расчетом по согласованию Сторон.
              </p>
              <p>
                4.3. В соответствии с Федеральным законом № 54-ФЗ электронный кассовый чек на сумму сервисного сбора формируется в автоматическом режиме и направляется на адрес электронной почты или номер телефона Гостя.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">5. Правила отмены бронирования и возврата средств</h2>
              <p>
                5.1. <strong>Бесплатная отмена:</strong> При отмене бронирования Гостем не позднее чем за 3 (трое) суток (72 часа) до установленного времени заезда (14:00 дня заезда), сумма внесенного аванса (5%) возвращается Гостю в полном объеме на ту же банковскую карту, с которой была произведена оплата. Срок зачисления возврата зависит от банка-эмитента (обычно от 1 до 3 рабочих дней).
              </p>
              <p>
                5.2. <strong>Поздняя отмена и незаезд:</strong> При отмене бронирования менее чем за 3 суток до заезда либо в случае неприбытия Гостя (No-show), внесенная сумма аванса удерживается в качестве компенсации фактических расходов Агента и Владельца на резервирование объекта.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">6. Права и обязанности сторон</h2>
              <p>
                6.1. Владелец гарантирует готовность и соответствие Объекта заявленным характеристикам, а также заселение Гостя с 14:00 в забронированные даты.
              </p>
              <p>
                6.2. Гость обязуется освободить помещение до 12:00 дня выезда, соблюдать правила проживания, режим тишины с 23:00 до 08:00 и правила пожарной безопасности.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">7. Конфиденциальность и безопасность данных</h2>
              <p>
                7.1. Обработка персональных данных Пользователей осуществляется в строгом соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных». Все транзакции защищены протоколами SSL/TLS и стандартом безопасности PCI DSS.
              </p>
            </section>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide">8. Реквизиты Исполнителя (Агента)</h3>
              <p><strong>Индивидуальный предприниматель:</strong> Ибрагимов Завур Абдурагимович</p>
              <p><strong>ИНН:</strong> 056002553388</p>
              <p><strong>ОГРНИП:</strong> 323050000010499</p>
              <p><strong>Телефон службы поддержки:</strong> +7 (964) 571-46-06</p>
              <p><strong>Telegram:</strong> @Bagistr</p>
              <p><strong>E-mail:</strong> Baga1071@yandex.ru</p>
              <p><strong>Адрес:</strong> Российская Федерация, Республика Дагестан, г. Избербаш</p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}