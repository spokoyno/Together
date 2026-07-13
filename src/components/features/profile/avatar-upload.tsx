"use client";

import { useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLanguage } from "@/components/providers/language-provider";
import { compressAvatarFile } from "@/lib/media/compress-image.client";
import { uploadAvatarClient } from "@/lib/media/upload.client";
import { saveAvatarPath } from "@/lib/profile/actions";

type AvatarUploadProps = {
  name: string;
  userId: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

export function AvatarUpload({ name, userId, imageUrl, size = "lg" }: AvatarUploadProps) {
  const { t } = useLanguage();
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const displayUrl = overrideUrl ?? imageUrl ?? null;
  const busy = isPending || isPreparing;

  async function handlePick(file: File) {
    setError("");
    setIsPreparing(true);

    let localPreview: string | null = null;

    try {
      const prepared = await compressAvatarFile(file);
      localPreview = URL.createObjectURL(prepared);
      setOverrideUrl(localPreview);

      startTransition(async () => {
        const uploaded = await uploadAvatarClient(userId, prepared);
        if (!uploaded.ok) {
          setError(uploaded.error);
          setOverrideUrl(null);
          if (localPreview) {
            URL.revokeObjectURL(localPreview);
          }
          return;
        }

        const saved = await saveAvatarPath(uploaded.path);
        if (!saved.ok) {
          setError(saved.error);
          setOverrideUrl(null);
          if (localPreview) {
            URL.revokeObjectURL(localPreview);
          }
          return;
        }

        if (localPreview) {
          URL.revokeObjectURL(localPreview);
        }
        setOverrideUrl(saved.avatarUrl);
      });
    } catch {
      setError(t("hubErrorPhoto"));
      setOverrideUrl(null);
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    } finally {
      setIsPreparing(false);
    }
  }

  const buttonSize =
    size === "lg" ? "size-8" : size === "sm" ? "size-6" : "size-7";
  const iconSize = size === "lg" ? "size-4" : "size-3.5";

  return (
    <div className="relative shrink-0">
      <UserAvatar imageUrl={displayUrl} name={name} size={size} />

      <PhotoSourcePicker
        accept="image/jpeg,image/png,image/webp"
        cameraFacing="user"
        disabled={busy}
        onSelect={(file) => void handlePick(file)}
        renderTrigger={({ open, disabled }) => (
          <button
            aria-label={t("profileChangeAvatar")}
            className={`absolute -bottom-0.5 -right-0.5 grid ${buttonSize} place-items-center rounded-full bg-[var(--accent)] text-white shadow-md transition-transform active:scale-95 disabled:opacity-60`}
            disabled={disabled}
            onClick={open}
            type="button"
          >
            {busy ? (
              <Loader2 aria-hidden className={`${iconSize} animate-spin`} />
            ) : (
              <Camera aria-hidden className={iconSize} />
            )}
          </button>
        )}
      />

      {error ? <p className="absolute left-0 top-full mt-1 w-40 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
