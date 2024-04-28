import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import zero from '~/assets/zero.png';
import { css } from '@emotion/css';
import { desktopMinWidth } from '~/constants/css';
import ZeroModal from './ZeroModal';

ZeroButton.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  content: PropTypes.string,
  style: PropTypes.object
};
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
  return (
    <ErrorBoundary componentPath="Buttons/ZeroButton">
      <Button
        style={{
          background: `no-repeat center/80% url(${zero})`,
          ...style
        }}
        className={css`
          opacity: ${modalShown ? 1 : 0.5};
          @media (min-width: ${desktopMinWidth}) {
            &:hover {
              opacity: 1;
            }
          }
        `}
        skeuomorphic
        onClick={() => setModalShown(true)}
      >
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
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
