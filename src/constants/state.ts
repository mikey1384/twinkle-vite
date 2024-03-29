export const scrollPositions: Record<string, number> = {};
export const placeholderHeights: Record<string, number> = {};
export const visibles: Record<string, boolean> = {};
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
