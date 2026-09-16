import type { ComponentProps, ReactNode } from "react";
import { Delete } from "lucide-react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------- Button --------------------------------- */

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "outline" | "ghost" | "gold" | "danger" | "ink";
  size?: "sm" | "md" | "lg";
  block?: boolean;
};

const BUTTON_VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-coral text-white hover:bg-coral-dark shadow-sm shadow-coral/25",
  outline: "border border-line-strong bg-surface text-ink hover:bg-cream",
  ghost: "text-ink-soft hover:bg-cream-deep hover:text-ink",
  gold: "bg-gold text-white hover:bg-gold-dark shadow-sm shadow-gold/25",
  danger: "bg-danger text-white hover:brightness-95",
  ink: "bg-ink text-cream hover:brightness-110",
};

const BUTTON_SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-14 px-6 text-[15px] rounded-2xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center font-semibold transition active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-45",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        block && "w-full",
        className
      )}
    />
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cx("rounded-2xl border border-line bg-surface", className)}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral">
            {icon}
          </span>
        )}
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------- Fields --------------------------------- */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      {label && (
        <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </span>
      )}
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-ink-faint">{hint}</span>}
    </label>
  );
}

const CONTROL =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-coral focus:ring-4 focus:ring-coral/12 disabled:bg-cream-deep";

/** `sizing` menggantikan kelas tinggi agar tidak bentrok dengan kelas dasar. */
export function Input({
  className,
  sizing = "md",
  ...props
}: ComponentProps<"input"> & { sizing?: "md" | "lg" }) {
  return (
    <input
      {...props}
      className={cx(
        CONTROL,
        sizing === "lg" ? "h-14 font-display text-xl font-semibold" : "h-11",
        className
      )}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...props} className={cx(CONTROL, "h-11 pr-9", className)}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(CONTROL, "py-2.5", className)} />;
}

/* ---------------------------------- Badge ---------------------------------- */

type Tone = "coral" | "gold" | "leaf" | "neutral" | "danger";

const TONES: Record<Tone, string> = {
  coral: "bg-coral-soft text-coral-dark",
  gold: "bg-gold-soft text-gold-dark",
  leaf: "bg-leaf-soft text-leaf",
  neutral: "bg-cream-deep text-ink-soft",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Sheet ---------------------------------- */

export function Sheet({
  onClose,
  children,
  maxWidth = "max-w-md",
}: {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cx(
          "animate-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl",
          maxWidth
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {children}
      </div>
    </div>
  );
}

/* --------------------------------- Numpad ---------------------------------- */

export function Numpad({
  value,
  onChange,
  length = 4,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const press = (digit: string) => {
    if (value.length < length) onChange(value + digit);
  };

  return (
    <div>
      <div className="mb-5 flex justify-center gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={cx(
              "h-3.5 w-3.5 rounded-full transition",
              i < value.length ? "scale-110 bg-coral" : "bg-line-strong"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <NumpadKey key={d} onClick={() => press(d)}>
            {d}
          </NumpadKey>
        ))}
        <NumpadKey onClick={() => onChange("")} muted>
          <span className="text-[13px] font-semibold">Hapus</span>
        </NumpadKey>
        <NumpadKey onClick={() => press("0")}>0</NumpadKey>
        <NumpadKey onClick={() => onChange(value.slice(0, -1))} muted>
          <Delete size={19} />
        </NumpadKey>
      </div>
    </div>
  );
}

function NumpadKey({
  children,
  onClick,
  muted,
}: {
  children: ReactNode;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex h-14 items-center justify-center rounded-xl text-xl font-semibold transition active:scale-95",
        muted
          ? "text-ink-soft hover:bg-cream-deep"
          : "border border-line bg-cream text-ink hover:border-coral/40 hover:bg-coral-soft"
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Feedback --------------------------------- */

export function Alert({ children, tone = "danger" }: { children: ReactNode; tone?: Tone }) {
  return (
    <p
      className={cx(
        "rounded-xl px-3.5 py-2.5 text-[13px] font-medium leading-snug",
        TONES[tone]
      )}
    >
      {children}
    </p>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon && <span className="text-ink-faint">{icon}</span>}
      <p className="font-display text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-[13px] text-ink-soft">{description}</p>}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  decIcon,
  incIcon,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  decIcon: ReactNode;
  incIcon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-cream p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-coral shadow-sm transition active:scale-90 disabled:opacity-35"
      >
        {decIcon}
      </button>
      <span className="min-w-8 text-center text-[15px] font-bold tabular-nums text-ink">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-coral shadow-sm transition active:scale-90 disabled:opacity-35"
      >
        {incIcon}
      </button>
    </div>
  );
}
