import { useEffect, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { PricingConfig } from '../types';
import {
  checkAndConsumeUrlConfig,
  decodePricingConfig,
  encodePricingConfig,
  loadSavedPricingConfig,
  savePricingConfig,
} from './configCodec';

const SETTINGS_DOC_KEY = 'pricing_config';

// A ?cfg=... share link is a deliberate one-session override: it wins over the
// Firestore value until the next full page load. Evaluated once at module load.
const urlOverrideConfig: PricingConfig | null = checkAndConsumeUrlConfig();

export interface PricingConfigState {
  config: PricingConfig;
  /** True once the Firestore read has settled (or an override is active). */
  loaded: boolean;
}

/**
 * Live pricing config: Firestore (site_settings/pricing_config, an encoded
 * token) > localStorage cache > defaults. A ?cfg= URL token outranks all of
 * them for the current session.
 */
export function usePricingConfig(): PricingConfigState {
  const [state, setState] = useState<PricingConfigState>(() => ({
    config: urlOverrideConfig ?? loadSavedPricingConfig(),
    loaded: Boolean(urlOverrideConfig),
  }));

  useEffect(() => {
    if (urlOverrideConfig) return;
    const unsubscribe = onSnapshot(
      doc(db, 'site_settings', SETTINGS_DOC_KEY),
      (snap) => {
        const raw = snap.exists() ? snap.data().value : null;
        const decoded =
          typeof raw === 'string' && raw ? decodePricingConfig(raw) : null;
        if (decoded) savePricingConfig(decoded);
        setState({
          config: decoded ?? loadSavedPricingConfig(),
          loaded: true,
        });
      },
      (err) => {
        console.error('Failed to load pricing config:', err);
        setState((prev) => ({ ...prev, loaded: true }));
      }
    );
    return unsubscribe;
  }, []);

  return state;
}

/** Persists the config to Firestore (source of truth) and the local cache. */
export async function savePricingConfigToCloud(config: PricingConfig): Promise<void> {
  const token = encodePricingConfig(config);
  if (!token) throw new Error('Failed to encode pricing config.');
  await setDoc(doc(db, 'site_settings', SETTINGS_DOC_KEY), {
    value: token,
    updatedAt: serverTimestamp(),
  });
  savePricingConfig(config);
}

/** Builds a client share link that pins the given config via ?cfg=. */
export function buildClientShareLink(config: PricingConfig): string {
  const token = encodePricingConfig(config);
  return `${window.location.origin}/rates?cfg=${token}`;
}
