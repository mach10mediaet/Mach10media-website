import React from 'react';

/* Two-state switch — [OFF] [ON] as real buttons. The active state fills solid
   amber with black text, matching the site-wide selection language, so
   pressability is unmistakable. */
interface TogglePairProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  panelId?: string;
}

const base =
  'rounded-sm px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer';

export const TogglePair: React.FC<TogglePairProps> = ({ label, checked, onToggle, panelId }) => {
  const offClass = checked
    ? 'text-neutral-400 hover:text-[#F9A136]'
    : 'bg-[#E2912B] font-medium text-[#080808]';
  const onClass = checked
    ? 'bg-[#E2912B] font-medium text-[#080808]'
    : 'text-neutral-400 hover:text-[#F9A136]';

  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`${label} on/off`}>
      <button
        type="button"
        aria-pressed={!checked}
        aria-controls={panelId}
        onClick={() => checked && onToggle()}
        className={`${base} ${offClass}`}
      >
        Off
      </button>
      <button
        type="button"
        aria-pressed={checked}
        aria-controls={panelId}
        onClick={() => !checked && onToggle()}
        className={`${base} ${onClass}`}
      >
        On
      </button>
    </div>
  );
};
