import { DEFAULT_PRICING_CONFIG } from '../constants/defaults';
import type { PricingConfig } from '../types';

// localStorage is only an offline cache; the source of truth lives in
// Firestore at site_settings/pricing_config (see configStore.ts).
const STORAGE_KEY = 'mach10_pricing_config_v2';
const LEGACY_STORAGE_KEY = 'aura_luxe_pricing_config_v1';

interface CompactConfig {
  v: [number, number, number, number];
  p: [number, number, number, number];
  s: number;
  ef: number;
  et: number;
  im: [number, number, number, number];
  vm: [number, number, number];
  tr: number;
  ch?: {
    xp: number;
    xt: number;
    lp: number;
    lc: number;
    yt: [number, number, number, number];
    rf: number;
    re: number;
  };
}

function num(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function mergePricingConfig(partial: Partial<PricingConfig> | null | undefined): PricingConfig {
  const def = DEFAULT_PRICING_CONFIG;
  if (!partial || typeof partial !== 'object') return def;

  return {
    videoTiers: {
      tier1: num(partial.videoTiers?.tier1, def.videoTiers.tier1),
      tier2: num(partial.videoTiers?.tier2, def.videoTiers.tier2),
      tier3: num(partial.videoTiers?.tier3, def.videoTiers.tier3),
      tier4: num(partial.videoTiers?.tier4, def.videoTiers.tier4),
    },
    visualTiers: {
      tier1: num(partial.visualTiers?.tier1, def.visualTiers.tier1),
      tier2: num(partial.visualTiers?.tier2, def.visualTiers.tier2),
      tier3: num(partial.visualTiers?.tier3, def.visualTiers.tier3),
      tier4: num(partial.visualTiers?.tier4, def.visualTiers.tier4),
    },
    storyRateRatio: num(partial.storyRateRatio, def.storyRateRatio),
    storyTiersOverride: partial.storyTiersOverride,
    engagementFee: num(partial.engagementFee, def.engagementFee),
    engagementThreshold: num(partial.engagementThreshold, def.engagementThreshold),
    industryMultipliers: {
      small: num(partial.industryMultipliers?.small, def.industryMultipliers.small),
      medium: num(partial.industryMultipliers?.medium, def.industryMultipliers.medium),
      corporate: num(partial.industryMultipliers?.corporate, def.industryMultipliers.corporate),
      enterprise: num(partial.industryMultipliers?.enterprise, def.industryMultipliers.enterprise),
    },
    videoStyleMultipliers: {
      talkingHead: num(
        partial.videoStyleMultipliers?.talkingHead,
        def.videoStyleMultipliers.talkingHead
      ),
      lifestyle: num(
        partial.videoStyleMultipliers?.lifestyle,
        def.videoStyleMultipliers.lifestyle
      ),
      commercial: num(
        partial.videoStyleMultipliers?.commercial,
        def.videoStyleMultipliers.commercial
      ),
    },
    channels: {
      xPostRate: num(partial.channels?.xPostRate, def.channels.xPostRate),
      xThreadRate: num(partial.channels?.xThreadRate, def.channels.xThreadRate),
      linkedinPostRate: num(partial.channels?.linkedinPostRate, def.channels.linkedinPostRate),
      linkedinCarouselRate: num(
        partial.channels?.linkedinCarouselRate,
        def.channels.linkedinCarouselRate
      ),
      youtubeLandscapeTiers: {
        tier1: num(
          partial.channels?.youtubeLandscapeTiers?.tier1,
          def.channels.youtubeLandscapeTiers.tier1
        ),
        tier2: num(
          partial.channels?.youtubeLandscapeTiers?.tier2,
          def.channels.youtubeLandscapeTiers.tier2
        ),
        tier3: num(
          partial.channels?.youtubeLandscapeTiers?.tier3,
          def.channels.youtubeLandscapeTiers.tier3
        ),
        tier4: num(
          partial.channels?.youtubeLandscapeTiers?.tier4,
          def.channels.youtubeLandscapeTiers.tier4
        ),
      },
      repostFreeAllowance: num(
        partial.channels?.repostFreeAllowance,
        def.channels.repostFreeAllowance
      ),
      repostExtraFee: num(partial.channels?.repostExtraFee, def.channels.repostExtraFee),
    },
    taxRate: num(partial.taxRate, def.taxRate),
  };
}

export function encodePricingConfig(config: PricingConfig): string {
  const ch = config.channels ?? DEFAULT_PRICING_CONFIG.channels;
  const compact: CompactConfig = {
    v: [
      config.videoTiers.tier1,
      config.videoTiers.tier2,
      config.videoTiers.tier3,
      config.videoTiers.tier4,
    ],
    p: [
      config.visualTiers.tier1,
      config.visualTiers.tier2,
      config.visualTiers.tier3,
      config.visualTiers.tier4,
    ],
    s: config.storyRateRatio,
    ef: config.engagementFee,
    et: config.engagementThreshold,
    im: [
      config.industryMultipliers.small,
      config.industryMultipliers.medium,
      config.industryMultipliers.corporate,
      config.industryMultipliers.enterprise,
    ],
    vm: [
      config.videoStyleMultipliers.talkingHead,
      config.videoStyleMultipliers.lifestyle,
      config.videoStyleMultipliers.commercial,
    ],
    tr: config.taxRate,
    ch: {
      xp: ch.xPostRate,
      xt: ch.xThreadRate,
      lp: ch.linkedinPostRate,
      lc: ch.linkedinCarouselRate,
      yt: [
        ch.youtubeLandscapeTiers.tier1,
        ch.youtubeLandscapeTiers.tier2,
        ch.youtubeLandscapeTiers.tier3,
        ch.youtubeLandscapeTiers.tier4,
      ],
      rf: ch.repostFreeAllowance,
      re: ch.repostExtraFee,
    },
  };

  try {
    const jsonStr = JSON.stringify(compact);
    // Base64 encoding with URL safe characters
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode pricing config:', err);
    return '';
  }
}

export function decodePricingConfig(token: string): PricingConfig | null {
  try {
    // Restore base64 padding
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    const compact: CompactConfig = JSON.parse(jsonStr);

    if (!compact.v || !compact.p || !compact.im || !compact.vm) {
      return null;
    }

    const defCh = DEFAULT_PRICING_CONFIG.channels;

    return {
      videoTiers: {
        tier1: num(compact.v[0], DEFAULT_PRICING_CONFIG.videoTiers.tier1),
        tier2: num(compact.v[1], DEFAULT_PRICING_CONFIG.videoTiers.tier2),
        tier3: num(compact.v[2], DEFAULT_PRICING_CONFIG.videoTiers.tier3),
        tier4: num(compact.v[3], DEFAULT_PRICING_CONFIG.videoTiers.tier4),
      },
      visualTiers: {
        tier1: num(compact.p[0], DEFAULT_PRICING_CONFIG.visualTiers.tier1),
        tier2: num(compact.p[1], DEFAULT_PRICING_CONFIG.visualTiers.tier2),
        tier3: num(compact.p[2], DEFAULT_PRICING_CONFIG.visualTiers.tier3),
        tier4: num(compact.p[3], DEFAULT_PRICING_CONFIG.visualTiers.tier4),
      },
      storyRateRatio: num(compact.s, DEFAULT_PRICING_CONFIG.storyRateRatio),
      engagementFee: num(compact.ef, DEFAULT_PRICING_CONFIG.engagementFee),
      engagementThreshold: num(compact.et, DEFAULT_PRICING_CONFIG.engagementThreshold),
      industryMultipliers: {
        small: num(compact.im[0], 1.0),
        medium: num(compact.im[1], 1.25),
        corporate: num(compact.im[2], 1.5),
        enterprise: num(compact.im[3], 2.0),
      },
      videoStyleMultipliers: {
        talkingHead: num(compact.vm[0], 1.0),
        lifestyle: num(compact.vm[1], 1.3),
        commercial: num(compact.vm[2], 1.75),
      },
      channels: {
        xPostRate: num(compact.ch?.xp, defCh.xPostRate),
        xThreadRate: num(compact.ch?.xt, defCh.xThreadRate),
        linkedinPostRate: num(compact.ch?.lp, defCh.linkedinPostRate),
        linkedinCarouselRate: num(compact.ch?.lc, defCh.linkedinCarouselRate),
        youtubeLandscapeTiers: {
          tier1: num(compact.ch?.yt?.[0], defCh.youtubeLandscapeTiers.tier1),
          tier2: num(compact.ch?.yt?.[1], defCh.youtubeLandscapeTiers.tier2),
          tier3: num(compact.ch?.yt?.[2], defCh.youtubeLandscapeTiers.tier3),
          tier4: num(compact.ch?.yt?.[3], defCh.youtubeLandscapeTiers.tier4),
        },
        repostFreeAllowance: num(compact.ch?.rf, defCh.repostFreeAllowance),
        repostExtraFee: num(compact.ch?.re, defCh.repostExtraFee),
      },
      taxRate: num(compact.tr, DEFAULT_PRICING_CONFIG.taxRate),
    };
  } catch (err) {
    console.error('Failed to decode pricing config:', err);
    return null;
  }
}

export function loadSavedPricingConfig(): PricingConfig {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergePricingConfig(parsed);
    }
  } catch (err) {
    console.warn('Error reading pricing config from localStorage:', err);
  }
  return DEFAULT_PRICING_CONFIG;
}

export function savePricingConfig(config: PricingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving pricing config to localStorage:', err);
  }
}

/**
 * Checks URL for ?cfg=... or &cfg=...
 * If found, decodes config and removes cfg parameter from visible address bar
 */
export function checkAndConsumeUrlConfig(): PricingConfig | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const cfgToken = url.searchParams.get('cfg');

  if (cfgToken) {
    const decoded = decodePricingConfig(cfgToken);
    // Strip cfg parameter immediately so client cannot inspect or tamper with it
    url.searchParams.delete('cfg');
    const newUrl =
      url.pathname +
      (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') +
      url.hash;
    window.history.replaceState(null, '', newUrl);

    if (decoded) {
      // Also persist to current session/localStorage
      savePricingConfig(decoded);
      return decoded;
    }
  }

  return null;
}
