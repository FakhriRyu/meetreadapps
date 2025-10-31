const DEFAULT_LOCALE = "id-ID";
const DEFAULT_TIME_ZONE = "Asia/Jakarta";

type DateLike = Date | string | number | null | undefined;

function normalizeDate(input: DateLike): Date | null {
  if (input == null) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = {},
  locale = DEFAULT_LOCALE,
) {
  const date = normalizeDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: DEFAULT_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatTime(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = {},
  locale = DEFAULT_LOCALE,
) {
  const date = normalizeDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DEFAULT_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatDateTime(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = {},
  locale = DEFAULT_LOCALE,
) {
  const date = normalizeDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DEFAULT_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
  locale = DEFAULT_LOCALE,
) {
  if (value == null) return "-";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) return "-";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    ...options,
  }).format(numeric);
}

export { DEFAULT_LOCALE, DEFAULT_TIME_ZONE };
