// What a paid Build reward was for (the API's story.subject; see
// twinkle-api helpers/build/rewardSubject.ts). The server only sends it while
// the app is public and, for a song, while that song is still published.
export interface BountySubject {
  kind: 'song' | 'item';
  action: 'listen' | 'listen-own' | 'publish' | null;
  title: string;
  path: string | null;
  imageUrl: string | null;
  creator: { id: number; username: string } | null;
}

const PATH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/;

export function normalizeBountySubject(value: unknown): BountySubject | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, any>;
  const title = typeof source.title === 'string' ? source.title.trim() : '';
  if (!title) return null;
  const creatorId = Number(source.creator?.id);
  const creatorName =
    typeof source.creator?.username === 'string'
      ? source.creator.username.trim()
      : '';
  return {
    kind: source.kind === 'song' ? 'song' : 'item',
    action:
      source.action === 'listen' ||
      source.action === 'listen-own' ||
      source.action === 'publish'
        ? source.action
        : null,
    title,
    path:
      typeof source.path === 'string' && PATH_PATTERN.test(source.path)
        ? source.path
        : null,
    imageUrl:
      typeof source.imageUrl === 'string' &&
      source.imageUrl.startsWith('https://')
        ? source.imageUrl
        : null,
    creator:
      creatorId > 0 && creatorName
        ? { id: creatorId, username: creatorName }
        : null
  };
}

// The story's main line, in plain words. `lead` precedes the quoted title;
// `byCreator` is true when "by <creator>" should follow.
export function getBountySubjectCopy(subject: BountySubject) {
  if (subject.action === 'listen')
    return { lead: 'Listened to', byCreator: Boolean(subject.creator) };
  if (subject.action === 'listen-own')
    return { lead: 'Listened to their own song', byCreator: false };
  if (subject.action === 'publish')
    return { lead: 'Published', byCreator: false };
  return { lead: '', byCreator: false };
}

/** A one-sentence summary, e.g. for the play button's accessible name. */
export function getBountySubjectSentence({
  subject,
  username,
  xp,
  appTitle
}: {
  subject: BountySubject;
  username?: string;
  xp?: number;
  appTitle?: string;
}) {
  const who = username || 'Someone';
  const earned =
    Number(xp) > 0 ? `earned ${Number(xp).toLocaleString('en-US')} XP` : 'earned a bounty';
  const where = appTitle ? ` in ${appTitle}` : '';
  if (subject.action === 'listen')
    return `${who} ${earned} listening to ${subject.title}${
      subject.creator ? ` by ${subject.creator.username}` : ''
    }${where}`;
  if (subject.action === 'listen-own')
    return `${who} ${earned} listening to their own song ${subject.title}${where}`;
  if (subject.action === 'publish')
    return `${who} ${earned} publishing ${subject.title}${where}`;
  return `${who} ${earned} for ${subject.title}${where}`;
}

/**
 * Play only what the server identified itself (a Groove Lab song it read for
 * the reward: action is set only by server proofs), never an app-supplied
 * subject. The API currently sends only those; this keeps the client in step.
 */
export function canPlayBountySubject(subject: BountySubject | null) {
  return Boolean(subject && subject.kind === 'song' && subject.action);
}

/** Inline player frame: the app's own share page, embedded (no Header). */
export function getBountySubjectPlayerSrc(buildId: unknown, path: string | null) {
  const id = Number(buildId);
  if (!Number.isSafeInteger(id) || id <= 0 || !path || !PATH_PATTERN.test(path))
    return '';
  return `/app/${id}/${path}?embedded=1`;
}

export function getBountySubjectAppPath(buildId: unknown, path: string | null) {
  const id = Number(buildId);
  if (!Number.isSafeInteger(id) || id <= 0) return '';
  return path && PATH_PATTERN.test(path) ? `/app/${id}/${path}` : `/app/${id}`;
}
