'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Waves, ArrowLeft, Building2, X, CheckCircle2, ImagePlus, Plus, Trash2, Layers, Check, Home } from 'lucide-react';
import { ImageCropperModal } from '@/components/ImageCropperModal';

const PRESET_AMENITIES = [
  'Wi-Fi', 'Кондиционер', 'Мангал', 'Бассейн', 'Беседка', 
  'Лежак / Шезлонг', 'Парковка', 'Баня / Сауна', 'Вид на море', 
  'Стиральная машина', 'Телевизор', 'Детская площадка'
];

export default function AddPropertyPage() {
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

  const [units, setUnits] = useState<string[]>(['Домик №1', 'Домик №2']);
  const [newUnitName, setNewUnitName] = useState('');

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Wi-Fi', 'Кондиционер', 'Мангал'
  ]);
  const [customAmenitiesList, setCustomAmenitiesList] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  
  // Фотографии
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Состояния для кадрирования
  const [pendingFileQueue, setPendingFileQueue] = useState<File[]>([]);
  const [currentCroppingImage, setCurrentCroppingImage] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);

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

  // 1. При выборе файлов открываем первый файл в кроппере
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const firstFile = fileList[0];
    const remaining = fileList.slice(1);

    setPendingFileQueue(remaining);
    openCropForFile(firstFile);
    e.target.value = '';
  };

  const openCropForFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setCurrentCroppingImage({
        url: objectUrl,
        width: img.width,
        height: img.height,
      });
    };
    img.src = objectUrl;
  };

  // 2. После кадрирования одного файла отправляем WebP в Cloudinary
  const handleCropComplete = async (croppedWebpFile: File) => {
    setCurrentCroppingImage(null);
    setUploading(true);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (cloudName && uploadPreset) {
      try {
        const data = new FormData();
        data.append('file', croppedWebpFile);
        data.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: data,
        });

        if (res.ok) {
          const fileData = await res.json();
          setPhotos((prev) => [...prev, fileData.secure_url]);
        }
      } catch (err) {
        console.error('Ошибка загрузки в Cloudinary:', err);
      }
    } else {
      // Fallback на DataURL если переменные окружения не заданы
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(croppedWebpFile);
    }

    setUploading(false);

    // Если в очереди есть еще файлы, открываем следующий на кадрирование
    if (pendingFileQueue.length > 0) {
      const nextFile = pendingFileQueue[0];
      setPendingFileQueue((prev) => prev.slice(1));
      openCropForFile(nextFile);
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
              <p className="text-slate-600 text-sm">Ваше объявление опубликовано в каталоге с идеальными пропорциями фото.</p>
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
                <p className="text-xs text-slate-500 mt-1">Заполните параметры и добавьте кадрированные фотографии</p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium">{errorMsg}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ВЫБОР ФОРМАТА */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Что вы сдаете? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setListingFormat('single')}
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
                        <p className="text-[11px] text-slate-500 mt-0.5">Один объект целиком</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setListingFormat('complex')}
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
                    placeholder="Пример: Коттедж «Черная жемчужина»"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* БЛОК ДОМИКОВ ДЛЯ КОМПЛЕКСА */}
                {listingFormat === 'complex' && (
                  <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <label className="text-xs font-bold text-slate-800 uppercase">
                        Домики / Номера ({units.length})
                      </label>
                    </div>

                    <div className="space-y-2">
                      {units.map((u, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold">
                          <span className="text-slate-800">{u}</span>
                          {units.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUnit(idx)}
                              className="text-slate-400 hover:text-red-600 p-1"
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
                        placeholder="Название (напр. Домик №3)"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={addUnit}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1"
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
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Цена за сутки (₽) *</label>
                    <input
                      type="number"
                      name="price_per_night"
                      required
                      placeholder="6000"
                      value={formData.price_per_night}
                      onChange={handleChange}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">До моря (метров) *</label>
                    <input
                      type="number"
                      name="distance_to_sea"
                      required
                      placeholder="80"
                      value={formData.distance_to_sea}
                      onChange={handleChange}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Макс. гостей</label>
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
                    placeholder="г. Избербаш, Райский пляж, линия 26"
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

                {/* ФОТОГРАФИИ С КАДРИРОВАНИЕМ В 16:9 И WEBP */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Фотографии объекта (16:9 или 4:3 WebP) *
                    </label>
                    <span className="text-[11px] text-teal-600 font-bold">
                      {photos.length} загружено
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                    {photos.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm">
                        <img src={url} alt="Загруженное фото" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-600 text-white p-1 rounded-full shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <label className="aspect-video border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-teal-50/40 transition-colors">
                      <ImagePlus className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-600">
                        {uploading ? 'Конвертация...' : '+ Добавить фото'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    При загрузке откроется окно кадрирования, где вы сможете выбрать лучшую область кадра в пропорции 16:9 или 4:3.
                  </p>
                </div>

                {/* УДОБСТВА */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Удобства и бонусы</label>
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
                      placeholder="Например: Сапборды / Беседка"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={addCustomAmenity}
                      className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      Добавить
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Описание</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Панорамные окна, вид на море, мангальная зона..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-4 rounded-2xl transition-colors shadow-lg shadow-teal-500/25"
                >
                  {loading ? 'Публикация...' : 'Опубликовать объект'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛКА КАДРИРОВАНИЯ И СЖАТИЯ WEBP */}
      {currentCroppingImage && (
        <ImageCropperModal
          imageSrc={currentCroppingImage.url}
          originalWidth={currentCroppingImage.width}
          originalHeight={currentCroppingImage.height}
          onCropComplete={handleCropComplete}
          onCancel={() => setCurrentCroppingImage(null)}
        />
      )}
    </main>
  );
}