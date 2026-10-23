import { SITE_NAME } from '../constants/siteBrand';

const contentTitles = new Map([
  ['comments', 'Comment'],
  ['links', 'Link'],
  ['missions', 'Mission'],
  ['playlists', 'Playlist'],
  ['subjects', 'Subject'],
  ['videos', 'Video'],
  ['ai-cards', 'AI Card'],
  ['ai-stories', 'AI Story'],
  ['ai-card-summons', 'AI Card Summon'],
  ['daily-reflections', 'Daily Reflection'],
  ['mission-passes', 'Mission Pass'],
  ['achievement-unlocks', 'Achievement'],
  ['bounties', 'Bounty'],
  ['bridge-steps', 'Bridge Step'],
  ['daily-rewards', 'Daily Goal'],
  ['shared-prompts', 'Shared Prompt']
]);

const sectionTitles = new Map([
  ['achievements', 'Achievements'],
  ['ai-cards', 'Explore AI Cards'],
  ['ai-stories', 'AI Stories'],
  ['app', 'Build App'],
  ['app-capture', 'Build App'],
  ['bridge', 'Bridge Builder Check-in'],
  ['bridge-builder', 'Bridge Builder'],
  ['build', 'Build'],
  ['chat', 'Chat'],
  ['cli', 'Connect Lumine'],
  ['daily-reflection', 'Daily Reflection'],
  ['earn', 'Earn'],
  ['explore', 'Explore'],
  ['friends', 'Friends'],
  ['grammarbles', 'Grammarbles'],
  ['groups', 'Groups'],
  ['links', 'Links'],
  ['management', 'Management'],
  ['missions', 'Missions'],
  ['playlists', 'Playlists'],
  ['privacy', 'Privacy'],
  ['prompts', 'Prompts'],
  ['reset', 'Reset Password'],
  ['settings', 'Settings'],
  ['signup', 'Guardian Consent'],
  ['sponsor', 'Sponsor'],
  ['subjects', 'Subjects'],
  ['users', 'Users'],
  ['verify', 'Email Verification'],
  ['videos', 'Videos']
]);

// Shared by browser-tab fallbacks and analytics. Keep report titles stable:
// content IDs, usernames, tokens and arbitrary URL slugs are not page names.
// Pages may still set richer browser-tab titles once their content loads.
export function getBasePageTitle(pathname: string): string {
  const [section = '', subsection = ''] = pathname
    .split(/[?#]/, 1)[0]
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());

  if (section === 'achievements' && subsection === 'bridge-builder') {
    return `Bridge Builder | ${SITE_NAME}`;
  }

  const title =
    (subsection ? contentTitles.get(section) : undefined) ||
    sectionTitles.get(section) ||
    contentTitles.get(section);

  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}
