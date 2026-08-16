export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  
  /**
   * Обрезает изображение по координатам, масштабирует до высокого разрешения (1600px+) и конвертирует в WebP
   */
  export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: PixelCrop
  ): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      throw new Error('Не удалось получить 2D контекст канваса');
    }
  
    // Целевое высокое разрешение для идеальной резкости на Retina экранах
    const targetWidth = Math.max(pixelCrop.width, 1600);
    const targetHeight = Math.round(targetWidth * (pixelCrop.height / pixelCrop.width));
  
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  
    // Качественное сглаживание
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Ошибка создания WebP файла'));
            return;
          }
          const file = new File([blob], `property-photo-${Date.now()}.webp`, {
            type: 'image/webp',
          });
          resolve(file);
        },
        'image/webp',
        0.88 // 88% WebP качество (идеальный баланс резкости и малого веса)
      );
    });
  }