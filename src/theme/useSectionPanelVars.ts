import { useMemo, type CSSProperties } from 'react';
import { useKeyContext } from '~/contexts';
import { Color, getThemeStyles } from '~/constants/css';
import { getThemeRoles, ThemeName } from '.';
import { resolveColorValue } from './resolveColor';

interface SectionPanelOptions {
  customThemeName?: string | ThemeName;
  intensity?: number;
  bodyBlendWeight?: number;
}

function blendWithWhite(color: string | undefined, weight: number): string {
  if (!color) return '#fbfcff';
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

export function useSectionPanelVars(options: SectionPanelOptions = {}) {
  const { customThemeName, intensity = 0.12, bodyBlendWeight = 0.97 } = options;
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => (customThemeName || viewerTheme || 'logoBlue') as ThemeName,
    [customThemeName, viewerTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, intensity),
    [themeName, intensity]
  );
  const sectionPanelRole = themeRoles.sectionPanel;
  const sectionPanelTextRole = themeRoles.sectionPanelText;

  const accentColorKey =
    (typeof sectionPanelRole?.color === 'string' && sectionPanelRole.color) ||
    themeName;
  const accentColor = useMemo(() => {
    const fromRole = resolveColorValue(
      sectionPanelRole?.color,
      sectionPanelRole?.opacity
    );
    if (fromRole) return fromRole;
    return resolveColorValue(themeName) || Color.logoBlue();
  }, [sectionPanelRole?.color, sectionPanelRole?.opacity, themeName]);

  const panelBodyBg = useMemo(
    () => blendWithWhite(accentColor, bodyBlendWeight),
    [accentColor, bodyBlendWeight]
  );
  const panelBorderColor = useMemo(
    () => themeStyles.border || Color.borderGray(0.65),
    [themeStyles.border]
  );

  const headerTextColor =
    resolveColorValue(
      sectionPanelTextRole?.color,
      sectionPanelTextRole?.opacity
    ) || Color.darkerGray();
  const headerTextShadowColor = resolveColorValue(sectionPanelTextRole?.shadow);
  const headerTextShadow = headerTextShadowColor
    ? `0 0.05rem ${headerTextShadowColor}`
    : 'none';

  const successColor = useMemo(() => {
    const colorKey = themeRoles.success?.color;
    if (colorKey && Color[colorKey as keyof typeof Color]) {
      return colorKey;
    }
    return 'green';
  }, [themeRoles.success?.color]);

  const styleVars = useMemo(
    () =>
      ({
        ['--section-panel-bg' as const]: '#ffffff',
        ['--section-panel-header-bg' as const]: '#ffffff',
        ['--section-panel-body-bg' as const]: panelBodyBg,
        ['--section-panel-border-color' as const]: panelBorderColor,
        ['--section-panel-accent' as const]: accentColor
      } as CSSProperties),
    [accentColor, panelBodyBg, panelBorderColor]
  );

  return {
    themeName,
    accentColorKey,
    accentColor,
    headerTextColor,
    headerTextShadow,
    successColor,
    panelBorderColor,
    styleVars
  };
}
