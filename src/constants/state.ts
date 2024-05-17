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
export const placeholderHeights: Record<string, number> = {};
export const richTextHeights: Record<string, Record<string, number>> = {};
export const scrollPositions: Record<string, number> = {};
export const currentTimes: Record<string, number> = {};
export const audioRef: Record<string, HTMLAudioElement | null> = {
  current: null
};
