import React from 'react';
import { INDUSTRY_OPTIONS, VIDEO_STYLE_OPTIONS } from '../constants/defaults';
import type { IndustryScaleKey, VideoStyleKey } from '../types';

interface DiscoverySectionProps {
  clientName: string;
  onClientNameChange: (name: string) => void;
  industryScale: IndustryScaleKey;
  onIndustryScaleChange: (industry: IndustryScaleKey) => void;
  videoStyle: VideoStyleKey;
  onVideoStyleChange: (style: VideoStyleKey) => void;
}

const SCALE_LABELS: Record<IndustryScaleKey, { title: string; sub: string }> = {
  small: { title: 'Startup', sub: 'Indie & Creator' },
  medium: { title: 'Established', sub: 'Hospitality & NGO' },
  corporate: { title: 'Corporate', sub: 'Finance & Real Estate' },
  enterprise: { title: 'Enterprise', sub: 'Multinational & FMCG' },
};

const STYLE_LABELS: Record<VideoStyleKey, { title: string; sub: string }> = {
  talkingHead: { title: 'Talking Head', sub: 'Single-cam & studio audio' },
  lifestyle: { title: 'Lifestyle & B-Roll', sub: 'Location & gimbal motion' },
  commercial: { title: 'Commercial Set', sub: 'Full crew & cinema grade' },
};

export const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  clientName,
  onClientNameChange,
  industryScale,
  onIndustryScaleChange,
  videoStyle,
  onVideoStyleChange,
}) => {
  return (
    <section className="border-t border-white/8 pt-8 pb-10 space-y-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-sans text-lg font-medium tracking-tight text-white uppercase sm:text-xl">
          <span className="mr-2.5 font-mono text-xs text-[#F9A136]">01</span>
          Brand Profile
        </h2>
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#8c8c8c] uppercase">
          Client &amp; Production Tier
        </span>
      </div>

      {/* 1. Client Name */}
      <div>
        <label
          htmlFor="client-name-input"
          className="block font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase mb-2"
        >
          Client or Brand Name
        </label>
        <input
          id="client-name-input"
          type="text"
          value={clientName}
          onChange={(e) => onClientNameChange(e.target.value)}
          placeholder="Enter brand name (e.g. RakaCars, Olive & Bread)..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-sm text-white placeholder:text-[#8c8c8c] transition-colors focus:border-[#F9A136] focus:outline-none sm:text-base"
        />
      </div>

      {/* 2. Organization Scale */}
      <fieldset className="space-y-2.5">
        <legend className="font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase">
          Organization Scale
        </legend>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {INDUSTRY_OPTIONS.map((item) => {
            const isSelected = industryScale === item.key;
            const label = SCALE_LABELS[item.key];
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onIndustryScaleChange(item.key)}
                className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-[#F9A136] bg-[#F9A136]/[0.06]'
                    : 'border-white/8 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-xs font-medium text-white sm:text-sm">
                    {label.title}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      isSelected ? 'bg-[#F9A136]' : 'bg-white/15'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <span className="mt-1 font-sans text-[11px] text-[#8c8c8c]">{label.sub}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 3. Video Direction */}
      <fieldset className="space-y-2.5">
        <legend className="font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase">
          Video Production Style
        </legend>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {VIDEO_STYLE_OPTIONS.map((style) => {
            const isSelected = videoStyle === style.key;
            const label = STYLE_LABELS[style.key];
            return (
              <button
                key={style.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onVideoStyleChange(style.key)}
                className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-[#F9A136] bg-[#F9A136]/[0.06]'
                    : 'border-white/8 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-xs font-medium text-white sm:text-sm">
                    {label.title}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      isSelected ? 'bg-[#F9A136]' : 'bg-white/15'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <span className="mt-1 font-sans text-[11px] text-[#8c8c8c]">{label.sub}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
};
