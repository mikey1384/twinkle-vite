import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import zero from './zero.png';
import { css } from '@emotion/css';
import ZeroModal from './ZeroModal';

ZeroButton.propTypes = {
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  style: PropTypes.object,
  content: PropTypes.string
};

export default function ZeroButton({ contentId, contentType, content, style }) {
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
          &:hover {
            opacity: 1;
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
