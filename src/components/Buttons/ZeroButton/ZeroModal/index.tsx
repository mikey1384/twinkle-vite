import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ZeroMessage from './ZeroMessage';
import Menu from './Menu';
import RichText from '~/components/Texts/RichText';
import { socket } from '~/constants/io';
import { useContentState } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ZeroModal.propTypes = {
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  onHide: PropTypes.func.isRequired,
  modalOverModal: PropTypes.bool,
  content: PropTypes.string
};
export default function ZeroModal({
  contentId,
  contentType,
  onHide,
  modalOverModal,
  content
}: {
  contentId?: number;
  contentType?: string;
  onHide: () => void;
  modalOverModal?: boolean;
  content?: string;
}) {
  const [loadingType, setLoadingType] = useState('');
  const [response, setResponse] = useState('');
  const responseIdentifier = useRef(Math.floor(Math.random() * 1000000000));

  useEffect(() => {
    socket.on('zeros_review_updated', handleZeroReviewUpdated);
    socket.on('zeros_review_finished', handleZeroReviewFinished);

    function handleZeroReviewUpdated({
      response,
      identifier
    }: {
      response: string;
      identifier: number;
    }) {
      if (loadingType && identifier === responseIdentifier.current)
        setResponse(response);
    }

    function handleZeroReviewFinished(identifier: number) {
      if (identifier === responseIdentifier.current) setLoadingType('');
    }

    return function cleanUp() {
      socket.removeListener('zeros_review_updated', handleZeroReviewUpdated);
      socket.removeListener('zeros_review_finished', handleZeroReviewFinished);
    };
  });

  const { content: contentFetchedFromContext } = useContentState({
    contentId: contentId as number,
    contentType: contentType as string
  });

  return (
    <Modal
      closeWhenClickedOutside={false}
      large
      modalOverModal={modalOverModal}
      onHide={onHide}
    >
      <header>Zero</header>
      <main>
        <div
          className={css`
            width: 100%;
            display: flex;
            > .menu {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: center;
              flex-grow: 1;
            }
            > .content {
              position: relative;
              display: flex;
              justify-content: center;
              align-items: center;
              flex-direction: column;
              width: 50%;
            }
            @media (max-width: ${mobileMaxWidth}) {
              flex-direction: column;
              > .menu {
                width: 100%;
              }
              > .content {
                padding-top: 10rem;
                width: 100%;
                padding-bottom: 7rem;
              }
            }
          `}
        >
          <div className="menu">
            <ZeroMessage />
            <Menu
              style={{ marginTop: '2rem' }}
              content={content || contentFetchedFromContext}
              loadingType={loadingType}
              onSetLoadingType={setLoadingType}
              identifier={responseIdentifier.current}
            />
          </div>
          <div className="content">
            {response ? (
              <RichText
                key={response}
                maxLines={100}
                style={{
                  opacity: 1,
                  marginBottom: '3rem',
                  fontWeight: 'bold',
                  fontFamily: 'Roboto mono, monospace',
                  textAlign: response?.length < 30 ? 'center' : 'left',
                  color: Color.darkerGray()
                }}
              >
                {response}
              </RichText>
            ) : null}
            <p
              style={{
                marginTop: response ? '3rem' : 0,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical'
              }}
            >{`"${content || contentFetchedFromContext}"`}</p>
          </div>
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
