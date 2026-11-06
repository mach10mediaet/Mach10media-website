import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, ArrowUpRight } from 'lucide-react';
import type { ChannelKey, DeliverablesState } from './types';
import { DEFAULT_CHANNELS, PRESET_DEFINITIONS } from './constants/defaults';
import { calculateScope } from './utils/pricing';
import { usePricingConfig } from './utils/configStore';
import { DiscoverySection } from './components/DiscoverySection';
import { PresetsSection } from './components/PresetsSection';
import { DeliverablesSection } from './components/DeliverablesSection';
import { ChannelsSection } from './components/ChannelsSection';
import { EstimateCard } from './components/EstimateCard';

const INITIAL_DELIVERABLES: DeliverablesState = {
  clientName: '',
  videoCount: PRESET_DEFINITIONS.gold.videoCount,
  photoCount: PRESET_DEFINITIONS.gold.photoCount,
  graphicCount: PRESET_DEFINITIONS.gold.graphicCount,
  storyCount: PRESET_DEFINITIONS.gold.storyCount,
  engagementReport: PRESET_DEFINITIONS.gold.engagementReport,
  industryScale: 'small',
  videoStyle: 'talkingHead',
  activePreset: 'gold',
  channels: DEFAULT_CHANNELS,
};

export default function CalculatorView() {
  const { config: pricingConfig } = usePricingConfig();

  const [deliverables, setDeliverables] = useState<DeliverablesState>(INITIAL_DELIVERABLES);
  // Hidden until the client finishes the scope form and presses the estimate CTA.
  const [estimateRevealed, setEstimateRevealed] = useState(false);

  const handleSelectPreset = (presetKey: 'bronze' | 'silver' | 'gold') => {
    const preset = PRESET_DEFINITIONS[presetKey];
    setDeliverables((prev) => ({
      ...prev,
      videoCount: preset.videoCount,
      photoCount: preset.photoCount,
      graphicCount: preset.graphicCount,
      storyCount: preset.storyCount,
      engagementReport: preset.engagementReport,
      activePreset: presetKey,
      channels: {
        ...prev.channels,
        x: {
          ...prev.channels.x,
          videoReposts: Math.min(prev.channels.x.videoReposts, preset.videoCount),
        },
        linkedin: {
          ...prev.channels.linkedin,
          videoReposts: Math.min(prev.channels.linkedin.videoReposts, preset.videoCount),
        },
        youtube: {
          ...prev.channels.youtube,
          shortsCount: Math.min(prev.channels.youtube.shortsCount, preset.videoCount),
        },
      },
    }));
  };

  const handleUpdateDeliverable = (
    key: 'videoCount' | 'photoCount' | 'graphicCount' | 'storyCount' | 'engagementReport',
    value: number | boolean
  ) => {
    setDeliverables((prev) => {
      const nextVideoCount =
        key === 'videoCount' && typeof value === 'number' ? value : prev.videoCount;
      return {
        ...prev,
        [key]: value,
        activePreset: 'custom',
        channels: {
          ...prev.channels,
          x: {
            ...prev.channels.x,
            videoReposts: Math.min(prev.channels.x.videoReposts, nextVideoCount),
          },
          linkedin: {
            ...prev.channels.linkedin,
            videoReposts: Math.min(prev.channels.linkedin.videoReposts, nextVideoCount),
          },
          youtube: {
            ...prev.channels.youtube,
            shortsCount: Math.min(prev.channels.youtube.shortsCount, nextVideoCount),
          },
        },
      };
    });
  };

  const handleToggleChannel = (channelKey: ChannelKey) => {
    setDeliverables((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channelKey]: {
          ...prev.channels[channelKey],
          enabled: !prev.channels[channelKey].enabled,
        },
      },
    }));
  };

  const handleUpdateX = (
    field: 'postCount' | 'threadCount' | 'videoReposts',
    value: number
  ) => {
    setDeliverables((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        x: {
          ...prev.channels.x,
          [field]: field === 'videoReposts' ? Math.min(value, prev.videoCount) : value,
        },
      },
    }));
  };

  const handleUpdateLinkedIn = (
    field: 'postCount' | 'carouselCount' | 'videoReposts',
    value: number
  ) => {
    setDeliverables((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        linkedin: {
          ...prev.channels.linkedin,
          [field]: field === 'videoReposts' ? Math.min(value, prev.videoCount) : value,
        },
      },
    }));
  };

  const handleUpdateYouTube = (
    field: 'shortsCount' | 'landscapeCount',
    value: number
  ) => {
    setDeliverables((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        youtube: {
          ...prev.channels.youtube,
          [field]: field === 'shortsCount' ? Math.min(value, prev.videoCount) : value,
        },
      },
    }));
  };

  const handleResetCalculator = () => {
    setDeliverables(INITIAL_DELIVERABLES);
  };

  const breakdown = useMemo(() => {
    return calculateScope(deliverables, pricingConfig);
  }, [deliverables, pricingConfig]);

  const revealEstimate = () => {
    setEstimateRevealed(true);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const backToScope = () => {
    setEstimateRevealed(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  return (
    <div className="relative min-h-screen bg-transparent text-[#f2f2f2] selection:bg-white selection:text-black antialiased px-6 pt-36 pb-36 md:px-12 lg:pb-24">
      <div className="mx-auto w-full max-w-5xl">
        {/* Page header — matches the studio-wide page hero pattern */}
        <div className="mb-16 border-b border-white/5 pb-10">
          <div className="mb-4 flex items-center justify-between gap-6">
            <p className="text-[#a3a3a3] font-mono text-[12px] tracking-[0.3em] uppercase">
              THE RATE ESTIMATOR
            </p>

            <button
              type="button"
              onClick={handleResetCalculator}
              className="inline-flex shrink-0 items-center gap-1.5 py-1 font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase transition-colors hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Reset Scope</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>

          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-5xl uppercase">
            build your{' '}
            <span className="webkit-stroke font-black opacity-80 leading-none">monthly retainer</span>
          </h1>
          <p className="mt-4 max-w-xl font-sans text-sm sm:text-[15px] font-light text-neutral-400 leading-relaxed">
            Pick a package, adjust the deliverables, and switch on extra channels — then run the
            estimate for your monthly total.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!estimateRevealed ? (
            <motion.div
              key="scope-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DiscoverySection
                clientName={deliverables.clientName}
                onClientNameChange={(name) =>
                  setDeliverables((prev) => ({ ...prev, clientName: name }))
                }
                industryScale={deliverables.industryScale}
                onIndustryScaleChange={(scale) =>
                  setDeliverables((prev) => ({ ...prev, industryScale: scale }))
                }
                videoStyle={deliverables.videoStyle}
                onVideoStyleChange={(style) =>
                  setDeliverables((prev) => ({ ...prev, videoStyle: style }))
                }
              />

              <PresetsSection
                activePreset={deliverables.activePreset}
                onSelectPreset={handleSelectPreset}
                pricingConfig={pricingConfig}
                industryScale={deliverables.industryScale}
                videoStyle={deliverables.videoStyle}
              />

              <DeliverablesSection
                videoCount={deliverables.videoCount}
                photoCount={deliverables.photoCount}
                graphicCount={deliverables.graphicCount}
                storyCount={deliverables.storyCount}
                engagementReport={deliverables.engagementReport}
                onUpdateDeliverable={handleUpdateDeliverable}
                videoTierUnlocked={breakdown.videoTierUnlocked}
                visualTierUnlocked={breakdown.visualTierUnlocked}
                storyTierUnlocked={breakdown.storyTierUnlocked}
                totalPosts={breakdown.totalPosts}
                isEngagementWaived={breakdown.isEngagementWaived}
              />

              <ChannelsSection
                channels={deliverables.channels}
                videoCount={deliverables.videoCount}
                repostFreeAllowance={pricingConfig.channels.repostFreeAllowance}
                youtubeLandscapeTierUnlocked={breakdown.youtubeLandscapeTierUnlocked}
                onToggleChannel={handleToggleChannel}
                onUpdateX={handleUpdateX}
                onUpdateLinkedIn={handleUpdateLinkedIn}
                onUpdateYouTube={handleUpdateYouTube}
              />

              {/* Reveal the price only on demand */}
              <div className="mt-12 border-t border-white/[0.07] pt-10">
                <button
                  type="button"
                  onClick={revealEstimate}
                  id="show-estimate-button"
                  className="group flex w-full cursor-pointer items-center justify-center rounded-full bg-white py-4 font-mono text-[11px] font-bold tracking-[0.16em] text-[#080808] uppercase shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition-all duration-500 hover:scale-[1.015] hover:bg-[#F9A136]"
                >
                  <span>Show My Estimate</span>
                  <ArrowUpRight
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </button>
                <p className="mt-5 text-center font-mono text-[10px] tracking-[0.2em] text-[#8c8c8c] uppercase">
                  Calculated live from your selections — no email required
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="estimate-result"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="mx-auto max-w-2xl">
                <EstimateCard breakdown={breakdown} />
                <button
                  type="button"
                  onClick={backToScope}
                  id="adjust-details-link"
                  className="mx-auto mt-8 block font-mono text-[10px] tracking-[0.2em] text-[#8c8c8c] uppercase transition-colors hover:text-[#F9A136] cursor-pointer"
                >
                  Adjust Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
