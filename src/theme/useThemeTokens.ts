import { useMemo } from 'react';
import { useKeyContext } from '~/contexts';
import { getThemeStyles } from '~/constants/css';
import { getThemeRoles, ThemeName } from '.';
import { useOptionalRootTheme } from './RootThemeProvider';

interface UseThemeTokensOptions {
  themeName?: string | ThemeName;
  intensity?: number;
}

export function useThemeTokens(options: UseThemeTokensOptions = {}) {
  const rootTheme = useOptionalRootTheme();
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const { themeName: overrideThemeName, intensity = 0.12 } = options;
  const themeName = useMemo<ThemeName>(
    () =>
      (overrideThemeName ||
        rootTheme?.themeName ||
        viewerTheme ||
        'logoBlue') as ThemeName,
    [overrideThemeName, rootTheme?.themeName, viewerTheme]
  );
  const themeRoles = useMemo(() => {
    if (!overrideThemeName && rootTheme && rootTheme.themeName === themeName) {
      return rootTheme.themeRoles;
    }
    return getThemeRoles(themeName);
  }, [overrideThemeName, rootTheme, themeName]);
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, intensity),
    [themeName, intensity]
  );

  return {
    themeName,
    themeRoles,
    themeStyles
  };
}
