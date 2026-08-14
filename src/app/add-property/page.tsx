'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Waves, ArrowLeft, Building2, X, CheckCircle2, ImagePlus, Plus, Home, Trash2, Layers, Check } from 'lucide-react';

const PRESET_AMENITIES = [
  'Wi-Fi', 'Кондиционер', 'Мангал', 'Бассейн', 'Беседка', 
  'Лежак / Шезлонг', 'Парковка', 'Баня / Сауна', 'Вид на море', 
  'Стиральная машина', 'Телевизор', 'Детская площадка'
];

export default function AddPropertyPage() {
  // Выбор формата: 'single' (один отдельный дом) или 'complex' (база отдыха / гостиница с номерами)
  const [listingFormat, setListingFormat] = useState<'single' | 'complex'>('single');

  const [formData, setFormData] = useState({
    title: '',
    property_type: 'house',
    price_per_night: '',
    max_guests: '4',
    distance_to_sea: '',
    address: '',
    description: '',
    landlord_phone: '',
  });

  // Список домиков/номеров (используется только для формата 'complex')
  const [units, setUnits] = useState<string[]>(['Домик №1', 'Домик №2']);
  const [newUnitName, setNewUnitName] = useState('');

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Wi-Fi', 'Кондиционер', 'Мангал'
  ]);
  const [customAmenitiesList, setCustomAmenitiesList] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addCustomAmenity = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = customAmenity.trim();
    if (!trimmed) return;

    if (!PRESET_AMENITIES.includes(trimmed) && !customAmenitiesList.includes(trimmed)) {
      setCustomAmenitiesList((prev) => [...prev, trimmed]);
    }
    if (!selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed]);
    }
    setCustomAmenity('');
  };

  // Управление домиками/номерами для комплекса
  const addUnit = () => {
    if (newUnitName.trim()) {
      setUnits((prev) => [...prev, newUnitName.trim()]);
      setNewUnitName('');
    } else {
      setUnits((prev) => [...prev, `Домик №${prev.length + 1}`]);
    }
  };

  const removeUnit = (index: number) => {
    if (units.length <= 1) {
      setErrorMsg('В комплексе должен быть указан хотя бы один домик или номер.');
      return;
    }
    setUnits((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setErrorMsg('Настройка загрузки фото еще не завершена в .env.local');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    const newUploadedPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: data,
        });

        if (!res.ok) throw new Error('Ошибка загрузки');

        const fileData = await res.json();
        newUploadedPhotos.push(fileData.secure_url);
      }

      setPhotos((prev) => [...prev, ...newUploadedPhotos]);
    } catch (err) {
      setErrorMsg('Не удалось загрузить фотографии.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (photos.length === 0) {
      setErrorMsg('Пожалуйста, загрузите хотя бы одну фотографию.');
      setLoading(false);
      return;
    }

    // Если одиночный объект — передаем 1 дефолтный юнит, если комплекс — массив выбранных юнитов
    const finalUnits = listingFormat === 'single' ? ['Основной объект'] : units;

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amenities: selectedAmenities,
          photos,
          units: finalUnits,
        }),
      });

      if (!res.ok) throw new Error('Ошибка сервера');

      setIsSuccess(true);
    } catch (err) {
      setErrorMsg('Не удалось отправить объект. Проверьте заполнение.');
    } finally {
      setLoading(false);
    }
  };

  const allAvailableAmenities = [...PRESET_AMENITIES, ...customAmenitiesList];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Райский<span className="text-blue-600">Пляж</span>
            </span>
          </Link>

          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" /> На главную
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-black text-slate-900">Объект успешно добавлен!</h2>
              <p className="text-slate-600 text-sm">Ваше объявление опубликовано в каталоге DagBooking.</p>
              <Link href="/" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors">
                Посмотреть в каталоге
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Партнерам и владельцам</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900">Сдать жилье</h1>
                <p className="text-xs text-slate-500 mt-1">Заполните параметры вашего объекта для публикации</p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium">{errorMsg}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. ПЕРЕКЛЮЧАТЕЛЬ: ОДИН ОБЪЕКТ ИЛИ КОМПЛЕКС */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Что вы сдаете? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setListingFormat('single');
                        setFormData((prev) => ({ ...prev, property_type: 'house' }));
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        listingFormat === 'single'
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${listingFormat === 'single' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
                          <Home className="w-5 h-5" />
                        </div>
                        {listingFormat === 'single' && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Отдельный дом / коттедж</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Один объект целиком под одного арендатора</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setListingFormat('complex');
                        setFormData((prev) => ({ ...prev, property_type: 'house' }));
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        listingFormat === 'complex'
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${listingFormat === 'complex' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        {listingFormat === 'complex' && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Комплекс / База / Отель</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Несколько одинаковых номеров или домиков</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Название */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    {listingFormat === 'single' ? 'Название объекта *' : 'Название базы / комплекса *'}
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder={
                      listingFormat === 'single'
                        ? 'Пример: Уютный коттедж у моря с мангалом'
                        : 'Пример: База отдыха «Каспийский берег»'
                    }
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* БЛОК ДОМИКОВ/НОМЕРОВ (ПОКАЗЫВАЕТСЯ ТОЛЬКО ПРИ ВЫБОРЕ КОМПЛЕКСА) */}
                {listingFormat === 'complex' && (
                  <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <label className="text-xs font-bold text-slate-800 uppercase">
                        Домики / Номера в этом комплексе ({units.length})
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Добавьте сюда названия всех ваших домиков или комнат. У каждого будет вестись свой независимый календарь заездов.
                    </p>

                    <div className="space-y-2">
                      {units.map((u, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold">
                          <span className="text-slate-800">{u}</span>
                          {units.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUnit(idx)}
                              className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Название (напр. Коттедж №3 или Номер 102)"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={addUnit}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Тип жилья</label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleChange}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="house">Дом / Коттедж / Дача</option>
                      <option value="room">Номер в отеле / Гостевой дом</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      {listingFormat === 'single' ? 'Цена за сутки (₽) *' : 'Цена за 1 домик/номер в сутки (₽) *'}
                    </label>
                    <input
                      type="number"
                      name="price_per_night"
                      required
                      placeholder="5000"
                      value={formData.price_per_night}
                      onChange={handleChange}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Расстояние до моря (метров) *</label>
                    <input
                      type="number"
                      name="distance_to_sea"
                      required
                      placeholder="150"
                      value={formData.distance_to_sea}
                      onChange={handleChange}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      {listingFormat === 'single' ? 'Макс. гостей' : 'Вместимость 1 домика/номера'}
                    </label>
                    <input
                      type="number"
                      name="max_guests"
                      required
                      placeholder="6"
                      value={formData.max_guests}
                      onChange={handleChange}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Адрес объекта *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="г. Избербаш, ул. Приморская, 15"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Телефон владельца *</label>
                  <input
                    type="tel"
                    name="landlord_phone"
                    required
                    placeholder="+7 988 000 00 00"
                    value={formData.landlord_phone}
                    onChange={handleChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* БОНУСЫ И УДОБСТВА */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Бонусы и удобства
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allAvailableAmenities.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{amenity}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Например: Сапборды / Джакузи"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomAmenity(e);
                        }
                      }}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addCustomAmenity}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить</span>
                    </button>
                  </div>
                </div>

                {/* ФОТОГРАФИИ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Фотографии *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                    {photos.map((url, index) => (
                      <div key={index} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200">
                        <img src={url} alt="Загруженное фото" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <label className="h-24 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/50">
                      <ImagePlus className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600">Загрузить</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Описание</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Панорамные окна, закрытая территория, зона барбекю..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-4 rounded-2xl transition-colors shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  {loading ? 'Публикация...' : 'Опубликовать объект'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}