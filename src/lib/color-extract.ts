/**
 * Extrae el color dominante y una versión suavizada para el fondo ambiental difuminado.
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('#1f1f1f');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#1f1f1f');
          return;
        }

        // Reducir la imagen a un tamaño pequeño para cálculo rápido
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const alpha = data[i + 3];

          if (alpha > 128) {
            // Ignorar píxeles casi negros o casi blancos puros para captar el matiz real
            const brightness = (red + green + blue) / 3;
            if (brightness > 25 && brightness < 235) {
              r += red;
              g += green;
              b += blue;
              count++;
            }
          }
        }

        if (count === 0) {
          resolve('#2b2b2b');
          return;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        resolve(hex);
      } catch {
        resolve('#262626');
      }
    };

    img.onerror = () => {
      resolve('#262626');
    };
  });
}
