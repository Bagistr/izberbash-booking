import Link from 'next/link';
import { sql } from '@/lib/db';
import { Property } from '@/types/property';
import { PropertyList } from '@/components/PropertyList';
import { Waves, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

async function getProperties(): Promise<Property[]> {
  try {
    const rows = await sql`SELECT * FROM properties WHERE is_active = true`;
    return rows as Property[];
  } catch (err) {
    console.error('Ошибка получения данных из Neon:', err);
    return [];
  }
}

export default async function HomePage() {
  const properties = await getProperties();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Шапка / Навбар */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Dag<span className="text-blue-600">Booking</span>
            </span>
          </div>

          <Link
            href="/add-property"
            className="bg-slate-900 text-white font-medium text-sm px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors inline-block"
          >
            Сдать жилье
          </Link>
        </div>
      </header>

      {/* Промо-блок (Hero Section) */}
      <section className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 px-3 py-1.5 rounded-full text-blue-200 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Отдых на Каспийском побережье</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Посуточная аренда домиков и номеров в Избербаше
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Прямое бронирование от проверенных собственников.
          </p>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <ShieldCheck className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Проверенное жилье</p>
                <p className="text-xs text-blue-200">Реальные фото и контакты</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <MapPin className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Близость к морю</p>
                <p className="text-xs text-blue-200">От 50 метров до пляжа</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <Waves className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Без переплат</p>
                <p className="text-xs text-blue-200">Прямые цены от хозяев</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог объектов */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Доступные объекты в Избербаше ({properties.length})
        </h2>

        <PropertyList properties={properties} />
      </section>
    </main>
  );
}