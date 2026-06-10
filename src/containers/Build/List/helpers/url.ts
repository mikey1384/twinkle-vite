import type { BuildStudioBrowseMode } from '~/contexts/Build/reducer';
import type { BuildListTab } from '../types';
import { isPublicBrowseTab } from './index';

export const buildListTabSlugs: Record<BuildListTab, string> = {
  mine: 'my',
  collaborating: 'team',
  community: 'community',
  open_source: 'open-source'
};

// Static route paths must stay non-numeric so they never collide with the
// /build/:buildId and /build/:buildId/:branchNumber routes.
export const buildListTabRoutes: Array<{
  path: string;
  tab: BuildListTab;
  browseMode?: BuildStudioBrowseMode;
}> = [
  { path: buildListTabSlugs.mine, tab: 'mine' },
  { path: buildListTabSlugs.collaborating, tab: 'collaborating' },
  ...(['community', 'open_source'] as const).flatMap((tab) => {
    const slug = buildListTabSlugs[tab];
    return [
      { path: slug, tab },
      { path: `${slug}/recent`, tab, browseMode: 'recent' as const },
      { path: `${slug}/leaderboard`, tab, browseMode: 'leaderboard' as const },
      { path: `${slug}/*`, tab }
    ];
  })
];

export function getBuildListTabPath(
  tab: BuildListTab,
  browseMode?: BuildStudioBrowseMode
) {
  const basePath = `/build/${buildListTabSlugs[tab]}`;
  if (!isPublicBrowseTab(tab)) return basePath;
  return `${basePath}/${browseMode === 'leaderboard' ? 'leaderboard' : 'recent'}`;
}
