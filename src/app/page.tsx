import Link from 'next/link';
import { sql } from '@/lib/db';
import { Property } from '@/types/property';
import { PropertyList } from '@/components/PropertyList';
import { Header } from '@/components/Header';
import { ShieldCheck, MapPin, Waves, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getProperties(): Promise<Property[]> {
  try {
    const properties = await sql`SELECT * FROM properties WHERE is_active = true ORDER BY created_at DESC`;
    let reviewsSummary: any[] = [];
    try {
      reviewsSummary = await sql`
        SELECT 
          property_id, 
          ROUND(AVG(rating)::numeric, 1) as avg_rating, 
          COUNT(id)::int as count 
        FROM reviews 
        GROUP BY property_id
      `;
    } catch (e) {
      // Таблица отзывов еще пуста или создается
    }

    const reviewMap = new Map(
      reviewsSummary.map((r: any) => [String(r.property_id), { rating: Number(r.avg_rating), count: Number(r.count) }])
    );

    return properties.map((p: any) => {
      const rev = reviewMap.get(String(p.id));
      return {
        ...p,
        rating: rev ? rev.rating : 5.0,
        reviews_count: rev ? rev.count : 0,
      };
    }) as Property[];
  } catch (err) {
    console.error('Ошибка получения данных из Neon:', err);
    return [];
  }
}

export default async function HomePage() {
  const properties = await getProperties();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Универсальная динамическая шапка */}
      <Header />

      {/* Промо-баннер */}
      <section className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 px-3 py-1.5 rounded-full text-blue-200 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Отдых на побережье Каспийского моря</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Посуточная аренда домиков и номеров в Избербаше
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto">
            Бронируйте проверенные коттеджи и гостевые дома напрямую от собственников без переплат.
          </p>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <ShieldCheck className="w-7 h-7 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Проверенное жилье</p>
                <p className="text-[11px] text-blue-200">Реальные фото и бронь</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <MapPin className="w-7 h-7 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Близость к морю</p>
                <p className="text-[11px] text-blue-200">От 50 метров до пляжа</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <Waves className="w-7 h-7 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Гарантия дат</p>
                <p className="text-[11px] text-blue-200">Защита от овербукинга</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог и интерактивные фильтры */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyList properties={properties} />
      </section>

    {/* ПОДВАЛ САЙТА (FOOTER) */}
    <footer className="bg-white border-t border-slate-200 mt-20 py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
        {/* Копирайт и реквизиты */}
        <div>
          <p className="font-bold text-slate-700">© 2026 Райский Пляж. Все права защищены.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">ИП Ибрагимов З.А. • ИНН 056002553388</p>
        </div>

        {/* Юридические ссылки для Robokassa */}
        <div className="flex items-center space-x-6">
          <Link href="/offer" className="hover:text-blue-600 underline transition-colors">
            Публичная оферта
          </Link>
          <Link href="/offer" className="hover:text-blue-600 underline transition-colors">
            Политика конфиденциальности
          </Link>
          <a href="mailto:Baga1071@yandex.ru" className="hover:text-blue-600 transition-colors">
            Поддержка: Baga1071@yandex.ru
          </a>
        </div>

      </div>
    </footer>
    </main>
  );
}