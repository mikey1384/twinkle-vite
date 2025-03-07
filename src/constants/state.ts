export const fullTextStates: Record<string, boolean> = {};
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
