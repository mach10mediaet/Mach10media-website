import React, { useMemo } from 'react';
import { DEFAULT_CHANNELS, PRESET_DEFINITIONS } from '../constants/defaults';
import type { IndustryScaleKey, PresetKey, PricingConfig, VideoStyleKey } from '../types';
import { calculateScope, formatETB } from '../utils/pricing';

interface PresetsSectionProps {
  activePreset: PresetKey;
  onSelectPreset: (preset: 'bronze' | 'silver' | 'gold') => void;
  pricingConfig: PricingConfig;
  industryScale: IndustryScaleKey;
  videoStyle: VideoStyleKey;
}

const PRESET_THEMES: Record<
  'bronze' | 'silver' | 'gold',
  {
    cardActive: string;
    cardIdle: string;
    labelActive: string;
    labelIdle: string;
    dotActive: string;
    dotIdle: string;
    priceUnit: string;
  }
> = {
  bronze: {
    cardActive:
      'border-[#D98A4E] bg-[linear-gradient(180deg,rgba(217,138,78,0.12),rgba(217,138,78,0.02))] shadow-[0_12px_32px_-14px_rgba(217,138,78,0.25)]',
    cardIdle:
      'border-[#D98A4E]/25 bg-[#D98A4E]/[0.02] hover:border-[#D98A4E]/55 hover:bg-[#D98A4E]/[0.05]',
    labelActive: 'text-[#D98A4E] font-semibold',
    labelIdle: 'text-[#D98A4E]/85 group-hover:text-[#D98A4E]',
    dotActive: 'bg-[#D98A4E] scale-110 shadow-[0_0_8px_rgba(217,138,78,0.7)]',
    dotIdle: 'border border-[#D98A4E]/50 bg-transparent group-hover:border-[#D98A4E]',
    priceUnit: 'text-[#D98A4E]',
  },
  silver: {
    cardActive:
      'border-[#D8E0EA] bg-[linear-gradient(180deg,rgba(216,224,234,0.12),rgba(216,224,234,0.02))] shadow-[0_12px_32px_-14px_rgba(216,224,234,0.22)]',
    cardIdle:
      'border-[#D8E0EA]/25 bg-[#D8E0EA]/[0.02] hover:border-[#D8E0EA]/55 hover:bg-[#D8E0EA]/[0.05]',
    labelActive: 'text-[#E2E8F0] font-semibold',
    labelIdle: 'text-[#CBD5E1]/85 group-hover:text-[#E2E8F0]',
    dotActive: 'bg-[#E2E8F0] scale-110 shadow-[0_0_8px_rgba(226,232,240,0.7)]',
    dotIdle: 'border border-[#CBD5E1]/50 bg-transparent group-hover:border-[#E2E8F0]',
    priceUnit: 'text-[#CBD5E1]',
  },
  gold: {
    cardActive:
      'border-[#F9A136] bg-[linear-gradient(180deg,rgba(249,161,54,0.12),rgba(249,161,54,0.02))] shadow-[0_12px_32px_-14px_rgba(249,161,54,0.28)]',
    cardIdle:
      'border-[#F9A136]/25 bg-[#F9A136]/[0.02] hover:border-[#F9A136]/60 hover:bg-[#F9A136]/[0.05]',
    labelActive: 'text-[#F9A136] font-semibold',
    labelIdle: 'text-[#F9A136]/85 group-hover:text-[#F9A136]',
    dotActive: 'bg-[#F9A136] scale-110 shadow-[0_0_8px_rgba(249,161,54,0.7)]',
    dotIdle: 'border border-[#F9A136]/50 bg-transparent group-hover:border-[#F9A136]',
    priceUnit: 'text-[#F9A136]',
  },
};

export const PresetsSection: React.FC<PresetsSectionProps> = ({
  activePreset,
  onSelectPreset,
  pricingConfig,
  industryScale,
  videoStyle,
}) => {
  const presets: ('bronze' | 'silver' | 'gold')[] = ['bronze', 'silver', 'gold'];

  const presetNetPrices = useMemo(() => {
    const compute = (key: 'bronze' | 'silver' | 'gold') => {
      const def = PRESET_DEFINITIONS[key];
      return calculateScope(
        {
          clientName: '',
          videoCount: def.videoCount,
          photoCount: def.photoCount,
          graphicCount: def.graphicCount,
          storyCount: def.storyCount,
          engagementReport: def.engagementReport,
          industryScale,
          videoStyle,
          activePreset: key,
          channels: DEFAULT_CHANNELS,
        },
        pricingConfig
      ).estimatedNetTotal;
    };

    return {
      bronze: compute('bronze'),
      silver: compute('silver'),
      gold: compute('gold'),
    };
  }, [pricingConfig, industryScale, videoStyle]);

  return (
    <section className="border-t border-white/8 pt-8 pb-10">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-sans text-lg font-medium tracking-tight text-white uppercase sm:text-xl">
          <span className="mr-2.5 font-mono text-xs text-[#F9A136]">02</span>
          Baseline Package
        </h2>
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#6b6b6b] uppercase">
          IG · TikTok · Facebook
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {presets.map((key) => {
          const item = PRESET_DEFINITIONS[key];
          const isActive = activePreset === key;
          const netPrice = presetNetPrices[key];
          const theme = PRESET_THEMES[key];

          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectPreset(key)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer ${
                isActive ? theme.cardActive : theme.cardIdle
              }`}
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className={`font-mono text-xs tracking-[0.22em] uppercase transition-colors ${
                      isActive ? theme.labelActive : theme.labelIdle
                    }`}
                  >
                    {item.name}
                  </span>

                  <span
                    className={`h-2 w-2 rounded-full transition-all ${
                      isActive ? theme.dotActive : theme.dotIdle
                    }`}
                    aria-hidden="true"
                  />
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-2xl font-light tracking-tight text-white tabular-nums sm:text-3xl">
                    {formatETB(netPrice)}
                  </span>
                  <span
                    className={`font-mono text-[10px] tracking-[0.16em] uppercase ${theme.priceUnit}`}
                  >
                    ETB / mo
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-white/8 pt-3 font-mono text-[11px] tracking-[0.12em] text-[#b3b3b3]">
                {item.videoCount > 0 && `${item.videoCount} Reels`}
                {item.photoCount > 0 && ` · ${item.photoCount} Photos`}
                {item.engagementReport && ' · Report'}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
