import type { PromptBrowseMode, PromptListTab } from '../types';

export const promptListTabSlugs: Record<PromptListTab, string> = {
  my: 'my',
  community: 'community'
};

export const promptListTabRoutes: Array<{
  path: string;
  tab: PromptListTab;
  browseMode?: PromptBrowseMode;
}> = [
  { path: promptListTabSlugs.my, tab: 'my' },
  {
    path: promptListTabSlugs.community,
    tab: 'community'
  },
  {
    path: `${promptListTabSlugs.community}/recent`,
    tab: 'community',
    browseMode: 'recent'
  },
  {
    path: `${promptListTabSlugs.community}/leaderboard`,
    tab: 'community',
    browseMode: 'leaderboard'
  },
  {
    path: `${promptListTabSlugs.community}/*`,
    tab: 'community'
  }
];

export function getPromptListTabPath(
  tab: PromptListTab,
  browseMode?: PromptBrowseMode
) {
  const basePath = `/prompts/${promptListTabSlugs[tab]}`;
  if (tab === 'my') return basePath;
  return `${basePath}/${
    browseMode === 'leaderboard' ? 'leaderboard' : 'recent'
  }`;
}

export function isPromptListPath(pathname: string) {
  const [, section, tabSlug] = pathname.split('/');
  if (section !== 'prompts') return false;
  if (!tabSlug) return true;
  return Object.values(promptListTabSlugs).includes(tabSlug as PromptListTab);
}
