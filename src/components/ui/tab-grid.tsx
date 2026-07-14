"use client";

type TabGridProps<T extends string> = {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
};

export function TabGrid<T extends string>({ tabs, value, onChange }: TabGridProps<T>) {
  const gridClass =
    tabs.length === 2
      ? "grid-cols-2"
      : tabs.length === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div className={`mb-4 grid gap-2 ${gridClass}`}>
      {tabs.map((tab) => (
        <button
          className={`min-h-11 rounded-2xl px-2 py-2.5 text-center text-sm font-semibold leading-tight ${
            value === tab.id ? "bg-[var(--accent)] text-white" : "surface-input"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
