import type { BuildStudioBrowseMode } from '~/contexts/Build/reducer';
import type { BuildBrowseTab, BuildListTab } from './types';

export const buildListTabs: Array<{
  value: BuildListTab;
  label: string;
  icon: string;
}> = [
  { value: 'mine', label: 'My Builds', icon: 'rocket-launch' },
  { value: 'collaborating', label: 'Team Builds', icon: 'users' },
  { value: 'community', label: 'Community', icon: 'users' },
  { value: 'open_source', label: 'Open Source', icon: 'code-branch' }
];

export const buildBrowseTabs: BuildBrowseTab[] = [
  'collaborating',
  'community',
  'open_source'
];

export const buildBrowseModeTabs: Array<{
  value: BuildStudioBrowseMode;
  label: string;
  icon: string;
}> = [
  { value: 'recent', label: 'Recent', icon: 'clock' },
  { value: 'leaderboard', label: 'Leaderboard', icon: 'trophy' }
];
