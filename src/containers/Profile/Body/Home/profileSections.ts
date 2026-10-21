const profileSectionKeys = [
  'reflectionStats',
  'intro',
  'pictures',
  'builds',
  'pinnedAICards',
  'featuredSubjects',
  'notableActivities',
  'xpAnalysis',
  'missionProgress'
];

export const profileSectionLabels: Record<string, string> = {
  reflectionStats: 'Daily Reflection Stats',
  intro: 'Intro',
  pictures: 'Pictures',
  builds: 'Builds',
  pinnedAICards: 'AI Cards',
  featuredSubjects: 'Featured Subjects',
  notableActivities: 'Notable Activities',
  xpAnalysis: 'XP Analysis',
  missionProgress: 'Mission Progress'
};

const legacyActivitySectionKeys = [
  'featuredSubjects',
  'notableActivities',
  'xpAnalysis',
  'missionProgress'
];

export function normalizeSectionOrder(sectionOrder: unknown) {
  const allowed = new Set(profileSectionKeys);
  const seen = new Set<string>();
  const normalized: string[] = [];
  if (Array.isArray(sectionOrder)) {
    for (const rawKey of sectionOrder) {
      const key = String(rawKey);
      if (key === 'activities') {
        for (const activityKey of legacyActivitySectionKeys) {
          if (seen.has(activityKey)) continue;
          seen.add(activityKey);
          normalized.push(activityKey);
        }
        continue;
      }
      if (!allowed.has(key) || seen.has(key)) continue;
      seen.add(key);
      normalized.push(key);
    }
  }
  // Stats used to sit above every reorderable section. Keep that position
  // for existing profiles until the member explicitly moves it.
  if (!seen.has('reflectionStats')) {
    seen.add('reflectionStats');
    normalized.unshift('reflectionStats');
  }
  for (const key of profileSectionKeys) {
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(key);
    }
  }
  return normalized;
}
