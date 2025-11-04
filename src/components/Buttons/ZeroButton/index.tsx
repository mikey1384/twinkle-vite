import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import zero from '~/assets/zero.png';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import ZeroModal from './ZeroModal';

export default function ZeroButton({
  contentId,
  contentType,
  content,
  style,
  hideLabel
}: {
  contentId: number;
  contentType: string;
  content?: string;
  style?: React.CSSProperties;
  hideLabel?: boolean;
}) {
  const [modalShown, setModalShown] = useState(false);
  const { colorKey: zeroAccent } = useRoleColor('logoTwin', {
    fallback: 'logoBlue'
  });

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
          {!hideLabel && (
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
          )}
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
