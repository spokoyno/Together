import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Главная" },
  { href: "/plans", label: "Планы" },
  { href: "/memories", label: "Моменты" },
  { href: "/profile", label: "Профиль" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 justify-around rounded-3xl border border-[var(--border)] bg-white/95 p-3 text-sm shadow-lg backdrop-blur">
      {links.map((link) => (
        <Link className="min-h-11 min-w-11 px-2 py-2 text-center" href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
