import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import zero from '~/assets/zero.png';
import { css } from '@emotion/css';
import { desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { getThemeRoles, ThemeName } from '~/theme/themes';
import ZeroModal from './ZeroModal';

export default function ZeroButton({
  contentId,
  contentType,
  content,
  style
}: {
  contentId: number;
  contentType: string;
  content?: string;
  style?: React.CSSProperties;
}) {
  const [modalShown, setModalShown] = useState(false);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((profileTheme || 'logoBlue') as ThemeName),
    [profileTheme]
  );
  const zeroAccent = useMemo(
    () => getThemeRoles(themeName).logoTwin?.color || 'logoBlue',
    [themeName]
  );

  return (
    <ErrorBoundary componentPath="Buttons/ZeroButton">
      <Button
        className={css`
          display: inline-flex;
        `}
        style={{
          padding: '0.7rem 1.1rem',
          ...style
        }}
        color={zeroAccent}
        variant="soft"
        tone="raised"
        size="md"
        shape="pill"
        uppercase={false}
        onClick={() => setModalShown(true)}
        aria-label="Ask Zero"
      >
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
          `}
        >
          <img
            src={zero}
            alt=""
            className={css`
              width: 1.6rem;
              height: 1.6rem;
              object-fit: contain;
              pointer-events: none;
            `}
          />
          <span
            className={css`
              font-weight: 700;
              letter-spacing: 0.02em;
              @media (max-width: ${mobileMaxWidth}) {
                display: none;
              }
            `}
          >
            Ask Zero
          </span>
        </span>
      </Button>
      {modalShown && (
        <ZeroModal
          contentId={contentId}
          contentType={contentType}
          onHide={() => setModalShown(false)}
          content={content}
        />
      )}
    </ErrorBoundary>
  );
}
