import { useMemo, type CSSProperties } from 'react';
import { Color, getThemeStyles } from '~/constants/css';
import { useRootTheme } from './RootThemeProvider';

interface HomePanelVars extends CSSProperties {
  ['--home-panel-bg']?: string;
  ['--home-panel-tint']?: string;
  ['--home-panel-border']?: string;
  ['--home-panel-heading']?: string;
  ['--home-panel-accent']?: string;
  ['--home-panel-card-border']?: string;
}

function blendWithWhite(color: string | undefined, weight: number): string {
  if (!color) return '#ffffff';
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

export function useHomePanelVars(
  intensity = 0.08,
  options: { neutralSurface?: boolean } = {}
) {
  const { neutralSurface = false } = options;
  const { themeName, themeRoles } = useRootTheme();
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, intensity),
    [themeName, intensity]
  );
  const headingColor = useMemo(() => {
    const colorKey = themeRoles.sectionPanelText?.color as
      | keyof typeof Color
      | undefined;
    const fn =
      colorKey &&
      (Color[colorKey] as ((opacity?: number) => string) | undefined);
    return fn ? fn() : Color.darkerGray();
  }, [themeRoles.sectionPanelText?.color]);
  const accentColor = useMemo(() => {
    const colorKey = themeRoles.sectionPanel?.color as
      | keyof typeof Color
      | undefined;
    const fn =
      colorKey &&
      (Color[colorKey] as ((opacity?: number) => string) | undefined);
    return fn ? fn() : Color.logoBlue();
  }, [themeRoles.sectionPanel?.color]);
  const accentTint = useMemo(() => {
    const colorKey = themeRoles.sectionPanel?.color as
      | keyof typeof Color
      | undefined;
    const fn =
      colorKey &&
      (Color[colorKey] as ((opacity?: number) => string) | undefined);
    if (fn) return fn(0.14);
    return Color.logoBlue(0.14);
  }, [themeRoles.sectionPanel?.color]);
  const panelVars = useMemo<HomePanelVars>(() => {
    const border = 'var(--ui-border)';
    const surfaceTint = blendWithWhite(
      themeStyles.hoverBg || accentTint || Color.logoBlue(0.12),
      0.96
    );
    return {
      ['--home-panel-bg']: '#ffffff',
      ['--home-panel-tint']:
        themeStyles.hoverBg || accentTint || Color.logoBlue(0.12),
      ['--home-panel-surface']: neutralSurface ? '#ffffff' : surfaceTint,
      ['--home-panel-border']: border,
      ['--home-panel-heading']: headingColor,
      ['--home-panel-accent']: accentColor,
      ['--home-panel-card-border']: border
    } as HomePanelVars;
  }, [accentColor, accentTint, headingColor, themeStyles.hoverBg, neutralSurface]);

  return {
    accentColor,
    accentTint,
    headingColor,
    panelVars,
    themeName,
    themeRoles,
    themeStyles
  };
}
