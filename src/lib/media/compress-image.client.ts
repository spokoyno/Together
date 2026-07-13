"use client";

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;
const SKIP_COMPRESS_BELOW = 350_000;

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type");
  }

  if (file.size <= SKIP_COMPRESS_BELOW && (file.type === "image/jpeg" || file.type === "image/webp")) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (file.size <= 5 * 1024 * 1024) {
      return file;
    }
    throw new Error("Image too large");
  }

  try {
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const scale = longestSide > MAX_SIDE ? MAX_SIDE / longestSide : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    if (!blob) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
