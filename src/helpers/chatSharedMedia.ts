export type SharedMediaKind = 'all' | 'media' | 'files';
export interface SharedAttachment {
  id: number;
  channelId: number;
  topicId: number;
  subchannelId: number;
  subchannelPath: string;
  userId: number;
  username: string;
  timeStamp: number;
  name: string;
  fileType: 'image' | 'video' | 'audio' | 'file';
  size: number;
  url: string;
  thumbUrl: string;
  topicTitle: string;
  downloadUrl?: string;
}
export interface SharedMediaPage {
  items: SharedAttachment[];
  nextCursor: number | null;
}
export interface SharedMediaQuery {
  channelId: number;
  topicId?: number;
  kind?: SharedMediaKind;
  beforeId?: number;
}
export interface SharedMediaCacheEntry {
  channelId: number;
  page: SharedMediaPage;
  checkedAt: number;
}
export type SharedMediaCache = Record<string, SharedMediaCacheEntry>;

export const sharedMediaInvalidationEvents = [
  'human_topic_state_changed'
];
export const sharedMediaRemovalEvents = [
  'chat_message_deleted',
  'message_attachment_hid'
];

export function sharedMediaEventChannel(event: any) {
  return Number(
    event?.channelId || event?.channel?.id || event?.message?.channelId
  );
}

export function invalidateSharedMediaCache(
  cache: SharedMediaCache,
  channelId?: number,
  preserve = false
): SharedMediaCache {
  if (!channelId) return {};
  return Object.fromEntries(
    Object.entries(cache).flatMap(([key, entry]) =>
      entry.channelId !== channelId
        ? [[key, entry]]
        : preserve
          ? [[key, { ...entry, checkedAt: 0 }]]
          : []
    )
  );
}

export function removeSharedMediaMessage(
  cache: SharedMediaCache,
  channelId: number,
  messageId: number
): SharedMediaCache {
  return Object.fromEntries(
    Object.entries(cache).map(([key, entry]) => [
      key,
      entry.channelId === channelId &&
      entry.page.items.some((item) => item.id === messageId)
        ? {
            ...entry,
            page: {
              ...entry.page,
              items: entry.page.items.filter((item) => item.id !== messageId)
            }
          }
        : entry
    ])
  );
}

export function mergeSharedMedia(
  current: SharedMediaPage,
  next: SharedMediaPage
): SharedMediaPage {
  return {
    items: [
      ...new Map(
        [...current.items, ...next.items].map((item) => [item.id, item])
      ).values()
    ].sort((a, b) => b.id - a.id),
    nextCursor: next.nextCursor
  };
}

export function refreshSharedMediaPage(
  current: SharedMediaPage,
  head: SharedMediaPage
): SharedMediaPage {
  // Without overlap, retaining old pages would skip the uploads between the
  // new head and our previous cursor. Let the canonical head fill that gap.
  if (
    !head.nextCursor ||
    !head.items.some((item) =>
      current.items.some((existing) => existing.id === item.id)
    )
  )
    return head;

  // Replace the entire range the server just checked, including attachments
  // it no longer returns. Keep only older pages outside that range.
  return mergeSharedMedia(
    {
      items: current.items.filter((item) => item.id < head.nextCursor!),
      nextCursor: null
    },
    {
      items: head.items,
      nextCursor:
        current.nextCursor === null
          ? null
          : Math.min(current.nextCursor, head.nextCursor)
    }
  );
}
export function attachmentSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
export function attachmentDate(timeStamp: number) {
  return new Date(timeStamp * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function sharedAttachmentPath(
  channelPath: string,
  item: SharedAttachment
) {
  if (item.subchannelId && !item.subchannelPath) return null;
  return `/chat/${encodeURIComponent(channelPath)}${item.subchannelId ? `/${encodeURIComponent(item.subchannelPath)}` : ''}${item.topicId ? `/topic/${item.topicId}` : ''}`;
}
