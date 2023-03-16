import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ZeroMessage from './ZeroMessage';
import Menu from './Menu';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import LongText from '~/components/Texts/LongText';
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
}) {
  const [loadingType, setLoadingType] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [response, setResponse] = useState(null);
  useEffect(() => {
    if (loadingType && loadingProgress < 99) {
      setTimeout(() => {
        setLoadingProgress((loadingProgress) => loadingProgress + 1);
      }, 300);
    }
  }, [loadingProgress, loadingType]);

  const { content: contentFetchedFromContext } = useContentState({
    contentId,
    contentType
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
              > p {
                opacity: ${loadingType ? 0.2 : 1};
              }
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
              onSetResponse={setResponse}
              onSetLoadingProgress={setLoadingProgress}
            />
          </div>
          <div className="content">
            {response ? (
              <LongText
                style={{
                  marginBottom: '3rem',
                  fontWeight: 'bold',
                  fontFamily: 'Roboto mono, monospace',
                  color: Color.darkerGray()
                }}
              >
                {response}
              </LongText>
            ) : null}
            <p
              style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical'
              }}
            >{`"${content || contentFetchedFromContext}"`}</p>
            {loadingType ? (
              <div style={{ position: 'absolute', top: '5rem', width: '70%' }}>
                <Loading style={{ height: '5rem' }} />
                <ProgressBar progress={loadingProgress} />
              </div>
            ) : null}
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
