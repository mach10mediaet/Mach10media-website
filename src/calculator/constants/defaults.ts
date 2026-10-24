import type {
  ChannelOption,
  ChannelSelection,
  IndustryOption,
  PricingConfig,
  VideoStyleOption,
} from '../types';

export const DEFAULT_CHANNELS: ChannelSelection = {
  x: {
    enabled: false,
    postCount: 0,
    threadCount: 0,
    videoReposts: 0,
  },
  linkedin: {
    enabled: false,
    postCount: 0,
    carouselCount: 0,
    videoReposts: 0,
  },
  youtube: {
    enabled: false,
    shortsCount: 0,
    landscapeCount: 0,
  },
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  videoTiers: {
    tier1: 4500, // 1-3 videos
    tier2: 4000, // 4-6 videos
    tier3: 3750, // 7-9 videos
    tier4: 3300, // 10+ videos
  },
  visualTiers: {
    tier1: 1800, // 1-3 combined visual posts
    tier2: 1500, // 4-6 combined visual posts
    tier3: 1300, // 7-9 combined visual posts
    tier4: 1100, // 10+ combined visual posts
  },
  storyRateRatio: 0.5, // 50% of visual tier rate
  engagementFee: 4000, // 4,000 ETB
  engagementThreshold: 8, // Waived if total posts >= 8
  industryMultipliers: {
    small: 1.0,
    medium: 1.25,
    corporate: 1.5,
    enterprise: 2.0,
  },
  videoStyleMultipliers: {
    talkingHead: 1.0,
    lifestyle: 1.3,
    commercial: 1.75,
  },
  channels: {
    xPostRate: 600,
    xThreadRate: 1500,
    linkedinPostRate: 900,
    linkedinCarouselRate: 1800,
    youtubeLandscapeTiers: {
      tier1: 9000,
      tier2: 8000,
      tier3: 7500,
      tier4: 6600,
    },
    repostFreeAllowance: 4,
    repostExtraFee: 500,
  },
  taxRate: 0.15, // 15% VAT
};

export const CHANNEL_OPTIONS: ChannelOption[] = [
  {
    key: 'x',
    code: 'X',
    name: 'X (Twitter)',
    subtitle: 'Real-Time Pulse, Threads & Clips',
    formatsSummary: 'X Posts (16:9 1600×900) · Multi-Post Threads · Adapted Reel Cutdowns',
  },
  {
    key: 'linkedin',
    code: 'IN',
    name: 'LinkedIn',
    subtitle: 'Executive Authority & B2B Carousels',
    formatsSummary: 'Long-Form Insights · PDF Document Carousels (4:5 1080×1350) · Native Video',
  },
  {
    key: 'youtube',
    code: 'YT',
    name: 'YouTube',
    subtitle: 'Shorts Syndication & 16:9 Long-Form',
    formatsSummary: 'YouTube Shorts (9:16 Reused Reels) · Dedicated 16:9 (1920×1080) + Thumbnail',
  },
];

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  {
    key: 'small',
    title: 'Small Business / Startup / Creator',
    subtitle: 'Boutique & Emerging Brand Scale',
    description: 'Direct-to-consumer, local retail, modern indie brands & personal executive presence.',
    badge: 'Standard Scale',
  },
  {
    key: 'medium',
    title: 'Established Business / Hospitality / NGO',
    subtitle: 'Growth & Regional Reach',
    description: 'Hotels, dining groups, multi-branch retail, medical practices & prominent non-profits.',
    badge: 'Regional Scale',
  },
  {
    key: 'corporate',
    title: 'Corporate / Real Estate / Finance',
    subtitle: 'Institutional & Industry Leadership',
    description: 'Commercial real estate developers, banking, fintech, industrial firms & tech scale-ups.',
    badge: 'Corporate Scope',
  },
  {
    key: 'enterprise',
    title: 'Enterprise / Multinational / FMCG',
    subtitle: 'Global & High-Volume Scale',
    description: 'Pan-African & global conglomerates, major consumer brands & nationwide media rollout.',
    badge: 'Enterprise Tier',
  },
];

export const VIDEO_STYLE_OPTIONS: VideoStyleOption[] = [
  {
    key: 'talkingHead',
    title: 'Talking Head & Essential Reels',
    subtitle: 'Single-Cam Direct to Camera',
    description: 'Clean pro-audio, studio key lighting, on-screen dynamic typography & crisp cutdowns.',
    badge: 'Essential Pro',
    iconName: 'UserCheck',
  },
  {
    key: 'lifestyle',
    title: 'Dynamic Lifestyle & B-Roll',
    subtitle: 'Location & Narrative Movement',
    description: 'Multi-angle location coverage, stylized atmospheric lighting, gimbal flow & sound design.',
    badge: 'Dynamic Studio',
    iconName: 'Clapperboard',
  },
  {
    key: 'commercial',
    title: 'High-Production Commercial',
    subtitle: 'Cinematic Storyboard & Full Crew',
    description: 'Multi-cam setup, scripted scene direction, cinema-grade glass, custom color grade & sound design.',
    badge: 'Cinematic Apex',
    iconName: 'Film',
  },
];

export const PRESET_DEFINITIONS = {
  bronze: {
    name: 'BRONZE',
    label: 'Bronze Signature',
    tagline: 'Balanced Hybrid Content Mix',
    videoCount: 4,
    photoCount: 4,
    graphicCount: 0,
    storyCount: 0,
    engagementReport: true,
    highlight: '4 Videos + 4 Photos (8 Posts)',
  },
  silver: {
    name: 'SILVER',
    label: 'Silver Motion',
    tagline: 'High-Impact Short-Form Dominance',
    videoCount: 8,
    photoCount: 0,
    graphicCount: 0,
    storyCount: 0,
    engagementReport: true,
    highlight: '8 Dedicated Video Reels',
  },
  gold: {
    name: 'GOLD',
    label: 'Gold Premiere',
    tagline: 'Comprehensive Full-Spectrum Presence',
    videoCount: 8,
    photoCount: 4,
    graphicCount: 0,
    storyCount: 0,
    engagementReport: true,
    highlight: '8 Videos + 4 Photos (12 Posts)',
  },
};
