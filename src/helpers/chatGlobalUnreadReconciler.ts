import { getChatUnreadActivityRevision } from './chatUnreadActivity';

const MAX_FRESH_UNREAD_COUNT_ATTEMPTS = 3;

export async function loadFreshCanonicalChatGlobalUnreadCount({
  load,
  isCurrentOwner = () => true,
  maxAttempts = MAX_FRESH_UNREAD_COUNT_ATTEMPTS
}: {
  load: (attempt: number) => Promise<number>;
  isCurrentOwner?: () => boolean;
  maxAttempts?: number;
}): Promise<number | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const expectedActivityRevision = getChatUnreadActivityRevision();
    const numUnreads = Number(await load(attempt));
    if (!isCurrentOwner()) return null;
    if (getChatUnreadActivityRevision() !== expectedActivityRevision) {
      continue;
    }
    return Number.isFinite(numUnreads) && numUnreads >= 0
      ? numUnreads
      : null;
  }
  // Repeated confirmed activity means each snapshot was obsolete before it
  // could be applied. Preserve the last confirmed count; the socket/bootstrap
  // path will try again after activity settles.
  return null;
}
