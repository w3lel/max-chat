import { avatarHue, initials } from '../utils/format';

export function Avatar({ title, seed, size = 48 }: { title: string; seed: string; size?: number }) {
  const hue = avatarHue(seed);
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 75% 62%), hsl(${(hue + 40) % 360} 70% 52%))`,
      }}
      aria-hidden="true"
    >
      {initials(title) || (
        <svg viewBox="0 0 24 24" width="55%" height="55%" fill="currentColor">
          <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
        </svg>
      )}
    </span>
  );
}
