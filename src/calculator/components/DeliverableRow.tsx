import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface DeliverableRowProps {
  id: string;
  num: string;
  title: string;
  specs: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  tierUnlocked?: boolean;
  badgeText?: string | null;
  badgeTone?: 'amber' | 'neutral';
  disabled?: boolean;
  hint?: string | null;
}

export const DeliverableRow: React.FC<DeliverableRowProps> = ({
  id,
  num,
  title,
  specs,
  value,
  min = 0,
  max = 60,
  onChange,
  tierUnlocked,
  badgeText,
  badgeTone = 'amber',
  disabled = false,
  hint = null,
}) => {
  const effectiveMax = Math.max(min, max);
  const clampedValue = Math.max(min, Math.min(effectiveMax, value));
  const isDisabled = disabled || effectiveMax <= min;

  const handleDecrement = () => {
    if (!isDisabled && clampedValue > min) onChange(clampedValue - 1);
  };

  const handleIncrement = () => {
    if (!isDisabled && clampedValue < effectiveMax) onChange(clampedValue + 1);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) {
      onChange(0);
    } else {
      onChange(Math.max(min, Math.min(effectiveMax, parsed)));
    }
  };

  const resolvedBadge = badgeText ?? (tierUnlocked ? 'Volume Rate' : null);

  return (
    <div className="group border-t border-white/8 py-4 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span
            className={`pt-0.5 font-mono text-xs transition-colors ${
              clampedValue > 0 ? 'text-[#F9A136]' : 'text-[#8c8c8c]'
            }`}
          >
            {num}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <label
                htmlFor={`input-${id}`}
                className={`font-sans text-sm font-medium tracking-tight transition-colors sm:text-base ${
                  isDisabled
                    ? 'text-[#a3a3a3] cursor-not-allowed'
                    : 'text-[#f2f2f2] group-hover:text-white cursor-pointer'
                }`}
              >
                {title}
              </label>
              {resolvedBadge && (
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] uppercase ${
                    badgeTone === 'amber'
                      ? 'border-[#F9A136]/30 bg-[#F9A136]/10 text-[#F9A136]'
                      : 'border-white/12 bg-white/5 text-[#a3a3a3]'
                  }`}
                >
                  {resolvedBadge}
                </span>
              )}
            </div>
            <p className="mt-0.5 font-sans text-xs text-[#808080]">{specs}</p>
            {hint && (
              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#F9A136]/80">
                {hint}
              </p>
            )}
          </div>
        </div>

        {/* Clean Stepper */}
        <div className="flex shrink-0 items-center rounded-full border border-white/12 bg-white/[0.02] p-1">
          <button
            type="button"
            aria-label={`Decrease ${title}`}
            onClick={handleDecrement}
            disabled={isDisabled || clampedValue <= min}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#8c8c8c] transition-colors hover:bg-white/10 hover:text-white disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <input
            id={`input-${id}`}
            type="number"
            min={min}
            max={effectiveMax}
            value={clampedValue}
            disabled={isDisabled}
            onChange={handleDirectInput}
            className="w-10 bg-transparent text-center font-mono text-sm font-medium text-white tabular-nums focus:outline-none disabled:opacity-40"
          />

          <button
            type="button"
            aria-label={`Increase ${title}`}
            onClick={handleIncrement}
            disabled={isDisabled || clampedValue >= effectiveMax}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#f2f2f2] transition-colors hover:bg-[#F9A136] hover:text-[#080808] disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
