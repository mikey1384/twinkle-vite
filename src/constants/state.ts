export const fullTextStates: Record<
  string,
  Record<
    string,
    {
      fullTextShown: boolean;
      textLength: number;
    }
  >
> = {};
export const userIdRef = { current: null };
export const inputStates: Record<string, string> = {};
export const editFormTextStates: Record<string, string> = {};
export const placeholderHeights: Record<string, number> = {};
export const richTextHeights: Record<string, Record<string, number>> = {};
export const scrollPositions: Record<string, number> = {};
export const currentTimes: Record<string, number> = {};
export const isRewardCollected: Record<string, boolean> = {};
export const MessageHeights: Record<string, any> = {};
export const vocabScrollHeight: Record<string, number> = { current: 0 };
export const aiCardScrollHeight: Record<string, number> = { current: 0 };
export const vocabFeedHeight: Record<string, number> = { current: 0 };
export const audioRef: Record<string, any> = {
  player: null,
  key: ''
};
