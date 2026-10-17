import { getBountySubjectCopy, normalizeBountySubject } from './bountySubject';

// The reward day is the site's UTC day (rewardDay on the server).
export function getDigestDayLabel(dayKey: string, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  if (dayKey === today) return 'Today';
  const yesterday = new Date(now - 86400000).toISOString().slice(0, 10);
  if (dayKey === yesterday) return 'Yesterday';
  const date = new Date(`${dayKey}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

// "Mina, Joon, +6": who earned their first reward in the app today, shown
// from two up (one newcomer has their own card). The first two are named.
export function getNewcomerSummary(
  newcomers?: {
    count?: number;
    users?: Array<{ userId: number; username: string }>;
  } | null
) {
  const count = Math.max(0, Math.floor(Number(newcomers?.count) || 0));
  const users = (newcomers?.users || [])
    .filter((user) => user?.userId && user.username)
    .slice(0, 2);
  if (count < 2 || !users.length) return null;
  return { users, rest: Math.max(0, count - users.length) };
}

// The card's "who just earned what" line. When the latest reward says what it
// was for (a World First item, a song), lead with that: "discovered Puddle
// first", with the rule title as a small tag ("Intermediate word"). Without a
// subject, keep "just earned <rule title>".
export function getDigestLatestLine(
  latest?: { title?: string; subject?: unknown } | null
) {
  const ruleTitle = String(latest?.title || '').trim();
  const subject = normalizeBountySubject(latest?.subject);
  if (!subject) {
    return { lead: 'just earned', subjectTitle: null, after: '', tag: '', ruleTitle };
  }
  if (subject.action === 'discover') {
    return {
      lead: 'discovered',
      subjectTitle: subject.title,
      after: ' first',
      // "World First: Intermediate word" -> "Intermediate word"
      tag: ruleTitle.replace(/^world first\s*[:\-–]\s*/i, '') || ruleTitle,
      ruleTitle
    };
  }
  const { lead } = getBountySubjectCopy(subject);
  return {
    lead: lead ? lead.charAt(0).toLowerCase() + lead.slice(1) : 'earned a reward for',
    subjectTitle: subject.title,
    after: '',
    tag: ruleTitle,
    ruleTitle
  };
}
