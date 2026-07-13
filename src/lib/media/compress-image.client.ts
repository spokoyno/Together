"use client";

export type CompressImageOptions = {
  maxSide?: number;
  quality?: number;
  skipBelow?: number;
};

const DEFAULT_MAX_SIDE = 1600;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_SKIP_BELOW = 350_000;

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxSide = options.maxSide ?? DEFAULT_MAX_SIDE;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const skipBelow = options.skipBelow ?? DEFAULT_SKIP_BELOW;

  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type");
  }

  if (file.size <= skipBelow && (file.type === "image/jpeg" || file.type === "image/webp")) {
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
    const scale = longestSide > maxSide ? maxSide / longestSide : 1;
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
      canvas.toBlob(resolve, "image/jpeg", quality);
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

/** Square crop + compress — for avatars. */
export async function compressAvatarFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return compressImageFile(file, { maxSide: 512, quality: 0.82, skipBelow: 0 });
  }

  try {
    const size = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - size) / 2);
    const sy = Math.floor((bitmap.height - size) / 2);
    const outputSize = 512;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");
    if (!context) {
      return compressImageFile(file, { maxSide: 512, quality: 0.82, skipBelow: 0 });
    }

    context.drawImage(bitmap, sx, sy, size, size, 0, 0, outputSize, outputSize);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob) {
      throw new Error("Compression failed");
    }

    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
