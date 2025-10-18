import { useMemo, type CSSProperties } from 'react';
import { useKeyContext } from '~/contexts';
import { Color, getThemeStyles } from '~/constants/css';
import { getThemeRoles, ThemeName } from '.';

interface HomePanelVars extends CSSProperties {
  ['--home-panel-bg']?: string;
  ['--home-panel-tint']?: string;
  ['--home-panel-border']?: string;
  ['--home-panel-heading']?: string;
  ['--home-panel-accent']?: string;
  ['--home-panel-card-border']?: string;
}

export function useHomePanelVars(intensity = 0.12) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => (profileTheme || 'logoBlue') as ThemeName,
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
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
    const border = themeStyles.border || Color.borderGray(0.65);
    return {
      ['--home-panel-bg']: '#ffffff',
      ['--home-panel-tint']:
        themeStyles.hoverBg || accentTint || Color.logoBlue(0.12),
      ['--home-panel-border']: border,
      ['--home-panel-heading']: headingColor,
      ['--home-panel-accent']: accentColor,
      ['--home-panel-card-border']: border
    };
  }, [
    accentColor,
    accentTint,
    headingColor,
    themeStyles.border,
    themeStyles.hoverBg
  ]);

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
