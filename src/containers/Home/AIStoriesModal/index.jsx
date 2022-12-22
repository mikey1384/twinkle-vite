import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

AIStoriesModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function AIStoriesModal({ onHide }) {
  const [loading, setLoading] = useState(true);
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [storyObj, setStoryObj] = useState({});

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { storyObj } = await loadAIStory();
      setStoryObj(storyObj);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      modalStyle={{
        height: '80vh'
      }}
      large
      onHide={onHide}
    >
      <main
        style={{
          overflow: 'scroll',
          scrollBehavior: 'smooth',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
      >
        {loading ? (
          <Loading style={{ marginTop: '20vh' }} text="Generating a Story..." />
        ) : (
          <div
            className={css`
              width: 50%;
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
            style={{
              marginTop: '60vh',
              marginBottom: '60vh',
              padding: '2rem',
              fontSize: '1.7rem'
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: storyObj?.story }}
              style={{ lineHeight: 3 }}
            />
            <div
              style={{
                marginTop: '20rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button transparent onClick={onHide}>
                close
              </Button>
            </div>
          </div>
        )}
      </main>
    </Modal>
  );
}
