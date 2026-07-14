export function formatTimeRange(times: string[]): string {
  if (times.length === 0) return "";
  if (times.length === 1) return times[0];
  return `${times[0]}–${times[times.length - 1]}`;
}
