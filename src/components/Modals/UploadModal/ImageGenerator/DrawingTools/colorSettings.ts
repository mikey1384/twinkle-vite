import { COMMON_COLORS } from './constants';

export const DEFAULT_DRAWING_COLOR = '#000000';
const MAX_RECENT_COLORS = 6;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isValidDrawingColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value);
}

export function normalizeDrawingColor(value: unknown): string {
  if (!isValidDrawingColor(value)) {
    return DEFAULT_DRAWING_COLOR;
  }
  return value.toLowerCase();
}

export function normalizeRecentDrawingColors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Set<string>();
  const normalized: string[] = [];
  for (const item of value) {
    if (!isValidDrawingColor(item)) continue;
    const color = item.toLowerCase();
    if (COMMON_COLORS.includes(color) || deduped.has(color)) continue;
    deduped.add(color);
    normalized.push(color);
    if (normalized.length >= MAX_RECENT_COLORS) break;
  }
  return normalized;
}

export function extractDrawingColorSettings(settings: any): {
  color: string;
  recentColors: string[];
} {
  const imageEditorSettings = settings?.imageEditor || {};
  return {
    color: normalizeDrawingColor(imageEditorSettings.color),
    recentColors: normalizeRecentDrawingColors(imageEditorSettings.recentColors)
  };
}
