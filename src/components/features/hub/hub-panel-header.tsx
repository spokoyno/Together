import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type HubPanelHeaderProps = {
  title: string;
  subtitle?: string;
};

export function HubPanelHeader({ title, subtitle }: HubPanelHeaderProps) {
  return (
    <header className="mb-6">
      <Link
        className="mb-4 inline-flex min-h-11 items-center gap-1 rounded-2xl px-1 text-sm font-semibold text-[var(--accent)]"
        href="/memories"
      >
        <ChevronLeft aria-hidden className="size-5" />
        Лента
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
    </header>
  );
}
