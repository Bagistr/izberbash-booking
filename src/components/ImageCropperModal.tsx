'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, PixelCrop } from '@/utils/cropImage';
import { Crop, ZoomIn, Check, X, AlertTriangle } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  originalWidth: number;
  originalHeight: number;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  originalWidth,
  originalHeight,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number>(16 / 9); // 16:9 по умолчанию
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);

  const isLowResolution = originalWidth < 1200 || originalHeight < 800;

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback(
    (_: any, croppedAreaPixels: PixelCrop) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(croppedFile);
      onCropComplete(croppedFile, previewUrl);
    } catch (e) {
      console.error('Ошибка кадрирования:', e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 relative shadow-2xl flex flex-col space-y-4 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Crop className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-slate-100">Кадрирование фотографии</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Предупреждение о низком разрешении */}
        {isLowResolution && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3.5 py-2 rounded-2xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              Исходное фото ({originalWidth}×{originalHeight}px) меньше рекомендуемых 1200×800px.
            </span>
          </div>
        )}

        {/* Рабочая область кроппера */}
        <div className="relative w-full h-[320px] sm:h-[400px] bg-black rounded-2xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            showGrid={true}
          />
        </div>

        {/* Панель настроек пропорций и зума */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Переключатель пропорций */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Формат:</span>
            <button
              type="button"
              onClick={() => setAspect(16 / 9)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                aspect === 16 / 9
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              16:9 (Широкий)
            </button>
            <button
              type="button"
              onClick={() => setAspect(4 / 3)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                aspect === 4 / 3
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              4:3 (Классический)
            </button>
          </div>

          {/* Ползунок Зума */}
          <div className="flex items-center space-x-2 w-full sm:w-48">
            <ZoomIn className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2.5 rounded-xl"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={processing}
            className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{processing ? 'Конвертация в WebP...' : 'Применить и сохранить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};