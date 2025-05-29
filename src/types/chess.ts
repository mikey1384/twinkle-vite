// Chess-related type definitions
export interface ChessLevelsResponse {
  levels: Array<{
    level: number;
    floor: number;
    ceil: number;
  }>;
  currentLevel: number;
  maxLevelUnlocked: number;
}
