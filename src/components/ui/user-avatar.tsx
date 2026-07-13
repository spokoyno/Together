export function UserAvatar({
  name,
  size = "md",
  href,
  imageUrl,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  imageUrl?: string | null;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  const sizeClass =
    size === "lg" ? "size-16 text-xl" : size === "sm" ? "size-10 text-sm" : "size-12 text-base";

  const inner = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={`${sizeClass} rounded-full object-cover ring-2 ring-[var(--surface)]`}
      src={imageUrl}
    />
  ) : (
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
