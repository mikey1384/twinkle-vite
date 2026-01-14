import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useAppContext } from '~/contexts';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';
import { applyThemeVars, getThemeRoles, ThemeName, type RoleTokens } from '.';
import { useLocation } from 'react-router-dom';

interface RootThemeContextValue {
  themeName: ThemeName;
  themeRoles: RoleTokens;
  setRouteThemeOverride: (theme: ThemeName | null) => void;
}

const RootThemeContext = createContext<RootThemeContextValue | null>(null);

export function RootThemeProvider({ children }: { children: ReactNode }) {
  const profileTheme = useAppContext((v) => v.user.state.myState.profileTheme);
  const userLoaded = useAppContext((v) => v.user.state.loaded);
  const location = useLocation();

  // Reactive state for route theme override (set by Profile component)
  const [routeThemeOverride, setRouteThemeOverrideState] = useState<
    ThemeName | null
  >(() => {
    // Initialize from localStorage on mount (for page reloads)
    if (typeof window !== 'undefined') {
      const path = window.location?.pathname || '';
      if (path.startsWith('/users/')) {
        return localStorage.getItem('routeProfileTheme') as ThemeName | null;
      }
    }
    return null;
  });

  const setRouteThemeOverride = useCallback((theme: ThemeName | null) => {
    setRouteThemeOverrideState(theme);
    // Keep localStorage in sync for page reloads
    try {
      if (theme) {
        localStorage.setItem('routeProfileTheme', theme);
      } else {
        localStorage.removeItem('routeProfileTheme');
      }
    } catch (_err) {}
  }, []);

  // Clear route override when navigating away from profile pages
  useLayoutEffect(() => {
    const path = location?.pathname || '';
    if (!path.startsWith('/users/') && routeThemeOverride) {
      setRouteThemeOverride(null);
    }
  }, [location?.pathname, routeThemeOverride, setRouteThemeOverride]);

  const themeName = useMemo<ThemeName>(() => {
    let stored: string | null = null;
    if (typeof window !== 'undefined') {
      stored = localStorage.getItem('profileTheme');
    }
    const isOnProfilePage = (location?.pathname || '').startsWith('/users/');

    // Before user is loaded, prefer route override (if on profile page), then stored
    if (!userLoaded) {
      return (
        (isOnProfilePage && routeThemeOverride
          ? routeThemeOverride
          : undefined) ||
        (stored as ThemeName) ||
        (profileTheme as ThemeName) ||
        DEFAULT_PROFILE_THEME
      );
    }
    // After user loads, if route override exists (visiting someone else's profile), prefer it
    if (isOnProfilePage && routeThemeOverride) {
      return routeThemeOverride;
    }
    // Otherwise prefer user theme; fall back to stored, then default
    return (profileTheme || stored || DEFAULT_PROFILE_THEME) as ThemeName;
  }, [profileTheme, userLoaded, location?.pathname, routeThemeOverride]);

  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);

  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      applyThemeVars(themeName);
    }
  }, [themeName]);

  const value = useMemo(
    () => ({
      themeName,
      themeRoles,
      setRouteThemeOverride
    }),
    [themeName, themeRoles, setRouteThemeOverride]
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
