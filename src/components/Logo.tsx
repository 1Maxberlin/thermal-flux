/** Brand mark: a stylised flow-through-pipe droplet with a thermal arc. */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Thermaflux logo">
      <defs>
        <linearGradient id="tf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
        <linearGradient id="tf-grad-2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--flame)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#tf-grad)" opacity="0.14" />
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="13"
        fill="none"
        stroke="url(#tf-grad)"
        strokeWidth="1.6"
        opacity="0.55"
      />
      <path
        d="M9 31c6.5 0 6.5-9 13-9s6.5 9 13 9 6.5-4.5 4-6.5"
        fill="none"
        stroke="url(#tf-grad-2)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 8.5c3.6 4.4 5.6 7.4 5.6 10a5.6 5.6 0 1 1-11.2 0c0-2.6 2-5.6 5.6-10Z"
        fill="url(#tf-grad)"
        opacity="0.95"
      />
      <circle cx="24" cy="19.5" r="1.9" fill="var(--surface)" opacity="0.9" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="leading-tight">
      <span className="block font-display text-base font-extrabold tracking-tight">
        Therma<span className="text-gradient">flux</span>
      </span>
      <span className="block text-[11px] font-medium text-muted-foreground">
        Flow &amp; Thermal Studio
      </span>
    </span>
  );
}
