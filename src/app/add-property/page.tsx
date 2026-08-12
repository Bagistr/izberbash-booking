'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Waves, ArrowLeft, Building2, Upload, X, CheckCircle2, ImagePlus } from 'lucide-react';

export default function AddPropertyPage() {
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'house',
    price_per_night: '',
    max_guests: '4',
    distance_to_sea: '',
    address: '',
    description: '',
    amenities: 'Wi-Fi, Кондиционер, Мангал, Парковка',
    landlord_phone: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Загрузка фото в Cloudinary
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

        if (!res.ok) throw new Error('Ошибка загрузки одного из файлов');

        const fileData = await res.json();
        newUploadedPhotos.push(fileData.secure_url);
      }

      setPhotos((prev) => [...prev, ...newUploadedPhotos]);
    } catch (err) {
      console.error('Ошибка при загрузке фото:', err);
      setErrorMsg('Не удалось загрузить фотографии. Попробуйте другой файл или меньший размер.');
    } finally {
      setUploading(false);
    }
  };

  // Удаление фото из списка
  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (photos.length === 0) {
      setErrorMsg('Пожалуйста, загрузите хотя бы одну фотографию объекта.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photos,
        }),
      });

      if (!res.ok) throw new Error('Ошибка сервера');

      setIsSuccess(true);
    } catch (err) {
      setErrorMsg('Не удалось отправить объект. Проверьте заполнение полей.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Dag<span className="text-blue-600">Booking</span>
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
              <p className="text-slate-600 text-sm">
                Ваш дом/номер опубликован на сайте и доступен для бронирования.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link href="/" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-center hover:bg-blue-700 transition-colors">
                  Посмотреть в каталоге
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Партнерам и владельцам</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900">Сдать жилье в Избербаше</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Заполните базовые данные и выберите фотографии со своего устройства.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Название объекта *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Пример: Уютный коттедж у Каспийского моря"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Тип жилья</label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleChange}
                      className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="house">Дом / Коттедж</option>
                      <option value="room">Номер в отеле/гостевом доме</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Цена за сутки (₽) *</label>
                    <input
                      type="number"
                      name="price_per_night"
                      required
                      placeholder="5000"
                      value={formData.price_per_night}
                      onChange={handleChange}
                      className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Расстояние до моря (в метрах) *</label>
                    <input
                      type="number"
                      name="distance_to_sea"
                      required
                      placeholder="150"
                      value={formData.distance_to_sea}
                      onChange={handleChange}
                      className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Макс. спальных мест</label>
                    <input
                      type="number"
                      name="max_guests"
                      required
                      placeholder="6"
                      value={formData.max_guests}
                      onChange={handleChange}
                      className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Адрес объекта *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="г. Избербаш, ул. Приморская, д. 15"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* БЛОК ЗАГРУЗКИ ФОТОГРАФИЙ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Фотографии объекта *
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {photos.map((url, index) => (
                      <div key={index} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={url} alt="Загруженное фото" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <label className="h-24 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors">
                      <ImagePlus className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600">Добавить</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploading && (
                    <p className="text-xs text-blue-600 font-medium animate-pulse">
                      Идет загрузка фотографий...
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Описание жилья</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Панорамные окна, беседка, закрытый двор..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-4 rounded-2xl transition-colors shadow-lg shadow-blue-500/25"
                >
                  {loading ? 'Публикация объекта...' : 'Опубликовать объект'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}