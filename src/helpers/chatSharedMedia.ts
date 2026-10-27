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
