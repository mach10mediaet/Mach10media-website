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
  { labelIdle: string; priceUnit: string }
> = {
  bronze: {
    labelIdle: 'text-[#D98A4E]/85 group-hover:text-[#D98A4E]',
    priceUnit: 'text-[#D98A4E]',
  },
  silver: {
    labelIdle: 'text-[#CBD5E1]/85 group-hover:text-[#E2E8F0]',
    priceUnit: 'text-[#CBD5E1]',
  },
  gold: {
    labelIdle: 'text-[#F9A136]/85 group-hover:text-[#F9A136]',
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
    <section className="pt-8 pb-10">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-sans text-lg font-medium tracking-tight text-white uppercase sm:text-xl">
          <span className="mr-2.5 font-mono text-xs text-[#F9A136]">02</span>
          Baseline Package
        </h2>
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#8c8c8c] uppercase">
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
              className={`group flex flex-col justify-between rounded-sm p-5 text-left transition-colors duration-300 cursor-pointer ${
                isActive ? 'bg-[#E2912B]' : 'bg-transparent'
              }`}
            >
              <div>
                <div className="mb-4">
                  <span
                    className={`font-mono text-xs tracking-[0.22em] uppercase transition-colors duration-300 ${
                      isActive ? 'font-semibold text-[#080808]' : theme.labelIdle
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-sans text-2xl font-light tracking-tight tabular-nums transition-colors duration-300 sm:text-3xl ${
                      isActive ? 'text-[#080808]' : 'text-white'
                    }`}
                  >
                    {formatETB(netPrice)}
                  </span>
                  <span
                    className={`font-mono text-[10px] tracking-[0.16em] uppercase transition-colors duration-300 ${
                      isActive ? 'text-[#080808]/70' : theme.priceUnit
                    }`}
                  >
                    ETB / mo
                  </span>
                </div>
              </div>

              <div className={`mt-5 font-mono text-[11px] tracking-[0.12em] transition-colors duration-300 ${
                isActive ? 'text-[#080808]/75' : 'text-[#b3b3b3]'
              }`}>
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
