import { useMemo } from 'react';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { getThemeRoles, ThemeName } from '.';
import { useOptionalRootTheme } from './RootThemeProvider';
import { resolveColor, resolveColorValue } from './resolveColor';

interface UseRoleColorOptions {
  themeName?: string | ThemeName;
  fallback?: string;
  opacity?: number;
}

export function useRoleColor(
  role: string | undefined,
  options: UseRoleColorOptions = {}
) {
  const rootTheme = useOptionalRootTheme();
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const { themeName: themeNameOverride, fallback, opacity } = options;
  const themeName = useMemo<ThemeName>(
    () =>
      (themeNameOverride ||
        rootTheme?.themeName ||
        viewerTheme ||
        'logoBlue') as ThemeName,
    [themeNameOverride, rootTheme?.themeName, viewerTheme]
  );
  const themeRoles = useMemo(() => {
    if (!themeNameOverride && rootTheme && rootTheme.themeName === themeName) {
      return rootTheme.themeRoles;
    }
    return getThemeRoles(themeName);
  }, [themeNameOverride, rootTheme, themeName]);
  const roleToken = role ? themeRoles[role] : undefined;

  const baseColorKey =
    roleToken?.color ||
    fallback ||
    ((themeName as keyof typeof Color) in Color ? themeName : 'logoBlue');

  const defaultOpacity =
    opacity ??
    (typeof roleToken?.opacity === 'number' ? roleToken.opacity : undefined);

  const { color: resolvedColor, resolver } = resolveColor({
    colorKey: baseColorKey,
    opacity: defaultOpacity
  });

  const color =
    resolvedColor || resolveColorValue('logoBlue', defaultOpacity) || '#1d4ed8';

  const getColor = (customOpacity?: number) => {
    if (resolver) {
      return resolver(
        typeof customOpacity === 'number' ? customOpacity : defaultOpacity
      );
    }
    return color;
  };

  return {
    color,
    colorKey: baseColorKey,
    defaultOpacity,
    themeName,
    token: roleToken,
    getColor
  };
}
