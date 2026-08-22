export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Unknown date";

  const delta = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < minute) return "Just now";
  if (delta < hour) {
    const n = Math.floor(delta / minute);
    return `${n} minute${n === 1 ? "" : "s"} ago`;
  }
  if (delta < day) {
    const n = Math.floor(delta / hour);
    return `${n} hour${n === 1 ? "" : "s"} ago`;
  }
  if (delta < 7 * day) {
    const n = Math.floor(delta / day);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
