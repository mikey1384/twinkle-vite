import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  type ReactNode
} from 'react';
import { useAppContext } from '~/contexts';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';
import { applyThemeVars, getThemeRoles, ThemeName, type RoleTokens } from '.';

interface RootThemeContextValue {
  themeName: ThemeName;
  themeRoles: RoleTokens;
}

const RootThemeContext = createContext<RootThemeContextValue | null>(null);

export function RootThemeProvider({ children }: { children: ReactNode }) {
  const profileTheme = useAppContext((v) => v.user.state.myState.profileTheme);

  const themeName = useMemo<ThemeName>(() => {
    if (profileTheme) {
      return profileTheme as ThemeName;
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('profileTheme');
      if (stored) {
        return stored as ThemeName;
      }
    }
    return DEFAULT_PROFILE_THEME as ThemeName;
  }, [profileTheme]);

  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);

  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      applyThemeVars(themeName);
    }
  }, [themeName]);

  const value = useMemo(
    () => ({
      themeName,
      themeRoles
    }),
    [themeName, themeRoles]
  );

  return (
    <RootThemeContext.Provider value={value}>
      {children}
    </RootThemeContext.Provider>
  );
}

export function useRootTheme(): RootThemeContextValue {
  const context = useContext(RootThemeContext);
  if (!context) {
    throw new Error('useRootTheme must be used within RootThemeProvider');
  }
  return context;
}

export function useOptionalRootTheme(): RootThemeContextValue | null {
  return useContext(RootThemeContext);
}
