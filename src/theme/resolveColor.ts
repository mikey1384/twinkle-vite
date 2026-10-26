import { Color } from '~/constants/css';

export type ColorResolver = ((opacity?: number) => string) | undefined;

// Server-owned theme names can outlive the palette in an open browser tab.
// Unlike resolveColor's CSS-value support, these callers need a known key.
export function resolvePaletteColorKey(colorKey: unknown): string {
  return typeof colorKey === 'string' &&
    Object.prototype.hasOwnProperty.call(Color, colorKey) &&
    typeof Color[colorKey] === 'function'
    ? colorKey
    : 'logoBlue';
}

interface ResolveColorOptions {
  colorKey?: string;
  opacity?: number;
}

export function resolveColor({
  colorKey,
  opacity
}: ResolveColorOptions): {
  color: string | undefined;
  resolver: ColorResolver;
} {
  if (!colorKey) {
    return { color: undefined, resolver: undefined };
  }
  const candidate = Color[colorKey as keyof typeof Color];
  if (typeof candidate === 'function') {
    return {
      color: typeof opacity === 'number' ? candidate(opacity) : candidate(),
      resolver: candidate
    };
  }
  if (typeof candidate === 'string') {
    return { color: candidate, resolver: undefined };
  }
  return { color: colorKey, resolver: undefined };
}

export function resolveColorValue(
  colorKey?: string,
  opacity?: number
): string | undefined {
  return resolveColor({ colorKey, opacity }).color;
}
