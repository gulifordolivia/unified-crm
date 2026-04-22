const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const compactDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function formatShortDate(value: Date | string) {
  return shortDateFormatter.format(toDate(value));
}

export function formatCompactDate(value: Date | string) {
  return compactDateFormatter.format(toDate(value));
}

export function daysUntil(value: Date | string) {
  const now = new Date();
  const target = toDate(value);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function daysSince(value: Date | string) {
  return Math.max(0, -daysUntil(value));
}

export function formatRelativeWindow(value: Date | string) {
  const delta = daysUntil(value);

  if (delta < 0) {
    return `${Math.abs(delta)}d overdue`;
  }

  if (delta === 0) {
    return "Due today";
  }

  if (delta === 1) {
    return "Due tomorrow";
  }

  return `In ${delta}d`;
}

export function isWithinDays(value: Date | string, windowDays: number) {
  const delta = daysUntil(value);
  return delta >= 0 && delta <= windowDays;
}
