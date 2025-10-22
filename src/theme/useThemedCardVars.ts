import { useMemo, type CSSProperties } from 'react';
import { useKeyContext } from '~/contexts';
import { Color, getThemeStyles } from '~/constants/css';
import { getThemeRoles, ThemeName } from '.';
import { resolveColorValue } from './resolveColor';

interface ThemedCardOptions {
  role?: string;
  intensity?: number;
  accentColor?: string;
  fallbackColor?: string;
  blendWeight?: number;
  borderFallback?: string;
  themeName?: ThemeName | string;
}

function blendWithWhite(color: string | undefined, weight: number): string {
  if (!color) return '#f7f9ff';
  const trimmed = color.trim();
  const hexMatch = trimmed.match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) {
    const [r, g, b] = [
      parseInt(hexMatch[1].slice(0, 2), 16),
      parseInt(hexMatch[1].slice(2, 4), 16),
      parseInt(hexMatch[1].slice(4, 6), 16)
    ];
    const w = Math.max(0, Math.min(1, weight));
    const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
    return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, 1)`;
  }
  const rgbaMatch = trimmed.match(
    /rgba?\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)(?:,\s*([-\d.]+))?\)/i
  );
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    const w = Math.max(0, Math.min(1, weight));
    const mix = (channel: string | number) =>
      Math.round(Number(channel) * (1 - w) + 255 * w);
    return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, 1)`;
  }
  return color;
}

export function useThemedCardVars(options: ThemedCardOptions = {}) {
  const {
    role,
    intensity = 0.12,
    accentColor: accentOverride,
    fallbackColor,
    blendWeight = 0.92,
    borderFallback,
    themeName: themeNameOverride
  } = options;
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => (themeNameOverride || viewerTheme || 'logoBlue') as ThemeName,
    [themeNameOverride, viewerTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, intensity),
    [themeName, intensity]
  );
  const roleToken = role ? themeRoles[role] : undefined;

  const accentColor = useMemo(() => {
    const override = resolveColorValue(accentOverride);
    if (override) return override;
    const fromRole = resolveColorValue(roleToken?.color, roleToken?.opacity);
    if (fromRole) return fromRole;
    const fallback = resolveColorValue(fallbackColor);
    if (fallback) return fallback;
    return Color.logoBlue();
  }, [accentOverride, fallbackColor, roleToken?.color, roleToken?.opacity]);

  function setAlphaExact(rgba: string, a: number) {
    const m = rgba.match(
      /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
    );
    if (!m) return rgba;
    const [_, r, g, b] = m;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
  }

  const cardBg = useMemo(() => 'transparent', []);

  const borderColor = useMemo(() => {
    const fallback = borderFallback && resolveColorValue(borderFallback);
    const resolved = resolveColorValue(accentColor);
    if (fallback) return fallback;
    if (resolved) return setAlphaExact(resolved, 0.35);
    return 'var(--ui-border)';
  }, [accentColor, borderFallback]);

  const cardVars = useMemo(
    () =>
      ({
        ['--themed-card-bg' as const]: cardBg,
        ['--themed-card-border' as const]: borderColor,
        ['--themed-card-accent' as const]: accentColor
      } as CSSProperties),
    [accentColor, borderColor, cardBg]
  );

  return {
    accentColor,
    cardBg,
    borderColor,
    cardVars,
    themeName,
    themeRoles,
    themeStyles
  };
}
