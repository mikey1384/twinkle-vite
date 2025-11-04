import { useMemo } from 'react';
import { getScopedThemeVars, ThemeName } from '.';
import { useThemeTokens } from './useThemeTokens';
import { resolveColorValue } from './resolveColor';

interface UseScopedThemeVarsOptions {
  themeName?: string | ThemeName;
  roles?: string[];
}

export function useScopedThemeVars(options: UseScopedThemeVarsOptions): {
  themeName: ThemeName;
  baseVars: Record<string, string>;
  roleVars: Record<string, string>;
  vars: Record<string, string>;
} {
  const { themeName: overrideThemeName, roles } = options;
  const { themeName, themeRoles } = useThemeTokens({
    themeName: overrideThemeName
  });

  const baseVars = useMemo(() => getScopedThemeVars(themeName), [themeName]);

  const roleVars = useMemo(() => {
    if (!roles?.length) return {} as Record<string, string>;
    const vars: Record<string, string> = {};
    roles.forEach((role) => {
      const token = themeRoles[role];
      if (!token) return;
      if ('color' in token && token.color) {
        const resolved = resolveColorValue(token.color, token.opacity);
        if (resolved) {
          vars[`--role-${role}-color`] = resolved;
        }
      }
      if ('opacity' in token && typeof token.opacity === 'number') {
        vars[`--role-${role}-opacity`] = String(token.opacity);
      }
      if ('shadow' in token && token.shadow) {
        const shadowColor = resolveColorValue(token.shadow);
        if (shadowColor) {
          vars[`--role-${role}-shadow`] = shadowColor;
        }
      }
    });
    return vars;
  }, [roles, themeRoles]);

  const vars = useMemo(
    () => ({
      ...baseVars,
      ...roleVars
    }),
    [baseVars, roleVars]
  );

  return {
    themeName,
    baseVars,
    roleVars,
    vars
  };
}
