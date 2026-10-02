type P = { className?: string };

export const Logo = ({ className }: P) => (
  <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3d7bff" />
        <stop offset="1" stopColor="#8f4dff" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="9" fill="url(#logo-g)" />
    <path d="M9 21V11l7 6 7-6v10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SendIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.4 20.4 21 12 3.4 3.6l.01 6.53L15 12 3.41 13.87z" fill="currentColor" />
  </svg>
);

export const PlusIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BackIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LogoutIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Галочки статуса: одна — отправлено, две — доставлено, синие — прочитано */
export const Ticks = ({ status }: { status?: string }) => {
  if (status === 'pending')
    return (
      <svg className="ticks" viewBox="0 0 12 12" aria-label="Отправляется">
        <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 3.5V6l1.6 1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  if (status === 'failed') return <span className="ticks ticks--failed" aria-label="Ошибка">!</span>;
  const double = status === 'delivered' || status === 'read';
  return (
    <svg className={`ticks ${status === 'read' ? 'ticks--read' : ''}`} viewBox="0 0 18 12" aria-label={status}>
      <path d="M1 6.5 4.5 10 11 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {double && (
        <path d="M7 9.2 7.8 10 14.3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};
