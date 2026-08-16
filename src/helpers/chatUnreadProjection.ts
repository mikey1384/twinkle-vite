export function channelHasCanonicalUnread(channel: any) {
  if (!channel || channel.isHidden) return false;
  if (Number(channel.numUnreads || 0) > 0) return true;
  return Object.values(channel.subchannelObj || {}).some(
    (subchannel: any) => Number(subchannel?.numUnreads || 0) > 0
  );
}

export function hasVisibleCanonicalChatUnread({
  channelsObj,
  homeChannelIds,
  favoriteChannelIds,
  classChannelIds
}: {
  channelsObj: Record<number, any>;
  homeChannelIds: number[];
  favoriteChannelIds: number[];
  classChannelIds: number[];
}) {
  const listedChannelIds = new Set<number>([
    ...(homeChannelIds || []),
    ...(favoriteChannelIds || []),
    ...(classChannelIds || [])
  ]);
  for (const channelId of listedChannelIds) {
    if (channelHasCanonicalUnread(channelsObj?.[channelId])) return true;
  }
  return false;
}

function prependUniqueChannelId(channelIds: number[], channelId: number) {
  return [
    channelId,
    ...(channelIds || []).filter(
      (listedChannelId) => Number(listedChannelId) !== channelId
    )
  ];
}

export function projectCanonicalUnreadChannelLists({
  channelId,
  isClass,
  favorited,
  homeChannelIds,
  favoriteChannelIds,
  classChannelIds
}: {
  channelId: number;
  isClass: boolean;
  favorited: boolean;
  homeChannelIds: number[];
  favoriteChannelIds: number[];
  classChannelIds: number[];
}) {
  const normalizedChannelId = Number(channelId);
  const withoutChannel = (channelIds: number[]) =>
    (channelIds || []).filter(
      (listedChannelId) => Number(listedChannelId) !== normalizedChannelId
    );
  return {
    homeChannelIds: prependUniqueChannelId(homeChannelIds, normalizedChannelId),
    favoriteChannelIds: favorited
      ? prependUniqueChannelId(favoriteChannelIds, normalizedChannelId)
      : withoutChannel(favoriteChannelIds),
    classChannelIds: isClass
      ? prependUniqueChannelId(classChannelIds, normalizedChannelId)
      : withoutChannel(classChannelIds)
  };
}
