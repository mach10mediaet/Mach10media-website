import React, { useEffect, useRef, useState } from 'react';
import type { PricingConfig } from './types';
import { DEFAULT_PRICING_CONFIG } from './constants/defaults';
import { formatETB } from './utils/pricing';
import { buildClientShareLink, savePricingConfigToCloud, usePricingConfig } from './utils/configStore';
import { Check, RotateCcw, ArrowUpRight } from 'lucide-react';

interface RatesAdminProps {
  onNotice?: (message: string) => void;
}

interface RateFieldProps {
  id: string;
  label: string;
  value: number;
  unit?: string;
  step?: number;
  min?: number;
  onChange: (val: number) => void;
}

const RateField: React.FC<RateFieldProps> = ({
  id,
  label,
  value,
  unit = 'ETB',
  step = 50,
  min = 0,
  onChange,
}) => (
  <div className="rounded-xl border border-white/8 bg-[#060606] p-4">
    <label
      htmlFor={id}
      className="block font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase mb-2"
    >
      {label}
    </label>
    <div className="flex items-baseline justify-between gap-2">
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          onChange(Number.isFinite(parsed) && parsed >= min ? parsed : 0);
        }}
        className="w-full bg-transparent font-mono text-lg font-medium text-white tabular-nums focus:outline-none focus:text-[#F9A136]"
      />
      <span className="font-mono text-[10px] tracking-[0.18em] text-[#F9A136] uppercase">
        {unit}
      </span>
    </div>
  </div>
);

export default function RatesAdmin({ onNotice }: RatesAdminProps) {
  const { config, loaded } = usePricingConfig();
  const [form, setForm] = useState<PricingConfig>(config);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'tiers' | 'multipliers' | 'settings' | 'channels'
  >('tiers');

  // Hydrate the form once the live Firestore config arrives, then leave local
  // edits alone (snapshots only re-fire when the saved doc actually changes).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!hydratedRef.current && loaded) {
      setForm(config);
      hydratedRef.current = true;
    }
  }, [config, loaded]);

  const persist = async (nextConfig: PricingConfig, successMessage: string) => {
    setIsSaving(true);
    try {
      await savePricingConfigToCloud(nextConfig);
      setForm(nextConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onNotice?.(successMessage);
    } catch (err) {
      console.error('Failed to save pricing config:', err);
      onNotice?.('Failed to save rate configuration. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    void persist(form, 'Rate configuration saved — live on the Rate Estimator.');
  };

  const handleCopyClientLink = () => {
    const clientUrl = buildClientShareLink(form);
    navigator.clipboard.writeText(clientUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3500);
  };

  const handleReset = () => {
    if (window.confirm('Reset all pricing variables and multipliers to factory defaults for every visitor?')) {
      void persist(DEFAULT_PRICING_CONFIG, 'Rate configuration reset to factory defaults.');
    }
  };

  const updateVideoTier = (tier: keyof PricingConfig['videoTiers'], val: number) => {
    setForm((prev) => ({
      ...prev,
      videoTiers: { ...prev.videoTiers, [tier]: val },
    }));
  };

  const updateVisualTier = (tier: keyof PricingConfig['visualTiers'], val: number) => {
    setForm((prev) => ({
      ...prev,
      visualTiers: { ...prev.visualTiers, [tier]: val },
    }));
  };

  const updateIndustryMultiplier = (
    key: keyof PricingConfig['industryMultipliers'],
    val: number
  ) => {
    setForm((prev) => ({
      ...prev,
      industryMultipliers: { ...prev.industryMultipliers, [key]: val },
    }));
  };

  const updateVideoStyleMultiplier = (
    key: keyof PricingConfig['videoStyleMultipliers'],
    val: number
  ) => {
    setForm((prev) => ({
      ...prev,
      videoStyleMultipliers: { ...prev.videoStyleMultipliers, [key]: val },
    }));
  };

  const updateChannelScalar = (
    key:
      | 'xPostRate'
      | 'xThreadRate'
      | 'linkedinPostRate'
      | 'linkedinCarouselRate'
      | 'repostFreeAllowance'
      | 'repostExtraFee',
    val: number
  ) => {
    setForm((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [key]: val,
      },
    }));
  };

  const updateYoutubeLandscapeTier = (
    tier: keyof PricingConfig['channels']['youtubeLandscapeTiers'],
    val: number
  ) => {
    setForm((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        youtubeLandscapeTiers: {
          ...prev.channels.youtubeLandscapeTiers,
          [tier]: val,
        },
      },
    }));
  };

  const tabs: {
    key: 'tiers' | 'multipliers' | 'settings' | 'channels';
    label: string;
  }[] = [
    { key: 'tiers', label: '01 / Bulk Tiers' },
    { key: 'multipliers', label: '02 / Scale & Style Multipliers' },
    { key: 'settings', label: '03 / Tax & Report' },
    { key: 'channels', label: '04 / Channels' },
  ];

  return (
    <div className="mx-auto max-w-6xl py-6">
      {/* Header */}
      <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/8 pb-8 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.28em] text-[#F9A136] uppercase">
            <span className="h-2 w-2 rounded-full bg-[#F9A136]" aria-hidden="true" />
            <span>Studio Rate Architecture</span>
            <span className="text-[#8c8c8c]">
              {loaded ? '· Live rates synced' : '· Syncing rates…'}
            </span>
          </div>
          <h1 className="font-sans text-3xl font-extralight tracking-tighter text-[#f2f2f2] uppercase sm:text-4xl">
            pricing <span className="font-semibold text-white">configuration</span>
          </h1>
          <p className="mt-2 max-w-xl font-sans text-xs font-light leading-relaxed text-[#8c8c8c] sm:text-sm">
            Adjust volume bracket rates, market multipliers, distribution channel add-ons, and reporting thresholds. Saving publishes rates to the public Rate Estimator instantly; encoded client links still work as per-session overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-white px-6 py-3 font-mono text-[10px] font-bold tracking-[0.2em] text-[#080808] uppercase transition-all duration-300 hover:bg-[#F9A136] disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {saveSuccess && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{isSaving ? 'Publishing…' : saveSuccess ? 'Saved' : 'Save Rates'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyClientLink}
            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-mono text-[10px] tracking-[0.2em] text-[#f2f2f2] uppercase transition-all duration-300 hover:border-[#F9A136] hover:text-[#F9A136] cursor-pointer flex items-center gap-2"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-[#F9A136]" aria-hidden="true" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copiedLink ? 'Client Link Copied' : 'Copy Encoded Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-[#7a7a7a] uppercase transition-colors hover:text-red-400 cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Minimal Tab Navigation */}
      <div className="mb-8 flex flex-wrap items-center gap-8 border-b border-white/8">
        {tabs.map((tab) => {
          const isCurrent = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-4 font-mono text-xs tracking-[0.22em] uppercase transition-colors duration-300 cursor-pointer ${
                isCurrent ? 'text-white' : 'text-[#a3a3a3] hover:text-[#f2f2f2]'
              }`}
            >
              {tab.label}
              {isCurrent && (
                <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-[#F9A136]" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BULK TIERS */}
      {activeTab === 'tiers' && (
        <div className="space-y-8">
          {/* Video Tiers */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
            <div className="mb-6">
              <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase">
                Video Bulk Tier Rates (ETB / Video)
              </h2>
              <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase">
                Progressive volume discount applied per 9:16 vertical video reel
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { key: 'tier1', label: 'Tier 1 (1–3 Videos)' },
                  { key: 'tier2', label: 'Tier 2 (4–6 Videos)' },
                  { key: 'tier3', label: 'Tier 3 (7–9 Videos)' },
                  { key: 'tier4', label: 'Tier 4 (10+ Videos)' },
                ] as const
              ).map((item) => (
                <RateField
                  key={item.key}
                  id={`video-${item.key}`}
                  label={item.label}
                  value={form.videoTiers[item.key]}
                  onChange={(val) => updateVideoTier(item.key, val)}
                />
              ))}
            </div>
          </div>

          {/* Visual Tiers */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
            <div className="mb-6">
              <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase">
                Combined Photo + Graphic Bulk Tier Rates (ETB / Post)
              </h2>
              <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase">
                Calculated from combined count (Photo Posts + Graphic Design Posts)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { key: 'tier1', label: 'Tier 1 (1–3 Posts)' },
                  { key: 'tier2', label: 'Tier 2 (4–6 Posts)' },
                  { key: 'tier3', label: 'Tier 3 (7–9 Posts)' },
                  { key: 'tier4', label: 'Tier 4 (10+ Posts)' },
                ] as const
              ).map((item) => (
                <RateField
                  key={item.key}
                  id={`visual-${item.key}`}
                  label={item.label}
                  value={form.visualTiers[item.key]}
                  onChange={(val) => updateVisualTier(item.key, val)}
                />
              ))}
            </div>
          </div>

          {/* Story Ratio */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <label
                  htmlFor="story-rate-ratio"
                  className="font-sans text-base font-medium tracking-tight text-white uppercase block"
                >
                  Social Story Rate Ratio
                </label>
                <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase">
                  Ratio of visual tier rate (0.5 = 50%)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="story-rate-ratio"
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.5"
                  value={form.storyRateRatio}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      storyRateRatio: parseFloat(e.target.value) || 0.5,
                    }))
                  }
                  className="w-24 rounded-xl border border-white/12 bg-[#060606] px-3 py-2 text-right font-mono text-sm font-medium text-white tabular-nums focus:border-[#F9A136] focus:outline-none"
                />
                <span className="font-mono text-xs text-[#8c8c8c]">
                  ({Math.round(form.storyRateRatio * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTIPLIERS */}
      {activeTab === 'multipliers' && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
            <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase mb-1">
              Organization Scale Multipliers
            </h2>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase mb-6">
              Applied to total net investment based on brand market scale
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { key: 'small', label: 'Startup / Indie' },
                  { key: 'medium', label: 'Established / NGO' },
                  { key: 'corporate', label: 'Corporate' },
                  { key: 'enterprise', label: 'Enterprise / FMCG' },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-white/8 bg-[#060606] p-4"
                >
                  <label
                    htmlFor={`scale-${item.key}`}
                    className="block font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase mb-2"
                  >
                    {item.label}
                  </label>
                  <div className="flex items-baseline justify-between gap-2">
                    <input
                      id={`scale-${item.key}`}
                      type="number"
                      step="0.05"
                      value={form.industryMultipliers[item.key]}
                      onChange={(e) =>
                        updateIndustryMultiplier(item.key, parseFloat(e.target.value) || 1.0)
                      }
                      className="w-full bg-transparent font-mono text-lg font-medium text-white tabular-nums focus:outline-none focus:text-[#F9A136]"
                    />
                    <span className="font-mono text-xs text-[#F9A136]">×</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
            <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase mb-1">
              Video Production Style Multipliers
            </h2>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase mb-6">
              Applied to core reels and YouTube 16:9 landscape video production
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                [
                  { key: 'talkingHead', label: 'Talking Head & Reels' },
                  { key: 'lifestyle', label: 'Lifestyle & B-Roll' },
                  { key: 'commercial', label: 'Commercial Set' },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-white/8 bg-[#060606] p-4"
                >
                  <label
                    htmlFor={`style-${item.key}`}
                    className="block font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase mb-2"
                  >
                    {item.label}
                  </label>
                  <div className="flex items-baseline justify-between gap-2">
                    <input
                      id={`style-${item.key}`}
                      type="number"
                      step="0.05"
                      value={form.videoStyleMultipliers[item.key]}
                      onChange={(e) =>
                        updateVideoStyleMultiplier(item.key, parseFloat(e.target.value) || 1.0)
                      }
                      className="w-full bg-transparent font-mono text-lg font-medium text-white tabular-nums focus:outline-none focus:text-[#F9A136]"
                    />
                    <span className="font-mono text-xs text-[#F9A136]">×</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6">
            <label
              htmlFor="engagement-fee-input"
              className="block font-sans text-sm font-medium text-white uppercase mb-1"
            >
              Standalone Monthly Report Fee
            </label>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase mb-4">
              Charged when total core posts are below waiver threshold
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#060606] px-4 py-3">
              <input
                id="engagement-fee-input"
                type="number"
                step="100"
                value={form.engagementFee}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    engagementFee: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full bg-transparent font-mono text-lg font-medium text-white tabular-nums focus:outline-none"
              />
              <span className="font-mono text-xs text-[#F9A136]">ETB</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6">
            <label
              htmlFor="engagement-threshold-input"
              className="block font-sans text-sm font-medium text-white uppercase mb-1"
            >
              Report Waiver Threshold
            </label>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase mb-4">
              Waived automatically when total core posts reach this count
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#060606] px-4 py-3">
              <input
                id="engagement-threshold-input"
                type="number"
                min="1"
                max="50"
                value={form.engagementThreshold}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    engagementThreshold: parseInt(e.target.value, 10) || 8,
                  }))
                }
                className="w-full bg-transparent font-mono text-lg font-medium text-white tabular-nums focus:outline-none"
              />
              <span className="font-mono text-xs text-[#F9A136] uppercase">Posts</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6">
            <label
              htmlFor="vat-rate-input"
              className="block font-sans text-sm font-medium text-white uppercase mb-1"
            >
              Value Added Tax (VAT) Ratio
            </label>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase mb-4">
              Default: 0.15 (15% VAT)
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#060606] px-4 py-3">
              <input
                id="vat-rate-input"
                type="number"
                step="0.01"
                min="0"
                max="0.5"
                value={form.taxRate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    taxRate: parseFloat(e.target.value) || 0.15,
                  }))
                }
                className="w-full bg-transparent font-mono text-lg font-medium text-white tabular-nums focus:outline-none"
              />
              <span className="font-mono text-xs text-[#F9A136]">
                {Math.round(form.taxRate * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHANNELS */}
      {activeTab === 'channels' && (
        <div className="space-y-8">
          {/* X & LinkedIn Content Rates */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
              <div className="mb-6">
                <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase">
                  X (Twitter) Content Rates (ETB)
                </h2>
                <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase">
                  Per-unit rates for 16:9 / 1:1 posts &amp; 5–8 post narrative threads
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RateField
                  id="channel-x-post"
                  label="X Post (Copy + Visual)"
                  value={form.channels.xPostRate}
                  onChange={(val) => updateChannelScalar('xPostRate', val)}
                />
                <RateField
                  id="channel-x-thread"
                  label="X Thread (5–8 Posts)"
                  value={form.channels.xThreadRate}
                  onChange={(val) => updateChannelScalar('xThreadRate', val)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
              <div className="mb-6">
                <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase">
                  LinkedIn Content Rates (ETB)
                </h2>
                <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase">
                  Executive long-form posts &amp; 6–10 slide PDF document carousels
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RateField
                  id="channel-linkedin-post"
                  label="LinkedIn Post (Copy + Visual)"
                  value={form.channels.linkedinPostRate}
                  onChange={(val) => updateChannelScalar('linkedinPostRate', val)}
                />
                <RateField
                  id="channel-linkedin-carousel"
                  label="LinkedIn Carousel (PDF)"
                  value={form.channels.linkedinCarouselRate}
                  onChange={(val) => updateChannelScalar('linkedinCarouselRate', val)}
                />
              </div>
            </div>
          </div>

          {/* YouTube Landscape Tiers */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
            <div className="mb-6">
              <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase">
                YouTube Landscape (16:9) Bulk Tier Rates (ETB / Video)
              </h2>
              <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase">
                Dedicated 1920×1080 production + custom 1280×720 thumbnail · Multiplied by Video Production Style
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { key: 'tier1', label: 'Tier 1 (1–3 Videos)' },
                  { key: 'tier2', label: 'Tier 2 (4–6 Videos)' },
                  { key: 'tier3', label: 'Tier 3 (7–9 Videos)' },
                  { key: 'tier4', label: 'Tier 4 (10+ Videos)' },
                ] as const
              ).map((item) => (
                <RateField
                  key={item.key}
                  id={`yt-landscape-${item.key}`}
                  label={item.label}
                  value={form.channels.youtubeLandscapeTiers[item.key]}
                  step={100}
                  onChange={(val) => updateYoutubeLandscapeTier(item.key, val)}
                />
              ))}
            </div>
          </div>

          {/* Repost / Shorts Adaptation Allowance & Fee */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 sm:p-7">
            <div className="mb-6">
              <h2 className="font-sans text-base font-medium tracking-tight text-white uppercase">
                Reel Reposts &amp; YouTube Shorts Syndication
              </h2>
              <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7a7a7a] uppercase">
                Reusing core 9:16 reels on YouTube Shorts, LinkedIn, or X: free up to the monthly allowance per channel, then per-video adaptation fee
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RateField
                id="repost-free-allowance"
                label="Free Repost Allowance (Per Channel / Mo)"
                value={form.channels.repostFreeAllowance}
                unit="Videos"
                step={1}
                onChange={(val) => updateChannelScalar('repostFreeAllowance', val)}
              />
              <RateField
                id="repost-extra-fee"
                label="Extra Repost Adaptation Fee (Beyond Allowance)"
                value={form.channels.repostExtraFee}
                unit="ETB"
                step={50}
                onChange={(val) => updateChannelScalar('repostExtraFee', val)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Bar */}
      <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.015] p-6">
        <div className="mb-4 font-mono text-[10px] tracking-[0.24em] text-[#8c8c8c] uppercase">
          Baseline Retainer Preview (1.0× Scale &amp; Style)
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 font-mono text-xs">
          <div className="rounded-xl border border-white/6 bg-[#060606] p-4">
            <span className="text-[#7a7a7a] block text-[10px] uppercase tracking-widest mb-1">
              01 / Bronze (4V + 4P)
            </span>
            <span className="text-white text-base font-medium tabular-nums">
              {formatETB(4 * form.videoTiers.tier2 + 4 * form.visualTiers.tier2)} ETB
            </span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#060606] p-4">
            <span className="text-[#7a7a7a] block text-[10px] uppercase tracking-widest mb-1">
              02 / Silver (8V)
            </span>
            <span className="text-white text-base font-medium tabular-nums">
              {formatETB(8 * form.videoTiers.tier3)} ETB
            </span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#060606] p-4">
            <span className="text-[#7a7a7a] block text-[10px] uppercase tracking-widest mb-1">
              03 / Gold (8V + 4P)
            </span>
            <span className="text-white text-base font-medium tabular-nums">
              {formatETB(8 * form.videoTiers.tier3 + 4 * form.visualTiers.tier2)} ETB
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 font-mono text-xs">
          <div className="rounded-xl border border-white/6 bg-[#060606] p-4">
            <span className="text-[#7a7a7a] block text-[10px] uppercase tracking-widest mb-1">
              X / Post &amp; Thread
            </span>
            <span className="text-white text-sm font-medium tabular-nums">
              {formatETB(form.channels.xPostRate)} / {formatETB(form.channels.xThreadRate)} ETB
            </span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#060606] p-4">
            <span className="text-[#7a7a7a] block text-[10px] uppercase tracking-widest mb-1">
              LinkedIn / Post &amp; Carousel
            </span>
            <span className="text-white text-sm font-medium tabular-nums">
              {formatETB(form.channels.linkedinPostRate)} / {formatETB(form.channels.linkedinCarouselRate)} ETB
            </span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#060606] p-4">
            <span className="text-[#7a7a7a] block text-[10px] uppercase tracking-widest mb-1">
              YouTube / 1× 16:9 Landscape
            </span>
            <span className="text-white text-sm font-medium tabular-nums">
              {formatETB(form.channels.youtubeLandscapeTiers.tier1)} ETB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
