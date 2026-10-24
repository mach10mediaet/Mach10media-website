import { DEFAULT_CHANNELS, DEFAULT_PRICING_CONFIG } from '../constants/defaults';
import type {
  CalculationBreakdown,
  ChannelSelection,
  DeliverablesState,
  PricingConfig,
  TierRates,
} from '../types';

export function getVideoTierRate(count: number, tiers: TierRates): number {
  if (count <= 0) return 0;
  if (count <= 3) return tiers.tier1;
  if (count <= 6) return tiers.tier2;
  if (count <= 9) return tiers.tier3;
  return tiers.tier4;
}

export function getVisualTierRate(count: number, tiers: TierRates): number {
  if (count <= 0) return 0;
  if (count <= 3) return tiers.tier1;
  if (count <= 6) return tiers.tier2;
  if (count <= 9) return tiers.tier3;
  return tiers.tier4;
}

export function getStoryTierRate(count: number, config: PricingConfig): number {
  if (count <= 0) return 0;
  if (config.storyTiersOverride) {
    if (count <= 3) return config.storyTiersOverride.tier1;
    if (count <= 6) return config.storyTiersOverride.tier2;
    if (count <= 9) return config.storyTiersOverride.tier3;
    return config.storyTiersOverride.tier4;
  }
  const visualRate = getVisualTierRate(count, config.visualTiers);
  return Math.round(visualRate * config.storyRateRatio);
}

export function calculateScope(
  state: DeliverablesState,
  config: PricingConfig
): CalculationBreakdown {
  const { videoCount, photoCount, graphicCount, storyCount, engagementReport } = state;
  const rawChannels = state.channels ?? DEFAULT_CHANNELS;
  const chConfig = config.channels ?? DEFAULT_PRICING_CONFIG.channels;

  // Clamp adapted reel reposts / Shorts so they never exceed core videoCount
  const clampedChannels: ChannelSelection = {
    x: {
      enabled: Boolean(rawChannels.x?.enabled),
      postCount: Math.max(0, rawChannels.x?.postCount ?? 0),
      threadCount: Math.max(0, rawChannels.x?.threadCount ?? 0),
      videoReposts: Math.min(Math.max(0, rawChannels.x?.videoReposts ?? 0), videoCount),
    },
    linkedin: {
      enabled: Boolean(rawChannels.linkedin?.enabled),
      postCount: Math.max(0, rawChannels.linkedin?.postCount ?? 0),
      carouselCount: Math.max(0, rawChannels.linkedin?.carouselCount ?? 0),
      videoReposts: Math.min(Math.max(0, rawChannels.linkedin?.videoReposts ?? 0), videoCount),
    },
    youtube: {
      enabled: Boolean(rawChannels.youtube?.enabled),
      shortsCount: Math.min(Math.max(0, rawChannels.youtube?.shortsCount ?? 0), videoCount),
      landscapeCount: Math.max(0, rawChannels.youtube?.landscapeCount ?? 0),
    },
  };

  const combinedVisualCount = photoCount + graphicCount;
  const totalPosts = videoCount + photoCount + graphicCount;

  // Rate lookup
  const videoTierRate = getVideoTierRate(videoCount, config.videoTiers);
  const combinedVisualTierRate = getVisualTierRate(combinedVisualCount, config.visualTiers);
  const storyTierRate = getStoryTierRate(storyCount, config);

  // Style and Scale Multipliers
  const videoStyleMultiplier = config.videoStyleMultipliers[state.videoStyle] ?? 1.0;
  const industryScaleMultiplier = config.industryMultipliers[state.industryScale] ?? 1.0;

  // Core Subtotals (Silent Math)
  const videoSubtotal = videoCount * videoTierRate * videoStyleMultiplier;
  const visualSubtotal = combinedVisualCount * combinedVisualTierRate;
  const storySubtotal = storyCount * storyTierRate;

  // Channel Add-on Subtotals
  const freeAllowance = Math.max(0, chConfig.repostFreeAllowance);
  const extraRepostFee = Math.max(0, chConfig.repostExtraFee);

  const xRepostsCharged = clampedChannels.x.enabled
    ? Math.max(0, clampedChannels.x.videoReposts - freeAllowance)
    : 0;
  const linkedinRepostsCharged = clampedChannels.linkedin.enabled
    ? Math.max(0, clampedChannels.linkedin.videoReposts - freeAllowance)
    : 0;
  const youtubeShortsCharged = clampedChannels.youtube.enabled
    ? Math.max(0, clampedChannels.youtube.shortsCount - freeAllowance)
    : 0;

  const xSubtotal = clampedChannels.x.enabled
    ? clampedChannels.x.postCount * chConfig.xPostRate +
      clampedChannels.x.threadCount * chConfig.xThreadRate +
      xRepostsCharged * extraRepostFee
    : 0;

  const linkedinSubtotal = clampedChannels.linkedin.enabled
    ? clampedChannels.linkedin.postCount * chConfig.linkedinPostRate +
      clampedChannels.linkedin.carouselCount * chConfig.linkedinCarouselRate +
      linkedinRepostsCharged * extraRepostFee
    : 0;

  const ytLandscapeRate = getVideoTierRate(
    clampedChannels.youtube.landscapeCount,
    chConfig.youtubeLandscapeTiers
  );
  const youtubeSubtotal = clampedChannels.youtube.enabled
    ? clampedChannels.youtube.landscapeCount * ytLandscapeRate * videoStyleMultiplier +
      youtubeShortsCharged * extraRepostFee
    : 0;

  const channelsSubtotal = xSubtotal + linkedinSubtotal + youtubeSubtotal;

  // Engagement Fee logic: waived if totalPosts (core posts only) >= threshold
  const isEngagementWaived = engagementReport && totalPosts >= config.engagementThreshold;
  const engagementFeeEffective =
    engagementReport && !isEngagementWaived ? config.engagementFee : 0;

  // Raw Total & Rounding to nearest 500 ETB
  const rawTotal =
    (videoSubtotal + visualSubtotal + storySubtotal + channelsSubtotal + engagementFeeEffective) *
    industryScaleMultiplier;
  const estimatedNetTotal = rawTotal === 0 ? 0 : Math.round(rawTotal / 500) * 500;
  const taxAmount = Math.round(estimatedNetTotal * config.taxRate);
  const grandTotal = estimatedNetTotal + taxAmount;

  const activeChannelsCount =
    Number(clampedChannels.x.enabled) +
    Number(clampedChannels.linkedin.enabled) +
    Number(clampedChannels.youtube.enabled);

  return {
    videoCount,
    photoCount,
    graphicCount,
    storyCount,
    combinedVisualCount,
    totalPosts,
    isEngagementWaived,
    engagementReportIncluded: engagementReport,
    estimatedNetTotal,
    taxAmount,
    grandTotal,
    activePreset: state.activePreset,
    clientName: state.clientName.trim(),
    industryScale: state.industryScale,
    videoStyle: state.videoStyle,
    videoTierUnlocked: videoCount >= 4,
    visualTierUnlocked: combinedVisualCount >= 4,
    storyTierUnlocked: storyCount >= 4,
    channels: clampedChannels,
    activeChannelsCount,
    youtubeLandscapeTierUnlocked:
      clampedChannels.youtube.enabled && clampedChannels.youtube.landscapeCount >= 4,
    xRepostsCharged,
    linkedinRepostsCharged,
    youtubeShortsCharged,
  };
}

export function formatETB(amount: number): string {
  return amount.toLocaleString('en-US');
}
