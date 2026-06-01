// Client-side image compression to <= maxBytes (default 20KB)
// Iteratively reduces JPEG quality then dimensions until target reached.

export async function compressImageToMax(file: File, maxBytes = 20 * 1024): Promise<File> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  URL.revokeObjectURL(url);

  let width = Math.min(img.naturalWidth, 800);
  let height = Math.round((img.naturalHeight / img.naturalWidth) * width);
  let quality = 0.8;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');

  const render = (): Promise<Blob> =>
    new Promise((resolve) => {
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality);
    });

  let blob = await render();
  let safety = 25;
  while (blob.size > maxBytes && safety-- > 0) {
    if (quality > 0.35) {
      quality = Math.max(0.3, quality - 0.1);
    } else {
      width = Math.max(160, Math.floor(width * 0.85));
      height = Math.max(120, Math.floor(height * 0.85));
      quality = 0.7;
    }
    blob = await render();
  }
  return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
}
