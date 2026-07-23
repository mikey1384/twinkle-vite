export interface ChatQuickAccessPartner {
  id: number;
  username: string;
  profilePicUrl: string | null;
  channelId: number | null;
  pathId: number | null;
  favorited: boolean;
  isAi: boolean;
}

export type BackgroundGroupNotificationMode = 'all' | 'mentions' | 'off';

export interface ChatNotificationPreferences {
  backgroundDirectMessages: boolean;
  backgroundGroupMode: BackgroundGroupNotificationMode;
  backgroundAiReplies: boolean;
  closedDirectMessages: boolean;
  closedGroupMentions: boolean;
}

export interface MutedChatConversation {
  channelId: number;
  title: string;
  twoPeople: boolean;
  updatedAt: number;
}

export interface ChatNotificationSettings {
  userId: number;
  revision: number;
  preferences: ChatNotificationPreferences;
  mutedChannelIds: number[];
  mutedConversations: MutedChatConversation[];
}

export type ChatQuickAccessMode = 'automatic' | 'custom';

export interface ChatQuickAccessState {
  revision: number;
  mode: ChatQuickAccessMode;
  partners: ChatQuickAccessPartner[];
}

export interface ChatChannelSummary {
  id: number;
  [key: string]: unknown;
}

export interface CanonicalChatFavoriteState {
  allFavoriteChannelIds: Record<number, boolean>;
  favoriteChannelIds: number[];
  favoriteLoadMoreButton: boolean;
  favoriteStateRevision: number;
  favorited: boolean;
  favoriteChannels: ChatChannelSummary[];
  favoriteChannel: ChatChannelSummary | null;
}

export interface CanonicalChatSidebarState {
  quickAccess?: ChatQuickAccessState;
  favoriteState?: CanonicalChatFavoriteState;
  channelVisibility?: CanonicalChatChannelVisibility;
}

export interface CanonicalChatChannelVisibility {
  channelId: number;
  isHidden: boolean;
  revision: number;
  lastMessageId: number;
}

export interface ChatReaction {
  type: string;
  userId: number;
}

export interface ChatLastReaction {
  userId: number;
  reaction: string;
  messageId: number;
  subchannelId: number;
  timeStamp: number;
  reactionStateRevision: number;
  reactionActivityRevision: number;
}

export interface CanonicalChatReactionActivity {
  revision: number;
  lastUpdated: number;
  lastMessageId: number;
  lastReaction: ChatLastReaction | null;
  changed: boolean;
}

export interface CanonicalChatReactionUpdate {
  messageId: number;
  channelId: number;
  subchannelId: number;
  mutation: 'add' | 'remove';
  reaction: string;
  userId: number;
  reactions: ChatReaction[];
  reactionStateRevision: number;
  changed: boolean;
  twoPeople: boolean;
  timeStamp: number;
  channelActivity: CanonicalChatReactionActivity;
  requiresSidebarResync?: boolean;
}

export interface CanonicalChatUnreadScopeState {
  lastRead: number;
  numUnreads: number;
  lastUnreadUserId: number | null;
  lastUnreadReaction: string | null;
  lastUnreadMessageId: number | null;
  lastUnreadReactionTimeStamp: number | null;
}

export interface CanonicalChatChannelUnreadState {
  channelId: number;
  subchannelId: number;
  reactionActivityRevision: number;
  channel: CanonicalChatUnreadScopeState;
  subchannel: CanonicalChatUnreadScopeState | null;
  channelVisibility?: CanonicalChatChannelVisibility;
  quickAccess?: ChatQuickAccessState;
}
