export function getCurrentFormattedTime(): string {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, '0');

  const year = now.getFullYear().toString().slice(-2);
  const month = pad(now.getMonth() + 1); // 0-based
  const day = pad(now.getDate());

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
