/** Motif bunga Martinez at Symphonia (logo resmi, di-crop dari lockup asli). */
export function MartinezMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-martinez-mark.png"
      alt="Martinez at Symphonia"
      className={`object-contain ${className}`}
    />
  );
}

/** Lockup lengkap (motif + wordmark) dari file logo asli. */
export function MartinezLogoFull({ className = "h-24" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-martinez-full.png"
      alt="Martinez at Symphonia"
      className={`object-contain ${className}`}
    />
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
