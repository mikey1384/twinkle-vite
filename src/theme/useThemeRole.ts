import { useMemo } from 'react';
import { useKeyContext } from '~/contexts';
import { getThemeRoles, ThemeName } from '.';
import { useOptionalRootTheme } from './RootThemeProvider';

interface UseThemeRoleOptions {
  themeName?: string | ThemeName;
}

export function useThemeRole(role: string, options: UseThemeRoleOptions = {}) {
  const rootTheme = useOptionalRootTheme();
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const { themeName: overrideThemeName } = options;

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

  return themeRoles[role];
}

export function useThemeRoles(options: UseThemeRoleOptions = {}) {
  const rootTheme = useOptionalRootTheme();
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const { themeName: overrideThemeName } = options;

  const themeName = useMemo<ThemeName>(
    () =>
      (overrideThemeName ||
        rootTheme?.themeName ||
        viewerTheme ||
        'logoBlue') as ThemeName,
    [overrideThemeName, rootTheme?.themeName, viewerTheme]
  );

  if (!overrideThemeName && rootTheme && rootTheme.themeName === themeName) {
    return rootTheme.themeRoles;
  }

  return getThemeRoles(themeName);
}
