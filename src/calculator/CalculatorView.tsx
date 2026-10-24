import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ChannelKey, DeliverablesState } from './types';
import { DEFAULT_CHANNELS, PRESET_DEFINITIONS } from './constants/defaults';
import { calculateScope } from './utils/pricing';
import { usePricingConfig } from './utils/configStore';
import { DiscoverySection } from './components/DiscoverySection';
import { PresetsSection } from './components/PresetsSection';
import { DeliverablesSection } from './components/DeliverablesSection';
import { ChannelsSection } from './components/ChannelsSection';
import { StickySummaryCard } from './components/StickySummaryCard';

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

  return (
    <div className="relative min-h-screen bg-transparent text-[#f2f2f2] selection:bg-white selection:text-black antialiased px-6 pt-36 pb-36 md:px-12 lg:pb-24">
      <div className="mx-auto w-full max-w-6xl">
        {/* Compact Scannable Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 font-mono text-[11px] tracking-[0.26em] text-[#F9A136] uppercase">
              Scope Studio
            </p>
            <h1 className="font-sans text-2xl font-light tracking-tight text-white uppercase sm:text-4xl">
              Monthly Content <span className="font-semibold">Retainer</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={handleResetCalculator}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#b3b3b3] uppercase transition-colors hover:border-white/25 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset Scope</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>

        {/* Split Workspace: Left Scope Builder & Right Sticky Estimate */}
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
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
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-20 lg:self-start">
            <StickySummaryCard breakdown={breakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
