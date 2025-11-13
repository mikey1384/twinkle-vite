import React, { useMemo } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';import ScopedTheme from '~/theme/ScopedTheme';
import { useRoleColor } from '~/theme/useRoleColor';
import { resolveColorValue } from '~/theme/resolveColor';

const loadMoreLabel = 'Load More';
const loadingLabel = 'Loading';

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
  const {
    themeName,
    color: themedColorValue,
    colorKey: themedColorKey
  } = useRoleColor('loadMoreButton', {
    themeName: theme || profileTheme,
    fallback: 'lightBlue'
  });
  const { buttonColorKey, buttonColorValue } = useMemo(() => {
    const overrideValue = overrideColor
      ? resolveColorValue(overrideColor)
      : undefined;
    if (overrideColor && overrideValue) {
      return {
        buttonColorKey: overrideColor,
        buttonColorValue: overrideValue
      };
    }
    const resolvedKey = themedColorKey || 'lightBlue';
    const resolvedValue =
      themedColorValue ||
      resolveColorValue(resolvedKey) ||
      resolveColorValue('lightBlue') ||
      '#4aa3ff';
    return {
      buttonColorKey: overrideColor || resolvedKey,
      buttonColorValue: overrideValue || resolvedValue
    };
  }, [overrideColor, themedColorKey, themedColorValue]);
  const scopedStyle = useMemo(
    () =>
      ({
        '--role-loadMoreButton-color': buttonColorValue
      } as React.CSSProperties),
    [buttonColorValue]
  );

  return (
    <ErrorBoundary componentPath="LoadMoreButton">
      <ScopedTheme
        theme={themeName}
        roles={['loadMoreButton']}
        style={scopedStyle}
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
          variant="soft"
          shape="pill"
          uppercase={false}
          {...props}
        >
          {loading ? loadingLabel : label || loadMoreLabel}
        </Button>
      </ScopedTheme>
    </ErrorBoundary>
  );
}
