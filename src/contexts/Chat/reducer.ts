import { initialChatState } from '.';
import {
  defaultChatSubject,
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE,
  BOOKMARK_VIEWS,
  BookmarkView,
  GENERAL_CHAT_ID
} from '~/constants/defaultValues';
import { determineSelectedChatTab } from './helpers';
import { applyPresenceSnapshot, stampPresenceEntry } from './presenceSnapshot';
import { objectify } from '~/helpers';
import { prependUniqueIds } from '~/contexts/Content/idListHelpers';
import { recordChatBootstrapEvent } from '~/helpers/chatBootstrapDebug';
import { hasCanonicalChatMessage } from '~/helpers/chatRealtimeMessageIdentity';
import { v1 as uuidv1 } from 'uuid';
import type { CanonicalChatChannelVisibility } from '~/types/chat';
import { shouldApplyChatNotificationSettings } from './notificationSettingsRevision';
import {
  applyCanonicalChannelOwnerTransition,
  applyCanonicalGroupInvitation,
  applyCanonicalGroupMemberJoin,
  applyCanonicalGroupMemberDeparture
} from './groupTransitionState';
import {
  mergeCanonicalGroupMemberIds,
  mergeCanonicalGroupMembers
} from '~/helpers/chatGroupMembership';
import { upsertBuildContributionSubmissionState } from '~/helpers/buildContributionSubmissionHelpers';
import { applyCanonicalChatAttachmentThumbnail } from './attachmentThumbnailState';
import {
  applyCanonicalChannelSettings,
  applyCanonicalTopicSettings
} from './canonicalSettingsState';

interface BookmarkListMap {
  ai?: any[];
  me?: any[];
}

interface BookmarkLoadMoreMap {
  ai?: boolean;
  me?: boolean;
}

const chatTabHash: {
  [key: string]: string;
} = {
  home: 'homeChannelIds',
  favorite: 'favoriteChannelIds',
  class: 'classChannelIds'
};

function loadChannelSettings(settings: any) {
  if (!settings) return {};
  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings);
    } catch {
      return {};
    }
  }
  if (typeof settings !== 'object') return {};
  return settings;
}

function mergeChannelSettings({
  existingSettings,
  serverSettings
}: {
  existingSettings: any;
  serverSettings: any;
}) {
  const existing = loadChannelSettings(existingSettings);
  const server = loadChannelSettings(serverSettings);
  const existingActivityRevision = Number(
    existing?.reactionActivityRevision || 0
  );
  const serverActivityRevision = Number(server?.reactionActivityRevision || 0);
  const existingLastReactionTs = Number(existing?.lastReaction?.timeStamp) || 0;
  const serverLastReactionTs = Number(server?.lastReaction?.timeStamp) || 0;

  // Message reaction revisions are local to one message and cannot order
  // channel recency across different messages. Bootstrap and realtime compare
  // the channel activity revision; timestamps are only a rolling-deploy
  // fallback for legacy rows that have no channel revision yet.
  const merged = { ...existing, ...server };
  const preserveExistingActivity =
    existingActivityRevision > serverActivityRevision ||
    (existingActivityRevision === 0 &&
      serverActivityRevision === 0 &&
      existingLastReactionTs > serverLastReactionTs);
  const activitySource = preserveExistingActivity ? existing : server;
  if (activitySource.lastReaction) {
    merged.lastReaction = activitySource.lastReaction;
  } else {
    delete merged.lastReaction;
  }
  merged.reactionActivityRevision = preserveExistingActivity
    ? existingActivityRevision
    : serverActivityRevision;
  return merged;
}

type CanonicalChannelVisibilityById = Record<
  number,
  CanonicalChatChannelVisibility
>;

function getCanonicalChannelVisibilityFromChannel(channel: any) {
  const channelId = Number(channel?.id || 0);
  const revision = Number(channel?.visibilityRevision || 0);
  if (channelId <= 0 || revision <= 0) return null;
  return {
    channelId,
    isHidden: !!channel?.isHidden,
    revision,
    lastMessageId: Number(
      channel?.lastMessageId || channel?.messageIds?.[0] || 0
    )
  };
}

function mergeCanonicalChannelVisibility({
  visibilityById,
  visibility
}: {
  visibilityById: CanonicalChannelVisibilityById;
  visibility?: CanonicalChatChannelVisibility | null;
}) {
  const channelId = Number(visibility?.channelId || 0);
  const revision = Number(visibility?.revision || 0);
  if (channelId <= 0 || revision <= 0) return visibilityById;
  const currentRevision = Number(visibilityById[channelId]?.revision || 0);
  if (revision < currentRevision) return visibilityById;
  return {
    ...visibilityById,
    [channelId]: {
      channelId,
      isHidden: !!visibility?.isHidden,
      revision,
      lastMessageId: Number(visibility?.lastMessageId || 0)
    }
  };
}

function applyCanonicalChannelVisibility({
  channel,
  visibility
}: {
  channel: any;
  visibility?: CanonicalChatChannelVisibility | null;
}) {
  if (!channel?.id || Number(channel.id) !== Number(visibility?.channelId)) {
    return channel;
  }
  const incomingRevision = Number(visibility?.revision || 0);
  const currentRevision = Number(channel.visibilityRevision || 0);
  if (incomingRevision <= 0 || incomingRevision < currentRevision) {
    return channel;
  }
  const visibilityAtLastMessageId = Number(visibility?.lastMessageId || 0);
  const currentLastMessageId = Number(
    channel.lastMessageId || channel.messageIds?.[0] || 0
  );
  return {
    ...channel,
    // A message committed after a hide makes the channel visible again. The
    // visibility revision and message watermark own those independent axes.
    isHidden:
      !!visibility?.isHidden &&
      currentLastMessageId <= visibilityAtLastMessageId,
    visibilityRevision: incomingRevision
  };
}

function resetTopicMessageCachesForCanonicalChannelLoad(
  topicObj: Record<string, any> | null | undefined
) {
  const invalidatedTopicObj: Record<string, any> = {};
  for (const [topicId, topic] of Object.entries(topicObj || {})) {
    // A channel load does not include each topic's message page. Never carry a
    // pre-snapshot ID list across that boundary: an offline deletion or
    // moderation event may have made it stale. Keeping `loaded: false` lets
    // the existing topic loader repopulate the selected topic canonically.
    invalidatedTopicObj[topicId] = {
      ...topic,
      loaded: false,
      messageIds: []
    };
  }
  return invalidatedTopicObj;
}

function reconcileCanonicalTopicNavigation({
  existingChannel,
  canonicalTopicObj
}: {
  existingChannel: any;
  canonicalTopicObj: Record<string, any>;
}) {
  const selectedTopicId = Number(existingChannel?.selectedTopicId || 0);
  const selectedTopicIsVisible =
    selectedTopicId <= 0 || Boolean(canonicalTopicObj[selectedTopicId]);
  const visibleTopicHistory = (existingChannel?.topicHistory || []).filter(
    (topicId: number) => Boolean(canonicalTopicObj[topicId])
  );

  if (!selectedTopicIsVisible) {
    return {
      selectedTab: 'all',
      selectedTopicId: null,
      topicHistory: [],
      currentTopicIndex: -1
    };
  }

  const topicHistory =
    selectedTopicId > 0 &&
    !visibleTopicHistory.some(
      (topicId: number) => Number(topicId) === selectedTopicId
    )
      ? [...visibleTopicHistory, selectedTopicId]
      : visibleTopicHistory;
  const selectedTopicIndex = topicHistory.findIndex(
    (topicId: number) => Number(topicId) === selectedTopicId
  );
  const existingTopicIndex = Number(existingChannel?.currentTopicIndex ?? -1);

  return {
    selectedTab: existingChannel?.selectedTab,
    selectedTopicId: existingChannel?.selectedTopicId,
    topicHistory,
    currentTopicIndex:
      selectedTopicId > 0
        ? selectedTopicIndex
        : Math.max(-1, Math.min(existingTopicIndex, topicHistory.length - 1))
  };
}

const ROOT_REALTIME_ACTIVITY_SCOPE = 'root';

type ConfirmedRealtimeActivityByChannel = Record<
  number,
  Record<string, number | Record<string, number>>
>;

function getRealtimeActivityScope(subchannelId?: number | null) {
  const normalizedSubchannelId = Number(subchannelId || 0);
  return normalizedSubchannelId > 0
    ? String(normalizedSubchannelId)
    : ROOT_REALTIME_ACTIVITY_SCOPE;
}

function getRealtimeMessageEventKey(messageId: number | string) {
  return `message:${messageId}`;
}

function getRealtimeReactionEventKey({
  messageId,
  reaction,
  userId
}: {
  messageId: number;
  reaction: string;
  userId: number;
}) {
  return `reaction:${messageId}:${userId}:${reaction}`;
}

function wasRealtimeActivityConfirmed(scopeActivity?: unknown) {
  if (typeof scopeActivity === 'number') return scopeActivity > 0;
  if (!scopeActivity || typeof scopeActivity !== 'object') return false;
  return Object.keys(scopeActivity).length > 0;
}

function getLatestConfirmedEventSequence(activityByScope?: unknown) {
  if (typeof activityByScope === 'number') return activityByScope;
  if (!activityByScope || typeof activityByScope !== 'object') return 0;
  let latestSequence = 0;
  for (const value of Object.values(activityByScope)) {
    latestSequence = Math.max(
      latestSequence,
      getLatestConfirmedEventSequence(value)
    );
  }
  return latestSequence;
}

function shouldTrackConfirmedRealtimeActivity(state: any) {
  return Boolean(state.activeChatBootstrap?.id);
}

function markConfirmedRealtimeActivity({
  activityByChannel = {},
  channelId,
  subchannelId,
  eventKey,
  eventSequence
}: {
  activityByChannel?: ConfirmedRealtimeActivityByChannel;
  channelId: number;
  subchannelId?: number | null;
  eventKey: string;
  eventSequence?: number;
}) {
  const scope = getRealtimeActivityScope(subchannelId);
  const channelActivity = activityByChannel[channelId] || {};
  const existingScopeActivity = channelActivity[scope];
  const scopeActivity =
    existingScopeActivity && typeof existingScopeActivity === 'object'
      ? existingScopeActivity
      : {};
  const confirmedSequence = Math.max(Number(eventSequence || 0), 1);

  return {
    ...activityByChannel,
    [channelId]: {
      ...channelActivity,
      [scope]: {
        ...scopeActivity,
        // A socket event and its writer-backed HTTP response can carry the
        // same canonical mutation. Preserve the first sequence for that
        // identity so a duplicate delivery cannot masquerade as activity that
        // happened after an intervening canonical read.
        [eventKey]: Number(scopeActivity[eventKey] || 0) || confirmedSequence
      }
    }
  };
}

function removeConfirmedRealtimeActivity({
  activityByChannel = {},
  channelId,
  subchannelId,
  eventKey
}: {
  activityByChannel?: ConfirmedRealtimeActivityByChannel;
  channelId: number;
  subchannelId?: number | null;
  eventKey: string;
}) {
  const scope = getRealtimeActivityScope(subchannelId);
  const channelActivity = activityByChannel[channelId];
  const existingScopeActivity = channelActivity?.[scope];
  if (existingScopeActivity == null) return activityByChannel;

  const nextChannelActivity = { ...channelActivity };
  if (typeof existingScopeActivity === 'object') {
    const nextScopeActivity = { ...existingScopeActivity };
    delete nextScopeActivity[eventKey];
    if (Object.keys(nextScopeActivity).length > 0) {
      nextChannelActivity[scope] = nextScopeActivity;
    } else {
      delete nextChannelActivity[scope];
    }
  } else {
    // Numeric entries are from the previous anonymous-marker shape and cannot
    // be matched safely. A confirmed reversal supersedes that legacy marker.
    delete nextChannelActivity[scope];
  }

  const nextActivityByChannel = { ...activityByChannel };
  if (Object.keys(nextChannelActivity).length > 0) {
    nextActivityByChannel[channelId] = nextChannelActivity;
  } else {
    delete nextActivityByChannel[channelId];
  }
  return nextActivityByChannel;
}

function toConfirmedRealtimeMessage({
  message,
  messageId,
  eventSequence
}: {
  message: any;
  messageId: number | string;
  eventSequence?: number;
}) {
  return {
    ...message,
    id: messageId,
    isLoaded: true,
    confirmedRealtimeSequence: Math.max(Number(eventSequence || 0), 1)
  };
}

function getChannelMessage({
  channel,
  messageId,
  subchannelId
}: {
  channel: any;
  messageId: number;
  subchannelId?: number | null;
}) {
  return (
    (subchannelId
      ? channel?.subchannelObj?.[subchannelId]?.messagesObj?.[messageId]
      : channel?.messagesObj?.[messageId]) || {}
  );
}

function mergeMessagesPreservingNewerReactionState({
  existingMessagesObj = {},
  serverMessagesObj = {}
}: {
  existingMessagesObj?: Record<string, any>;
  serverMessagesObj?: Record<string, any>;
}) {
  const mergedMessagesObj = {
    ...existingMessagesObj,
    ...serverMessagesObj
  };
  for (const messageId in serverMessagesObj) {
    const existingMessage = existingMessagesObj[messageId];
    const serverMessage = serverMessagesObj[messageId];
    const existingRevision = Number(
      existingMessage?.reactionStateServerRevision || 0
    );
    const serverRevision = Number(
      serverMessage?.reactionStateServerRevision || 0
    );
    if (existingRevision > serverRevision) {
      mergedMessagesObj[messageId] = {
        ...serverMessage,
        reactions: existingMessage.reactions,
        reactionStateServerRevision: existingRevision
      };
    }
  }
  return mergedMessagesObj;
}

function setMessageReactionsOnChannel({
  channel,
  messageId,
  subchannelId,
  reactions,
  reactionStateRevision
}: {
  channel: any;
  messageId: number;
  subchannelId?: number | null;
  reactions: any[];
  reactionStateRevision?: number;
}) {
  const message = getChannelMessage({ channel, messageId, subchannelId });
  const updatedMessage = {
    ...message,
    reactions,
    ...(reactionStateRevision
      ? {
          reactionStateServerRevision: Math.max(
            Number(message.reactionStateServerRevision || 0),
            reactionStateRevision
          )
        }
      : {})
  };
  const subchannelObj = subchannelId
    ? {
        ...channel?.subchannelObj,
        [subchannelId]: {
          ...channel?.subchannelObj?.[subchannelId],
          messagesObj: {
            ...channel?.subchannelObj?.[subchannelId]?.messagesObj,
            [messageId]: updatedMessage
          }
        }
      }
    : channel?.subchannelObj;

  return {
    ...channel,
    messagesObj: {
      ...channel?.messagesObj,
      [messageId]: updatedMessage
    },
    ...(subchannelObj ? { subchannelObj } : {})
  };
}

function setCanonicalReactionActivityOnChannel({
  channel,
  channelActivity
}: {
  channel: any;
  channelActivity: any;
}) {
  if (!channel) return channel;
  const incomingRevision = Number(channelActivity?.revision || 0);
  const settings = loadChannelSettings(channel.settings);
  if (
    incomingRevision <= 0 ||
    incomingRevision < Number(settings.reactionActivityRevision || 0)
  ) {
    return channel;
  }
  const nextSettings = {
    ...settings,
    reactionActivityRevision: incomingRevision
  };
  if (channelActivity.lastReaction) {
    nextSettings.lastReaction = channelActivity.lastReaction;
  } else {
    delete nextSettings.lastReaction;
  }
  const hasMessageWatermark = Number.isSafeInteger(
    channelActivity?.lastMessageId
  );
  const currentLastMessageId = Math.max(
    Number(channel.lastMessageId || 0),
    Number(channel.messageIds?.[0] || 0)
  );
  const messageActivityWasSuperseded =
    hasMessageWatermark &&
    currentLastMessageId > Number(channelActivity.lastMessageId);
  return {
    ...channel,
    // Reaction revisions order reaction activity, not message creation. The
    // server's locked last-message pointer is the cross-domain watermark: a
    // later local message keeps its recency, while a same-watermark reaction
    // removal may still move lastUpdated backward canonically.
    lastUpdated: messageActivityWasSuperseded
      ? Number(channel.lastUpdated || 0)
      : Number(channelActivity.lastUpdated || 0),
    settings: nextSettings
  };
}

function reconcileConfirmedReactionMarkers({
  state,
  action,
  update
}: {
  state: any;
  action: any;
  update: any;
}) {
  if (
    !shouldTrackConfirmedRealtimeActivity(state) ||
    !update.changed ||
    !update.twoPeople ||
    !update.channelActivity?.changed
  ) {
    return state;
  }
  const eventKey = getRealtimeReactionEventKey({
    messageId: Number(update.messageId),
    reaction: String(update.reaction),
    userId: Number(update.userId)
  });
  const markerParams = {
    channelId: Number(update.channelId),
    subchannelId: Number(update.subchannelId || 0),
    eventKey
  };
  const confirmedRealtimeActivityByChannel =
    update.mutation === 'add'
      ? markConfirmedRealtimeActivity({
          activityByChannel: state.confirmedRealtimeActivityByChannel,
          ...markerParams,
          eventSequence: action.eventSequence
        })
      : removeConfirmedRealtimeActivity({
          activityByChannel: state.confirmedRealtimeActivityByChannel,
          ...markerParams
        });
  let confirmedRealtimeUnreadActivityByChannel =
    state.confirmedRealtimeUnreadActivityByChannel || {};
  if (update.mutation === 'add' && action.shouldIncrementUnreads) {
    confirmedRealtimeUnreadActivityByChannel = markConfirmedRealtimeActivity({
      activityByChannel: confirmedRealtimeUnreadActivityByChannel,
      ...markerParams,
      eventSequence: action.eventSequence
    });
  } else if (update.mutation === 'remove') {
    confirmedRealtimeUnreadActivityByChannel = removeConfirmedRealtimeActivity({
      activityByChannel: confirmedRealtimeUnreadActivityByChannel,
      ...markerParams
    });
  }
  return {
    ...state,
    confirmedRealtimeActivityByChannel,
    confirmedRealtimeUnreadActivityByChannel
  };
}

function bufferCanonicalReactionUpdateDuringBootstrap({
  state,
  action,
  update
}: {
  state: any;
  action: any;
  update: any;
}) {
  if (!shouldTrackConfirmedRealtimeActivity(state)) {
    return state;
  }
  // Message reactions and DM preview activity are separate projections with
  // separate revision domains. Buffer every confirmed message snapshot by its
  // own identity; replaying the envelope after bootstrap lets each projection
  // independently reject an older revision.
  const key = [
    Number(update.channelId),
    Number(update.subchannelId || 0),
    Number(update.messageId),
    Number(update.reactionStateRevision)
  ].join(':');
  if (state.canonicalReactionUpdatesDuringBootstrap?.[key]) return state;
  return {
    ...state,
    canonicalReactionUpdatesDuringBootstrap: {
      ...state.canonicalReactionUpdatesDuringBootstrap,
      [key]: {
        update,
        ownerUserId: action.ownerUserId,
        pageVisible: action.pageVisible,
        usingChat: action.usingChat,
        shouldIncrementUnreads: action.shouldIncrementUnreads,
        eventSequence: action.eventSequence
      }
    }
  };
}

function getCanonicalUnreadScopeState(unreadState: any) {
  return {
    lastRead: Number(unreadState?.lastRead || 0),
    numUnreads: Number(unreadState?.numUnreads || 0),
    lastUnreadUserId:
      unreadState?.lastUnreadUserId == null
        ? null
        : Number(unreadState.lastUnreadUserId),
    lastUnreadReaction: unreadState?.lastUnreadReaction || null,
    lastUnreadMessageId:
      unreadState?.lastUnreadMessageId == null
        ? null
        : Number(unreadState.lastUnreadMessageId),
    lastUnreadReactionTimeStamp:
      unreadState?.lastUnreadReactionTimeStamp == null
        ? null
        : Number(unreadState.lastUnreadReactionTimeStamp)
  };
}

function applyCanonicalUnreadScope(source: any, unreadState: any) {
  return {
    ...source,
    ...getCanonicalUnreadScopeState(unreadState)
  };
}

function getLatestCanonicalUnreadScopeState({
  existingSource,
  serverSource
}: {
  existingSource: any;
  serverSource: any;
}) {
  const existingLastRead = Number(existingSource?.lastRead || 0);
  const serverLastRead = Number(serverSource?.lastRead || 0);
  return getCanonicalUnreadScopeState(
    existingLastRead > serverLastRead ? existingSource : serverSource
  );
}

function canonicalApplyOwnerMatchesBoundUser(state: any, userId: unknown) {
  // Confirmed account-bound responses and their canonical revisions are
  // meaningful only within one account's projection. Once the provider is
  // bound to a user (a completed or in-flight bootstrap), reject responses
  // owned by anyone else before they mutate any chat state. Otherwise a late
  // response from a previously signed-in account could install private
  // channels/sidebar data and its higher per-user revision could suppress the
  // current account's own canonical snapshot. With no bound user (after
  // RESET_CHAT, before the next bootstrap) there is no projection to apply.
  const ownerUserId = Number(userId || 0);
  if (ownerUserId <= 0) return false;
  const boundUserId =
    state.loadedForUserId ?? state.activeChatBootstrap?.userId ?? null;
  return boundUserId != null && Number(boundUserId) === ownerUserId;
}

function bufferCanonicalUnreadStateDuringBootstrap({
  state,
  unreadState,
  eventSequence
}: {
  state: any;
  unreadState: any;
  eventSequence?: number;
}) {
  if (!shouldTrackConfirmedRealtimeActivity(state)) return state;
  const key = `${Number(unreadState.channelId)}:${Number(
    unreadState.subchannelId || 0
  )}`;
  const existing = state.canonicalUnreadStatesDuringBootstrap?.[key];
  const existingUnreadState = existing?.unreadState || existing;
  if (existing) {
    const existingActivityRevision = Number(
      existingUnreadState.reactionActivityRevision || 0
    );
    const incomingActivityRevision = Number(
      unreadState.reactionActivityRevision || 0
    );
    const normalizedSubchannelId = Number(unreadState.subchannelId || 0);
    const existingScope = normalizedSubchannelId
      ? existingUnreadState.subchannel
      : existingUnreadState.channel;
    const incomingScope = normalizedSubchannelId
      ? unreadState.subchannel
      : unreadState.channel;
    if (
      existingActivityRevision > incomingActivityRevision ||
      (existingActivityRevision === incomingActivityRevision &&
        Number(existingScope?.lastRead || 0) >
          Number(incomingScope?.lastRead || 0))
    ) {
      return state;
    }
  }
  return {
    ...state,
    canonicalUnreadStatesDuringBootstrap: {
      ...state.canonicalUnreadStatesDuringBootstrap,
      [key]: {
        unreadState,
        eventSequence: Math.max(Number(eventSequence || 0), 1)
      }
    }
  };
}

function bufferConfirmedMessageDeletionDuringBootstrap({
  state,
  action
}: {
  state: any;
  action: any;
}) {
  if (!shouldTrackConfirmedRealtimeActivity(state)) return state;
  const key = `${Number(action.channelId)}:${Number(
    action.subchannelId || 0
  )}:${Number(action.messageId)}`;
  return {
    ...state,
    confirmedMessageDeletionsDuringBootstrap: {
      ...state.confirmedMessageDeletionsDuringBootstrap,
      [key]: {
        channelId: Number(action.channelId),
        subchannelId: Number(action.subchannelId || 0),
        topicId: Number(action.topicId || 0),
        messageId: Number(action.messageId),
        eventSequence: Math.max(Number(action.eventSequence || 0), 1)
      }
    }
  };
}

function getPostBootstrapMessageIds({
  source,
  confirmedScopeActivity
}: {
  source: any;
  confirmedScopeActivity?: unknown;
}) {
  if (!confirmedScopeActivity || typeof confirmedScopeActivity !== 'object') {
    return [];
  }
  return (source?.messageIds || []).filter((messageId: number | string) =>
    Object.prototype.hasOwnProperty.call(
      confirmedScopeActivity,
      getRealtimeMessageEventKey(messageId)
    )
  );
}

function getRebasedConfirmedUnreadActivityState({
  serverSource,
  existingSource
}: {
  serverSource: any;
  existingSource: any;
}) {
  return {
    // Channel bootstrap unread counts are binary today. Rebase the confirmed
    // event on the writer snapshot instead of copying a stale absolute count.
    numUnreads: Math.max(Number(serverSource?.numUnreads || 0), 1),
    lastUnreadUserId: existingSource?.lastUnreadUserId,
    lastUnreadReaction: existingSource?.lastUnreadReaction,
    lastUnreadMessageId: existingSource?.lastUnreadMessageId,
    lastUnreadReactionTimeStamp: existingSource?.lastUnreadReactionTimeStamp
  };
}

function mergeConfirmedChannelOrder(
  currentOrder: number[] = [],
  serverOrder: number[] = [],
  confirmedChannelIds: Set<number>,
  allowedChannelIds?: Record<number, boolean>
) {
  const confirmedOrder = currentOrder.filter((channelId) => {
    const normalizedChannelId = Number(channelId);
    return (
      confirmedChannelIds.has(normalizedChannelId) &&
      (!allowedChannelIds || Boolean(allowedChannelIds[normalizedChannelId]))
    );
  });
  return confirmedOrder.concat(
    serverOrder.filter((channelId) => !confirmedOrder.includes(channelId))
  );
}

function reconcileCanonicalFavoriteOrder({
  canonicalChannelsById,
  canonicalOrder,
  currentChannelsById,
  currentOrder
}: {
  canonicalChannelsById: Map<number, any>;
  canonicalOrder: number[];
  currentChannelsById: Record<number, any>;
  currentOrder: number[];
}) {
  const currentOrderIndex = new Map(
    currentOrder.map((channelId, index) => [Number(channelId), index])
  );
  const canonicalOrderIndex = new Map(
    canonicalOrder.map((channelId, index) => [Number(channelId), index])
  );

  return canonicalOrder.slice().sort((firstChannelId, secondChannelId) => {
    const firstActivity = getFreshestFavoriteActivity({
      canonicalChannel: canonicalChannelsById.get(Number(firstChannelId)),
      currentChannel: currentChannelsById[Number(firstChannelId)]
    });
    const secondActivity = getFreshestFavoriteActivity({
      canonicalChannel: canonicalChannelsById.get(Number(secondChannelId)),
      currentChannel: currentChannelsById[Number(secondChannelId)]
    });
    if (firstActivity.lastUpdated !== secondActivity.lastUpdated) {
      return secondActivity.lastUpdated - firstActivity.lastUpdated;
    }

    // Message IDs break same-second ties. Reaction revisions are used above to
    // choose each channel's authoritative lastUpdated projection, including
    // removals whose timestamp intentionally moves backward.
    if (firstActivity.lastMessageId !== secondActivity.lastMessageId) {
      return secondActivity.lastMessageId - firstActivity.lastMessageId;
    }
    const firstCurrentIndex = currentOrderIndex.get(Number(firstChannelId));
    const secondCurrentIndex = currentOrderIndex.get(Number(secondChannelId));
    if (
      firstCurrentIndex !== undefined &&
      secondCurrentIndex !== undefined &&
      firstCurrentIndex !== secondCurrentIndex
    ) {
      return firstCurrentIndex - secondCurrentIndex;
    }
    return (
      Number(canonicalOrderIndex.get(Number(firstChannelId)) || 0) -
      Number(canonicalOrderIndex.get(Number(secondChannelId)) || 0)
    );
  });
}

function getFavoriteActivityVector(channel: any) {
  const lastMessageId = Number(
    channel?.lastMessageId || channel?.messageIds?.[0] || 0
  );
  return {
    lastMessageId:
      Number.isSafeInteger(lastMessageId) && lastMessageId > 0
        ? lastMessageId
        : 0,
    reactionRevision: Math.max(
      0,
      Number(loadChannelSettings(channel?.settings).reactionActivityRevision) ||
        0
    )
  };
}

function canonicalFavoriteActivityDominates({
  canonicalChannel,
  currentChannel
}: {
  canonicalChannel: any;
  currentChannel: any;
}) {
  const canonicalActivity = getFavoriteActivityVector(canonicalChannel);
  const currentActivity = getFavoriteActivityVector(currentChannel);
  return (
    canonicalActivity.lastMessageId >= currentActivity.lastMessageId &&
    canonicalActivity.reactionRevision >= currentActivity.reactionRevision &&
    (canonicalActivity.lastMessageId > currentActivity.lastMessageId ||
      canonicalActivity.reactionRevision > currentActivity.reactionRevision)
  );
}

function canonicalFavoriteActivityIsAtLeastAsNew({
  canonicalChannel,
  currentChannel
}: {
  canonicalChannel: any;
  currentChannel: any;
}) {
  const canonicalActivity = getFavoriteActivityVector(canonicalChannel);
  const currentActivity = getFavoriteActivityVector(currentChannel);
  return (
    canonicalActivity.lastMessageId >= currentActivity.lastMessageId &&
    canonicalActivity.reactionRevision >= currentActivity.reactionRevision
  );
}

function mergeCanonicalFavoriteSubchannelState({
  canonicalChannel,
  currentChannel
}: {
  canonicalChannel: any;
  currentChannel: any;
}) {
  const canonicalSubchannelObj = canonicalChannel?.subchannelObj || {};
  const currentSubchannelObj = currentChannel?.subchannelObj || {};
  const canonicalSubchannelIds = canonicalChannel?.subchannelIds || [];
  const hasCanonicalSubchannelProjection =
    Number(canonicalChannel?.id) === Number(GENERAL_CHAT_ID) ||
    canonicalSubchannelIds.length > 0 ||
    Object.keys(canonicalSubchannelObj).length > 0;
  if (!hasCanonicalSubchannelProjection) {
    return {
      subchannelIds: currentChannel?.subchannelIds || [],
      subchannelObj: currentSubchannelObj
    };
  }
  const mergedSubchannelObj = currentChannel?.loaded
    ? { ...currentSubchannelObj }
    : {};

  for (const subchannelId of Object.keys(canonicalSubchannelObj)) {
    const canonicalSubchannel = canonicalSubchannelObj[subchannelId];
    const currentSubchannel = currentSubchannelObj[subchannelId];
    const messagesObj = mergeMessagesPreservingNewerReactionState({
      existingMessagesObj: currentSubchannel?.messagesObj,
      serverMessagesObj: canonicalSubchannel?.messagesObj
    });
    mergedSubchannelObj[subchannelId] = {
      ...currentSubchannel,
      ...canonicalSubchannel,
      ...getLatestCanonicalUnreadScopeState({
        existingSource: currentSubchannel,
        serverSource: canonicalSubchannel
      }),
      messageIds: currentSubchannel?.loaded
        ? mergeNewestFirstMessageIds({
            currentMessageIds: currentSubchannel.messageIds || [],
            serverMessageIds: canonicalSubchannel?.messageIds || [],
            messagesObj
          })
        : canonicalSubchannel?.messageIds || [],
      messagesObj,
      loaded: Boolean(currentSubchannel?.loaded || canonicalSubchannel?.loaded)
    };
  }

  const subchannelIds = currentChannel?.loaded
    ? (currentChannel.subchannelIds || []).concat(
        canonicalSubchannelIds.filter(
          (subchannelId: number) =>
            !(currentChannel.subchannelIds || []).includes(subchannelId)
        )
      )
    : canonicalSubchannelIds;

  return { subchannelIds, subchannelObj: mergedSubchannelObj };
}

function mergeCanonicalFavoriteChannelSummary({
  canonicalChannel,
  currentChannel,
  visibility
}: {
  canonicalChannel: any;
  currentChannel?: any;
  visibility?: CanonicalChatChannelVisibility | null;
}) {
  if (!currentChannel?.id) {
    return applyCanonicalChannelVisibility({
      channel: canonicalChannel,
      visibility
    });
  }
  if (
    !canonicalFavoriteActivityIsAtLeastAsNew({
      canonicalChannel,
      currentChannel
    })
  ) {
    return applyCanonicalChannelVisibility({
      channel: currentChannel,
      visibility
    });
  }

  const mergedSubchannelState = mergeCanonicalFavoriteSubchannelState({
    canonicalChannel,
    currentChannel
  });
  if (
    !canonicalFavoriteActivityDominates({
      canonicalChannel,
      currentChannel
    })
  ) {
    // Favorite revisions own membership, while read watermarks can advance
    // without message/reaction activity changing. On an equal activity vector,
    // reconcile each canonical unread scope but preserve the current preview
    // and message caches.
    return applyCanonicalChannelVisibility({
      channel: {
        ...currentChannel,
        ...getLatestCanonicalUnreadScopeState({
          existingSource: currentChannel,
          serverSource: canonicalChannel
        }),
        ...mergedSubchannelState
      },
      visibility
    });
  }

  const messagesObj = mergeMessagesPreservingNewerReactionState({
    existingMessagesObj: currentChannel.messagesObj,
    serverMessagesObj: canonicalChannel.messagesObj
  });
  const mergedChannel = {
    ...currentChannel,
    ...canonicalChannel,
    // The canonical summary owns activity, preview, settings, and unread state
    // when its message/reaction vector dominates. Keep fuller channel caches
    // while merging the canonical scoped summary projection above.
    ...getLatestCanonicalUnreadScopeState({
      existingSource: currentChannel,
      serverSource: canonicalChannel
    }),
    lastUpdated: Number(canonicalChannel.lastUpdated || 0),
    lastMessageId:
      getFavoriteActivityVector(canonicalChannel).lastMessageId || null,
    settings: mergeChannelSettings({
      existingSettings: currentChannel.settings,
      serverSettings: canonicalChannel.settings
    }),
    messageIds: mergeNewestFirstMessageIds({
      currentMessageIds: currentChannel.messageIds || [],
      serverMessageIds: canonicalChannel.messageIds || [],
      messagesObj
    }),
    messagesObj,
    ...mergedSubchannelState,
    ...(currentChannel.loaded
      ? {
          ...(!canonicalChannel.twoPeople
            ? {
                allMemberIds: currentChannel.allMemberIds || [],
                members: currentChannel.members || []
              }
            : {})
        }
      : {})
  };
  return applyCanonicalChannelVisibility({
    channel: mergedChannel,
    visibility
  });
}

function getFreshestFavoriteActivity({
  canonicalChannel,
  currentChannel
}: {
  canonicalChannel?: any;
  currentChannel?: any;
}) {
  const canonicalActivity = getFavoriteActivityVector(canonicalChannel);
  const currentActivity = getFavoriteActivityVector(currentChannel);
  const canonicalReactionRevision = canonicalActivity.reactionRevision;
  const currentReactionRevision = currentActivity.reactionRevision;
  const canonicalLastMessageId = canonicalActivity.lastMessageId;
  const currentLastMessageId = currentActivity.lastMessageId;
  const canonicalDominates =
    canonicalLastMessageId >= currentLastMessageId &&
    canonicalReactionRevision >= currentReactionRevision &&
    (canonicalLastMessageId > currentLastMessageId ||
      canonicalReactionRevision > currentReactionRevision);
  const currentDominates =
    currentLastMessageId >= canonicalLastMessageId &&
    currentReactionRevision >= canonicalReactionRevision &&
    (currentLastMessageId > canonicalLastMessageId ||
      currentReactionRevision > canonicalReactionRevision);

  // Message creation and reaction activity are independent monotonic domains.
  // Treat their pair as a tiny vector clock: one side is authoritative only
  // when it is at least as new in both. This lets a newer reaction removal
  // move lastUpdated backward without erasing a message that arrived after the
  // server captured the favorite response (and vice versa).
  const source = canonicalDominates
    ? canonicalChannel
    : currentDominates
      ? currentChannel
      : Number(canonicalChannel?.lastUpdated || 0) >
          Number(currentChannel?.lastUpdated || 0)
        ? canonicalChannel
        : currentChannel || canonicalChannel;
  return {
    lastUpdated: Number(source?.lastUpdated || 0),
    lastMessageId: getFavoriteActivityVector(source).lastMessageId
  };
}

function numberOrdersMatch(first: number[] = [], second: number[] = []) {
  return (
    first.length === second.length &&
    first.every(
      (channelId, index) => Number(channelId) === Number(second[index])
    )
  );
}

function getConfirmedLastMessageId(
  currentMessageId: unknown,
  incomingMessageId: unknown
) {
  const currentId = Number(currentMessageId || 0);
  const incomingId = Number(incomingMessageId || 0);
  return Number.isSafeInteger(incomingId) && incomingId > currentId
    ? incomingId
    : currentId || null;
}

function prependUniqueChatMessageId({
  messageIds = [],
  messageId
}: {
  messageIds?: Array<number | string>;
  messageId: number | string;
}) {
  const messageIdKey = String(messageId);
  return messageIds.some(
    (existingMessageId) => String(existingMessageId) === messageIdKey
  )
    ? messageIds
    : [messageId, ...messageIds];
}

function getSubmittedChatMessage({
  existingMessage,
  isRespondingToSubject,
  message,
  messageId,
  replyTarget,
  subchannelId,
  targetSubject
}: {
  existingMessage?: any;
  isRespondingToSubject?: boolean;
  message: any;
  messageId: number | string;
  replyTarget?: any;
  subchannelId?: number;
  targetSubject?: any;
}) {
  // A same-account socket echo can arrive before the HTTP request resolves.
  // In that order, keep the confirmed server payload instead of replacing it
  // with the locally reconstructed submit payload.
  if (existingMessage) return existingMessage;

  return {
    ...message,
    isLoaded: true,
    tempMessageId: messageId,
    ...(subchannelId ? { subchannelId } : {}),
    content: message.content,
    targetMessage: replyTarget,
    ...(isRespondingToSubject
      ? {
          targetSubject: {
            ...targetSubject,
            content: targetSubject?.content || defaultChatSubject
          }
        }
      : {})
  };
}

function getConfirmedRealtimeChannelIds({
  confirmedRealtimeActivityByChannel
}: {
  confirmedRealtimeActivityByChannel: ConfirmedRealtimeActivityByChannel;
}) {
  const confirmedChannelIds = new Set<number>();
  for (const [channelId, activityByScope] of Object.entries(
    confirmedRealtimeActivityByChannel || {}
  )) {
    if (
      Object.values(activityByScope || {}).some((scopeActivity) =>
        wasRealtimeActivityConfirmed(scopeActivity)
      )
    ) {
      confirmedChannelIds.add(Number(channelId));
    }
  }
  return confirmedChannelIds;
}

function mergeNewestFirstMessageIds({
  currentMessageIds = [],
  serverMessageIds = [],
  messagesObj
}: {
  currentMessageIds?: Array<number | string>;
  serverMessageIds?: Array<number | string>;
  messagesObj: Record<string, any>;
}) {
  const seenIds = new Set<string>();
  const mergedIds: Array<{
    id: number | string;
    firstSeenIndex: number;
  }> = [];
  for (const id of currentMessageIds.concat(serverMessageIds)) {
    const idKey = String(id);
    if (seenIds.has(idKey)) continue;
    seenIds.add(idKey);
    mergedIds.push({ id, firstSeenIndex: mergedIds.length });
  }

  mergedIds.sort((first, second) => {
    const firstNumericId = Number(first.id);
    const secondNumericId = Number(second.id);
    if (
      Number.isFinite(firstNumericId) &&
      Number.isFinite(secondNumericId) &&
      firstNumericId !== secondNumericId
    ) {
      return secondNumericId - firstNumericId;
    }

    const firstTimeStamp = Number(messagesObj?.[first.id]?.timeStamp || 0);
    const secondTimeStamp = Number(messagesObj?.[second.id]?.timeStamp || 0);
    if (firstTimeStamp !== secondTimeStamp) {
      return secondTimeStamp - firstTimeStamp;
    }
    return first.firstSeenIndex - second.firstSeenIndex;
  });

  return mergedIds.map(({ id }) => id);
}

function updateCardIdMembership(
  cardIds: number[],
  cardId: number,
  included: boolean
) {
  const remainingCardIds = cardIds.filter(
    (existingCardId) => existingCardId !== cardId
  );
  return included ? [cardId, ...remainingCardIds] : remainingCardIds;
}

function getBuildContributionInviteMembershipKey(invite: any) {
  const buildId = Number(invite?.buildId || 0);
  const userId = Number(invite?.userId || 0);
  return buildId > 0 && userId > 0 ? `${buildId}:${userId}` : '';
}

function getBuildContributionMembershipKey({
  buildId,
  userId
}: {
  buildId?: number;
  userId?: number;
}) {
  const normalizedBuildId = Number(buildId || 0);
  const normalizedUserId = Number(userId || 0);
  return normalizedBuildId > 0 && normalizedUserId > 0
    ? `${normalizedBuildId}:${normalizedUserId}`
    : '';
}

function getBuildContributionInviteStatus(
  invite: any,
  fallbackStatus?: string
) {
  const status = String(invite?.status || fallbackStatus || '').trim();
  if (
    status === 'accepted' ||
    status === 'declined' ||
    status === 'revoked' ||
    status === 'left'
  ) {
    return status;
  }
  if (Number(invite?.revokedAt || 0) > 0) return 'revoked';
  if (Number(invite?.declinedAt || 0) > 0) return 'declined';
  if (Number(invite?.leftAt || 0) > 0) return 'left';
  if (Number(invite?.acceptedAt || 0) > 0) return 'accepted';
  return 'pending';
}

function getBuildCollaborationRequestStatus(
  request: any,
  fallbackStatus?: string
) {
  const status = String(request?.status || fallbackStatus || '').trim();
  if (
    status === 'accepted' ||
    status === 'invited' ||
    status === 'rejected' ||
    status === 'canceled'
  ) {
    return status;
  }
  if (Number(request?.canceledAt || 0) > 0) return 'canceled';
  return 'pending';
}

function getStatusRank(status: string) {
  if (status === 'accepted') return 3;
  if (
    status === 'declined' ||
    status === 'rejected' ||
    status === 'canceled' ||
    status === 'left'
  ) {
    return 2;
  }
  if (status === 'revoked') return 1;
  return 0;
}

function normalizeEventTimeMs(value?: number) {
  const normalizedValue = Number(value || 0);
  if (!normalizedValue) return 0;
  return normalizedValue > 1000000000000
    ? normalizedValue
    : normalizedValue * 1000;
}

function getInviteEventTime(
  invite: any,
  fallbackTimeStamp?: number,
  eventTimeMs?: number
) {
  return Math.max(
    normalizeEventTimeMs(Number(invite?.acceptedAt || 0)),
    normalizeEventTimeMs(Number(invite?.declinedAt || 0)),
    normalizeEventTimeMs(Number(invite?.revokedAt || 0)),
    normalizeEventTimeMs(Number(invite?.leftAt || 0)),
    normalizeEventTimeMs(Number(invite?.createdAt || 0)),
    normalizeEventTimeMs(fallbackTimeStamp),
    normalizeEventTimeMs(eventTimeMs)
  );
}

function getRequestEventTime(
  request: any,
  fallbackTimeStamp?: number,
  eventTimeMs?: number
) {
  return Math.max(
    normalizeEventTimeMs(Number(request?.respondedAt || 0)),
    normalizeEventTimeMs(Number(request?.canceledAt || 0)),
    normalizeEventTimeMs(Number(request?.hiddenAt || 0)),
    normalizeEventTimeMs(Number(request?.updatedAt || 0)),
    normalizeEventTimeMs(Number(request?.createdAt || 0)),
    normalizeEventTimeMs(fallbackTimeStamp),
    normalizeEventTimeMs(eventTimeMs)
  );
}

function shouldReplaceBuildCollaborationEntry({
  current,
  next,
  status
}: {
  current: any;
  next: any;
  status: string;
}) {
  if (!current) return true;
  if (current.active && !next.active) return false;
  const currentTime = Number(current.__eventTime || 0);
  const nextTime = Number(next.__eventTime || 0);
  if (nextTime !== currentTime) return nextTime > currentTime;
  return getStatusRank(status) >= getStatusRank(current.status);
}

function shouldReplaceBuildContributionMembership({
  current,
  next
}: {
  current: any;
  next: any;
}) {
  if (!current) return true;
  const currentTime = Number(current.__eventTime || 0);
  const nextTime = Number(next.__eventTime || 0);
  if (nextTime !== currentTime) return nextTime > currentTime;
  return Number(next.active ? 1 : 0) >= Number(current.active ? 1 : 0);
}

function upsertBuildContributionMembershipState({
  state,
  active,
  buildId,
  eventTimeMs,
  membership,
  timeStamp,
  userId
}: {
  state: any;
  active?: boolean;
  buildId?: number;
  eventTimeMs?: number;
  membership?: Record<string, any> | null;
  timeStamp?: number;
  userId?: number;
}) {
  const resolvedBuildId = Number(membership?.buildId || buildId || 0);
  const resolvedUserId = Number(membership?.userId || userId || 0);
  const membershipKey = getBuildContributionMembershipKey({
    buildId: resolvedBuildId,
    userId: resolvedUserId
  });
  if (!membershipKey) return state;
  const isActive =
    typeof active === 'boolean'
      ? active
      : Number(membership?.acceptedAt || 0) > 0;
  const nextMembership = {
    ...(membership || {}),
    active: isActive,
    buildId: resolvedBuildId,
    userId: resolvedUserId,
    __eventTime: Math.max(
      normalizeEventTimeMs(Number(membership?.acceptedAt || 0)),
      normalizeEventTimeMs(Number(membership?.createdAt || 0)),
      normalizeEventTimeMs(Number(membership?.leftAt || 0)),
      normalizeEventTimeMs(timeStamp),
      normalizeEventTimeMs(eventTimeMs)
    )
  };
  const currentMembership =
    state.buildContributionMembershipByKey?.[membershipKey] || null;
  if (
    !shouldReplaceBuildContributionMembership({
      current: currentMembership,
      next: nextMembership
    })
  ) {
    return state;
  }
  return {
    ...state,
    buildContributionMembershipByKey: {
      ...(state.buildContributionMembershipByKey || {}),
      [membershipKey]: nextMembership
    }
  };
}

// What the project's thumbnail is after the owner adopted one, read off the
// build row the endpoint returned rather than assumed from the button pressed.
//
// Keyed by project, not by branch, because that is what this state describes: a
// project has one thumbnail, and one suggestion is the one it came from. A
// branch can have sent several cards, and keying by branch made adopting the
// newest of them render every older card as "applied" too — each card merged
// the same entry over its own payload and claimed the project was using an
// image it was not. Which card won is answered by comparing the adopted URL to
// that card's own frozen suggestion, so a sibling card still updates its "Now"
// pane without inheriting a status that belongs to another suggestion.
function upsertBuildThumbnailSuggestionState({
  state,
  rootBuildId,
  build,
  adoptedFromThumbnailUrl,
  eventTimeMs
}: {
  state: any;
  rootBuildId: number;
  build?: Record<string, any> | null;
  adoptedFromThumbnailUrl?: string;
  eventTimeMs?: number;
}) {
  const resolvedRootBuildId = Number(rootBuildId || build?.id || 0);
  if (!resolvedRootBuildId || !build) return state;
  const nextEventTime = normalizeEventTimeMs(eventTimeMs) || Date.now();
  const current =
    state.buildThumbnailByRootBuildId?.[resolvedRootBuildId] || null;
  if (current && Number(current.__eventTime || 0) > nextEventTime) {
    return state;
  }
  return {
    ...state,
    buildThumbnailByRootBuildId: {
      ...(state.buildThumbnailByRootBuildId || {}),
      [resolvedRootBuildId]: {
        ...(current || {}),
        currentThumbnailUrl: String(build?.thumbnailUrl || ''),
        adoptedFromThumbnailUrl: String(adoptedFromThumbnailUrl || ''),
        __eventTime: nextEventTime
      }
    }
  };
}

function upsertBuildContributionInviteState({
  state,
  invite,
  inviteId,
  status,
  eventTimeMs,
  timeStamp
}: {
  state: any;
  invite?: Record<string, any> | null;
  inviteId?: number;
  status?: 'pending' | 'accepted' | 'declined' | 'revoked' | 'left';
  eventTimeMs?: number;
  timeStamp?: number;
}) {
  const resolvedInviteId = Number(invite?.id || inviteId || 0);
  if (!resolvedInviteId) return state;
  const resolvedStatus = getBuildContributionInviteStatus(invite, status);
  const nextInvite = {
    ...(invite || {}),
    id: resolvedInviteId,
    status: resolvedStatus,
    __eventTime: getInviteEventTime(invite, timeStamp, eventTimeMs)
  };
  const currentInvite =
    state.buildContributionInvitesById?.[resolvedInviteId] || null;
  if (
    !shouldReplaceBuildCollaborationEntry({
      current: currentInvite,
      next: nextInvite,
      status: resolvedStatus
    })
  ) {
    return state;
  }
  const membershipKey = getBuildContributionInviteMembershipKey(nextInvite);
  return {
    ...state,
    buildContributionInvitesById: {
      ...(state.buildContributionInvitesById || {}),
      [resolvedInviteId]: nextInvite
    },
    ...(membershipKey
      ? {
          buildContributionInviteMembershipByKey: {
            ...(state.buildContributionInviteMembershipByKey || {}),
            [membershipKey]: nextInvite
          }
        }
      : {})
  };
}

function getBuildCollaborationRequestMembershipKey(request: any) {
  const buildId = Number(request?.buildId || 0);
  const requesterUserId = Number(request?.requesterUserId || 0);
  return buildId > 0 && requesterUserId > 0
    ? `${buildId}:${requesterUserId}`
    : '';
}

function upsertBuildCollaborationRequestState({
  state,
  request,
  requestId,
  status,
  eventTimeMs,
  timeStamp
}: {
  state: any;
  request?: Record<string, any> | null;
  requestId?: number;
  status?: 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
  eventTimeMs?: number;
  timeStamp?: number;
}) {
  const resolvedRequestId = Number(request?.id || requestId || 0);
  if (!resolvedRequestId) return state;
  const resolvedStatus = getBuildCollaborationRequestStatus(request, status);
  const nextRequest = {
    ...(request || {}),
    id: resolvedRequestId,
    status: resolvedStatus,
    __eventTime: getRequestEventTime(request, timeStamp, eventTimeMs)
  };
  const currentRequest =
    state.buildCollaborationRequestsById?.[resolvedRequestId] || null;
  if (
    !shouldReplaceBuildCollaborationEntry({
      current: currentRequest,
      next: nextRequest,
      status: resolvedStatus
    })
  ) {
    return state;
  }
  const membershipKey = getBuildCollaborationRequestMembershipKey(nextRequest);
  return {
    ...state,
    buildCollaborationRequestsById: {
      ...(state.buildCollaborationRequestsById || {}),
      [resolvedRequestId]: nextRequest
    },
    ...(membershipKey
      ? {
          buildCollaborationRequestMembershipByKey: {
            ...(state.buildCollaborationRequestMembershipByKey || {}),
            [membershipKey]: nextRequest
          }
        }
      : {})
  };
}

function updateBuildCollaborationState(
  state: any,
  {
    invite,
    inviteId,
    inviteStatus,
    request,
    requestId,
    requestStatus,
    eventTimeMs,
    timeStamp
  }: {
    invite?: Record<string, any> | null;
    inviteId?: number;
    inviteStatus?: 'pending' | 'accepted' | 'declined' | 'revoked' | 'left';
    request?: Record<string, any> | null;
    requestId?: number;
    requestStatus?:
      'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
    eventTimeMs?: number;
    timeStamp?: number;
  }
) {
  let nextState = state;
  const resolvedInviteStatus = getBuildContributionInviteStatus(
    invite,
    inviteStatus
  );
  const inviteHasMembershipKeys =
    Number(invite?.buildId || 0) > 0 && Number(invite?.userId || 0) > 0;
  if (resolvedInviteStatus === 'accepted' && inviteHasMembershipKeys) {
    nextState = upsertBuildContributionMembershipState({
      state: nextState,
      active: true,
      buildId: Number(invite?.buildId || 0),
      eventTimeMs,
      membership: invite,
      timeStamp,
      userId: Number(invite?.userId || 0)
    });
  } else if (
    inviteHasMembershipKeys &&
    (resolvedInviteStatus === 'pending' ||
      resolvedInviteStatus === 'left' ||
      resolvedInviteStatus === 'revoked' ||
      resolvedInviteStatus === 'declined')
  ) {
    nextState = upsertBuildContributionMembershipState({
      state: nextState,
      active: false,
      buildId: Number(invite?.buildId || 0),
      eventTimeMs,
      membership: invite,
      timeStamp,
      userId: Number(invite?.userId || 0)
    });
  }
  if (
    getBuildCollaborationRequestStatus(request, requestStatus) === 'accepted' &&
    Number(request?.buildId || 0) > 0 &&
    Number(request?.requesterUserId || 0) > 0
  ) {
    nextState = upsertBuildContributionMembershipState({
      state: nextState,
      active: true,
      buildId: Number(request?.buildId || 0),
      eventTimeMs,
      membership: {
        buildId: Number(request?.buildId || 0),
        userId: Number(request?.requesterUserId || 0),
        acceptedAt: Number(request?.respondedAt || request?.updatedAt || 0)
      },
      timeStamp,
      userId: Number(request?.requesterUserId || 0)
    });
  }
  nextState = upsertBuildContributionInviteState({
    state: nextState,
    invite,
    inviteId,
    status: inviteStatus,
    eventTimeMs,
    timeStamp
  });
  nextState = upsertBuildCollaborationRequestState({
    state: nextState,
    request,
    requestId,
    status: requestStatus,
    eventTimeMs,
    timeStamp
  });
  return nextState;
}

export default function ChatReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
): any {
  switch (action.type) {
    case 'BUMP_CHESS_THEME_VERSION': {
      return {
        ...state,
        chessThemeVersion: (state.chessThemeVersion || 0) + 1
      };
    }
    case 'UPDATE_BUILD_COLLABORATION_STATE':
      return updateBuildCollaborationState(state, {
        invite: action.invite,
        inviteId: action.inviteId,
        inviteStatus: action.inviteStatus,
        request: action.request,
        requestId: action.requestId,
        requestStatus: action.requestStatus,
        eventTimeMs: action.eventTimeMs,
        timeStamp: action.timeStamp
      });
    case 'UPDATE_BUILD_CONTRIBUTION_SUBMISSION_STATE':
      return upsertBuildContributionSubmissionState({
        state,
        branchBuildId: action.branchBuildId,
        rootBuildId: action.rootBuildId,
        build: action.build,
        contribution: action.contribution,
        lumineFix: action.lumineFix,
        eventTimeMs: action.eventTimeMs
      });
    case 'UPDATE_BUILD_THUMBNAIL_SUGGESTION_STATE':
      return upsertBuildThumbnailSuggestionState({
        state,
        rootBuildId: action.rootBuildId,
        build: action.build,
        adoptedFromThumbnailUrl: action.adoptedFromThumbnailUrl,
        eventTimeMs: action.eventTimeMs
      });
    case 'UPDATE_BUILD_CONTRIBUTION_MEMBERSHIP':
      return upsertBuildContributionMembershipState({
        state,
        active: action.active,
        buildId: action.buildId,
        eventTimeMs: action.eventTimeMs,
        membership: action.membership,
        timeStamp: action.timeStamp,
        userId: action.userId
      });
    case 'AI_CARD_OFFER_WITHDRAWAL': {
      return {
        ...state,
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feedId]: {
            ...state.aiCardFeedObj[action.feedId],
            offer: {
              ...state.aiCardFeedObj[action.feedId]?.offer,
              isCancelled: true
            }
          }
        }
      };
    }
    case 'ADD_ID_TO_NEW_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const messageIds = prevChannelObj?.messageIds?.map((messageId: number) =>
        messageId === action.tempMessageId ? action.messageId : messageId
      );
      const messagesObj = {
        ...prevChannelObj?.messagesObj,
        [action.messageId]: {
          ...prevChannelObj?.messagesObj?.[action.tempMessageId],
          ...(prevChannelObj?.topicObj?.[action.topicId]?.content
            ? { targetSubject: prevChannelObj?.topicObj?.[action.topicId] }
            : {}),
          id: action.messageId,
          timeStamp: action.timeStamp
        }
      };
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.subchannelId
              ]?.messageIds.map((messageId: number) =>
                messageId === action.tempMessageId
                  ? action.messageId
                  : messageId
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.tempMessageId],
                  id: action.messageId,
                  timeStamp: action.timeStamp
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(prevChannelObj
            ? {
                [action.channelId]: {
                  ...prevChannelObj,
                  topicObj: {
                    ...prevChannelObj?.topicObj,
                    [action.topicId]: {
                      ...prevChannelObj?.topicObj[action.topicId],
                      messageIds: (
                        prevChannelObj?.topicObj[action.topicId]?.messageIds ||
                        []
                      ).map((messageId: number) =>
                        messageId === action.tempMessageId
                          ? action.messageId
                          : messageId
                      )
                    }
                  },
                  messageIds,
                  messagesObj,
                  ...(subchannelObj ? { subchannelObj } : {})
                }
              }
            : {})
        }
      };
    }
    case 'ADD_LISTED_AI_CARD': {
      const existingCard = state.cardObj[action.card.id];
      const isListed = Number(action.newState.isListed) === 1;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: existingCard
            ? { ...existingCard, ...action.newState }
            : action.card
        },
        listedCardIds: isListed
          ? [action.card.id].concat(
              state.listedCardIds.filter(
                (cardId: number) => cardId !== action.card.id
              )
            )
          : state.listedCardIds.filter(
              (cardId: number) => cardId !== action.card.id
            )
      };
    }
    case 'APPLY_AI_CARD_DIRECT_TRANSFER': {
      const cardId = Number(action.card?.id || 0);
      if (!Number.isSafeInteger(cardId) || cardId <= 0) return state;
      const existingCard = state.cardObj[cardId];
      const nextCard = {
        ...(existingCard || action.card),
        ...action.newState,
        id: cardId
      };
      const currentUserId = Number(action.userId || 0);
      const currentUserOwnsCard =
        currentUserId > 0 && Number(nextCard.ownerId) === currentUserId;
      const cardIsListed = Number(nextCard.isListed) === 1;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [cardId]: nextCard
        },
        myCardIds: updateCardIdMembership(
          state.myCardIds,
          cardId,
          currentUserOwnsCard
        ),
        myListedCardIds: updateCardIdMembership(
          state.myListedCardIds,
          cardId,
          currentUserOwnsCard && cardIsListed
        ),
        listedCardIds: updateCardIdMembership(
          state.listedCardIds,
          cardId,
          !currentUserOwnsCard && cardIsListed
        )
      };
    }
    case 'ADD_MY_AI_CARD': {
      return {
        ...state,
        cardObj: state.cardObj?.[action.card.id]
          ? {
              ...state.cardObj,
              [action.card.id]: {
                ...state.cardObj[action.card.id],
                ...action.card,
                isListed: false,
                askPrice: null
              }
            }
          : state.cardObj,
        myCardIds: [action.card.id].concat(
          state.myCardIds.filter((cardId: number) => cardId !== action.card.id)
        )
      };
    }
    case 'REMOVE_MY_AI_CARD': {
      return {
        ...state,
        cardObj: state.cardObj?.[action.cardId]
          ? {
              ...state.cardObj,
              [action.cardId]: {
                ...state.cardObj[action.cardId],
                isListed: false,
                askPrice: null
              }
            }
          : state.cardObj,
        myCardIds: state.myCardIds.filter(
          (cardId: number) => cardId !== action.cardId
        )
      };
    }
    case 'REMOVE_LISTED_AI_CARD': {
      return {
        ...state,
        cardObj: state.cardObj?.[action.cardId]
          ? {
              ...state.cardObj,
              [action.cardId]: {
                ...state.cardObj[action.cardId],
                isListed: false,
                askPrice: 0
              }
            }
          : state.cardObj,
        listedCardIds: state.listedCardIds.filter(
          (cardId: number) => cardId !== action.cardId
        )
      };
    }
    case 'APPLY_CANONICAL_CHAT_REACTION': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.ownerUserId)) {
        return state;
      }
      const update = action.update || {};
      const channelId = Number(update.channelId || 0);
      const messageId = Number(update.messageId || 0);
      const subchannelId = Number(update.subchannelId || 0);
      const incomingMessageRevision = Number(update.reactionStateRevision || 0);
      const incomingActivityRevision = Number(
        update.channelActivity?.revision || 0
      );
      if (
        channelId <= 0 ||
        messageId <= 0 ||
        incomingMessageRevision <= 0 ||
        (update.mutation !== 'add' && update.mutation !== 'remove') ||
        !Array.isArray(update.reactions)
      ) {
        return state;
      }

      const initialChannel = state.channelsObj[channelId];
      const existingActivityRevision = Number(
        loadChannelSettings(initialChannel?.settings)
          .reactionActivityRevision || 0
      );
      // Message snapshots and activity markers are separate projections. A
      // newer activity snapshot may already have won while an older HTTP
      // response was in flight; keep its message revision eligible, but never
      // let the older activity envelope recreate unread/bootstrap markers.
      const stateWithConfirmedReactionMarkers =
        incomingActivityRevision > 0 &&
        incomingActivityRevision < existingActivityRevision
          ? state
          : reconcileConfirmedReactionMarkers({ state, action, update });
      const prevChannelObj =
        stateWithConfirmedReactionMarkers.channelsObj[channelId];
      const message = getChannelMessage({
        channel: prevChannelObj,
        messageId,
        subchannelId
      });
      const currentMessageRevision = Number(
        message.reactionStateServerRevision || 0
      );
      // The message list and DM preview are independent canonical projections:
      // a reaction revision from one message cannot order channel activity
      // against a reaction on another message.
      const stateWithCanonicalReactions =
        message?.id && incomingMessageRevision >= currentMessageRevision
          ? {
              ...stateWithConfirmedReactionMarkers,
              channelsObj: {
                ...stateWithConfirmedReactionMarkers.channelsObj,
                [channelId]: setMessageReactionsOnChannel({
                  channel: prevChannelObj,
                  messageId,
                  subchannelId,
                  reactions: update.reactions,
                  reactionStateRevision: incomingMessageRevision
                })
              }
            }
          : stateWithConfirmedReactionMarkers;
      const stateWithCanonicalActivitySnapshot =
        update.twoPeople &&
        incomingActivityRevision > 0 &&
        incomingActivityRevision >= existingActivityRevision &&
        stateWithCanonicalReactions.channelsObj[channelId]
          ? {
              ...stateWithCanonicalReactions,
              channelsObj: {
                ...stateWithCanonicalReactions.channelsObj,
                [channelId]: setCanonicalReactionActivityOnChannel({
                  channel: stateWithCanonicalReactions.channelsObj[channelId],
                  channelActivity: update.channelActivity
                })
              }
            }
          : stateWithCanonicalReactions;
      const appliedActivityRevision = Math.max(
        Number(
          stateWithConfirmedReactionMarkers
            .appliedReactionActivityRevisionsByChannel?.[channelId] || 0
        ),
        existingActivityRevision
      );
      const shouldApplyActivityEvent =
        update.changed &&
        update.twoPeople &&
        update.channelActivity?.changed &&
        incomingActivityRevision > appliedActivityRevision;
      if (!shouldApplyActivityEvent) {
        const stateWithActivityWatermark =
          update.changed && update.twoPeople && incomingActivityRevision > 0
            ? {
                ...stateWithCanonicalActivitySnapshot,
                appliedReactionActivityRevisionsByChannel: {
                  ...(stateWithCanonicalActivitySnapshot.appliedReactionActivityRevisionsByChannel ||
                    {}),
                  [channelId]: Math.max(
                    appliedActivityRevision,
                    incomingActivityRevision
                  )
                }
              }
            : stateWithCanonicalActivitySnapshot;
        return bufferCanonicalReactionUpdateDuringBootstrap({
          state: stateWithActivityWatermark,
          action,
          update
        });
      }

      const stateWithCanonicalActivity =
        update.mutation === 'add'
          ? ChatReducer(stateWithCanonicalActivitySnapshot, {
              type: 'APPLY_CANONICAL_REACTION_ADD_ACTIVITY',
              channelId,
              messageId,
              reaction: update.reaction,
              subchannelId,
              userId: Number(update.userId),
              pageVisible: action.pageVisible,
              usingChat: action.usingChat,
              timeStamp: Number(update.timeStamp || 0),
              shouldIncrementUnreads: action.shouldIncrementUnreads
            })
          : stateWithCanonicalActivitySnapshot;

      return bufferCanonicalReactionUpdateDuringBootstrap({
        state: {
          ...stateWithCanonicalActivity,
          appliedReactionActivityRevisionsByChannel: {
            ...(stateWithCanonicalActivity.appliedReactionActivityRevisionsByChannel ||
              {}),
            [channelId]: incomingActivityRevision
          }
        },
        action,
        update
      });
    }
    case 'APPLY_CANONICAL_CHANNEL_UNREAD_STATE': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      const unreadState = action.unreadState || {};
      const channelId = Number(unreadState.channelId || 0);
      const subchannelId = Number(unreadState.subchannelId || 0);
      const incomingActivityRevision = Number(
        unreadState.reactionActivityRevision || 0
      );
      if (channelId <= 0 || !unreadState.channel) return state;

      const prevChannel = state.channelsObj[channelId];
      const currentActivityRevision = Number(
        loadChannelSettings(prevChannel?.settings).reactionActivityRevision || 0
      );
      if (prevChannel && incomingActivityRevision < currentActivityRevision) {
        return state;
      }

      let nextState = state;
      if (prevChannel) {
        let nextChannel = prevChannel;
        let appliedCanonicalReadState = false;
        const incomingChannelLastRead = Number(
          unreadState.channel?.lastRead || 0
        );
        const currentChannelLastRead = Number(prevChannel.lastRead || 0);
        if (incomingChannelLastRead >= currentChannelLastRead) {
          nextChannel = applyCanonicalUnreadScope(
            nextChannel,
            unreadState.channel
          );
          appliedCanonicalReadState = true;
        }
        if (subchannelId > 0 && unreadState.subchannel) {
          const previousSubchannel =
            prevChannel.subchannelObj?.[subchannelId] || {};
          const incomingSubchannelLastRead = Number(
            unreadState.subchannel.lastRead || 0
          );
          const currentSubchannelLastRead = Number(
            previousSubchannel.lastRead || 0
          );
          if (incomingSubchannelLastRead >= currentSubchannelLastRead) {
            nextChannel = {
              ...nextChannel,
              subchannelObj: {
                ...(nextChannel.subchannelObj || {}),
                [subchannelId]: applyCanonicalUnreadScope(
                  previousSubchannel,
                  unreadState.subchannel
                )
              }
            };
            appliedCanonicalReadState = true;
          }
        }
        if (!appliedCanonicalReadState) {
          return state;
        }
        nextState = {
          ...state,
          channelsObj: {
            ...state.channelsObj,
            [channelId]: nextChannel
          }
        };
      }

      return bufferCanonicalUnreadStateDuringBootstrap({
        state: nextState,
        unreadState,
        eventSequence: action.eventSequence
      });
    }
    case 'EDIT_CHANNEL_SETTINGS':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            description: action.description,
            isClosed: action.isClosed,
            isPublic: action.isPublic,
            isOwnerPostingOnly: action.isOwnerPostingOnly,
            canChangeSubject: action.canChangeSubject,
            theme: action.theme,
            thumbPath: action.thumbPath
          }
        },
        customChannelNames: {
          ...state.customChannelNames,
          [action.channelId]: action.channelName
        }
      };
    case 'CHANGE_ONLINE_STATUS': {
      const prev = state.chatStatus[action.userId] || {};
      const isOnline = !!action.isOnline;
      const derivedLastActive = !isOnline
        ? Number(action.lastActive) ||
          Number(prev.lastActive) ||
          Math.floor(Date.now() / 1000)
        : prev.lastActive;

      // Stamped so an in-flight presence snapshot, which was taken before this
      // event, cannot undo it when its ack finally lands.
      const updatedChatStatus = {
        ...state.chatStatus,
        [action.userId]: stampPresenceEntry(
          prev && Object.keys(prev).length
            ? {
                ...prev,
                ...(action.member || {}),
                isOnline,
                isAway: isOnline ? false : prev.isAway,
                isBusy: isOnline ? false : prev.isBusy,
                ...(derivedLastActive ? { lastActive: derivedLastActive } : {})
              }
            : {
                ...(action.member || {}),
                id: action.userId,
                isOnline,
                ...(derivedLastActive ? { lastActive: derivedLastActive } : {})
              }
        )
      };

      let recentOfflineUsers = state.recentOfflineUsers || [];
      if (!isOnline && derivedLastActive) {
        const withoutUser = recentOfflineUsers.filter(
          (u: any) => Number(u.id) !== Number(action.userId)
        );
        recentOfflineUsers = [
          {
            id: action.userId,
            ...(action.member || {}),
            lastActive: derivedLastActive
          },
          ...withoutUser
        ];
      }

      return {
        ...state,
        chatStatus: updatedChatStatus,
        recentOfflineUsers
      };
    }
    case 'CHANGE_AWAY_STATUS': {
      return {
        ...state,
        chatStatus: {
          ...state.chatStatus,
          [action.userId]: state.chatStatus[action.userId]
            ? stampPresenceEntry({
                ...state.chatStatus[action.userId],
                isAway: action.isAway
              })
            : undefined
        }
      };
    }
    case 'CHANGE_BUSY_STATUS': {
      return {
        ...state,
        chatStatus: {
          ...state.chatStatus,
          [action.userId]: state.chatStatus[action.userId]
            ? stampPresenceEntry({
                ...state.chatStatus[action.userId],
                isBusy: action.isBusy
              })
            : undefined
        }
      };
    }
    case 'CHANGE_CHANNEL_OWNER': {
      if (!state.channelsObj[action.channelId]) return state;

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: applyCanonicalChannelOwnerTransition({
            channel: state.channelsObj[action.channelId],
            creatorId: action.creatorId,
            message: action.message,
            newOwner: action.newOwner
          })
        }
      };
    }
    case 'CHANGE_TOPIC_SETTINGS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: applyCanonicalTopicSettings({
            channel: state.channelsObj[action.channelId],
            topicId: action.topicId,
            topicTitle: action.topicTitle,
            isOwnerPostingOnly: action.isOwnerPostingOnly,
            customInstructions: action.customInstructions
          })
        }
      };
    }
    case 'CHANGE_CHANNEL_SETTINGS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: applyCanonicalChannelSettings({
            channel: state.channelsObj[action.channelId],
            channelName: action.channelName,
            description: action.description,
            isClosed: action.isClosed,
            isPublic: action.isPublic,
            isOwnerPostingOnly: action.isOwnerPostingOnly,
            canChangeSubject: action.canChangeSubject,
            theme: action.theme,
            thumbPath: action.thumbPath
          })
        }
      };
    }
    case 'CHANGE_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              legacyTopicObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                featuredTopicId: action.isFeatured
                  ? action.subject.id
                  : prevChannelObj?.featuredTopicId,
                topicObj: action.topicObj
                  ? {
                      ...prevChannelObj?.topicObj,
                      [action.subject.id]: action.topicObj
                    }
                  : prevChannelObj?.topicObj,
                legacyTopicObj: action.subject
              }
        }
      };
    }
    case 'CLEAR_CHAT_SEARCH_RESULTS':
      return {
        ...state,
        chatSearchResults: []
      };
    case 'CLEAR_RECENT_CHESS_MESSAGE': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            recentChessMessage: null
          }
        }
      };
    }
    case 'CLEAR_SUBJECT_SEARCH_RESULTS':
      return {
        ...state,
        subjectSearchResults: []
      };
    case 'CLEAR_USER_SEARCH_RESULTS':
      return {
        ...state,
        userSearchResults: []
      };
    case 'CONFIRM_CALL_RECEPTION':
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          callReceived: true
        }
      };
    case 'CREATE_NEW_CHANNEL': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      const { channelId } = action.data.message;
      // Key the creation notice by the id the server gave it. A synthesized key
      // makes this message invisible to every id-keyed reconciliation — the
      // canonical favorite-state snapshot, a channel load, a load-more, a
      // realtime delivery — so the same message lands again under its real id
      // as a second "created the ... group" row.
      const startMessageId = action.data.message.id || uuidv1();
      const nextState = {
        ...state,
        chatType: null,
        subject: {},
        homeChannelIds: [channelId].concat(state.homeChannelIds),
        classChannelIds: action.data.isClass
          ? [channelId].concat(state.classChannelIds)
          : state.classChannelIds,
        channelsObj: {
          ...state.channelsObj,
          [channelId]: {
            id: channelId,
            allMemberIds: action.data.members.map(
              (member: { id: number }) => member.id
            ),
            channelName: action.data.message.channelName,
            messageIds: [startMessageId],
            messagesObj: {
              [startMessageId]: action.data.message
            },
            messagesLoadMoreButton: false,
            isClass: action.data.isClass,
            isClosed: action.data.isClosed,
            numUnreads: 0,
            twoPeople: false,
            creatorId: action.data.message.userId,
            members: action.data.members,
            unlockedThemes: [],
            pathId: action.data.pathId,
            loaded: true
          }
        },
        selectedChannelId: channelId
      };
      return action.data.favoriteState
        ? ChatReducer(nextState, {
            type: 'APPLY_CANONICAL_FAVORITE_STATE',
            ...action.data.favoriteState,
            userId: action.userId
          })
        : nextState;
    }
    case 'CREATE_NEW_DM_CHANNEL': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      const messageId = action.message?.id || uuidv1();
      const nextState = {
        ...state,
        subject: {},
        homeChannelIds: [
          action.channel.id,
          ...state.homeChannelIds.filter((channelId: number) => channelId !== 0)
        ],
        selectedChannelId: action.channel.id,
        ...(action.withoutMessage
          ? {}
          : {
              channelsObj: {
                ...state.channelsObj,
                0: {},
                [action.channel.id]: {
                  ...action.channel,
                  messageIds: [messageId],
                  messagesObj: {
                    [messageId]: action.message
                  },
                  numUnreads: 0,
                  loaded: true
                }
              }
            })
      };
      return action.quickAccess
        ? ChatReducer(nextState, {
            type: 'APPLY_CANONICAL_QUICK_ACCESS',
            quickAccess: action.quickAccess,
            userId: action.userId
          })
        : nextState;
    }
    case 'DELETE_AI_CHAT_FILE': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            files: {
              ...state.channelsObj[action.channelId].files,
              main: {
                ...state.channelsObj[action.channelId].files.main,
                ids: state.channelsObj[action.channelId].files.main.ids.filter(
                  (fileId: number) => fileId !== action.fileId
                )
              },
              ...(action.topicId &&
              state.channelsObj[action.channelId]?.files?.[action.topicId]
                ? {
                    [action.topicId]: {
                      ...state.channelsObj[action.channelId].files[
                        action.topicId
                      ],
                      ids: state.channelsObj[action.channelId].files[
                        action.topicId
                      ].ids.filter((fileId: number) => fileId !== action.fileId)
                    }
                  }
                : {})
            }
          }
        }
      };
    }
    case 'DELETE_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const deletedMessage = getChannelMessage({
        channel: prevChannelObj,
        messageId: action.messageId,
        subchannelId: action.subchannelId
      });
      const deletedSubchannelId =
        Number(action.subchannelId || deletedMessage?.subchannelId || 0) ||
        null;
      const realtimeEventKey = getRealtimeMessageEventKey(action.messageId);
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.subchannelId
              ]?.messageIds?.filter(
                (messageId: number) => messageId !== action.messageId
              )
            }
          }
        : prevChannelObj?.subchannelObj;
      const nextState = {
        ...state,
        confirmedRealtimeActivityByChannel: removeConfirmedRealtimeActivity({
          activityByChannel: state.confirmedRealtimeActivityByChannel,
          channelId: action.channelId,
          subchannelId: deletedSubchannelId,
          eventKey: realtimeEventKey
        }),
        confirmedRealtimeUnreadActivityByChannel:
          removeConfirmedRealtimeActivity({
            activityByChannel: state.confirmedRealtimeUnreadActivityByChannel,
            channelId: action.channelId,
            subchannelId: deletedSubchannelId,
            eventKey: realtimeEventKey
          }),
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            topicObj: action.topicId
              ? {
                  ...state.channelsObj[action.channelId]?.topicObj,
                  [action.topicId]: {
                    ...state.channelsObj[action.channelId]?.topicObj?.[
                      action.topicId
                    ],
                    messageIds: state.channelsObj[action.channelId]?.topicObj?.[
                      action.topicId
                    ]?.messageIds?.filter(
                      (messageId: number) => messageId !== action.messageId
                    )
                  }
                }
              : state.channelsObj[action.channelId]?.topicObj,
            messageIds: prevChannelObj?.messageIds?.filter(
              (messageId: number) => messageId !== action.messageId
            ),
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
      return bufferConfirmedMessageDeletionDuringBootstrap({
        state: nextState,
        action: {
          ...action,
          subchannelId: deletedSubchannelId
        }
      });
    }
    case 'CANCEL_AI_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const newChannelState = {
        currentlyStreamingAIMsgId: null,
        cancelledMessageIds: new Set([
          ...(prevChannelObj?.cancelledMessageIds || new Set()),
          action.messageId
        ])
      };

      let messageIds = prevChannelObj?.messageIds;
      let messagesObj = prevChannelObj?.messagesObj;
      let topicObj = prevChannelObj?.topicObj;

      if (action.shouldRemoveMessage) {
        messageIds = messageIds?.filter(
          (messageId: number) => messageId !== action.messageId
        );
        messagesObj = { ...messagesObj };
        delete messagesObj[action.messageId];

        if (action.topicId) {
          topicObj = {
            ...topicObj,
            [action.topicId]: {
              ...topicObj?.[action.topicId],
              messageIds: topicObj?.[action.topicId]?.messageIds?.filter(
                (messageId: number) => messageId !== action.messageId
              )
            }
          };
        }
      }

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            ...newChannelState,
            messageIds,
            messagesObj,
            topicObj
          }
        }
      };
    }
    case 'DISPLAY_ATTACHED_FILE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.messageId],
                  ...action.fileInfo,
                  id: action.messageId,
                  fileToUpload: null
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messagesObj: {
              ...prevChannelObj?.messagesObj,
              [action.messageId]: {
                ...prevChannelObj?.messagesObj?.[action.messageId],
                ...action.fileInfo,
                id: action.messageId,
                fileToUpload: null
              }
            },
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'APPEND_AI_MESSAGE_DELTA': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const existingMessage = prevChannelObj?.messagesObj?.[action.messageId];
      if (!existingMessage || typeof action.delta !== 'string') return state;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messagesObj: {
              ...prevChannelObj.messagesObj,
              [action.messageId]: {
                ...existingMessage,
                content: `${existingMessage.content || ''}${action.delta}`
              }
            }
          }
        }
      };
    }
    case 'SET_CHAT_ATTACHMENT_THUMB_URL': {
      const channel = state.channelsObj[action.channelId];
      const nextChannel = applyCanonicalChatAttachmentThumbnail({
        channel,
        messageId: action.messageId,
        subchannelId: action.subchannelId,
        thumbUrl: action.thumbUrl
      });
      if (nextChannel === channel) return state;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: nextChannel
        }
      };
    }
    case 'EDIT_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              legacyTopicObj:
                action.isSubject && action.subjectChanged
                  ? {
                      ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                        ?.legacyTopicObj,
                      content: action.editedMessage
                    }
                  : prevChannelObj?.subchannelObj?.[action.subchannelId]
                      ?.legacyTopicObj,
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.messageId],
                  content: action.editedMessage,
                  ...(action.isAIEdited ? { isAIEdited: true } : {})
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(prevChannelObj?.messagesObj
            ? {
                [action.channelId]: action.subchannelId
                  ? {
                      ...prevChannelObj,
                      subchannelObj
                    }
                  : {
                      ...prevChannelObj,
                      legacyTopicObj:
                        action.isSubject && action.subjectChanged
                          ? {
                              ...prevChannelObj.legacyTopicObj,
                              content: action.editedMessage
                            }
                          : prevChannelObj.legacyTopicObj,
                      messagesObj: {
                        ...prevChannelObj?.messagesObj,
                        [action.messageId]: {
                          ...prevChannelObj?.messagesObj[action.messageId],
                          content: action.editedMessage,
                          ...(action.isAIEdited ? { isAIEdited: true } : {})
                        }
                      }
                    }
              }
            : {})
        }
      };
    }
    case 'APPLY_AI_GENERATED_DEFINITIONS': {
      const definitionOrder: Record<string, string[]> = {};
      for (const key in action.partOfSpeeches) {
        definitionOrder[key] = action.partOfSpeeches[key].map(
          (def: { id: number }) => def.id
        );
      }

      return {
        ...state,
        wordsObj: {
          ...state.wordsObj,
          [action.word]: {
            ...state.wordsObj[action.word],
            ...action.partOfSpeeches,
            definitionOrder,
            partOfSpeechOrder: action.partOfSpeechOrder
          }
        }
      };
    }
    case 'EDIT_WORD':
      return {
        ...state,
        wordsObj: {
          ...state.wordsObj,
          [action.word]: {
            ...state.wordsObj[action.word],
            deletedDefIds: action.deletedDefIds,
            partOfSpeechOrder: action.partOfSpeeches,
            definitionOrder: action.editedDefinitionOrder
          }
        }
      };
    case 'ENABLE_CHAT_SUBJECT': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            canChangeSubject: 'owner',
            featuredTopicId: action.topic.id,
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topic.id]: action.topic
            }
          }
        }
      };
    }
    case 'ENTER_CHANNEL': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      let messagesLoadMoreButton = false;
      const serverLoadedChannel = action.data.channel;
      let channelVisibilityById = mergeCanonicalChannelVisibility({
        visibilityById: state.channelVisibilityById || {},
        visibility: getCanonicalChannelVisibilityFromChannel(
          state.channelsObj[serverLoadedChannel.id]
        )
      });
      channelVisibilityById = mergeCanonicalChannelVisibility({
        visibilityById: channelVisibilityById,
        visibility:
          getCanonicalChannelVisibilityFromChannel(serverLoadedChannel)
      });
      channelVisibilityById = mergeCanonicalChannelVisibility({
        visibilityById: channelVisibilityById,
        visibility: action.data.channelVisibility
      });
      const loadedChannel = applyCanonicalChannelVisibility({
        channel: serverLoadedChannel,
        visibility: channelVisibilityById[serverLoadedChannel.id]
      });
      const existingLoadedChannel = state.channelsObj[loadedChannel.id] || {};
      const mergedChannelSettings = mergeChannelSettings({
        existingSettings: existingLoadedChannel?.settings,
        serverSettings: loadedChannel?.settings
      });
      const mergedChannelLastUpdated = Math.max(
        Number(existingLoadedChannel?.lastUpdated || 0),
        Number(loadedChannel?.lastUpdated || 0),
        Number(mergedChannelSettings?.lastReaction?.timeStamp || 0)
      );
      if (action.data.messages.length === 21) {
        action.data.messages.pop();
        messagesLoadMoreButton = true;
      }
      let newSubchannelObj = {};
      if (
        action.data.currentSubchannelId &&
        action.data.channel?.subchannelObj
      ) {
        newSubchannelObj = {
          ...state.channelsObj[loadedChannel.id]?.subchannelObj,
          ...action.data.channel?.subchannelObj,
          [action.data.currentSubchannelId]: {
            ...state.channelsObj[loadedChannel.id]?.subchannelObj?.[
              action.data.currentSubchannelId
            ],
            ...action.data.channel?.subchannelObj?.[
              action.data.currentSubchannelId
            ],
            lastRead: Math.max(
              Number(
                state.channelsObj[loadedChannel.id]?.subchannelObj?.[
                  action.data.currentSubchannelId
                ]?.lastRead || 0
              ),
              Number(
                action.data.channel?.subchannelObj?.[
                  action.data.currentSubchannelId
                ]?.lastRead || 0
              )
            ),
            messageIds:
              action.data.channel?.subchannelObj[
                action.data.currentSubchannelId
              ]?.messageIds,
            // Merge with existing messagesObj to preserve loaded messages
            messagesObj: {
              ...state.channelsObj[loadedChannel.id]?.subchannelObj?.[
                action.data.currentSubchannelId
              ]?.messagesObj,
              ...action.data.channel?.subchannelObj[
                action.data.currentSubchannelId
              ]?.messagesObj
            },
            loaded: true
          }
        };
      }

      const messagesObj: any = {
        ...state.channelsObj[loadedChannel.id]?.messagesObj
      };
      for (const message of action.data.messages) {
        messagesObj[message.id] = {
          ...message,
          isLoaded: false
        };
      }

      const mergedTopicObj = resetTopicMessageCachesForCanonicalChannelLoad(
        loadedChannel.topicObj
      );
      const canonicalTopicNavigation = reconcileCanonicalTopicNavigation({
        existingChannel: existingLoadedChannel,
        canonicalTopicObj: mergedTopicObj
      });

      const enteredState = {
        ...state,
        channelVisibilityById,
        selectedChatTab: determineSelectedChatTab({
          currentSelectedChatTab: state.selectedChatTab,
          selectedChannel: loadedChannel
        }),
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  recentOmokMessage: null
                }
              }
            : {}),
          [loadedChannel.id]: {
            ...loadedChannel,
            lastRead: Math.max(
              Number(existingLoadedChannel.lastRead || 0),
              Number(loadedChannel.lastRead || 0)
            ),
            lastUpdated: mergedChannelLastUpdated,
            settings: mergedChannelSettings,
            messagesLoadMoreButton,
            loadMoreMembersShown: action.data.channel?.loadMoreMembersShown,
            subchannelIds: action.data.channel?.subchannelIds,
            subchannelObj: action.data.channel?.subchannelObj,
            messageIds: action.data.messages.map((message: any) => message.id),
            messagesObj,
            isReloadRequired: false,
            legacyTopicObj: state.channelsObj[loadedChannel.id]?.legacyTopicObj,
            ...canonicalTopicNavigation,
            topicObj: mergedTopicObj,
            loaded: true,
            ...(action.data.currentSubchannelId
              ? { subchannelObj: newSubchannelObj }
              : {}),
            ...(loadedChannel.twoPeople &&
            loadedChannel.members &&
            state.prevUserId
              ? {
                  partnerUsername: loadedChannel.members.find(
                    (m: { id: number }) => m.id !== state.prevUserId
                  )?.username
                }
              : {})
          }
        },
        selectedChannelId: loadedChannel.id
      };
      return action.data.quickAccess
        ? ChatReducer(enteredState, {
            type: 'APPLY_CANONICAL_QUICK_ACCESS',
            quickAccess: action.data.quickAccess,
            userId: action.userId
          })
        : enteredState;
    }
    case 'ENTER_EMPTY_CHAT':
      return {
        ...state,
        chatType: null,
        subject: {},
        selectedChannelId: 0,
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  recentOmokMessage: null
                }
              }
            : {}),
          0: {
            ...state.channelsObj[0],
            recentChessMessage: null,
            recentOmokMessage: null,
            messageIds: [],
            messagesLoadMoreButton: false,
            loaded: true
          }
        }
      };
    case 'ENTER_TOPIC': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const currentTopicIndex = prevChannelObj.currentTopicIndex ?? -1;
      let topicHistory = prevChannelObj.topicHistory || [];
      let newTopicIndex = currentTopicIndex;

      if (action.direction) {
        if (
          action.direction === 'forward' &&
          currentTopicIndex < topicHistory.length - 1
        ) {
          newTopicIndex = currentTopicIndex + 1;
        } else if (action.direction === 'back' && currentTopicIndex > 0) {
          newTopicIndex = currentTopicIndex - 1;
        }
      } else if (action.topicId) {
        if (
          action.topicId !== prevChannelObj.topicHistory?.[currentTopicIndex]
        ) {
          if (currentTopicIndex < topicHistory.length - 1) {
            topicHistory = topicHistory.slice(0, currentTopicIndex + 1);
          }
          topicHistory.push(action.topicId);
          newTopicIndex = topicHistory.length - 1;
        }
      }

      const effectiveTopicId = action.topicId ?? topicHistory[newTopicIndex];

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            lastTopicId: effectiveTopicId,
            selectedTab: 'topic',
            selectedTopicId: topicHistory[newTopicIndex],
            topicHistory,
            currentTopicIndex: newTopicIndex,
            ...(effectiveTopicId
              ? {
                  topicObj: {
                    ...prevChannelObj?.topicObj,
                    [effectiveTopicId]: {
                      ...prevChannelObj?.topicObj?.[effectiveTopicId],
                      isSearchActive: false
                    }
                  }
                }
              : {})
          }
        }
      };
    }
    case 'FEATURE_TOPIC': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            featuredTopicId: action.topic.id,
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topic.id]: action.topic
            }
          }
        }
      };
    }
    case 'LOAD_AI_CARD_FEED': {
      return {
        ...state,
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feed.id]: {
            ...action.feed,
            isLoaded: true
          }
        },
        ...(action.feed.card
          ? {
              cardObj: {
                ...state.cardObj,
                [action.feed.card.id]: action.feed.card
              }
            }
          : {})
      };
    }
    case 'PIN_TOPIC': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            pinnedTopicIds: action.pinnedTopicIds
          }
        }
      };
    }
    case 'GET_NUM_UNREAD_MSGS':
      return {
        ...state,
        numUnreads: action.numUnreads
      };
    case 'HANG_UP': {
      const newChannelOnCallMembers = { ...state.channelOnCall?.members };
      delete newChannelOnCallMembers[action.memberId];
      const newPeerStreams = { ...state.peerStreams };
      if (!action.iHungUp) {
        delete newPeerStreams[action.peerId];
      }
      return {
        ...state,
        myStream: action.iHungUp ? null : state.myStream,
        peerStreams: action.iHungUp ? {} : newPeerStreams,
        channelOnCall: {
          ...state.channelOnCall,
          callReceived: action.iHungUp
            ? false
            : state.channelOnCall?.callReceived,
          outgoingShown: action.iHungUp
            ? false
            : state.channelOnCall?.outgoingShown,
          imCalling: action.iHungUp ? false : state.channelOnCall?.imCalling,
          incomingShown: action.iHungUp
            ? false
            : state.channelOnCall?.incomingShown,
          members: newChannelOnCallMembers
        }
      };
    }
    case 'HIDE_ATTACHMENT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.messageId],
                  attachmentHidden: true
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(prevChannelObj?.messagesObj
            ? {
                [action.channelId]: {
                  ...prevChannelObj,
                  messagesObj: {
                    ...prevChannelObj.messagesObj,
                    [action.messageId]: {
                      ...prevChannelObj.messagesObj[action.messageId],
                      attachmentHidden: true
                    }
                  },
                  ...(subchannelObj ? { subchannelObj } : {})
                }
              }
            : {})
        }
      };
    }
    case 'START_CHAT_BOOTSTRAP': {
      const isSwitchingUsers =
        state.prevUserId != null &&
        Number(state.prevUserId) !== Number(action.userId);
      // Revisions are meaningful only inside one user's projection. Clear the
      // previous account's baselines before accepting events for the newly
      // bound user; otherwise a larger old revision can suppress the new
      // user's first canonical snapshot.
      const bootstrapBaseState = isSwitchingUsers
        ? { ...state, ...initialChatState }
        : state;
      return {
        ...bootstrapBaseState,
        activeChatBootstrap: {
          id: action.bootstrapId,
          userId: action.userId,
          startedAt: action.startedAt
        },
        canonicalReactionUpdatesDuringBootstrap: {},
        canonicalUnreadStatesDuringBootstrap: {},
        confirmedRealtimeActivityByChannel: {},
        confirmedRealtimeUnreadActivityByChannel: {},
        confirmedMessageDeletionsDuringBootstrap: {}
      };
    }
    case 'FINISH_CHAT_BOOTSTRAP': {
      if (state.activeChatBootstrap?.id !== action.bootstrapId) return state;
      return {
        ...state,
        activeChatBootstrap: null,
        canonicalReactionUpdatesDuringBootstrap: {},
        canonicalUnreadStatesDuringBootstrap: {},
        confirmedRealtimeActivityByChannel: {},
        confirmedRealtimeUnreadActivityByChannel: {},
        confirmedMessageDeletionsDuringBootstrap: {}
      };
    }
    case 'INIT_CHAT': {
      recordChatBootstrapEvent('chat-init-reducer-enter', {
        bootstrapId: action.bootstrapId || null,
        userId: action.userId,
        prevUserId: state.prevUserId,
        hasChannelsObj: !!action.data?.channelsObj,
        channelCount: Object.keys(action.data?.channelsObj || {}).length,
        currentChannelId: action.data?.currentChannelId ?? null
      });
      if (!action.data?.channelsObj) {
        recordChatBootstrapEvent(
          'chat-init-reducer-rejected-missing-channels',
          {
            bootstrapId: action.bootstrapId || null,
            userId: action.userId,
            prevUserId: state.prevUserId,
            currentChannelId: action.data?.currentChannelId ?? null
          }
        );
        return state;
      }
      const activeBootstrap = state.activeChatBootstrap;
      const isOwningBootstrap = Boolean(
        activeBootstrap &&
        activeBootstrap.id === action.bootstrapId &&
        Number(activeBootstrap.userId) === Number(action.userId)
      );
      if (!isOwningBootstrap) {
        recordChatBootstrapEvent('chat-init-reducer-rejected-non-owner', {
          bootstrapId: action.bootstrapId || null,
          activeBootstrapId: activeBootstrap?.id || null,
          userId: action.userId,
          activeBootstrapUserId: activeBootstrap?.userId || null
        });
        return state;
      }
      const alreadyUsingChat =
        (!!state.selectedChannelId || state.selectedChannelId === 0) &&
        state.selectedChannelId !== action.data.currentChannelId &&
        action.userId === state.prevUserId;
      let messagesLoadMoreButton = false;
      let classLoadMoreButton = false;
      let homeLoadMoreButton = false;
      let favoriteLoadMoreButton = Boolean(action.data.favoriteLoadMoreButton);
      let vocabFeedsLoadMoreButton = false;
      const newMessageIds = action.data.messageIds
        ? [...action.data.messageIds]
        : null;
      const newMessagesObj = mergeMessagesPreservingNewerReactionState({
        existingMessagesObj:
          state.channelsObj[action.data.currentChannelId]?.messagesObj,
        serverMessagesObj: action.data.messagesObj
      });
      if (newMessageIds && newMessageIds.length === 21) {
        newMessageIds.pop();
        messagesLoadMoreButton = true;
      }
      if (action.data.homeChannelIds?.length > 20) {
        action.data.homeChannelIds.pop();
        homeLoadMoreButton = true;
      }
      if (action.data.classChannelIds?.length > 20) {
        action.data.classChannelIds.pop();
        classLoadMoreButton = true;
      }
      if (action.data.favoriteChannelIds?.length > 20) {
        action.data.favoriteChannelIds.pop();
        favoriteLoadMoreButton = true;
      }
      if (action.data.vocabFeeds?.length > 20) {
        action.data.vocabFeeds.pop();
        vocabFeedsLoadMoreButton = true;
      }
      action.data.vocabFeeds?.reverse?.();
      const newChannelsObj: Record<string, any> = {
        ...state.channelsObj
      };
      let channelVisibilityById: CanonicalChannelVisibilityById = {
        ...(state.channelVisibilityById || {})
      };
      const isSameLoadedUser = action.userId === state.prevUserId;
      const bufferedReactionUpdates = Object.values(
        state.canonicalReactionUpdatesDuringBootstrap || {}
      ).sort(
        (a: any, b: any) =>
          Number(a.eventSequence || 0) - Number(b.eventSequence || 0)
      );
      const bufferedUnreadStates = Object.values(
        state.canonicalUnreadStatesDuringBootstrap || {}
      );
      const bufferedMessageDeletions = Object.values(
        state.confirmedMessageDeletionsDuringBootstrap || {}
      ).sort(
        (a: any, b: any) =>
          Number(a.eventSequence || 0) - Number(b.eventSequence || 0)
      );
      const confirmedRealtimeChannelIds = getConfirmedRealtimeChannelIds({
        confirmedRealtimeActivityByChannel:
          state.confirmedRealtimeActivityByChannel || {}
      });
      const preservedRealtimeActivity = confirmedRealtimeChannelIds.size > 0;
      const currentFavoriteStateRevision = Number(
        state.favoriteStateRevision || 0
      );
      const bootstrapFavoriteStateRevision = Number(
        action.data.favoriteStateRevision || 0
      );
      // A higher local revision may only outrank the bootstrap snapshot when
      // the bootstrapping user owns it. Revisions are per-user counters, so a
      // previous account's leftover revision would otherwise beat the current
      // account's canonical bootstrap and preserve the wrong user's private
      // sidebar state.
      const shouldPreserveFavoriteState =
        currentFavoriteStateRevision > bootstrapFavoriteStateRevision &&
        Number(state.favoriteStateOwnerId || 0) === Number(action.userId);
      const shouldPreserveQuickAccess =
        Number(state.quickAccess?.revision || 0) >
          Number(action.data.quickAccess?.revision || 0) &&
        Number(state.quickAccessOwnerId || 0) === Number(action.userId);
      for (const channelId in action.data.channelsObj) {
        const existingChannel = state.channelsObj[channelId];
        const serverChannel = action.data.channelsObj[channelId];
        channelVisibilityById = mergeCanonicalChannelVisibility({
          visibilityById: channelVisibilityById,
          visibility: getCanonicalChannelVisibilityFromChannel(existingChannel)
        });
        channelVisibilityById = mergeCanonicalChannelVisibility({
          visibilityById: channelVisibilityById,
          visibility: getCanonicalChannelVisibilityFromChannel(serverChannel)
        });
        const confirmedActivity =
          state.confirmedRealtimeActivityByChannel?.[channelId] || {};
        const confirmedUnreadActivity =
          state.confirmedRealtimeUnreadActivityByChannel?.[channelId] || {};
        const rootActivityArrivedDuringBootstrap = wasRealtimeActivityConfirmed(
          confirmedActivity[ROOT_REALTIME_ACTIVITY_SCOPE]
        );
        const rootUnreadArrivedDuringBootstrap = wasRealtimeActivityConfirmed(
          confirmedUnreadActivity[ROOT_REALTIME_ACTIVITY_SCOPE]
        );
        const activeSubchannelIds = Object.entries(confirmedActivity)
          .filter(
            ([scope, scopeActivity]) =>
              scope !== ROOT_REALTIME_ACTIVITY_SCOPE &&
              wasRealtimeActivityConfirmed(scopeActivity)
          )
          .map(([scope]) => Number(scope))
          .filter((subchannelId) => subchannelId > 0);
        const activeUnreadSubchannelIds = new Set(
          Object.entries(confirmedUnreadActivity)
            .filter(
              ([scope, scopeActivity]) =>
                scope !== ROOT_REALTIME_ACTIVITY_SCOPE &&
                wasRealtimeActivityConfirmed(scopeActivity)
            )
            .map(([scope]) => Number(scope))
            .filter((subchannelId) => subchannelId > 0)
        );
        const shouldPreserveRealtimeActivity = confirmedRealtimeChannelIds.has(
          Number(channelId)
        );
        const mergedSettings = shouldPreserveRealtimeActivity
          ? mergeChannelSettings({
              existingSettings: existingChannel?.settings,
              serverSettings: serverChannel?.settings
            })
          : loadChannelSettings(serverChannel?.settings);
        const mergedLastUpdated = shouldPreserveRealtimeActivity
          ? Math.max(
              Number(existingChannel?.lastUpdated || 0),
              Number(serverChannel?.lastUpdated || 0),
              Number(mergedSettings?.lastReaction?.timeStamp || 0)
            )
          : Number(serverChannel?.lastUpdated || 0);
        const hasCanonicalTopicCatalog =
          Number(channelId) === Number(action.data.currentChannelId);
        const mergedTopicObj = resetTopicMessageCachesForCanonicalChannelLoad(
          hasCanonicalTopicCatalog
            ? serverChannel?.topicObj
            : existingChannel?.topicObj
        );
        // Bootstrap summaries omit topic catalogs for noncurrent channels.
        // Invalidate their message-page caches, but wait for the later detailed
        // channel load before deciding whether a topic/navigation entry still
        // exists. The current channel's detailed writer snapshot can reconcile
        // that state immediately.
        const canonicalTopicNavigation = hasCanonicalTopicCatalog
          ? reconcileCanonicalTopicNavigation({
              existingChannel,
              canonicalTopicObj: mergedTopicObj
            })
          : {
              selectedTab: existingChannel?.selectedTab,
              selectedTopicId: existingChannel?.selectedTopicId,
              topicHistory: existingChannel?.topicHistory || [],
              currentTopicIndex: existingChannel?.currentTopicIndex ?? -1
            };
        let mergedSubchannelObj = serverChannel?.subchannelObj;
        if (serverChannel?.subchannelObj) {
          mergedSubchannelObj = {};
          for (const subchannelId in serverChannel.subchannelObj) {
            const existingSubchannel =
              existingChannel?.subchannelObj?.[subchannelId];
            const serverSubchannel = serverChannel.subchannelObj[subchannelId];
            mergedSubchannelObj[subchannelId] = {
              ...serverSubchannel,
              ...getLatestCanonicalUnreadScopeState({
                existingSource: existingSubchannel,
                serverSource: serverSubchannel
              }),
              messagesObj: mergeMessagesPreservingNewerReactionState({
                existingMessagesObj: existingSubchannel?.messagesObj,
                serverMessagesObj: serverSubchannel?.messagesObj
              })
            };
          }
        }
        if (activeSubchannelIds.length > 0) {
          mergedSubchannelObj = { ...(mergedSubchannelObj || {}) };
          for (const subchannelId of activeSubchannelIds) {
            const existingSubchannel =
              existingChannel?.subchannelObj?.[subchannelId] || {};
            const serverSubchannel = mergedSubchannelObj[subchannelId] || {};
            const mergedMessagesObj = mergeMessagesPreservingNewerReactionState(
              {
                existingMessagesObj: existingSubchannel?.messagesObj,
                serverMessagesObj: serverSubchannel?.messagesObj
              }
            );
            mergedSubchannelObj[subchannelId] = {
              ...existingSubchannel,
              ...serverSubchannel,
              messageIds: mergeNewestFirstMessageIds({
                currentMessageIds: getPostBootstrapMessageIds({
                  source: existingSubchannel,
                  confirmedScopeActivity: confirmedActivity[subchannelId]
                }),
                serverMessageIds: serverSubchannel?.messageIds || [],
                messagesObj: mergedMessagesObj
              }),
              messagesObj: mergedMessagesObj,
              ...getLatestCanonicalUnreadScopeState({
                existingSource: existingSubchannel,
                serverSource: serverSubchannel
              }),
              ...(activeUnreadSubchannelIds.has(subchannelId)
                ? getRebasedConfirmedUnreadActivityState({
                    serverSource: serverSubchannel,
                    existingSource: existingSubchannel
                  })
                : {})
            };
          }
        }
        if (shouldPreserveRealtimeActivity) {
          recordChatBootstrapEvent(
            'chat-init-preserved-confirmed-realtime-activity',
            {
              bootstrapId: action.bootstrapId || null,
              channelId: Number(channelId),
              rootActivityArrivedDuringBootstrap,
              activeSubchannelIds,
              rootUnreadArrivedDuringBootstrap,
              activeUnreadSubchannelIds: Array.from(activeUnreadSubchannelIds)
            }
          );
        }
        const mergedMessagesObj = mergeMessagesPreservingNewerReactionState({
          existingMessagesObj: existingChannel?.messagesObj,
          serverMessagesObj: serverChannel?.messagesObj
        });
        const reconciledRootMessageIds = rootActivityArrivedDuringBootstrap
          ? mergeNewestFirstMessageIds({
              currentMessageIds: getPostBootstrapMessageIds({
                source: existingChannel,
                confirmedScopeActivity:
                  confirmedActivity[ROOT_REALTIME_ACTIVITY_SCOPE]
              }),
              serverMessageIds: serverChannel?.messageIds || [],
              messagesObj: mergedMessagesObj
            })
          : serverChannel?.messageIds;
        newChannelsObj[channelId] = {
          ...serverChannel,
          lastUpdated: mergedLastUpdated,
          settings: mergedSettings,
          ...getLatestCanonicalUnreadScopeState({
            existingSource: existingChannel,
            serverSource: serverChannel
          }),
          // Preserve client-side UI state
          ...canonicalTopicNavigation,
          topicObj: mergedTopicObj,
          // messagesObj intentionally remains a cache, but only canonical IDs
          // and socket messages explicitly received after bootstrap began may
          // remain renderable. Merging the full pre-bootstrap ID list here can
          // resurrect messages deleted on the server while this tab was away.
          messageIds: reconciledRootMessageIds,
          messagesObj: mergedMessagesObj,
          ...(rootUnreadArrivedDuringBootstrap
            ? getRebasedConfirmedUnreadActivityState({
                serverSource: serverChannel,
                existingSource: existingChannel
              })
            : {}),
          ...(mergedSubchannelObj ? { subchannelObj: mergedSubchannelObj } : {})
        };
      }
      const newSubchannelObj: {
        messageIds: number[];
        messagesObj: Record<number, object>;
        subchannelObj: Record<number, { id: number }>;
        [key: number]: any;
      } = { messageIds: [], messagesObj: {}, subchannelObj: {} };
      const newCurrentChannel =
        action.data.channelsObj?.[action.data.currentChannelId];
      if (action.data.currentSubchannelId && action.data.channelsObj) {
        for (const subchannel of Object.values<{ id: number }>(
          newCurrentChannel?.subchannelObj
        )) {
          const reconciledSubchannel =
            newChannelsObj[action.data.currentChannelId]?.subchannelObj?.[
              subchannel.id
            ] || subchannel;
          newSubchannelObj[subchannel.id] = {
            ...(state.channelsObj[action.data.currentChannelId]
              ?.subchannelObj?.[subchannel.id] || {}),
            ...reconciledSubchannel
          };
        }
      }
      const existingCurrentChannel =
        state.channelsObj[action.data.currentChannelId];
      const reconciledCurrentChannel =
        newChannelsObj[action.data.currentChannelId] || newCurrentChannel || {};
      const currentRootActivityArrivedDuringBootstrap =
        wasRealtimeActivityConfirmed(
          state.confirmedRealtimeActivityByChannel?.[
            action.data.currentChannelId
          ]?.[ROOT_REALTIME_ACTIVITY_SCOPE]
        );
      // The summary merge above is the single recency reconciliation point for
      // every activity scope. Recomputing these fields from root activity here
      // used to overwrite a newer subchannel timestamp with bootstrap data.
      const mergedCurrentSettings = loadChannelSettings(
        reconciledCurrentChannel.settings
      );
      const mergedCurrentLastUpdated = Number(
        reconciledCurrentChannel.lastUpdated || 0
      );
      const reconciledCurrentMessageIds =
        currentRootActivityArrivedDuringBootstrap
          ? mergeNewestFirstMessageIds({
              // reconciledCurrentChannel already contains only canonical
              // summary IDs plus explicitly stamped post-bootstrap arrivals.
              currentMessageIds: reconciledCurrentChannel.messageIds || [],
              serverMessageIds: newMessageIds || [],
              messagesObj: newMessagesObj
            })
          : newMessageIds;
      const mergedCurrentTopicObj =
        resetTopicMessageCachesForCanonicalChannelLoad(
          newCurrentChannel?.topicObj
        );
      const canonicalCurrentTopicNavigation = reconcileCanonicalTopicNavigation(
        {
          existingChannel: existingCurrentChannel,
          canonicalTopicObj: mergedCurrentTopicObj
        }
      );
      newChannelsObj[action.data.currentChannelId] = {
        ...reconciledCurrentChannel,
        allMemberIds:
          newCurrentChannel?.allMemberIds ||
          action.data.channelsObj[action.data.currentChannelId]?.allMemberIds ||
          [],
        lastUpdated: mergedCurrentLastUpdated,
        settings: mergedCurrentSettings,
        messagesLoadMoreButton,
        messageIds: reconciledCurrentMessageIds,
        messagesObj: newMessagesObj,
        recentChessMessage: null,
        recentOmokMessage: null,
        loaded: true,
        // Preserve client-side UI state
        ...canonicalCurrentTopicNavigation,
        topicObj: mergedCurrentTopicObj,
        ...(action.data.currentSubchannelId
          ? {
              subchannelObj: {
                ...(state.channelsObj[action.data.currentChannelId]
                  ?.subchannelObj || {}),
                ...newSubchannelObj
              }
            }
          : {})
      };
      // Visibility revisions are retained independently of channel hydration.
      // Reapply them after both summary and current-channel reconciliation so
      // a bootstrap snapshot cannot overwrite an event received mid-load.
      for (const [channelId, visibility] of Object.entries(
        channelVisibilityById
      )) {
        if (!newChannelsObj[channelId]?.id) continue;
        newChannelsObj[channelId] = applyCanonicalChannelVisibility({
          channel: newChannelsObj[channelId],
          visibility
        });
      }
      if (alreadyUsingChat) {
        newChannelsObj[state.selectedChannelId] = {
          ...state.channelsObj[state.selectedChannelId],
          isReloadRequired: true,
          loaded: true
        };
      }
      for (const channelId in newChannelsObj) {
        if (
          state.channelsObj[channelId]?.loaded &&
          Number(channelId) !== Number(state.selectedChannelId)
        ) {
          newChannelsObj[channelId].loaded = false;
        }
      }
      // Compute partnerUsername for DM channels to avoid render-time computation issues
      for (const channelId in newChannelsObj) {
        const channel = newChannelsObj[channelId];
        if (channel?.twoPeople && channel?.members && action.userId) {
          const partner = channel.members.find(
            (m: { id: number }) => m.id !== action.userId
          );
          if (partner?.username) {
            newChannelsObj[channelId] = {
              ...channel,
              partnerUsername: partner.username
            };
          }
        }
      }
      const aiCardsLoaded =
        action.data.cardFeeds?.length > 1 ||
        (action.data.cardFeeds[0]?.id &&
          !state.aiCardFeedIds.includes(action.data.cardFeeds[0]?.id));
      const vocabActivitiesLoaded =
        action.data.vocabFeeds?.length > 1 ||
        (action.data.vocabFeeds?.[0] &&
          !(state.vocabFeeds || []).includes(action.data.vocabFeeds[0]));
      const newVocabLeaderboardAllSelected: Record<string, boolean> = {};
      for (const tab of Object.keys(state.vocabLeaderboardAllSelected)) {
        if (tab === 'month') {
          newVocabLeaderboardAllSelected[tab] =
            !!action.data.monthlyVocabRankings?.all?.length;
        }
        if (tab === 'year') {
          newVocabLeaderboardAllSelected[tab] =
            !!action.data.yearlyVocabRankings?.all?.length;
        }
      }

      const nextState = {
        ...state,
        ...initialChatState,
        wordleModalShown: state.wordleModalShown || false,
        currentMonth: action.data.currentMonth,
        currentYear: action.data.currentYear,
        chatStatus: state.chatStatus,
        // Like chatStatus, this is confirmed socket state that may arrive
        // while a same-user bootstrap is in flight. START_CHAT_BOOTSTRAP
        // already clears it before switching account projections.
        recentOfflineUsers: state.recentOfflineUsers,
        aiCardFeedIds: aiCardsLoaded
          ? action.data.cardFeeds.map((feed: { id: number }) => feed.id)
          : state.aiCardFeedIds,
        aiCardFeedObj: aiCardsLoaded
          ? objectify(action.data.cardFeeds)
          : state.aiCardFeedObj,
        aiCardLoadMoreButton: aiCardsLoaded
          ? action.data.aiCardLoadMoreButton
          : state.aiCardLoadMoreButton,
        allFavoriteChannelIds: shouldPreserveFavoriteState
          ? state.allFavoriteChannelIds
          : action.data.allFavoriteChannelIds,
        activeChatBootstrap: null,
        appliedReactionActivityRevisionsByChannel:
          state.appliedReactionActivityRevisionsByChannel || {},
        cardObj: action.data.cardObj
          ? {
              ...state.cardObj,
              ...action.data.cardObj
            }
          : state.cardObj,
        channelVisibilityById,
        channelsObj: newChannelsObj,
        // Every confirmed event recorded for this attempt is now reconciled
        // into channelsObj/order. Events outside a bootstrap need no markers;
        // the next attempt records only its own writer-read race window.
        confirmedRealtimeActivityByChannel: {},
        confirmedRealtimeUnreadActivityByChannel: {},
        confirmedMessageDeletionsDuringBootstrap: {},
        favoriteStateRevision: shouldPreserveFavoriteState
          ? state.favoriteStateRevision
          : bootstrapFavoriteStateRevision,
        // The bootstrap payload is the initing user's canonical state, and
        // preserved state already passed the same-owner gate above.
        favoriteStateOwnerId: action.userId,
        quickAccessOwnerId: action.userId,
        chatType:
          isSameLoadedUser && (!state.chatType || !action.data.chatType)
            ? state.chatType
            : action.data.chatType,
        classChannelIds: action.data.classChannelIds,
        classLoadMoreButton,
        collectPreviews: action.data.collectPreviews || {},
        customChannelNames: action.data.customChannelNames,
        favoriteChannelIds: shouldPreserveFavoriteState
          ? state.favoriteChannelIds
          : preservedRealtimeActivity
            ? mergeConfirmedChannelOrder(
                state.favoriteChannelIds,
                action.data.favoriteChannelIds,
                confirmedRealtimeChannelIds,
                action.data.allFavoriteChannelIds
              )
            : action.data.favoriteChannelIds,
        favoriteLoadMoreButton: shouldPreserveFavoriteState
          ? state.favoriteLoadMoreButton
          : favoriteLoadMoreButton,
        homeChannelIds: preservedRealtimeActivity
          ? mergeConfirmedChannelOrder(
              state.homeChannelIds,
              action.data.homeChannelIds,
              confirmedRealtimeChannelIds
            )
          : action.data.homeChannelIds,
        homeLoadMoreButton: alreadyUsingChat
          ? state.homeLoadMoreButton
          : homeLoadMoreButton,
        quickAccess: shouldPreserveQuickAccess
          ? state.quickAccess
          : action.data.quickAccess || initialChatState.quickAccess,
        incomingOffers:
          action.userId === state.prevUserId
            ? state.incomingOffers
            : action.data.incomingOffers || [],
        incomingOffersLoadMoreButton:
          action.userId === state.prevUserId
            ? state.incomingOffersLoadMoreButton
            : action.data.incomingOffersLoadMoreButton || false,
        lastSubchannelPaths:
          action.data.currentSubchannelId &&
          action.data.currentChannelId === state.selectedChannelId
            ? {
                ...state.lastSubchannelPaths,
                [action.data.currentChannelId]:
                  newSubchannelObj[action.data.currentSubchannelId].path
              }
            : action.userId === state.prevUserId
              ? state.lastSubchannelPaths
              : action.data.lastSubchannelPaths || {},
        loaded: true,
        loadedForUserId: action.userId,
        listedCardIds:
          action.userId === state.prevUserId
            ? state.listedCardIds
            : action.data.listedCardIds || [],
        listedCardsLoadMoreButton:
          action.userId === state.prevUserId
            ? state.listedCardsLoadMoreButton
            : action.data.listedCardsLoadMoreButton || false,
        myCardIds:
          action.userId === state.prevUserId
            ? state.myCardIds
            : action.data.myCardIds || [],
        myCardsLoadMoreButton:
          action.userId === state.prevUserId
            ? state.myCardsLoadMoreButton
            : action.data.myCardsLoadMoreButton || false,
        myListedCardIds:
          action.userId === state.prevUserId
            ? state.myListedCardIds
            : action.data.myListedCardIds || [],
        myListedCardsLoadMoreButton:
          action.userId === state.prevUserId
            ? state.myListedCardsLoadMoreButton
            : action.data.myListedCardsLoadMoreButton || false,
        mostRecentOfferTimeStamp: action.data.mostRecentOfferTimeStamp,
        numCardSummonedToday: action.data.numCardSummonedToday,
        numUnreads:
          alreadyUsingChat && !preservedRealtimeActivity ? 0 : state.numUnreads,
        outgoingOffers:
          action.userId === state.prevUserId
            ? state.outgoingOffers
            : action.data.outgoingOffers || [],
        outgoingOffersLoadMoreButton:
          action.userId === state.prevUserId
            ? state.outgoingOffersLoadMoreButton
            : action.data.outgoingOffersLoadMoreButton || false,
        reconnecting: false,
        recipientId:
          action.userId === state.prevUserId
            ? state.recipientId
            : action.data.recipientId || null,
        selectedChannelId:
          (state.selectedChannelId || state.selectedChannelId === 0) &&
          action.userId === state.prevUserId
            ? state.selectedChannelId
            : action.data.currentChannelId,
        vocabFeedIds: vocabActivitiesLoaded
          ? action.data.vocabFeeds
              .map((feed: { id: number }) => feed.id)
              .reverse()
          : state.vocabFeedIds,
        vocabFeedObj: vocabActivitiesLoaded
          ? objectify(action.data.vocabFeeds)
          : state.vocabFeedObj,
        vocabFeedsLoadMoreButton: vocabActivitiesLoaded
          ? vocabFeedsLoadMoreButton
          : state.vocabFeedsLoadMoreButton,
        vocabLeaderboardAllSelected: newVocabLeaderboardAllSelected,
        collectorRankings: vocabActivitiesLoaded
          ? action.data.collectorRankings
          : state.collectorRankings,
        monthlyVocabRankings: vocabActivitiesLoaded
          ? action.data.monthlyVocabRankings
          : state.monthlyVocabRankings,
        yearlyVocabRankings: vocabActivitiesLoaded
          ? action.data.yearlyVocabRankings
          : state.yearlyVocabRankings,
        vocabRankingsLoaded: vocabActivitiesLoaded
          ? true
          : state.vocabRankingsLoaded,
        wordsObj: {
          ...state.wordsObj,
          ...action.data.wordsObj
        },
        aiCallChannelId: state.aiCallChannelId,
        zeroChannelId: state.zeroChannelId,
        prevUserId: action.userId,
        thinkHard: state.thinkHard
      };
      let reconciledNextState = nextState;
      for (const bufferedUpdate of bufferedReactionUpdates as any[]) {
        const appliedReactionActivityRevisionsByChannel = {
          ...reconciledNextState.appliedReactionActivityRevisionsByChannel
        };
        delete appliedReactionActivityRevisionsByChannel[
          Number(bufferedUpdate.update?.channelId || 0)
        ];
        reconciledNextState = ChatReducer(
          {
            ...reconciledNextState,
            appliedReactionActivityRevisionsByChannel
          },
          {
            type: 'APPLY_CANONICAL_CHAT_REACTION',
            ...bufferedUpdate
          }
        );
      }
      for (const bufferedUnreadState of bufferedUnreadStates as any[]) {
        const unreadState =
          bufferedUnreadState.unreadState || bufferedUnreadState;
        const unreadEventSequence = Number(
          bufferedUnreadState.eventSequence || 0
        );
        const channelId = Number(unreadState.channelId || 0);
        const latestChannelEventSequence = Math.max(
          getLatestConfirmedEventSequence(
            state.confirmedRealtimeActivityByChannel?.[channelId]
          ),
          ...bufferedReactionUpdates
            .filter(
              (bufferedUpdate: any) =>
                Number(bufferedUpdate.update?.channelId || 0) === channelId
            )
            .map((bufferedUpdate: any) =>
              Number(bufferedUpdate.eventSequence || 0)
            ),
          ...bufferedMessageDeletions
            .filter(
              (deletion: any) => Number(deletion.channelId || 0) === channelId
            )
            .map((deletion: any) => Number(deletion.eventSequence || 0))
        );
        if (latestChannelEventSequence > unreadEventSequence) continue;
        reconciledNextState = ChatReducer(reconciledNextState, {
          type: 'APPLY_CANONICAL_CHANNEL_UNREAD_STATE',
          unreadState,
          // Buffered entries passed the owner gate while this bootstrap was
          // bound, so they belong to the bootstrapping user.
          userId: action.userId,
          eventSequence: unreadEventSequence
        });
      }
      for (const deletion of bufferedMessageDeletions as any[]) {
        reconciledNextState = ChatReducer(reconciledNextState, {
          type: 'DELETE_MESSAGE',
          ...deletion
        });
      }

      recordChatBootstrapEvent('chat-init-reducer-success', {
        bootstrapId: action.bootstrapId || null,
        userId: action.userId,
        loaded: reconciledNextState.loaded,
        loadedForUserId: reconciledNextState.loadedForUserId,
        selectedChannelId: reconciledNextState.selectedChannelId,
        prevUserId: reconciledNextState.prevUserId,
        channelCount: Object.keys(reconciledNextState.channelsObj || {}).length
      });
      return reconciledNextState;
    }

    case 'INVITE_USERS_TO_CHANNEL': {
      const currentChannel = state.channelsObj[state.selectedChannelId];
      if (!currentChannel) return state;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [state.selectedChannelId]: applyCanonicalGroupInvitation({
            channel: currentChannel,
            message: action.data.message,
            newMembers: action.data.selectedUsers
          })
        }
      };
    }
    case 'LEAVE_CHANNEL': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      const nextState = {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            allMemberIds: (
              state.channelsObj[action.channelId]?.allMemberIds || []
            ).filter((memberId: number) => memberId !== action.userId),
            loaded: false,
            members: (
              state.channelsObj[action.channelId]?.members || []
            )?.filter((member: { id: number }) => member.id !== action.userId)
          }
        },
        homeChannelIds: state.homeChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
        ),
        classChannelIds: state.classChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
        )
      };
      return action.favoriteState
        ? ChatReducer(nextState, {
            type: 'APPLY_CANONICAL_FAVORITE_STATE',
            ...action.favoriteState,
            userId: action.userId
          })
        : nextState;
    }
    case 'REMOVE_MEMBER_FROM_CHANNEL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            allMemberIds: (
              state.channelsObj[action.channelId]?.allMemberIds || []
            ).filter((memberId: number) => memberId !== action.memberId),
            members: (
              state.channelsObj[action.channelId]?.members || []
            )?.filter((member: { id: number }) => member.id !== action.memberId)
          }
        }
      };
    case 'LIST_AI_CARD': {
      const existingCard = state.cardObj[action.card.id];
      const isListed = Number(action.newState.isListed) === 1;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: existingCard
            ? { ...existingCard, ...action.newState }
            : { ...action.card, ...action.newState }
        },
        myListedCardIds: isListed
          ? [action.card.id].concat(
              state.myListedCardIds.filter(
                (cardId: number) => cardId !== action.card.id
              )
            )
          : state.myListedCardIds.filter(
              (cardId: number) => cardId !== action.card.id
            )
      };
    }
    case 'DELIST_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.cardId]: {
            ...state.cardObj[action.cardId],
            isListed: false,
            askPrice: 0
          }
        },
        myListedCardIds: state.myListedCardIds.filter(
          (cardId: number) => cardId !== action.cardId
        )
      };
    }
    case 'LOAD_MORE_BOOKMARKS': {
      const isTopicScope = !!action.topicId;
      const channelState = state.channelsObj[action.channelId] || {};
      const topicState = isTopicScope
        ? channelState.topicObj?.[action.topicId]
        : null;
      const view = (action.view || BOOKMARK_VIEWS.AI) as BookmarkView;

      const currentBookmarks = getBookmarkLists(
        isTopicScope
          ? topicState?.bookmarkedMessages
          : channelState.bookmarkedMessages
      );
      const currentLoadMoreState = getBookmarkLoadMore(
        isTopicScope
          ? topicState?.loadMoreBookmarksShown
          : channelState.loadMoreBookmarksShown
      );

      const updatedBookmarks = {
        ...currentBookmarks,
        [view]: currentBookmarks[view].concat(action.bookmarks)
      };

      const updatedLoadMoreState = {
        ...currentLoadMoreState,
        [view]: action.loadMoreShown
      };

      if (isTopicScope) {
        return {
          ...state,
          channelsObj: {
            ...state.channelsObj,
            [action.channelId]: {
              ...channelState,
              topicObj: {
                ...channelState.topicObj,
                [action.topicId]: {
                  ...topicState,
                  bookmarkedMessages: updatedBookmarks,
                  loadMoreBookmarksShown: updatedLoadMoreState
                }
              }
            }
          }
        };
      }

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...channelState,
            bookmarkedMessages: updatedBookmarks,
            loadMoreBookmarksShown: updatedLoadMoreState
          }
        }
      };

      function getBookmarkLoadMore(loadMore?: BookmarkLoadMoreMap) {
        return {
          ai: typeof loadMore?.ai === 'boolean' ? loadMore.ai : false,
          me: typeof loadMore?.me === 'boolean' ? loadMore.me : false
        };
      }
    }
    case 'LOAD_TOPIC_BOOKMARKS': {
      const channelState = state.channelsObj[action.channelId] || {};
      const topicState = channelState.topicObj?.[action.topicId] || {};

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...channelState,
            topicObj: {
              ...channelState.topicObj,
              [action.topicId]: {
                ...topicState,
                bookmarkedMessages: action.bookmarkedMessages,
                loadMoreBookmarksShown: action.loadMoreBookmarksShown,
                bookmarksLoaded: true
              }
            }
          }
        }
      };
    }
    case 'LOAD_MORE_CHANNEL_MEMBERS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            loadMoreMembersShown: action.loadMoreShown,
            members: [
              ...state.channelsObj[action.channelId].members,
              ...action.members.filter(
                (newMember: any) =>
                  !state.channelsObj[action.channelId].members.some(
                    (existingMember: any) => existingMember.id === newMember.id
                  )
              )
            ]
          }
        }
      };
    }
    case 'LOAD_MORE_CHANNELS': {
      let loadMoreButton = false;
      if (
        ['home', 'class', 'favorite'].includes(action.channelType) &&
        action.channels.length > 20
      ) {
        action.channels.pop();
        loadMoreButton = true;
      }

      const newChannels = { ...state.channelsObj };
      for (const channel of action.channels) {
        const existingChannel = state.channelsObj[channel.id] || {};
        if (existingChannel?.loaded) {
          newChannels[channel.id] = existingChannel;
          continue;
        }
        const mergedSettings = mergeChannelSettings({
          existingSettings: existingChannel?.settings,
          serverSettings: channel?.settings
        });
        const mergedLastUpdated = Math.max(
          Number(existingChannel?.lastUpdated || 0),
          Number(channel?.lastUpdated || 0),
          Number(mergedSettings?.lastReaction?.timeStamp || 0)
        );
        newChannels[channel.id] = {
          ...existingChannel,
          ...channel,
          lastUpdated: mergedLastUpdated,
          settings: mergedSettings
        };
      }

      const existingChannelIds = new Set(
        state[chatTabHash[action.channelType]]
      );
      const newChannelIds = action.channels
        .map((channel: any) => channel.id)
        .filter((id: number) => !existingChannelIds.has(id));

      return {
        ...state,
        [`${action.channelType}LoadMoreButton`]: loadMoreButton,
        [chatTabHash[action.channelType]]: [
          ...state[chatTabHash[action.channelType]],
          ...newChannelIds
        ],
        channelsObj: {
          ...state.channelsObj,
          ...newChannels
        }
      };
    }

    case 'LOAD_MORE_MESSAGES': {
      if (state.selectedChannelId !== action.loadedChannelId) return state;
      let loadMoreButton = false;
      if (action.messageIds.length === 21) {
        action.messageIds.pop();
        loadMoreButton = true;
      }
      const prevChannelObj = state.channelsObj[action.loadedChannelId];
      // messageIds stay newest-first. Loading more appends older ids to the tail
      // so newer terminal rows mount before the older board rows they close out.
      const messageIds = action.loadedSubchannelId
        ? prevChannelObj.messageIds
        : prevChannelObj.messageIds.concat(action.messageIds);
      const messagesObj = action.loadedSubchannelId
        ? prevChannelObj.messagesObj
        : {
            ...prevChannelObj.messagesObj,
            ...action.messagesObj
          };
      const messagesLoadMoreButton = action.loadedSubchannelId
        ? prevChannelObj.messagesLoadMoreButton
        : loadMoreButton;
      const subchannelObj = action.loadedSubchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.loadedSubchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.loadedSubchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.loadedSubchannelId
              ]?.messageIds.concat(action.messageIds),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.loadedSubchannelId]
                  ?.messagesObj,
                ...action.messagesObj
              },
              loadMoreButtonShown: loadMoreButton
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.loadedChannelId]: {
            ...prevChannelObj,
            messageIds,
            messagesObj,
            messagesLoadMoreButton,
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'LOAD_LISTED_AI_CARDS': {
      if (!action.cards) return state;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        listedCardIds: action.cards.map((card: { id: number }) => card.id),
        listedCardsLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_LISTED_AI_CARDS': {
      if (!action.cards) return state;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        listedCardIds: state.listedCardIds.concat(
          action.cards.map((card: { id: number }) => card.id)
        ),
        listedCardsLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MY_AI_CARDS':
      if (!action.cards) return state;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myCardIds: action.cards.map((card: { id: number }) => card.id),
        myCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MORE_MY_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myCardIds: state.myCardIds.concat(
          action.cards.map((card: { id: number }) => card.id)
        ),
        myCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MY_LISTED_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myListedCardIds: action.cards.map((card: { id: number }) => card.id),
        myListedCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MORE_MY_LISTED_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myListedCardIds: state.myListedCardIds.concat(
          action.cards.map((card: { id: number }) => card.id)
        ),
        myListedCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_INCOMING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
        },
        incomingOffers: action.offers,
        incomingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_OUTGOING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
        },
        outgoingOffers: action.offers,
        outgoingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_INCOMING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
        },
        incomingOffers: state.incomingOffers.concat(action.offers),
        incomingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_OUTGOING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
        },
        outgoingOffers: state.outgoingOffers.concat(action.offers),
        outgoingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.data.channelId];
      const subchannelObj = action.data.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.data.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.data.subchannelId],
              legacyTopicObj: {
                ...action.data,
                loaded: true
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.data.channelId]: action.data.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                legacyTopicObj: {
                  ...action.data,
                  loaded: true
                },
                topicObj: {
                  ...prevChannelObj?.topicObj,
                  [action.data.id]: {
                    ...prevChannelObj?.topicObj?.[action.data.id],
                    ...action.data
                  }
                }
              }
        }
      };
    }
    case 'LOAD_AI_CARD_CHAT': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  recentOmokMessage: null
                }
              }
            : {})
        },
        mostRecentOfferTimeStamp: action.mostRecentOfferTimeStamp,
        numCardSummonedToday: action.numCardSummonedToday,
        selectedChannelId: null,
        selectedSubchannelId: null,
        chatType: AI_CARD_CHAT_TYPE,
        cardObj: {
          ...state.cardObj,
          ...action.cardObj
        },
        aiCardFeedIds: action.cardFeeds.map((feed: { id: number }) => feed.id),
        aiCardFeedObj: objectify(action.cardFeeds),
        aiCardLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_AI_CARDS': {
      // a stale-cursor refetch can return feeds that are already loaded;
      // appending them again would duplicate React keys and corrupt the list
      const loadedFeedIds = new Set(state.aiCardFeedIds);
      const newCardFeeds = action.cardFeeds.filter(
        (feed: { id: number }) => !loadedFeedIds.has(feed.id)
      );
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...action.cardObj
        },
        aiCardFeedIds: state.aiCardFeedIds.concat(
          newCardFeeds.map((feed: { id: number }) => feed.id)
        ),
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          ...objectify(newCardFeeds)
        },
        aiCardLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_TOPIC_MESSAGES': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...(state.channelsObj[action.channelId]?.messagesObj || {}),
              ...(objectify(action.messages) as Record<number, object>)
            },
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                ...action.topicObj,
                messageIds: action.messages.map(
                  (message: { id: number }) => message.id
                ),
                loadMoreButtonShown: action.loadMoreShown,
                loadMoreShownAtBottom: action.loadMoreShownAtBottom,
                loaded: true
              }
            }
          }
        }
      };
    }
    case 'LOAD_MORE_TOPIC_MESSAGES': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...(state.channelsObj[action.channelId]?.messagesObj || {}),
              ...(objectify(action.messages) as Record<number, object>)
            },
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                ...action.topicObj,
                messageIds: (
                  state.channelsObj[action.channelId]?.topicObj?.[
                    action.topicId
                  ]?.messageIds || []
                ).concat(
                  action.messages.map((message: { id: number }) => message.id)
                ),
                loadMoreButtonShown: action.loadMoreShown
              }
            }
          }
        }
      };
    }
    case 'LOAD_MORE_RECENT_TOPIC_MESSAGES': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId]?.messagesObj,
              ...objectify(action.messages)
            },
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                messageIds: action.messages
                  .map((message: { id: number }) => message.id)
                  .concat(
                    state.channelsObj[action.channelId]?.topicObj?.[
                      action.topicId
                    ]?.messageIds || []
                  ),
                loadMoreShownAtBottom: action.loadMoreShownAtBottom
              }
            }
          }
        }
      };
    }
    case 'POST_AI_CARD_FEED': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card?.id]: action.card
        },
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feed?.id]: {
            ...action.feed,
            isLoaded: true
          }
        },
        aiCardFeedIds: [action.feed.id].concat(
          (state.aiCardFeedIds || []).filter(
            (feedId: number) => feedId !== action.feed.id
          )
        ),
        myCardIds: action.isSummon
          ? [action.card?.id].concat(
              state.myCardIds.filter(
                (cardId: number) => cardId !== action.card?.id
              )
            )
          : state.myCardIds
      };
    }
    case 'UPDATE_AI_CARD': {
      const existingCard = state.cardObj[action.cardId];
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...(action.isInit && existingCard
            ? {}
            : {
                [action.cardId]: {
                  ...(existingCard || action.initialState || {}),
                  ...action.newState
                }
              })
        }
      };
    }
    case 'UPDATE_AI_THINKING_STATUS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId]?.messagesObj,
              [action.messageId]: {
                ...state.channelsObj[action.channelId]?.messagesObj?.[
                  action.messageId
                ],
                aiThinkingStatus: action.status
              }
            }
          }
        }
      };
    }
    case 'UPDATE_AI_THOUGHT_STREAM': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId]?.messagesObj,
              [action.messageId]: {
                ...state.channelsObj[action.channelId]?.messagesObj?.[
                  action.messageId
                ],
                aiThoughtContent: action.isDelta
                  ? `${
                      state.channelsObj[action.channelId]?.messagesObj?.[
                        action.messageId
                      ]?.aiThoughtContent || ''
                    }${action.thoughtContent}`
                  : action.thoughtContent,
                aiThoughtStreamComplete: action.isComplete,
                aiThoughtIsThinkingHard: action.isThinkingHard
              }
            }
          }
        }
      };
    }
    case 'UPDATE_AI_GENERATED_FILE': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId]?.messagesObj,
              [action.messageId]: {
                ...state.channelsObj[action.channelId]?.messagesObj?.[
                  action.messageId
                ],
                fileName: action.fileName,
                filePath: action.filePath,
                fileSize: action.fileSize
              }
            }
          }
        }
      };
    }
    case 'UPDATE_LAST_USED_FILES': {
      const channel = state.channelsObj[action.channelId] || ({} as any);
      const fileList = action.topicId
        ? channel?.files?.[action.topicId] || { ids: [] }
        : channel?.files?.main || { ids: [] };

      const fileIds = action.files.map((file: any) => file.id);
      const filteredIds = fileList.ids.filter(
        (id: number) => !fileIds.includes(id)
      );
      const newIds = [...filteredIds, ...fileIds];

      const newFileDataObj = channel ? { ...channel?.fileDataObj } : {};
      action.files.forEach((file: any) => {
        newFileDataObj[file.id] = file;
      });

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...channel,
            files: {
              ...(channel.files || {}),
              [action.topicId ? action.topicId : 'main']: {
                ...fileList,
                ids: newIds
              }
            },
            fileDataObj: newFileDataObj
          }
        }
      };
    }
    case 'LOAD_VOCABULARY': {
      let vocabFeedsLoadMoreButton = false;
      if (action.vocabFeeds?.length > 20) {
        action.vocabFeeds.pop();
        vocabFeedsLoadMoreButton = true;
      }

      return {
        ...state,
        currentMonth: action.currentMonth,
        currentYear: action.currentYear,
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  recentOmokMessage: null
                }
              }
            : {})
        },
        selectedChannelId: null,
        selectedSubchannelId: null,
        chatType: VOCAB_CHAT_TYPE,
        vocabFeedIds: action.vocabFeeds.map((feed: { id: number }) => feed.id),
        vocabFeedObj: objectify(action.vocabFeeds),
        vocabFeedsLoadMoreButton,
        wordsObj: action.wordsObj,
        collectorRankings: action.collectorRankings,
        monthlyVocabRankings: action.monthlyVocabRankings,
        yearlyVocabRankings: action.yearlyVocabRankings,
        vocabRankingsLoaded: true
      };
    }
    case 'LOAD_VOCAB_RANKINGS': {
      return {
        ...state,
        collectorRankings: action.collectorRankings,
        monthlyVocabRankings: action.monthlyVocabRankings,
        yearlyVocabRankings: action.yearlyVocabRankings,
        vocabRankingsLoaded: true
      };
    }
    case 'LOAD_MORE_VOCABULARY': {
      let vocabFeedsLoadMoreButton = false;
      if (action.vocabFeeds.length > 20) {
        action.vocabFeeds.pop();
        vocabFeedsLoadMoreButton = true;
      }

      return {
        ...state,
        vocabFeedIds: state.vocabFeedIds.concat(
          action.vocabFeeds.map((feed: { id: number }) => feed.id)
        ),
        vocabFeedObj: {
          ...state.vocabFeedObj,
          ...objectify(action.vocabFeeds)
        },
        wordsObj: {
          ...state.wordsObj,
          ...action.wordsObj
        },
        vocabFeedsLoadMoreButton
      };
    }
    case 'LOAD_MORE_AI_CHAT_FILES': {
      const isForMain = !action.topicId;
      const scopeKey = isForMain ? 'main' : action.topicId;

      const prevChannel = state.channelsObj[action.channelId] || {};
      const prevFiles = prevChannel.files || {};
      const prevScope = prevFiles[scopeKey] || {};
      const prevIds = Array.isArray(prevScope.ids) ? prevScope.ids : [];

      const incomingIds = (action.files?.[scopeKey]?.ids || []) as number[];
      const mergedIds = Array.from(new Set([...incomingIds, ...prevIds]));
      const hasMore = !!action.files?.[scopeKey]?.hasMore;

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannel,
            files: {
              ...prevFiles,
              [scopeKey]: {
                ...prevScope,
                ids: mergedIds,
                hasMore
              }
            },
            fileDataObj: {
              ...prevChannel.fileDataObj,
              ...(action.fileDataObj || {})
            }
          }
        }
      };
    }
    case 'LOAD_WORD_COLLECTORS':
      return {
        ...state,
        collectorRankings: action.collectorRankings
      };
    case 'NEW_TOPIC': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: [action.subject.id].concat(
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.subject.id]: {
                  id: action.subject.id,
                  channelId: action.channelId,
                  subchannelId: action.subchannelId,
                  ...action.subject
                }
              },
              legacyTopicObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        homeChannelIds: [
          action.channelId,
          ...state.homeChannelIds.filter(
            (channelId: number) => channelId !== action.channelId
          )
        ],
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                topicObj: {
                  ...prevChannelObj?.topicObj,
                  [action.subject.subjectId]: {
                    ...(prevChannelObj?.topicObj?.[action.subject.subjectId] ||
                      action.subject),
                    messageIds: [action.subject.id].concat(
                      prevChannelObj?.topicObj?.[action.subject.subjectId]
                        ?.messageIds
                    )
                  }
                },
                messageIds: [action.subject.id].concat(
                  prevChannelObj?.messageIds
                ),
                messagesObj: {
                  ...prevChannelObj?.messagesObj,
                  [action.subject.id]: {
                    id: action.subject.id,
                    channelId: action.channelId,
                    ...action.subject
                  }
                },
                legacyTopicObj: action.subject
              }
        }
      };
    }
    case 'MAKE_OUTGOING_OFFER': {
      return {
        ...state,
        outgoingOffers: [action.offer].concat(state.outgoingOffers)
      };
    }
    case 'NOTIFY_MEMBER_LEFT': {
      return state.channelsObj[action.channelId]
        ? {
            ...state,
            channelsObj: {
              ...state.channelsObj,
              [action.channelId]: applyCanonicalGroupMemberDeparture({
                channel: state.channelsObj[action.channelId],
                userId: action.userId
              })
            }
          }
        : state;
      // this will mean that if the channel where the user has left is not loaded in the left channel list initially, it will not appear in the list when user scrolls down and triggers "load more" event (because load more event only loads channels with older update time than the bottom item) and because this is new update. but is that really that bad? this channel will surface when user reloads the website anyway and user wasn't really interested in this channel to keep it bumped up in the first place.
    }
    case 'APPLY_CANONICAL_GROUP_MEMBER_JOIN': {
      return state.channelsObj[action.channelId]
        ? {
            ...state,
            channelsObj: {
              ...state.channelsObj,
              [action.channelId]: applyCanonicalGroupMemberJoin({
                channel: state.channelsObj[action.channelId],
                member: action.member
              })
            }
          }
        : state;
    }
    case 'OPEN_NEW_TAB':
      return {
        ...state,
        chatType: null,
        subject: {},
        homeChannelIds: [
          0,
          ...state.homeChannelIds.filter((channelId: number) => channelId !== 0)
        ],
        selectedChannelId: 0,
        channelsObj: {
          ...state.channelsObj,
          messagesLoadMoreButton: false,
          messageIds: [],
          0: {
            id: 0,
            pathId: '',
            channelName: action.recipient.username,
            members: [action.user, action.recipient],
            numUnreads: 0,
            twoPeople: true,
            loaded: true
          }
        },
        recipientUsername: action.recipient.username,
        recipientId: action.recipient.id
      };
    case 'POST_FILE_UPLOAD_STATUS': {
      const targetId =
        action.channelId +
        (action.subchannelId ? `/${action.subchannelId}` : '');
      return {
        ...state,
        filesBeingUploaded: {
          ...state.filesBeingUploaded,
          [targetId]: state.filesBeingUploaded[targetId]?.concat(
            action.file
          ) || [action.file]
        }
      };
    }
    case 'REMOVE_FILE_UPLOAD_STATUS': {
      const targetId =
        action.channelId +
        (action.subchannelId ? `/${action.subchannelId}` : '');

      return {
        ...state,
        filesBeingUploaded: {
          ...state.filesBeingUploaded,
          [targetId]: state.filesBeingUploaded[targetId]?.filter(
            (file: any) => {
              return file.filePath !== action.filePath;
            }
          )
        }
      };
    }
    case 'REMOVE_TEMP_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const nextMessagesObj = { ...prevChannelObj.messagesObj };
      delete nextMessagesObj[action.tempMessageId];

      const nextTopicObj =
        action.topicId || action.topicId === 0
          ? {
              ...prevChannelObj.topicObj,
              [action.topicId]: {
                ...prevChannelObj.topicObj?.[action.topicId],
                messageIds: (
                  prevChannelObj.topicObj?.[action.topicId]?.messageIds || []
                ).filter(
                  (messageId: number | string) =>
                    messageId !== action.tempMessageId
                )
              }
            }
          : prevChannelObj.topicObj;

      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj.subchannelObj?.[action.subchannelId],
              messageIds: (
                prevChannelObj.subchannelObj?.[action.subchannelId]
                  ?.messageIds || []
              ).filter(
                (messageId: number | string) =>
                  messageId !== action.tempMessageId
              ),
              messagesObj: {
                ...prevChannelObj.subchannelObj?.[action.subchannelId]
                  ?.messagesObj
              }
            }
          }
        : prevChannelObj.subchannelObj;

      if (action.subchannelId) {
        delete subchannelObj[action.subchannelId].messagesObj[
          action.tempMessageId
        ];
      }

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            topicObj: nextTopicObj,
            messageIds: (prevChannelObj.messageIds || []).filter(
              (messageId: number | string) => messageId !== action.tempMessageId
            ),
            messagesObj: nextMessagesObj,
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'POST_UPLOAD_COMPLETE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.subchannelId
              ]?.messageIds.map((messageId: number) =>
                messageId === action.tempMessageId
                  ? action.messageId
                  : messageId
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]:
                  prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.tempMessageId]
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            topicObj: action.topicId
              ? {
                  ...prevChannelObj?.topicObj,
                  [action.topicId]: {
                    ...prevChannelObj?.topicObj?.[action.topicId],
                    messageIds: (
                      prevChannelObj?.topicObj?.[action.topicId]?.messageIds ||
                      []
                    ).map((messageId: number) =>
                      messageId === action.tempMessageId
                        ? action.messageId
                        : messageId
                    )
                  }
                }
              : prevChannelObj?.topicObj,
            messageIds: prevChannelObj?.messageIds?.map((messageId: number) =>
              messageId === action.tempMessageId ? action.messageId : messageId
            ),
            messagesObj: {
              ...prevChannelObj?.messagesObj,
              [action.messageId]: {
                ...prevChannelObj?.messagesObj?.[action.tempMessageId],
                ...(action.topicId
                  ? { targetSubject: prevChannelObj?.topicObj[action.topicId] }
                  : {})
              }
            },
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'RECEIVE_MESSAGE': {
      if (
        hasCanonicalChatMessage({
          channelsObj: state.channelsObj,
          message: action.message
        })
      ) {
        return state;
      }
      const messageId = action.message.id || uuidv1();
      const realtimeEventKey = getRealtimeMessageEventKey(messageId);
      const subchannelId = Number(action.message.subchannelId || 0);
      const currentSubchannelId = Number(action.currentSubchannelId || 0);
      const scopeIsOpen = Boolean(action.usingChat);
      // The global navigation badge is an acknowledgement signal, not a mirror
      // of every scoped unread. Chat Main clears it when the page is visible;
      // background activity increments it so the document title can notify the
      // user without relighting the open channel's sidebar badge.
      const numUnreads =
        action.isMyMessage || (action.pageVisible && action.usingChat)
          ? state.numUnreads
          : state.numUnreads + 1;
      const prevChannelObj = state.channelsObj[action.message.channelId] || {};
      const didIncrementScopedUnreads =
        !action.isMyMessage &&
        (subchannelId
          ? !(subchannelId === currentSubchannelId && scopeIsOpen)
          : !(scopeIsOpen && currentSubchannelId === 0));
      const isChessMoveMessage =
        action.message.isChessMsg &&
        !!action.message.chessState &&
        !action.message.omokState;
      const lastChessMoveViewerId =
        isChessMoveMessage &&
        action.message.userId &&
        !action.message.isDrawOffer
          ? action.message.userId
          : prevChannelObj.lastChessMoveViewerId;
      const lastOmokMoveViewerId =
        action.message.isChessMsg &&
        action.message.omokState &&
        action.message.userId
          ? action.message.userId
          : prevChannelObj.lastOmokMoveViewerId;
      const messageIds = subchannelId
        ? prevChannelObj.messageIds
        : prependUniqueChatMessageId({
            messageIds: prevChannelObj.messageIds,
            messageId
          });
      const messagesObj = subchannelId
        ? prevChannelObj.messagesObj
        : {
            ...prevChannelObj.messagesObj,
            [messageId]: toConfirmedRealtimeMessage({
              message: action.message,
              messageId,
              eventSequence: action.eventSequence
            })
          };
      const members = action.newMembers
        ? mergeCanonicalGroupMembers({
            members: prevChannelObj?.members || [],
            newMembers: action.newMembers
          })
        : prevChannelObj.members;
      const gameState = {
        ...prevChannelObj.gameState,
        ...(action.message.isChessMsg
          ? {
              chess: {
                ...prevChannelObj.gameState?.chess,
                drawOfferedBy: null
              }
            }
          : action.message.isDrawOffer
            ? {
                chess: {
                  ...prevChannelObj.gameState?.chess,
                  drawOfferedBy: action.message.userId
                }
              }
            : {})
      };
      const subchannelObj = subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[subchannelId],
              // Visible scopes are cleared only by the canonical last-read
              // response started by the socket handler. Until then, preserve
              // the last confirmed count rather than guessing that write won.
              numUnreads:
                Number(
                  prevChannelObj?.subchannelObj?.[subchannelId]?.numUnreads || 0
                ) + (didIncrementScopedUnreads ? 1 : 0),
              messageIds: prependUniqueChatMessageId({
                messageIds:
                  prevChannelObj?.subchannelObj?.[subchannelId]?.messageIds,
                messageId
              }),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[subchannelId]?.messagesObj,
                [messageId]: toConfirmedRealtimeMessage({
                  message: action.message,
                  messageId,
                  eventSequence: action.eventSequence
                })
              },
              ...(!action.isMyMessage
                ? {
                    lastUnreadUserId: null,
                    lastUnreadReaction: null,
                    lastUnreadMessageId: null,
                    lastUnreadReactionTimeStamp: null
                  }
                : {})
            }
          }
        : prevChannelObj?.subchannelObj;

      return {
        ...state,
        numUnreads,
        confirmedRealtimeActivityByChannel:
          shouldTrackConfirmedRealtimeActivity(state)
            ? markConfirmedRealtimeActivity({
                activityByChannel: state.confirmedRealtimeActivityByChannel,
                channelId: action.message.channelId,
                subchannelId,
                eventKey: realtimeEventKey,
                eventSequence: action.eventSequence
              })
            : state.confirmedRealtimeActivityByChannel || {},
        confirmedRealtimeUnreadActivityByChannel:
          shouldTrackConfirmedRealtimeActivity(state) &&
          didIncrementScopedUnreads
            ? markConfirmedRealtimeActivity({
                activityByChannel:
                  state.confirmedRealtimeUnreadActivityByChannel,
                channelId: action.message.channelId,
                subchannelId,
                eventKey: realtimeEventKey,
                eventSequence: action.eventSequence
              })
            : state.confirmedRealtimeUnreadActivityByChannel || {},
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            ...prevChannelObj,
            topicObj: {
              ...prevChannelObj?.topicObj,
              [action.message.subjectId]: {
                ...prevChannelObj?.topicObj?.[action.message.subjectId],
                messageIds: prependUniqueChatMessageId({
                  messageIds:
                    prevChannelObj?.topicObj?.[action.message.subjectId]
                      ?.messageIds,
                  messageId
                })
              }
            },
            allMemberIds: action.newMembers
              ? mergeCanonicalGroupMemberIds({
                  allMemberIds: prevChannelObj?.allMemberIds || [],
                  members: action.newMembers
                })
              : prevChannelObj?.allMemberIds,
            messageIds,
            messagesObj,
            lastChessMoveViewerId,
            lastOmokMoveViewerId,
            lastUpdated: Math.max(
              Number(prevChannelObj?.lastUpdated || 0),
              Number(action.message.timeStamp || 0)
            ),
            lastMessageId: getConfirmedLastMessageId(
              prevChannelObj?.lastMessageId,
              action.message.id
            ),
            members,
            numUnreads:
              Number(prevChannelObj.numUnreads || 0) +
              (!subchannelId && didIncrementScopedUnreads ? 1 : 0),
            gameState,
            isHidden: false,
            ...(!subchannelId && !action.isMyMessage
              ? {
                  lastUnreadUserId: null,
                  lastUnreadReaction: null,
                  lastUnreadMessageId: null,
                  lastUnreadReactionTimeStamp: null
                }
              : {}),
            ...(subchannelObj ? { subchannelObj } : {}),
            ...(action.message.notificationType === 'owner_change' &&
            action.message.newOwner?.id
              ? { creatorId: action.message.newOwner.id }
              : {})
          }
        }
      };
    }
    case 'RECEIVE_FIRST_MSG': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      if (
        hasCanonicalChatMessage({
          channelsObj: state.channelsObj,
          message: action.message
        })
      ) {
        return action.quickAccess
          ? ChatReducer(state, {
              type: 'APPLY_CANONICAL_QUICK_ACCESS',
              quickAccess: action.quickAccess,
              userId: action.userId
            })
          : state;
      }
      const messageId = action.message.id ? action.message.id : uuidv1();
      const realtimeEventKey = getRealtimeMessageEventKey(messageId);
      const invitationMembers = action.members || action.message.members || [];
      const nextState = {
        ...state,
        confirmedRealtimeActivityByChannel:
          shouldTrackConfirmedRealtimeActivity(state)
            ? markConfirmedRealtimeActivity({
                activityByChannel: state.confirmedRealtimeActivityByChannel,
                channelId: action.message.channelId,
                eventKey: realtimeEventKey,
                eventSequence: action.eventSequence
              })
            : state.confirmedRealtimeActivityByChannel || {},
        confirmedRealtimeUnreadActivityByChannel:
          shouldTrackConfirmedRealtimeActivity(state) && !action.isDuplicate
            ? markConfirmedRealtimeActivity({
                activityByChannel:
                  state.confirmedRealtimeUnreadActivityByChannel,
                channelId: action.message.channelId,
                eventKey: realtimeEventKey,
                eventSequence: action.eventSequence
              })
            : state.confirmedRealtimeUnreadActivityByChannel || {},
        numUnreads:
          action.isDuplicate && action.pageVisible
            ? state.numUnreads
            : Number(state.numUnreads) + 1,
        selectedChannelId: action.isDuplicate
          ? action.message.channelId
          : state.selectedChannelId,
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            id: action.message.channelId,
            messagesObj: {
              [messageId]: toConfirmedRealtimeMessage({
                message: action.message,
                messageId,
                eventSequence: action.eventSequence
              })
            },
            twoPeople: action.isTwoPeople,
            pathId: action.pathId,
            messageIds: [messageId],
            lastMessageId: getConfirmedLastMessageId(null, action.message.id),
            lastUpdated: Number(action.message.timeStamp || 0),
            isClass: action.isClass,
            members: invitationMembers,
            channelName: action.message.channelName || action.message.username,
            numUnreads: action.isDuplicate ? 0 : 1
          }
        },
        homeChannelIds: [action.message.channelId].concat(
          state.homeChannelIds.filter((_: number, index: number) =>
            action.isDuplicate ? index !== 0 : true
          )
        )
      };
      return action.quickAccess
        ? ChatReducer(nextState, {
            type: 'APPLY_CANONICAL_QUICK_ACCESS',
            quickAccess: action.quickAccess,
            userId: action.userId
          })
        : nextState;
    }
    case 'RECEIVE_MSG_ON_DIFF_CHANNEL': {
      if (
        hasCanonicalChatMessage({
          channelsObj: state.channelsObj,
          message: action.message
        })
      ) {
        return state;
      }
      const messageId = action.message.id || uuidv1();
      const realtimeEventKey = getRealtimeMessageEventKey(messageId);
      const prevChannelObj = state.channelsObj[action.channel.id];
      const subchannelId = action.message.subchannelId;
      const subchannelObj = subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.message.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[subchannelId],
              numUnreads:
                Number(
                  prevChannelObj?.subchannelObj?.[subchannelId]?.numUnreads || 0
                ) + (action.isMyMessage ? 0 : 1),
              messageIds: prependUniqueChatMessageId({
                messageIds:
                  prevChannelObj?.subchannelObj?.[subchannelId]?.messageIds,
                messageId
              }),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[subchannelId]?.messagesObj,
                [messageId]: toConfirmedRealtimeMessage({
                  message: action.message,
                  messageId,
                  eventSequence: action.eventSequence
                })
              },
              lastUnreadUserId: null,
              lastUnreadReaction: null,
              lastUnreadMessageId: null,
              lastUnreadReactionTimeStamp: null
            }
          }
        : prevChannelObj?.subchannelObj;

      return {
        ...state,
        confirmedRealtimeActivityByChannel:
          shouldTrackConfirmedRealtimeActivity(state)
            ? markConfirmedRealtimeActivity({
                activityByChannel: state.confirmedRealtimeActivityByChannel,
                channelId: action.channel.id,
                subchannelId,
                eventKey: realtimeEventKey,
                eventSequence: action.eventSequence
              })
            : state.confirmedRealtimeActivityByChannel || {},
        confirmedRealtimeUnreadActivityByChannel:
          shouldTrackConfirmedRealtimeActivity(state) && !action.isMyMessage
            ? markConfirmedRealtimeActivity({
                activityByChannel:
                  state.confirmedRealtimeUnreadActivityByChannel,
                channelId: action.channel.id,
                subchannelId,
                eventKey: realtimeEventKey,
                eventSequence: action.eventSequence
              })
            : state.confirmedRealtimeUnreadActivityByChannel || {},
        channelsObj: {
          ...state.channelsObj,
          [action.channel.id]: subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj,
                lastUpdated: Math.max(
                  Number(prevChannelObj?.lastUpdated || 0),
                  Number(action.message.timeStamp || 0)
                ),
                lastMessageId: getConfirmedLastMessageId(
                  prevChannelObj?.lastMessageId,
                  action.message.id
                )
              }
            : {
                ...prevChannelObj,
                // Preserve existing channel metadata when incoming data is incomplete
                id: action.channel.id,
                pathId: action.channel.pathId ?? prevChannelObj?.pathId,
                channelName:
                  action.channel.channelName ?? prevChannelObj?.channelName,
                twoPeople:
                  action.channel.twoPeople ?? prevChannelObj?.twoPeople,
                members: action.channel.members ?? prevChannelObj?.members,
                ...(prevChannelObj?.members && action.newMembers.length > 0
                  ? {
                      allMemberIds: (prevChannelObj?.allMemberIds || []).concat(
                        action.newMembers
                          .map((member: { id: number }) => member.id)
                          .filter(
                            (memberId: number) =>
                              !(prevChannelObj?.allMemberIds || []).includes(
                                memberId
                              )
                          )
                      ),
                      members: mergeCanonicalGroupMembers({
                        members: prevChannelObj?.members || [],
                        newMembers: action.newMembers
                      })
                    }
                  : {}),
                topicObj: action.message.subjectId
                  ? {
                      ...prevChannelObj?.topicObj,
                      [action.message.subjectId]: {
                        ...prevChannelObj?.topicObj?.[action.message.subjectId],
                        messageIds: prependUniqueChatMessageId({
                          messageIds:
                            prevChannelObj?.topicObj?.[action.message.subjectId]
                              ?.messageIds,
                          messageId
                        })
                      }
                    }
                  : prevChannelObj?.topicObj,
                messageIds: prependUniqueChatMessageId({
                  messageIds: prevChannelObj?.messageIds,
                  messageId
                }),
                messagesObj: {
                  ...prevChannelObj?.messagesObj,
                  [messageId]: toConfirmedRealtimeMessage({
                    message: action.message,
                    messageId,
                    eventSequence: action.eventSequence
                  })
                },
                ...(action.message.notificationType === 'owner_change' &&
                action.message.newOwner?.id
                  ? { creatorId: action.message.newOwner.id }
                  : {}),
                lastChessMoveViewerId:
                  action.message.isChessMsg &&
                  !!action.message.chessState &&
                  !action.message.omokState &&
                  action.message.userId &&
                  !action.message.isDrawOffer
                    ? action.message.userId
                    : prevChannelObj?.lastChessMoveViewerId,
                lastOmokMoveViewerId:
                  action.message.isChessMsg &&
                  action.message.omokState &&
                  action.message.userId
                    ? action.message.userId
                    : prevChannelObj?.lastOmokMoveViewerId,
                lastUpdated: Math.max(
                  Number(prevChannelObj?.lastUpdated || 0),
                  Number(action.message.timeStamp || 0)
                ),
                lastMessageId: getConfirmedLastMessageId(
                  prevChannelObj?.lastMessageId,
                  action.message.id
                ),
                numUnreads: action.isMyMessage
                  ? Number(prevChannelObj?.numUnreads || 0)
                  : Number(prevChannelObj?.numUnreads || 0) + 1,
                lastUnreadUserId: null,
                lastUnreadReaction: null,
                lastUnreadMessageId: null,
                lastUnreadReactionTimeStamp: null,
                // Preserve or compute partnerUsername for DM channels
                ...(prevChannelObj?.twoPeople || action.channel?.twoPeople
                  ? {
                      partnerUsername:
                        prevChannelObj?.partnerUsername ||
                        (state.prevUserId &&
                          (
                            prevChannelObj?.members ||
                            action.channel?.members ||
                            []
                          ).find(
                            (m: { id: number }) => m.id !== state.prevUserId
                          )?.username) ||
                        // Fallback: for DM channels, the message sender is the partner
                        (action.message.userId !== state.prevUserId
                          ? action.message.username
                          : undefined)
                    }
                  : {})
              }
        },
        numUnreads:
          action.isMyMessage || (action.pageVisible && action.usingChat)
            ? state.numUnreads
            : Number(state.numUnreads) + 1,
        favoriteChannelIds: state.allFavoriteChannelIds[action.channel.id]
          ? [action.channel.id].concat(
              state.favoriteChannelIds.filter(
                (channelId: number) => channelId !== action.channel.id
              )
            )
          : state.favoriteChannelIds,
        homeChannelIds: [action.channel.id].concat(
          state.homeChannelIds.filter(
            (channelId: number) => channelId !== action.channel.id
          )
        )
      };
    }
    case 'APPLY_CANONICAL_REACTION_ADD_ACTIVITY': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const shouldIncrementUnreads = action.shouldIncrementUnreads !== false;
      const subchannelId = Number(action.subchannelId) || null;
      if (!prevChannelObj) {
        return {
          ...state,
          numUnreads:
            !shouldIncrementUnreads || (action.pageVisible && action.usingChat)
              ? state.numUnreads
              : 1
        };
      }

      const updatedSubchannelObj = subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[subchannelId],
              ...(shouldIncrementUnreads
                ? {
                    numUnreads: 1,
                    lastUnreadUserId: action.userId,
                    lastUnreadReaction: action.reaction,
                    lastUnreadMessageId: action.messageId,
                    lastUnreadReactionTimeStamp: action.timeStamp
                  }
                : {})
            }
          }
        : prevChannelObj?.subchannelObj;

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: subchannelId
            ? {
                ...prevChannelObj,
                ...(shouldIncrementUnreads
                  ? {
                      lastUnreadUserId: action.userId,
                      lastUnreadReaction: action.reaction,
                      lastUnreadMessageId: action.messageId,
                      lastUnreadReactionTimeStamp: action.timeStamp
                    }
                  : {}),
                subchannelObj: updatedSubchannelObj
              }
            : {
                ...prevChannelObj,
                ...(shouldIncrementUnreads
                  ? {
                      numUnreads: 1,
                      lastUnreadUserId: action.userId,
                      lastUnreadReaction: action.reaction,
                      lastUnreadMessageId: action.messageId,
                      lastUnreadReactionTimeStamp: action.timeStamp
                    }
                  : {})
              }
        },
        numUnreads:
          !shouldIncrementUnreads || (action.pageVisible && action.usingChat)
            ? state.numUnreads
            : 1,
        favoriteChannelIds: state.allFavoriteChannelIds[action.channelId]
          ? [action.channelId].concat(
              state.favoriteChannelIds.filter(
                (channelId: number) => channelId !== action.channelId
              )
            )
          : state.favoriteChannelIds,
        homeChannelIds: [action.channelId].concat(
          state.homeChannelIds.filter(
            (channelId: number) => channelId !== action.channelId
          )
        )
      };
    }
    case 'INSERT_BLACK_AI_CARD_UPDATE_LOG': {
      return {
        ...state,
        wordLogs: [
          {
            id: uuidv1(),
            message: action.message,
            timeStamp: Date.now(),
            isSummonMsg: true,
            isNew: true
          },
          ...state.wordLogs
        ]
      };
    }
    case 'RECEIVE_AI_CARD_SUMMON':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: action.card
        },
        aiCardFeedIds: [action.feed.id].concat(
          state.aiCardFeedIds.filter(
            (feedId: number) => feedId !== action.feed.id
          )
        ),
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feed.id]: {
            ...action.feed,
            isLoaded: true
          }
        }
      };
    case 'POST_VOCAB_FEED': {
      // The relay fans this out to everyone in the room, so the same feed can
      // arrive more than once (reconnect, duplicate emit, response/event race).
      // Rendering it twice is what the duplicate cards look like.
      const isDuplicateFeed = state.vocabFeedIds.includes(action.feed.id);
      const isBreakFeed =
        action.feed.action === 'break_start' ||
        action.feed.action === 'break_clear';
      const newWordLog =
        !isDuplicateFeed &&
        action.feed.action !== 'reward' &&
        !isBreakFeed &&
        action.isMyFeed
          ? {
              id: uuidv1(),
              word: action.feed.content,
              level: action.feed.wordLevel,
              xp: action.feed.xpReward,
              coins: action.feed.coinReward,
              action: action.feed.action,
              timeStamp: Date.now(),
              isNew: true
            }
          : null;

      const isNewYear = action.currentYear !== state.currentYear;
      const filteredVocabFeedIds = isNewYear
        ? state.vocabFeedIds.filter(
            (feedId: number) =>
              state.vocabFeedObj[feedId]?.year === action.currentYear
          )
        : state.vocabFeedIds;

      return {
        ...state,
        currentYear: action.currentYear,
        currentMonth: action.currentMonth,
        vocabFeedIds: prependUniqueIds([action.feed.id], filteredVocabFeedIds),
        vocabFeedObj: {
          ...state.vocabFeedObj,
          [action.feed.id]: {
            ...action.feed,
            isNewFeed: true
          }
        },
        wordsObj: action.feed.content
          ? {
              ...state.wordsObj,
              [action.feed.content]: {
                ...state.wordsObj[action.feed.content],
                ...action.feed
              }
            }
          : state.wordsObj,
        wordLogs: newWordLog ? [newWordLog, ...state.wordLogs] : state.wordLogs,
        vocabFeedsLoadMoreButton: isNewYear
          ? false
          : state.vocabFeedsLoadMoreButton
      };
    }
    case 'REMOVE_NEW_LOG_STATE': {
      return {
        ...state,
        wordLogs: state.wordLogs.map((log: any) => ({
          ...log,
          isNew: action.logId === log.id ? false : log.isNew
        }))
      };
    }
    case 'RELOAD_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: [action.message.id].concat(
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.message.id]: action.message
              },
              legacyTopicObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        homeChannelIds: [
          action.channelId,
          ...state.homeChannelIds.filter(
            (channelId: number) => channelId !== action.channelId
          )
        ],
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                messageIds: [action.message.id].concat(
                  prevChannelObj?.messageIds
                ),
                messagesObj: {
                  ...prevChannelObj?.messagesObj,
                  [action.message.id]: action.message
                },
                legacyTopicObj: action.subject
              }
        }
      };
    }
    case 'RESET_CHAT': {
      recordChatBootstrapEvent('chat-reset-reducer', {
        userId: action.userId,
        prevUserId: state.prevUserId,
        loaded: state.loaded,
        loadedForUserId: state.loadedForUserId,
        selectedChannelId: state.selectedChannelId,
        channelCount: Object.keys(state.channelsObj || {}).length
      });
      const newChatStatus: Record<string, any> = {};
      for (const key in state.chatStatus) {
        if (Number(key) !== Number(action.userId)) {
          newChatStatus[key] = state.chatStatus[key];
        }
      }
      return {
        ...initialChatState,
        currentYear: state.currentYear,
        currentMonth: state.currentMonth,
        aiCardFeedIds: state.aiCardFeedIds,
        aiCardFeedObj: state.aiCardFeedObj,
        vocabFeedIds: state.vocabFeedIds,
        vocabFeedObj: state.vocabFeedObj,
        chatStatus: newChatStatus,
        cardObj: state.cardObj,
        thinkHard: state.thinkHard
      };
    }
    case 'SEARCH':
      return {
        ...state,
        chatSearchResults: action.data
      };
    case 'SEARCH_MESSAGES': {
      const {
        channelId,
        topicId,
        messageIds: searchedMessageIds,
        loadMoreShown,
        messagesObj
      } = action;
      const prevChannelObj = state.channelsObj[channelId];

      const updatedChannel = {
        ...prevChannelObj,
        messagesObj: {
          ...prevChannelObj.messagesObj,
          ...messagesObj
        },
        ...(topicId
          ? {
              topicObj: {
                ...prevChannelObj.topicObj,
                [topicId]: {
                  ...prevChannelObj.topicObj[topicId],
                  searchedMessageIds,
                  searchedLoadMoreButtonShown: loadMoreShown
                }
              }
            }
          : {
              searchedMessageIds,
              searchedLoadMoreButton: loadMoreShown
            })
      };

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [channelId]: updatedChannel
        }
      };
    }
    case 'LOAD_MORE_SEARCHED_MESSAGES': {
      const { channelId, topicId, messageIds, loadMoreShown, messagesObj } =
        action;
      const prevChannelObj = state.channelsObj[channelId];

      const updatedChannel = {
        ...prevChannelObj,
        messagesObj: {
          ...prevChannelObj.messagesObj,
          ...messagesObj
        },
        ...(topicId
          ? {
              topicObj: {
                ...prevChannelObj.topicObj,
                [topicId]: {
                  ...prevChannelObj.topicObj[topicId],
                  searchedMessageIds: [
                    ...(prevChannelObj.topicObj[topicId].searchedMessageIds ||
                      []),
                    ...messageIds
                  ],
                  searchedLoadMoreButtonShown: loadMoreShown
                }
              }
            }
          : {
              searchedMessageIds: [
                ...(prevChannelObj.searchedMessageIds || []),
                ...messageIds
              ],
              searchedLoadMoreButton: loadMoreShown
            })
      };

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [channelId]: updatedChannel
        }
      };
    }
    case 'SEARCH_SUBJECTS':
      return {
        ...state,
        subjectSearchResults: action.data
      };
    case 'SEARCH_USERS_FOR_CHANNEL':
      return {
        ...state,
        userSearchResults: action.data
      };
    case 'SELECT_CHAT_TAB':
      return {
        ...state,
        selectedChatTab: determineSelectedChatTab({
          currentSelectedChatTab: state.selectedChatTab,
          selectedChatTab: action.selectedChatTab
        })
      };
    case 'SET_CALL': {
      return {
        ...state,
        channelOnCall: action.channelId
          ? {
              imCalling: action.imCalling,
              id: action.channelId,
              members: {}
            }
          : {}
      };
    }
    case 'SET_AI_CALL': {
      return {
        ...state,
        aiCallChannelId: action.channelId
      };
    }
    case 'SET_AI_CALL_ENDING': {
      return {
        ...state,
        aiCallEnding: action.isEnding
      };
    }
    case 'SET_CHESS_GAME_STATE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            gameState: {
              ...prevChannelObj?.gameState,
              chess: {
                ...prevChannelObj?.gameState?.chess,
                ...action.newState
              }
            }
          }
        }
      };
    }
    case 'SET_CHESS_TARGET': {
      const prevChannelObj = state.channelsObj[action.channelId];
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            chessTarget: action.target
              ? {
                  ...action.target,
                  messageId: action.messageId,
                  isDiscussion: true
                }
              : null
          }
        }
      };
    }
    case 'SET_IS_SEARCH_ACTIVE': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const selectedTab = prevChannelObj.selectedTab;

      const updateSearchActive = (currentValue: boolean) => {
        if (action.isToggle) {
          return !currentValue;
        }
        return action.isActive;
      };

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            ...(selectedTab === 'all' || !selectedTab
              ? {
                  isSearchActive: updateSearchActive(
                    prevChannelObj.isSearchActive
                  )
                }
              : {}),
            topicObj: {
              ...prevChannelObj.topicObj,
              [prevChannelObj.selectedTopicId]: {
                ...prevChannelObj.topicObj?.[prevChannelObj.selectedTopicId],
                ...(selectedTab === 'topic'
                  ? {
                      isSearchActive: updateSearchActive(
                        prevChannelObj.topicObj?.[
                          prevChannelObj.selectedTopicId
                        ]?.isSearchActive
                      )
                    }
                  : {})
              }
            }
          }
        }
      };
    }
    case 'SET_TOPIC_SETTINGS_JSON':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                settings: {
                  ...state.channelsObj[action.channelId]?.topicObj?.[
                    action.topicId
                  ]?.settings,
                  ...action.newSettings
                }
              }
            }
          }
        }
      };
    case 'SET_CHANNEL_SETTINGS_JSON':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            settings: {
              ...state.channelsObj[action.channelId]?.settings,
              ...action.newSettings
            }
          }
        }
      };
    case 'SET_VOCAB_LEADERBOARDS':
      return {
        ...state,
        collectorRankings: action.collectorRankings,
        monthlyVocabRankings: action.monthlyVocabRankings,
        yearlyVocabRankings: action.yearlyVocabRankings
      };
    case 'ADD_BOOKMARKED_MESSAGE': {
      const isTopicScope = !!action.topicId;
      const channelState = state.channelsObj[action.channelId] || {};
      const topicState = isTopicScope
        ? channelState.topicObj?.[action.topicId]
        : null;
      const view = (action.view || BOOKMARK_VIEWS.AI) as BookmarkView;

      const currentBookmarks = getBookmarkLists(
        isTopicScope
          ? topicState?.bookmarkedMessages
          : channelState.bookmarkedMessages
      );

      const updatedBookmarks = {
        ...currentBookmarks,
        [view]: [action.bookmark].concat(
          currentBookmarks[view].filter(
            (bookmark: { id: number }) => bookmark.id !== action.bookmark.id
          )
        )
      };

      if (isTopicScope) {
        return {
          ...state,
          channelsObj: {
            ...state.channelsObj,
            [action.channelId]: {
              ...channelState,
              topicObj: {
                ...channelState.topicObj,
                [action.topicId]: {
                  ...topicState,
                  bookmarkedMessages: updatedBookmarks
                }
              }
            }
          }
        };
      }

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...channelState,
            bookmarkedMessages: updatedBookmarks
          }
        }
      };
    }

    case 'REMOVE_BOOKMARKED_MESSAGE': {
      const isTopicScope = !!action.topicId;
      const channelState = state.channelsObj[action.channelId] || {};
      const topicState = isTopicScope
        ? channelState.topicObj?.[action.topicId]
        : null;
      const view = (action.view || BOOKMARK_VIEWS.AI) as BookmarkView;

      const currentBookmarks = getBookmarkLists(
        isTopicScope
          ? topicState?.bookmarkedMessages
          : channelState.bookmarkedMessages
      );

      const updatedBookmarks = {
        ...currentBookmarks,
        [view]: currentBookmarks[view].filter(
          (bookmark: { id: number }) => bookmark.id !== action.messageId
        )
      };

      if (isTopicScope) {
        return {
          ...state,
          channelsObj: {
            ...state.channelsObj,
            [action.channelId]: {
              ...channelState,
              topicObj: {
                ...channelState.topicObj,
                [action.topicId]: {
                  ...topicState,
                  bookmarkedMessages: updatedBookmarks
                }
              }
            }
          }
        };
      }

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...channelState,
            bookmarkedMessages: updatedBookmarks
          }
        }
      };
    }
    case 'SET_CHANNEL_STATE':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            ...action.newState
          }
        }
      };
    case 'SET_CHAT_INVITATION_DETAIL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(state.channelsObj[action.channelId]?.messagesObj
            ? {
                [action.channelId]: {
                  ...state.channelsObj[action.channelId],
                  messagesObj: {
                    ...state.channelsObj[action.channelId].messagesObj,
                    [action.messageId]: {
                      ...state.channelsObj[action.channelId].messagesObj[
                        action.messageId
                      ],
                      invitationChannelId: action.channel.id
                    }
                  }
                }
              }
            : {}),
          [action.channel.id]: {
            ...state.channelsObj[action.channel.id],
            ...action.channel,
            loaded: state.channelsObj[action.channel.id]?.loaded || false
          }
        }
      };
    case 'SET_CHAT_NOTIFICATION_SETTINGS':
      if (
        !shouldApplyChatNotificationSettings({
          currentSettings: state.chatNotificationSettings,
          incomingSettings: action.settings
        })
      ) {
        return state;
      }
      return {
        ...state,
        chatNotificationSettings: action.settings
      };
    case 'SET_CHESS_MODAL_SHOWN':
      return {
        ...state,
        chessModalShown: action.shown
      };
    case 'SET_PENDING_CHESS_MODAL_CHANNEL_ID':
      return {
        ...state,
        pendingChessModalChannelId: action.channelId
      };
    case 'SET_OMOK_MODAL_SHOWN':
      return {
        ...state,
        omokModalShown: action.shown
      };
    case 'SET_CREATING_NEW_DM_CHANNEL':
      return {
        ...state,
        creatingNewDMChannel: action.creating
      };
    case 'APPLY_CANONICAL_CHAT_SIDEBAR_STATE': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      let nextState = state;
      if (action.favoriteState) {
        nextState = ChatReducer(nextState, {
          type: 'APPLY_CANONICAL_FAVORITE_STATE',
          ...action.favoriteState,
          userId: action.userId
        });
      }
      if (action.quickAccess) {
        nextState = ChatReducer(nextState, {
          type: 'APPLY_CANONICAL_QUICK_ACCESS',
          quickAccess: action.quickAccess,
          userId: action.userId
        });
      }
      if (action.channelVisibility) {
        const visibilityChannelId = Number(
          action.channelVisibility.channelId || 0
        );
        let channelVisibilityById = mergeCanonicalChannelVisibility({
          visibilityById: nextState.channelVisibilityById || {},
          visibility: getCanonicalChannelVisibilityFromChannel(
            nextState.channelsObj[visibilityChannelId]
          )
        });
        channelVisibilityById = mergeCanonicalChannelVisibility({
          visibilityById: channelVisibilityById,
          visibility: action.channelVisibility
        });
        const currentChannel = nextState.channelsObj[visibilityChannelId];
        nextState = {
          ...nextState,
          channelVisibilityById,
          ...(currentChannel?.id
            ? {
                channelsObj: {
                  ...nextState.channelsObj,
                  [visibilityChannelId]: applyCanonicalChannelVisibility({
                    channel: currentChannel,
                    visibility: channelVisibilityById[visibilityChannelId]
                  })
                }
              }
            : {})
        };
      }
      return nextState;
    }
    case 'APPLY_CANONICAL_FAVORITE_STATE': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      const incomingFavoriteStateRevision = Number(
        action.favoriteStateRevision || 0
      );
      if (
        incomingFavoriteStateRevision <= 0 ||
        incomingFavoriteStateRevision < Number(state.favoriteStateRevision || 0)
      ) {
        return state;
      }
      const favoriteStateOwnerId = Number(action.userId);
      const favoriteChannelsById = new Map<number, any>();
      for (const channel of action.favoriteChannels || []) {
        const channelId = Number(channel?.id || 0);
        if (channelId > 0) favoriteChannelsById.set(channelId, channel);
      }
      const legacyFavoriteChannelId = Number(action.favoriteChannel?.id || 0);
      if (legacyFavoriteChannelId > 0) {
        favoriteChannelsById.set(
          legacyFavoriteChannelId,
          action.favoriteChannel
        );
      }
      let channelsObj = state.channelsObj;
      for (const [channelId, channel] of favoriteChannelsById) {
        const mergedChannel = mergeCanonicalFavoriteChannelSummary({
          canonicalChannel: channel,
          currentChannel: state.channelsObj[channelId],
          visibility: state.channelVisibilityById?.[channelId]
        });
        if (mergedChannel === state.channelsObj[channelId]) continue;
        if (channelsObj === state.channelsObj) {
          channelsObj = { ...state.channelsObj };
        }
        channelsObj[channelId] = mergedChannel;
      }
      const reconciledFavoriteChannelIds = reconcileCanonicalFavoriteOrder({
        canonicalChannelsById: favoriteChannelsById,
        canonicalOrder: action.favoriteChannelIds || [],
        currentChannelsById: channelsObj,
        currentOrder: state.favoriteChannelIds || []
      });
      if (
        incomingFavoriteStateRevision ===
        Number(state.favoriteStateRevision || 0)
      ) {
        // Favorite revisions own membership, not channel recency. Reconcile an
        // equal snapshot only from the freshest confirmed channel activity on
        // either side; never restore its captured array order verbatim.
        const favoriteOrderChanged = !numberOrdersMatch(
          state.favoriteChannelIds,
          reconciledFavoriteChannelIds
        );
        return channelsObj === state.channelsObj && !favoriteOrderChanged
          ? state
          : {
              ...state,
              channelsObj,
              favoriteChannelIds: reconciledFavoriteChannelIds,
              favoriteStateOwnerId
            };
      }
      return {
        ...state,
        allFavoriteChannelIds: action.allFavoriteChannelIds,
        // The higher revision is authoritative for membership and page
        // composition only. Ordering is a separate projection of confirmed
        // message/reaction activity, which may have advanced after the server
        // captured this membership snapshot.
        favoriteChannelIds: reconciledFavoriteChannelIds,
        favoriteLoadMoreButton: action.favoriteLoadMoreButton,
        favoriteStateRevision: incomingFavoriteStateRevision,
        favoriteStateOwnerId,
        channelsObj
      };
    }
    case 'APPLY_CANONICAL_QUICK_ACCESS': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      if (
        Number(action.quickAccess?.revision || 0) <
        Number(state.quickAccess?.revision || 0)
      ) {
        return state;
      }
      return {
        ...state,
        quickAccess: action.quickAccess,
        quickAccessOwnerId: Number(action.userId)
      };
    }
    case 'SET_IS_RESPONDING_TO_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              replyTarget: null,
              isRespondingToSubject: action.isResponding
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                replyTarget: null,
                isRespondingToSubject: action.isResponding
              }
        }
      };
    }
    case 'SET_LOADING_VOCABULARY':
      return {
        ...state,
        loadingVocabulary: action.loading
      };
    case 'SET_LOADING_AI_CARD_CHAT':
      return {
        ...state,
        loadingAICardChat: action.loading
      };
    case 'SET_MESSAGE_STATE': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const subchannelObj = prevChannelObj.subchannelObj || {};
      const newSubchannelObj: any = {};
      for (const key in subchannelObj) {
        newSubchannelObj[key] = {
          ...subchannelObj[key],
          messagesObj: {
            ...subchannelObj[key].messagesObj,
            [action.messageId]: {
              ...subchannelObj[key].messagesObj?.[action.messageId],
              ...action.newState,
              isLoaded: true
            }
          }
        };
      }
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messagesObj: {
              ...prevChannelObj.messagesObj,
              [action.messageId]: {
                ...prevChannelObj.messagesObj?.[action.messageId],
                ...action.newState,
                isLoaded: true
              }
            },
            ...(prevChannelObj.subchannelObj
              ? { subchannelObj: newSubchannelObj }
              : {})
          }
        }
      };
    }
    case 'SET_MEMBERS_ON_CALL':
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          members:
            Object.keys(action.members).length > 0
              ? {
                  ...state.channelOnCall?.members,
                  ...action.members
                }
              : {}
        }
      };
    case 'SET_ONLINE_PRESENCE_SNAPSHOT': {
      // App-wide snapshot from check_online_presence: authoritative about who
      // is offline too, but only when the server could read the whole room.
      // See presenceSnapshot.ts.
      return {
        ...state,
        chatStatus: applyPresenceSnapshot({
          chatStatus: state.chatStatus || {},
          onlineUsers: action.onlineUsers || {},
          requestedAt: Number(action.requestedAt) || 0,
          reconcileOffline: action.isComplete === true
        })
      };
    }
    case 'SET_ONLINE_USERS': {
      if (!canonicalApplyOwnerMatchesBoundUser(state, action.userId)) {
        return state;
      }
      // Channel-scoped snapshot: it only covers the members of one channel, so
      // absence from it says nothing about the rest of the app.
      const mergedStatus = applyPresenceSnapshot({
        chatStatus: state.chatStatus || {},
        onlineUsers: action.onlineUsers || {},
        requestedAt: Number(action.requestedAt) || 0,
        reconcileOffline: false
      });

      const hasOfflineUsers = action.recentOfflineUsers !== undefined;
      let newRecentOfflineUsers = state.recentOfflineUsers;

      if (hasOfflineUsers) {
        const incomingOffline = action.recentOfflineUsers || [];
        const seenIds = new Set<number>();
        newRecentOfflineUsers = incomingOffline.filter((u: any) => {
          const id = Number(u.id);
          if (seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        });
      }

      return {
        ...state,
        chatStatus: mergedStatus,
        recentOfflineUsers: newRecentOfflineUsers
      };
    }
    case 'SET_MY_STREAM':
      return {
        ...state,
        myStream: action.stream
      };
    case 'SET_PEER_STREAMS':
      return {
        ...state,
        peerStreams: action.peerId
          ? {
              ...state.peerStreams,
              [action.peerId]: action.stream
            }
          : {}
      };
    case 'SET_RECONNECTING': {
      const channelsObj: Record<string, any> = {};
      for (const [channelId, channel] of Object.entries(state.channelsObj)) {
        channelsObj[channelId] = channel
          ? {
              ...channel,
              loaded: false
            }
          : channel;
      }
      return {
        ...state,
        channelsObj,
        reconnecting: true
      };
    }
    case 'SET_REPLY_TARGET': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              replyTarget: action.target,
              isRespondingToSubject: false
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                replyTarget: action.target,
                isRespondingToSubject: false
              }
        }
      };
    }
    case 'SET_SELECTED_SUBCHANNEL_ID': {
      return {
        ...state,
        selectedSubchannelId: action.subchannelId
      };
    }
    case 'SET_SUBCHANNEL': {
      const newSubchannelObj = {
        ...state.channelsObj[action.channelId]?.subchannelObj,
        [action.subchannel.id]: action.subchannel
      };
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            subchannelObj: newSubchannelObj
          }
        }
      };
    }
    case 'SET_AI_IMAGE_ERROR_MESSAGE': {
      return {
        ...state,
        aiCardErrorMessage: action.message
      };
    }
    case 'SET_AI_IMAGE_STATUS_MESSAGE': {
      return {
        ...state,
        aiCardStatusMessage: action.message
      };
    }
    case 'SET_IS_GENERATING_AI_CARD': {
      return {
        ...state,
        isGeneratingAICard: action.isGenerating
      };
    }
    case 'SET_IS_ZERO_CALL_AVAILABLE': {
      return {
        ...state,
        isZeroCallAvailable: action.isAvailable
      };
    }
    case 'SET_ZERO_CHANNEL_ID': {
      return {
        ...state,
        zeroChannelId: action.channelId
      };
    }
    case 'SET_VOCAB_ERROR_MESSAGE': {
      return {
        ...state,
        vocabErrorMessage: action.message
      };
    }
    case 'SET_VOCAB_LEADERBOARD_TAB': {
      return {
        ...state,
        vocabLeaderboardTab: action.tab
      };
    }
    case 'SET_VOCAB_LEADERBOARD_ALL_SELECTED': {
      return {
        ...state,
        vocabLeaderboardAllSelected: {
          ...state.vocabLeaderboardAllSelected,
          [action.tab]: action.selected
        }
      };
    }
    case 'SET_WORDLE_MODAL_SHOWN':
      return {
        ...state,
        wordleModalShown: action.shown
      };
    case 'SET_WORDS_OBJECT': {
      return {
        ...state,
        wordsObj: {
          ...state.wordsObj,
          [action.wordObj.content]: {
            ...(state.wordsObj?.[action.wordObj.content] || {}),
            ...action.wordObj
          }
        }
      };
    }
    case 'SET_WORD_REGISTER_STATUS': {
      return {
        ...state,
        wordRegisterStatus: action.status
      };
    }
    case 'SET_WORDLE_GUESSES':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            wordleGuesses: action.guesses
          }
        }
      };
    case 'SHOW_INCOMING': {
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          incomingShown: true
        }
      };
    }
    case 'SHOW_OUTGOING': {
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          outgoingShown: true
        }
      };
    }
    case 'SUBMIT_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.message.channelId] || {};
      const currentSubchannel = action.subchannelId
        ? prevChannelObj?.subchannelObj?.[action.subchannelId]
        : null;
      const submittedMessage = getSubmittedChatMessage({
        existingMessage: action.subchannelId
          ? currentSubchannel?.messagesObj?.[action.messageId]
          : prevChannelObj?.messagesObj?.[action.messageId],
        isRespondingToSubject: action.isRespondingToSubject,
        message: action.message,
        messageId: action.messageId,
        replyTarget: action.replyTarget,
        subchannelId: action.subchannelId,
        targetSubject: action.subchannelId
          ? currentSubchannel?.legacyTopicObj
          : prevChannelObj?.legacyTopicObj
      });
      const gameState = {
        ...prevChannelObj?.gameState,
        ...(action.message.isChessMsg
          ? {
              chess: {
                ...prevChannelObj?.gameState?.chess,
                drawOfferedBy: null
              }
            }
          : action.message.isDrawOffer
            ? {
                chess: {
                  ...prevChannelObj?.gameState?.chess,
                  drawOfferedBy: action.message.userId
                }
              }
            : {})
      };
      const messageIds = action.subchannelId
        ? prevChannelObj?.messageIds
        : prependUniqueChatMessageId({
            messageIds: prevChannelObj?.messageIds,
            messageId: action.messageId
          });
      const messagesObj = action.subchannelId
        ? prevChannelObj?.messagesObj
        : {
            ...prevChannelObj?.messagesObj,
            [action.messageId]: submittedMessage
          };
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...currentSubchannel,
              isRespondingToSubject: false,
              messageIds: prependUniqueChatMessageId({
                messageIds: currentSubchannel?.messageIds,
                messageId: action.messageId
              }),
              messagesObj: {
                ...currentSubchannel?.messagesObj,
                [action.messageId]: submittedMessage
              }
            }
          }
        : prevChannelObj?.subchannelObj;

      return {
        ...state,
        homeChannelIds: action.message.isNotification
          ? state.homeChannelIds
          : [action.message.channelId].concat(
              state.homeChannelIds.filter(
                (channelId: number) => channelId !== action.message.channelId
              )
            ),
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            ...prevChannelObj,
            topicObj: {
              ...prevChannelObj?.topicObj,
              [action.topicId]: {
                ...prevChannelObj?.topicObj?.[action.topicId],
                isSearchActive: false,
                messageIds: prependUniqueChatMessageId({
                  messageIds:
                    prevChannelObj?.topicObj?.[action.topicId]?.messageIds,
                  messageId: action.messageId
                })
              }
            },
            isSearchActive: false,
            isRespondingToSubject: false,
            gameState,
            messageIds,
            messagesObj,
            numUnreads: action.subchannelId ? prevChannelObj.numUnreads : 0,
            subchannelObj
          }
        }
      };
    }
    case 'TRIM_MESSAGES':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesLoadMoreButton:
              state.channelsObj[action.channelId]?.messageIds?.length > 20
                ? true
                : state.channelsObj[action.channelId]?.messagesLoadMoreButton,
            messageIds:
              state.channelsObj[action.channelId]?.messageIds?.length > 20
                ? state.channelsObj[action.channelId]?.messageIds.filter(
                    (_: number, index: number) => index <= 20
                  )
                : state.channelsObj[action.channelId]?.messageIds
          }
        }
      };
    case 'TRIM_SUBCHANNEL_MESSAGES': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds:
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
                  ?.length > 20
                  ? prevChannelObj?.subchannelObj?.[
                      action.subchannelId
                    ]?.messageIds?.filter(
                      (_: number, index: number) => index <= 20
                    )
                  : prevChannelObj?.subchannelObj?.[action.subchannelId]
                      ?.messageIds,
              loadMoreButtonShown:
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
                  ?.length > 20
                  ? true
                  : prevChannelObj?.subchannelObj?.[action.subchannelId]
                      ?.loadMoreButtonShown
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            subchannelObj
          }
        }
      };
    }
    case 'UPDATE_CURRENT_TRANSACTION_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            currentTransactionId: action.transactionId
          }
        }
      };
    case 'UPDATE_CHANNEL_PATH_ID_HASH':
      return {
        ...state,
        channelPathIdHash: {
          ...state.channelPathIdHash,
          [action.pathId]: action.channelId
        }
      };
    case 'UPDATE_LAST_SUBCHANNEL_PATH':
      return {
        ...state,
        lastSubchannelPaths: {
          ...state.lastSubchannelPaths,
          [action.channelId]: action.path
        }
      };
    case 'ACCEPT_TRANSACTION':
      return {
        ...state,
        acceptedTransactions: {
          ...state.acceptedTransactions,
          [action.transactionId]: true
        }
      };
    case 'CANCEL_TRANSACTION':
      return {
        ...state,
        cancelledTransactions: {
          ...state.cancelledTransactions,
          [action.transactionId]: action.reason
        }
      };
    case 'UPDATE_UPLOAD_PROGRESS': {
      const targetId =
        action.channelId +
        (action.subchannelId ? `/${action.subchannelId}` : '');
      return {
        ...state,
        filesBeingUploaded: {
          ...state.filesBeingUploaded,
          [targetId]: state.filesBeingUploaded[targetId]?.map(
            (file: { filePath: string }) =>
              file.filePath === action.path
                ? {
                    ...file,
                    uploadProgress: action.progress
                  }
                : file
          )
        }
      };
    }
    case 'UPDATE_LAST_CHESS_MESSAGE_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            ...resolveLatestBoardMessageState({
              currentActiveBoardMessageId:
                state.channelsObj[action.channelId]?.lastChessMessageId,
              currentLatestBoardMessageId:
                state.channelsObj[action.channelId]?.latestChessBoardMessageId,
              currentTerminalMessageId:
                state.channelsObj[action.channelId]?.lastChessTerminalMessageId,
              currentPendingTerminalToken:
                state.channelsObj[action.channelId]
                  ?.lastChessPendingTerminalToken,
              nextBoardMessageId: action.messageId,
              nextTerminalMessageId: action.terminalMessageId,
              boardMessageKey: 'lastChessMessageId',
              latestBoardMessageKey: 'latestChessBoardMessageId',
              terminalMessageKey: 'lastChessTerminalMessageId',
              pendingTerminalTokenKey: 'lastChessPendingTerminalToken'
            })
          }
        }
      };
    case 'UPDATE_LAST_OMOK_MESSAGE_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            ...resolveLatestBoardMessageState({
              currentActiveBoardMessageId:
                state.channelsObj[action.channelId]?.lastOmokMessageId,
              currentLatestBoardMessageId:
                state.channelsObj[action.channelId]?.latestOmokBoardMessageId,
              currentTerminalMessageId:
                state.channelsObj[action.channelId]?.lastOmokTerminalMessageId,
              currentPendingTerminalToken:
                state.channelsObj[action.channelId]
                  ?.lastOmokPendingTerminalToken,
              nextBoardMessageId: action.messageId,
              nextTerminalMessageId: action.terminalMessageId,
              boardMessageKey: 'lastOmokMessageId',
              latestBoardMessageKey: 'latestOmokBoardMessageId',
              terminalMessageKey: 'lastOmokTerminalMessageId',
              pendingTerminalTokenKey: 'lastOmokPendingTerminalToken'
            })
          }
        }
      };
    case 'UPDATE_LAST_CHESS_MOVE_VIEWER_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            lastChessMoveViewerId: action.viewerId
          }
        }
      };
    case 'UPDATE_LAST_OMOK_MOVE_VIEWER_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            lastOmokMoveViewerId: action.viewerId
          }
        }
      };
    case 'UPDATE_LATEST_PATH_ID': {
      return {
        ...state,
        latestPathId: action.pathId
      };
    }
    case 'UPDATE_RECENT_CHESS_MESSAGE':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            recentChessMessage: action.message
          }
        }
      };
    case 'UPDATE_RECENT_OMOK_MESSAGE':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            recentOmokMessage: action.message
          }
        }
      };
    case 'UPDATE_MOST_RECENT_AI_CARD_OFFER_TIMESTAMP':
      return {
        ...state,
        mostRecentOfferTimeStamp: action.timeStamp
      };
    case 'UPDATE_NUM_SUMMONED': {
      return {
        ...state,
        numCardSummonedToday: action.numSummoned
      };
    }
    case 'UPDATE_CHAT_TYPE': {
      return {
        ...state,
        chatType: action.chatType
      };
    }
    case 'UPDATE_SELECTED_CHANNEL_ID': {
      return {
        ...state,
        chatType: null,
        selectedChannelId: action.channelId
      };
    }
    case 'WITHDRAW_OUTGOING_OFFER': {
      return {
        ...state,
        outgoingOffers: state.outgoingOffers.filter(
          (offer: { id: number }) => offer.id !== action.offerId
        )
      };
    }
    case 'SET_CHESS_PUZZLE_MODAL_SHOWN': {
      return {
        ...state,
        chessPuzzleModalShown: action.shown
      };
    }
    case 'SET_THINK_HARD': {
      const updatedThinkHard = {
        ...state.thinkHard,
        [action.aiType]: {
          ...state.thinkHard[action.aiType],
          [action.topicId || 'global']: action.thinkHard
        }
      };
      return {
        ...state,
        thinkHard: updatedThinkHard
      };
    }
    case 'UPDATE_VISITED_CHANNEL':
      return {
        ...state,
        visitedChannelIds: {
          ...state.visitedChannelIds,
          [action.channelId]: true
        }
      };
    default:
      return state;
  }
}

function getBookmarkLists(bookmarks?: BookmarkListMap) {
  return {
    ai: bookmarks?.ai ? [...bookmarks.ai] : [],
    me: bookmarks?.me ? [...bookmarks.me] : []
  };
}

// last*MessageId tracks the newest board that is still playable.
// latest*BoardMessageId tracks the newest board row regardless of whether the
// game is already finished.
// last*TerminalMessageId tracks the newest row that ended a game so historical
// board rows cannot become "current" again when they mount later.
// last*PendingTerminalToken tracks a live terminal row that has not been given a
// comparable numeric message id yet (socket result rows arrive this way).
function resolveLatestBoardMessageState({
  currentActiveBoardMessageId,
  currentLatestBoardMessageId,
  currentTerminalMessageId,
  currentPendingTerminalToken,
  nextBoardMessageId,
  nextTerminalMessageId,
  boardMessageKey,
  latestBoardMessageKey,
  terminalMessageKey,
  pendingTerminalTokenKey
}: {
  currentActiveBoardMessageId?: number | null;
  currentLatestBoardMessageId?: number | null;
  currentTerminalMessageId?: number | null;
  currentPendingTerminalToken?: string | null;
  nextBoardMessageId?: number | null;
  nextTerminalMessageId?: number | string | null;
  boardMessageKey: 'lastChessMessageId' | 'lastOmokMessageId';
  latestBoardMessageKey:
    'latestChessBoardMessageId' | 'latestOmokBoardMessageId';
  terminalMessageKey:
    'lastChessTerminalMessageId' | 'lastOmokTerminalMessageId';
  pendingTerminalTokenKey:
    'lastChessPendingTerminalToken' | 'lastOmokPendingTerminalToken';
}) {
  const currentActiveBoardId =
    typeof currentActiveBoardMessageId === 'number'
      ? currentActiveBoardMessageId
      : null;
  const currentLatestBoardId =
    typeof currentLatestBoardMessageId === 'number'
      ? currentLatestBoardMessageId
      : null;
  const currentTerminalId =
    typeof currentTerminalMessageId === 'number' ? currentTerminalMessageId : 0;
  const nextTerminalId =
    typeof nextTerminalMessageId === 'number' ? nextTerminalMessageId : null;
  const nextPendingTerminalToken =
    typeof nextTerminalMessageId === 'string' && nextTerminalMessageId
      ? nextTerminalMessageId
      : null;
  const nextBoardId =
    typeof nextBoardMessageId === 'number' ? nextBoardMessageId : null;
  const appliedTerminalId =
    nextTerminalId === null
      ? currentTerminalId
      : Math.max(currentTerminalId, nextTerminalId);
  let appliedPendingTerminalToken =
    nextPendingTerminalToken || currentPendingTerminalToken || null;
  if (nextTerminalId !== null) {
    appliedPendingTerminalToken = null;
  }
  const appliedLatestBoardId =
    nextBoardId === null
      ? currentLatestBoardId
      : currentLatestBoardId === null
        ? nextBoardId
        : Math.max(currentLatestBoardId, nextBoardId);

  if (nextBoardId !== null) {
    if (appliedPendingTerminalToken) {
      if (
        typeof currentLatestBoardId === 'number' &&
        nextBoardId <= currentLatestBoardId
      ) {
        return {
          [boardMessageKey]: null,
          [latestBoardMessageKey]: appliedLatestBoardId,
          [terminalMessageKey]: appliedTerminalId || null,
          [pendingTerminalTokenKey]: appliedPendingTerminalToken
        };
      }
      appliedPendingTerminalToken = null;
    }
    if (nextBoardId <= appliedTerminalId) {
      return {
        [boardMessageKey]:
          typeof currentActiveBoardId === 'number' &&
          currentActiveBoardId > appliedTerminalId
            ? currentActiveBoardId
            : null,
        [latestBoardMessageKey]: appliedLatestBoardId,
        [terminalMessageKey]: appliedTerminalId || null,
        [pendingTerminalTokenKey]: appliedPendingTerminalToken
      };
    }
    return {
      [boardMessageKey]:
        currentActiveBoardId === null
          ? nextBoardId
          : Math.max(currentActiveBoardId, nextBoardId),
      [latestBoardMessageKey]: appliedLatestBoardId,
      [terminalMessageKey]: appliedTerminalId || null,
      [pendingTerminalTokenKey]: appliedPendingTerminalToken
    };
  }

  if (nextBoardMessageId === null) {
    if (nextTerminalId === null) {
      return {
        [boardMessageKey]:
          appliedPendingTerminalToken === null ? currentActiveBoardId : null,
        [latestBoardMessageKey]: appliedLatestBoardId,
        [terminalMessageKey]: appliedTerminalId || null,
        [pendingTerminalTokenKey]: appliedPendingTerminalToken
      };
    }
    return {
      [boardMessageKey]:
        typeof currentActiveBoardId === 'number' &&
        currentActiveBoardId > nextTerminalId
          ? currentActiveBoardId
          : null,
      [latestBoardMessageKey]: appliedLatestBoardId,
      [terminalMessageKey]: appliedTerminalId || null,
      [pendingTerminalTokenKey]: appliedPendingTerminalToken
    };
  }

  return {
    [boardMessageKey]: currentActiveBoardId,
    [latestBoardMessageKey]: appliedLatestBoardId,
    [terminalMessageKey]: appliedTerminalId || null,
    [pendingTerminalTokenKey]: appliedPendingTerminalToken
  };
}
