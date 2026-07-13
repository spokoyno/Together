export function daysBetween(from: string, to = new Date()): number {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function daysUntil(dateIso: string, from = new Date()): number {
  const target = new Date(dateIso);
  target.setHours(0, 0, 0, 0);
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const diff = target.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export function formatDateRu(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateLocalized(locale: string, value: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTimeRu(value: string): string {
  return formatDateTimeLocalized("ru-RU", value);
}

export function formatDateTimeLocalized(locale: string, value: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function relativeTimeRu(value: string): string {
  return relativeTimeLocalized("ru-RU", value);
}

export function relativeTimeLocalized(locale: string, value: string): string {
  const diffSec = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const absSec = Math.abs(diffSec);
  if (absSec < 60) {
    return rtf.format(Math.round(diffSec), "second");
  }

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }

  const diffDay = Math.round(diffSec / 86400);
  return rtf.format(diffDay, "day");
}

export function formatMessageTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `вчера, ${new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)}`;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatChatDayHeader(value: string): string {
  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return "Сегодня";
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function getChatDayKey(value: string): string {
  return value.slice(0, 10);
}
