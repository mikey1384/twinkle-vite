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
}

let configPromise: Promise<WandConfig | null> | null = null;

export function loadWandConfig(load: () => Promise<any>): Promise<WandConfig | null> {
  configPromise ||= Promise.resolve(load()).catch(() => {
    configPromise = null;
    return null;
  });
  return configPromise;
}
