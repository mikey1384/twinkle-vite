import { Color } from '~/constants/css';

export type ColorResolver = ((opacity?: number) => string) | undefined;

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
