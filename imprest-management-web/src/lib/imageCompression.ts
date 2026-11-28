/**
 * Browser-side image compression and WebP conversion utility.
 * - Downscales large smartphone photos proportionally to maxDimension (default 1920px).
 * - Converts to WebP format in the browser via HTML5 Canvas.
 * - Reduces 5MB+ photos to ~150-250KB before network transmission.
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 1920,
  quality = 0.82
): Promise<File> {
  // If not an image or is SVG/GIF, return unchanged
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file); // Fail-safe: return original file on error
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let { width, height } = img;

        // Proportionally scale down if wider or taller than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Fill white background for transparent images
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create optimized WebP file
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const webpFile = new File([blob], `${originalName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple files in parallel.
 */
export async function compressImages(
  files: FileList | File[],
  maxDimension = 1920,
  quality = 0.82
): Promise<File[]> {
  const fileArray = Array.from(files);
  return Promise.all(
    fileArray.map((f) => compressImageToWebP(f, maxDimension, quality))
  );
}
