"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { uploadAvatar } from "@/lib/profile/actions";

type AvatarUploadProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

export function AvatarUpload({ name, imageUrl, size = "lg" }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const displayUrl = overrideUrl ?? imageUrl ?? null;

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    const localPreview = URL.createObjectURL(file);
    setOverrideUrl(localPreview);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (!result.ok) {
        setError(result.error);
        setOverrideUrl(null);
        URL.revokeObjectURL(localPreview);
        return;
      }

      URL.revokeObjectURL(localPreview);
      setOverrideUrl(result.avatarUrl);
    });
  }

  const buttonSize =
    size === "lg" ? "size-8" : size === "sm" ? "size-6" : "size-7";
  const iconSize = size === "lg" ? "size-4" : "size-3.5";

  return (
    <div className="relative shrink-0">
      <UserAvatar imageUrl={displayUrl} name={name} size={size} />

      <button
        aria-label="Изменить аватар"
        className={`absolute -bottom-0.5 -right-0.5 grid ${buttonSize} place-items-center rounded-full bg-[var(--accent)] text-white shadow-md transition-transform active:scale-95 disabled:opacity-60`}
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden className={`${iconSize} animate-spin`} />
        ) : (
          <Camera aria-hidden className={iconSize} />
        )}
      </button>

      <input
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        className="hidden"
        onChange={handlePick}
        ref={inputRef}
        type="file"
      />

      {error ? <p className="absolute left-0 top-full mt-1 w-40 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
