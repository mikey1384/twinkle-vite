export interface FullTextSectionState {
  fullTextShown: boolean;
  textLength: number;
}

export interface FullTextStates {
  [key: string]: {
    [section: string]: FullTextSectionState;
  };
}

export const fullTextStates: FullTextStates = {};
export const userIdRef: Record<string, any> = { current: null };
export const inputStates: Record<string, boolean> = {};
export const editFormTextStates: Record<string, any> = {};
export const placeholderHeights: Record<string, number> = {};
export const richTextHeights: Record<string, Record<string, number>> = {};
export const scrollPositions: Record<string, number> = {};
export const currentTimes: Record<string, number> = {};
export const isRewardCollected: Record<string, boolean> = {};
export const MessageHeights: Record<string, any> = {};
export const vocabScrollHeight: Record<string, number> = { current: 0 };
export const aiCardScrollHeight: Record<string, number> = { current: 0 };
export const aiCardFeedHeight: Record<string, number> = { current: 0 };
export const vocabFeedHeight: Record<string, number> = { current: 0 };
export const vocabContainerRef: Record<string, any> = { current: null };
export const audioRef: Record<string, any> = {
  player: null,
  key: ''
};

// Add global merge state information
export const mergeStates: Record<
  string,
  {
    inProgress: boolean;
    progress: number;
    stage: string;
    completedTimestamp: number;
  }
> = {};

// Add global translation state information
export const translationStates: Record<
  string,
  {
    inProgress: boolean;
    audioProgress: number;
    audioStage: string;
    translationProgress: number;
    translationStage: string;
    completedTimestamp: number;
    current?: number;
    total?: number;
    warning?: string;
  }
> = {};

// Add global subtitle video player reference
export const subtitleVideoPlayer: {
  instance: any;
  isReady: boolean;
  lastAccessed: number;
} = {
  instance: null,
  isReady: false,
  lastAccessed: 0
};

// Add global subtitles state
export const subtitlesState: {
  segments: Array<{
    index: number;
    start: number;
    end: number;
    text: string;
  }>;
  editingTimes: Record<string, string>;
  lastEdited: number;
  videoId: string | null;
} = {
  segments: [],
  editingTimes: {},
  lastEdited: 0,
  videoId: null
};

// Helper to clean up message-related caches when messages are trimmed
export function cleanupMessageCaches(messageIds: (number | string)[]) {
  for (const messageId of messageIds) {
    // Clean MessageHeights (keyed by messageId)
    delete MessageHeights[messageId];

    // Clean fullTextStates and richTextHeights (keyed by "chat-{messageId}")
    const chatKey = `chat-${messageId}`;
    delete fullTextStates[chatKey];
    delete richTextHeights[chatKey];

    // Clean from global messages store
    delete messagesStore[messageId];
  }
}

// Global messages store - stores message content outside React state
// This allows for better memory management and avoids React overhead
// No eviction needed - plain JS objects are much more memory-efficient than React state
export const messagesStore: Record<string | number, any> = {};

// Get a message from the store
export function getMessage(messageId: string | number): any {
  return messagesStore[messageId];
}

// Store a message (or update existing)
export function setMessage(messageId: string | number, message: any): void {
  messagesStore[messageId] = message;
}

// Store multiple messages at once
export function setMessages(messages: Record<string | number, any>): void {
  for (const [id, message] of Object.entries(messages)) {
    setMessage(id, message);
  }
}

// Delete a message from the store
export function deleteMessage(messageId: string | number): void {
  delete messagesStore[messageId];
}

// Get multiple messages by IDs
export function getMessages(messageIds: (string | number)[]): Record<string | number, any> {
  const result: Record<string | number, any> = {};
  for (const id of messageIds) {
    const message = getMessage(id);
    if (message) {
      result[id] = message;
    }
  }
  return result;
}
