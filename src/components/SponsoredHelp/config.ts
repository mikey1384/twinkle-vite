import { useEffect, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';

// The sponsored help config (twinkle-api GET /chat/sponsored-help/config),
// read once per page load by the chat and comment wands.
export interface WandConfig {
  enabled: boolean;
  mode: 'on' | 'off';
  percents: number[];
  taskMaxLength: number;
  // wand cards: up to 3 objectives, in DMs and on comments (missing on an
  // API from before them)
  cards?: boolean;
  maxObjectives?: number;
  objectiveMaxLength?: number;
  // open wand cards embedded in rich text (missing on an API from before them)
  openCards?: boolean;
  openCardDefaultCap?: number;
  openCardMaxCap?: number;
  openCardPerPersonPercent?: number;
}

let configPromise: Promise<WandConfig | null> | null = null;

export function loadWandConfig(load: () => Promise<any>): Promise<WandConfig | null> {
  configPromise ||= Promise.resolve(load()).catch(() => {
    configPromise = null;
    return null;
  });
  return configPromise;
}

// The config for a component (null until loaded, and for guests).
export function useWandConfig(): WandConfig | null {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const loadSponsoredHelpConfig = useAppContext((v) => v.requestHelpers.loadSponsoredHelpConfig);
  const [config, setConfig] = useState<WandConfig | null>(null);
  useEffect(() => {
    if (!myId) return;
    let cancelled = false;
    void loadWandConfig(loadSponsoredHelpConfig).then((value) => {
      if (!cancelled) setConfig(value);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);
  return myId ? config : null;
}

// Open wand cards can be made: wand help is on for this member and the API
// has open cards.
export function canMakeOpenWandCard(config: WandConfig | null) {
  return config?.enabled === true && config?.openCards === true;
}
