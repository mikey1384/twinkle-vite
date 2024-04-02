export const scrollPositions: Record<string, number> = {};
export const placeholderHeights: Record<string, number> = {};
export const visibles: Record<string, boolean> = {};
export const richTextHeights: Record<string, Record<string, number>> = {};
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
