"use client";

import type { FormEventHandler, MouseEventHandler, ReactNode } from "react";

type ModalSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  as?: "div" | "form";
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export function ModalSheet({
  open,
  onClose,
  children,
  className = "",
  as = "div",
  onSubmit,
}: ModalSheetProps) {
  if (!open) {
    return null;
  }

  const stopPropagation: MouseEventHandler = (event) => {
    event.stopPropagation();
  };

  const panelClassName = `max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl ${className}`.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]"
      onClick={onClose}
      role="presentation"
    >
      {as === "form" ? (
        <form className={panelClassName} onClick={stopPropagation} onSubmit={onSubmit}>
          {children}
        </form>
      ) : (
        <div className={panelClassName} onClick={stopPropagation}>
          {children}
        </div>
      )}
    </div>
  );
}
