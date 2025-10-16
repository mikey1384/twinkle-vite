import React, { useMemo } from 'react';
import { panel } from '../Styles';
import { useHomeContext, useKeyContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';
import { Color, getThemeStyles } from '~/constants/css';

export default function ActivitySuggester({
  style
}: {
  style?: React.CSSProperties;
}) {
  const topMenuSection = useHomeContext((v) => v.state.topMenuSection);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((profileTheme || 'logoBlue') as ThemeName),
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, 0.12),
    [themeName]
  );
  const headingColorKey = themeRoles.sectionPanelText?.color as
    | keyof typeof Color
    | undefined;
  const headingColorFn =
    headingColorKey && (Color[headingColorKey] as
      | ((opacity?: number) => string)
      | undefined);
  const headingColor = headingColorFn
    ? headingColorFn()
    : Color.darkerGray();
  const accentColorKey = themeRoles.sectionPanel?.color as
    | keyof typeof Color
    | undefined;
  const accentColorFn =
    accentColorKey && (Color[accentColorKey] as
      | ((opacity?: number) => string)
      | undefined);
  const accentColor = accentColorFn ? accentColorFn() : Color.logoBlue();
  const accentTint = accentColorFn
    ? accentColorFn(0.14)
    : Color.logoBlue(0.14);
  const panelVars = useMemo(
    () =>
      ({
        ['--earn-panel-bg' as const]: '#ffffff',
        ['--earn-panel-tint' as const]:
          themeStyles.hoverBg || accentTint || Color.logoBlue(0.12),
        ['--earn-panel-border' as const]: themeStyles.border,
        ['--earn-panel-heading' as const]: headingColor,
        ['--earn-panel-accent' as const]: accentColor,
        ['--earn-card-border' as const]: themeStyles.border
      }) as React.CSSProperties,
    [accentColor, accentTint, headingColor, themeStyles.border, themeStyles.hoverBg]
  );
  const combinedStyle = useMemo(() => {
    if (!style) return panelVars;
    return { ...panelVars, ...style };
  }, [panelVars, style]);

  return (
    <ScopedTheme
      theme={themeName}
      roles={['sectionPanel', 'sectionPanelText']}
      className={panel}
      style={combinedStyle}
    >
      {topMenuSection === 'start' ? (
        <StartMenu />
      ) : topMenuSection === 'subject' ? (
        <EarnXPFromSubjects />
      ) : topMenuSection === 'recommend' ? (
        <RecommendPosts />
      ) : (
        <RewardPosts />
      )}
    </ScopedTheme>
  );
}
