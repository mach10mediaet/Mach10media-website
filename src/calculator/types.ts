export type IndustryScaleKey = 'small' | 'medium' | 'corporate' | 'enterprise';

export type VideoStyleKey = 'talkingHead' | 'lifestyle' | 'commercial';

export type PresetKey = 'bronze' | 'silver' | 'gold' | 'custom';

export type ChannelKey = 'x' | 'linkedin' | 'youtube';

export interface TierRates {
  tier1: number; // 1-3
  tier2: number; // 4-6
  tier3: number; // 7-9
  tier4: number; // 10+
}

export interface ChannelSelection {
  x: {
    enabled: boolean;
    postCount: number; // Standard X Posts (copy + 16:9 1600×900 or 1:1 visual)
    threadCount: number; // Multi-post Editorial Threads (5–8 posts + visuals)
    videoReposts: number; // Adapted from core Short-Form Video & Reels (<= videoCount)
  };
  linkedin: {
    enabled: boolean;
    postCount: number; // Executive Thought-Leadership Posts (long-form copy + 4:5/1:1 visual)
    carouselCount: number; // PDF Document Carousels (4:5 1080×1350, 6–10 slides)
    videoReposts: number; // Adapted from core Short-Form Video & Reels (<= videoCount)
  };
  youtube: {
    enabled: boolean;
    shortsCount: number; // Adapted from core 9:16 Reels (<= videoCount)
    landscapeCount: number; // Dedicated 16:9 (1920×1080) Long-Form Videos + Custom Thumbnail
  };
}

export interface ChannelRates {
  xPostRate: number; // default: 600 ETB
  xThreadRate: number; // default: 1500 ETB
  linkedinPostRate: number; // default: 900 ETB
  linkedinCarouselRate: number; // default: 1800 ETB
  youtubeLandscapeTiers: TierRates; // default: 9000 / 8000 / 7500 / 6600 ETB
  repostFreeAllowance: number; // default: 4 per channel / mo
  repostExtraFee: number; // default: 500 ETB per extra adapted video
}

export interface ChannelOption {
  key: ChannelKey;
  code: string;
  name: string;
  subtitle: string;
  formatsSummary: string;
}

export interface IndustryOption {
  key: IndustryScaleKey;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
}

export interface VideoStyleOption {
  key: VideoStyleKey;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  iconName: string;
}

export interface PricingConfig {
  videoTiers: TierRates;
  visualTiers: TierRates;
  storyRateRatio: number;
  storyTiersOverride?: TierRates;
  engagementFee: number;
  engagementThreshold: number;
  industryMultipliers: Record<IndustryScaleKey, number>;
  videoStyleMultipliers: Record<VideoStyleKey, number>;
  channels: ChannelRates;
  taxRate: number; // e.g. 0.15
}

export interface DeliverablesState {
  clientName: string;
  videoCount: number;
  photoCount: number;
  graphicCount: number;
  storyCount: number;
  engagementReport: boolean;
  industryScale: IndustryScaleKey;
  videoStyle: VideoStyleKey;
  activePreset: PresetKey;
  channels: ChannelSelection;
}

export interface CalculationBreakdown {
  videoCount: number;
  photoCount: number;
  graphicCount: number;
  storyCount: number;
  combinedVisualCount: number;
  totalPosts: number;
  isEngagementWaived: boolean;
  engagementReportIncluded: boolean;
  estimatedNetTotal: number;
  taxAmount: number;
  grandTotal: number;
  activePreset: PresetKey;
  clientName: string;
  industryScale: IndustryScaleKey;
  videoStyle: VideoStyleKey;
  videoTierUnlocked: boolean;
  visualTierUnlocked: boolean;
  storyTierUnlocked: boolean;
  channels: ChannelSelection;
  activeChannelsCount: number;
  youtubeLandscapeTierUnlocked: boolean;
  xRepostsCharged: number;
  linkedinRepostsCharged: number;
  youtubeShortsCharged: number;
}
