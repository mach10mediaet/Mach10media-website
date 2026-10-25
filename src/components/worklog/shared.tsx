import { ReactNode, useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

/** Ticking `Date.now()`, re-rendering on an interval while `active`. */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);
  return now;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">
      {children}
    </label>
  );
}

export const inputClass =
  'w-full border border-white/10 bg-black/50 px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-white/30';

export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
      <div>
        <h1 className="font-sans text-2xl font-light text-white">{title}</h1>
        {subtitle && (
          <p className="font-mono text-[9px] text-[#8c8c8c] tracking-wider uppercase mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const BADGE_TONES = {
  neutral: 'border-white/10 bg-white/5 text-neutral-300',
  green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  amber: 'border-[#F9A136]/25 bg-[#F9A136]/10 text-[#f7d6a0]',
  red: 'border-red-500/25 bg-red-950/20 text-red-300',
  blue: 'border-sky-500/25 bg-sky-500/10 text-sky-300'
} as const;

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/10 bg-white/[0.015] px-5 py-8 justify-center">
      <ShieldAlert className="h-4 w-4 text-neutral-600" />
      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{message}</p>
    </div>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-sans text-lg text-white">{title}</h2>
          <button onClick={onCancel} aria-label="Close" className="text-neutral-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="border border-red-500/30 bg-red-950/30 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50"
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
