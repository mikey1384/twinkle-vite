import type { CrewStage } from './types';

// Preset crew covers (twinkle-api meetupQuestRules MEETUP_CREW_COVERS). No
// uploads, for kid safety: a solid colour with a scatter of icons.
export interface CrewCoverPreset {
  key: string;
  label: string;
  color: string;
  icons: string[];
}

export const CREW_COVERS: CrewCoverPreset[] = [
  { key: 'sky', label: 'Sky', color: '#418ceb', icons: ['rocket', 'star', 'globe'] },
  { key: 'forest', label: 'Forest', color: '#2e8b57', icons: ['tree', 'puzzle-piece', 'heart'] },
  { key: 'sunset', label: 'Sunset', color: '#f07a2b', icons: ['fire', 'star', 'lightbulb'] },
  { key: 'ocean', label: 'Ocean', color: '#1b7a9e', icons: ['globe', 'book-open', 'star'] },
  { key: 'galaxy', label: 'Galaxy', color: '#5b3fa8', icons: ['rocket', 'star', 'brain'] },
  { key: 'garden', label: 'Garden', color: '#d9577f', icons: ['heart', 'palette', 'star'] },
  { key: 'library', label: 'Library', color: '#8a5a3c', icons: ['book', 'book-open', 'lightbulb'] },
  { key: 'lab', label: 'Lab', color: '#139a9a', icons: ['brain', 'code', 'lightbulb'] }
];

export function coverFor(key: string) {
  return CREW_COVERS.find((cover) => cover.key === key) || CREW_COVERS[0];
}

export const STAGE_STYLES: Record<CrewStage, { label: string; color: string }> = {
  forming: { label: 'Forming', color: '#418ceb' },
  parents: { label: 'Parents', color: '#8a4fd6' },
  planning: { label: 'Planning', color: '#e08a00' },
  meeting: { label: 'Meeting soon', color: '#d9577f' },
  filmed: { label: 'Filmed', color: '#139a9a' },
  done: { label: 'Complete!', color: '#28a745' },
  closed: { label: 'Closed', color: '#888888' }
};

// "Bridge Builders!" for finished crews, from the achievement's own title.
export function stageLabel(stage: CrewStage, achievementTitle: string) {
  if (stage === 'done' && achievementTitle) return `${achievementTitle}s!`;
  return STAGE_STYLES[stage]?.label || '';
}
