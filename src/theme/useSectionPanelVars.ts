import { useMemo, type CSSProperties } from 'react';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { getThemeRoles, ThemeName } from '.';
import { resolveColorValue } from './resolveColor';

interface SectionPanelOptions {
  customThemeName?: string | ThemeName;
}

export function useSectionPanelVars(options: SectionPanelOptions = {}) {
  const { customThemeName } = options;
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => (customThemeName || viewerTheme || 'logoBlue') as ThemeName,
    [customThemeName, viewerTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
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

  function setAlphaExact(rgba: string, a: number) {
    const m = rgba.match(
      /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
    );
    if (!m) return rgba;
    const [_, r, g, b] = m;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
  }

  const panelBodyBg = useMemo(() => '#fff', []);
  const panelBorderColor = useMemo(
    () => setAlphaExact(accentColor, 0.28),
    [accentColor]
  );
  const headerDividerColor = useMemo(
    () => setAlphaExact(accentColor, 0.12),
    [accentColor]
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
        ['--section-panel-bg' as const]: '#fff',
        ['--section-panel-header-bg' as const]: '#fff',
        ['--section-panel-body-bg' as const]: panelBodyBg,
        ['--section-panel-border-color' as const]: panelBorderColor,
        ['--section-panel-header-divider-color' as const]: headerDividerColor,
        ['--section-panel-accent' as const]: accentColor
      } as CSSProperties),
    [accentColor, panelBodyBg, panelBorderColor, headerDividerColor]
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
