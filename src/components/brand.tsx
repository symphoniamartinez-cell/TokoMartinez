const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const OUTER_PETAL =
  "M50 6 C54.5 15 57 23 57 29 C57 35.5 54 40 50 40 C46 40 43 35.5 43 29 C43 23 45.5 15 50 6 Z";
const INNER_PETAL =
  "M50 24 C52.5 29 54 33 54 36.5 C54 39.8 52.3 41.5 50 41.5 C47.7 41.5 46 39.8 46 36.5 C46 33 47.5 29 50 24 Z";

/** Motif bunga Martinez at Symphonia. */
export function MartinezMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Martinez at Symphonia">
      <g fill="var(--color-coral)">
        {ANGLES.map((a) => (
          <path key={`o${a}`} d={OUTER_PETAL} transform={`rotate(${a} 50 50)`} />
        ))}
      </g>
      <g fill="var(--color-coral)" opacity="0.55">
        {ANGLES.map((a) => (
          <path key={`i${a}`} d={INNER_PETAL} transform={`rotate(${a + 22.5} 50 50)`} />
        ))}
      </g>
      <g fill="var(--color-gold)">
        {ANGLES.map((a) => (
          <circle key={`d${a}`} cx="50" cy="18" r="3" transform={`rotate(${a + 22.5} 50 50)`} />
        ))}
      </g>
      <circle cx="50" cy="50" r="7.5" fill="var(--color-coral)" />
    </svg>
  );
}

export function Wordmark({
  subtitle = "at Symphonia",
  className = "",
}: {
  subtitle?: string | null;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MartinezMark className="h-8 w-8 shrink-0" />
      <div className="leading-none">
        <p className="font-display text-[15px] font-semibold tracking-[0.14em] text-ink">
          MARTINEZ
        </p>
        {subtitle && (
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-faint">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
