export function getLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getLocalDateOffset(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDaysLeft(dueDate: string, lang: string): string {
  const today = getLocalDate();
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.floor((due.getTime() - new Date(today + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return lang === "th" ? `เลย ${Math.abs(diffDays)} วัน` : `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return lang === "th" ? "วันนี้" : "Today";
  return `${diffDays}${lang === "th" ? " วัน" : "d"}`;
}

export function isOverdue(dueDate: string): boolean {
  return dueDate < getLocalDate();
}

export function isToday(dueDate: string): boolean {
  return dueDate === getLocalDate();
}
