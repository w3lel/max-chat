/** Оставляет только цифры, 8XXXXXXXXXX → 7XXXXXXXXXX */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length === 10) digits = `7${digits}`;
  return digits;
}

export function isValidPhone(digits: string): boolean {
  return /^\d{10,15}$/.test(digits);
}

/** 79991234567 → +7 999 123-45-67 */
export function formatPhone(digits: string): string {
  const m = digits.match(/^7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+7 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : `+${digits}`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function formatDay(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function initials(title: string): string {
  // только буквы: для чатов-номеров телефона инициалов нет — Avatar покажет иконку
  const letters = title.replace(/[^\p{L} ]/gu, '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]);
  return letters.join('').toUpperCase();
}

/** Стабильный цвет аватарки по строке */
export function avatarHue(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
