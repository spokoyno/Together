"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ImageIcon } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

type PhotoSourcePickerProps = {
  accept?: string;
  cameraFacing?: "user" | "environment";
  disabled?: boolean;
  multiple?: boolean;
  onSelect: (file: File) => void;
  onSelectMany?: (files: File[]) => void;
  renderTrigger: (props: { open: () => void; disabled?: boolean }) => React.ReactNode;
};

export function PhotoSourcePicker({
  accept = "image/jpeg,image/png,image/webp,image/gif",
  cameraFacing = "environment",
  disabled,
  multiple,
  onSelect,
  onSelectMany,
  renderTrigger,
}: PhotoSourcePickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>, fromGallery = false) {
    if (fromGallery && multiple && onSelectMany) {
      const files = event.target.files ? Array.from(event.target.files) : [];
      event.target.value = "";
      close();
      if (files.length) {
        onSelectMany(files);
      }
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = "";
    close();
    if (file) {
      onSelect(file);
    }
  }

  function openSource(source: "camera" | "gallery") {
    close();
    window.requestAnimationFrame(() => {
      if (source === "camera") {
        cameraRef.current?.click();
        return;
      }
      galleryRef.current?.click();
    });
  }

  const sheet = open ? (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+1rem)]"
      onClick={close}
      role="presentation"
    >
      <div
        className="surface-panel w-full max-w-md rounded-3xl p-3 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={t("photoSourcePicker")}
      >
        <p className="px-2 py-2 text-center text-sm font-semibold text-[var(--muted)]">
          {t("photoAdd")}
        </p>
        <button
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition-colors hover:bg-[var(--input-bg)]"
          onClick={() => openSource("camera")}
          type="button"
        >
          <span className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Camera aria-hidden className="size-5" />
          </span>
          {t("photoFromCamera")}
        </button>
        <button
          className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition-colors hover:bg-[var(--input-bg)]"
          onClick={() => openSource("gallery")}
          type="button"
        >
          <span className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <ImageIcon aria-hidden className="size-5" />
          </span>
          {t("photoFromGallery")}
        </button>
        <button
          className="mt-2 w-full rounded-2xl surface-input px-4 py-3 font-semibold"
          onClick={close}
          type="button"
        >
          {t("commonCancel")}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {renderTrigger({
        disabled,
        open: () => {
          if (!disabled) {
            setOpen(true);
          }
        },
      })}

      {open && typeof document !== "undefined" ? createPortal(sheet, document.body) : null}

      <input
        accept="image/*"
        className="hidden"
        multiple={multiple}
        onChange={(event) => handleChange(event, true)}
        ref={galleryRef}
        type="file"
      />
      <input
        accept={accept}
        capture={cameraFacing}
        className="hidden"
        onChange={(event) => handleChange(event)}
        ref={cameraRef}
        type="file"
      />
    </>
  );
}
