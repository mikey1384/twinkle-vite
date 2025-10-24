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
import { useLocation } from 'react-router-dom';

interface RootThemeContextValue {
  themeName: ThemeName;
  themeRoles: RoleTokens;
}

const RootThemeContext = createContext<RootThemeContextValue | null>(null);

export function RootThemeProvider({ children }: { children: ReactNode }) {
  const profileTheme = useAppContext((v) => v.user.state.myState.profileTheme);
  const userLoaded = useAppContext((v) => v.user.state.loaded);
  const location = useLocation();

  const themeName = useMemo<ThemeName>(() => {
    let stored: string | null = null;
    let routeTheme: string | null = null;
    if (typeof window !== 'undefined') {
      stored = localStorage.getItem('profileTheme');
      const path = location?.pathname || window.location?.pathname || '';
      if (path.startsWith('/users/')) {
        routeTheme = localStorage.getItem('routeProfileTheme');
      }
    }
    // Before user is loaded, prefer route override (if on profile page), then stored
    if (!userLoaded) {
      return (
        (routeTheme as ThemeName) ||
        (stored as ThemeName) ||
        (profileTheme as ThemeName) ||
        DEFAULT_PROFILE_THEME
      );
    }
    // After user loads, if route override exists (visiting someone else's profile), prefer it
    if (routeTheme) return routeTheme as ThemeName;
    // Otherwise prefer user theme; fall back to stored, then default
    return (profileTheme || stored || DEFAULT_PROFILE_THEME) as ThemeName;
  }, [profileTheme, userLoaded, location?.pathname]);

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
