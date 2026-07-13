export function UserAvatar({
  name,
  size = "md",
  href,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  const sizeClass =
    size === "lg" ? "size-16 text-xl" : size === "sm" ? "size-10 text-sm" : "size-12 text-base";

  const inner = (
    <div
      className={`grid ${sizeClass} place-items-center rounded-full bg-[var(--accent-soft)] font-bold text-[var(--accent)]`}
    >
      {initial}
    </div>
  );

  if (href) {
    return (
      <a aria-label={name} className="block transition-transform active:scale-95" href={href}>
        {inner}
      </a>
    );
  }

  return inner;
}
