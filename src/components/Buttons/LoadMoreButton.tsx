import React, { useMemo } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';
import { Color } from '~/constants/css';

const loadMoreLabel = localize('loadMore');
const loadingLabel = localize('loading');

export default function LoadMoreButton({
  label,
  loading,
  color: overrideColor,
  onClick,
  theme,
  ...props
}: {
  label?: string;
  loading?: boolean;
  color?: string;
  onClick: () => any;
  theme?: string;
  [key: string]: any;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((theme || profileTheme || 'logoBlue') as ThemeName),
    [profileTheme, theme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const { buttonColorKey, buttonColorValue } = useMemo(() => {
    const fallbackKey = 'lightBlue';
    const candidates = [
      overrideColor,
      themeRoles.loadMoreButton?.color,
      fallbackKey
    ];
    for (const key of candidates) {
      if (!key) continue;
      const fn = Color[key as keyof typeof Color];
      if (typeof fn === 'function') {
        return {
          buttonColorKey: key,
          buttonColorValue: fn()
        };
      }
    }
    const fallbackFn = Color[fallbackKey as keyof typeof Color];
    return {
      buttonColorKey: fallbackKey,
      buttonColorValue:
        typeof fallbackFn === 'function' ? fallbackFn() : '#4aa3ff'
    };
  }, [overrideColor, themeRoles]);
  const scopedStyle = useMemo(
    () =>
      ({
        '--role-loadMoreButton-color': buttonColorValue
      } as React.CSSProperties),
    [buttonColorValue]
  );

  return (
    <ErrorBoundary componentPath="LoadMoreButton">
      <ScopedTheme theme={themeName} roles={['loadMoreButton']} style={scopedStyle}>
        <div
          className={css`
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <Button
            loading={!!loading}
            color={buttonColorKey}
            onClick={onClick}
            {...props}
          >
            {loading ? loadingLabel : label || loadMoreLabel}
          </Button>
        </div>
      </ScopedTheme>
    </ErrorBoundary>
  );
}
