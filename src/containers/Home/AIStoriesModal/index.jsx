import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

AIStoriesModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function AIStoriesModal({ onHide }) {
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [imageUrl, setImageUrl] = useState('');
  const [storyObj, setStoryObj] = useState({});

  useEffect(() => {
    init();
    async function init() {
      const { imageUrl, storyObj } = await loadAIStory();
      setImageUrl(imageUrl);
      setStoryObj(storyObj);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      modalStyle={{
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        height: '80vh'
      }}
      large
      closeWhenClickedOutside={false}
      closeColor="#fff"
      onHide={onHide}
    >
      <main
        style={{
          height: '100%',
          color: '#fff',
          overflow: 'scroll',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
      >
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
            fontSize: '1.7rem',
            backgroundColor: Color.black(0.9)
          }}
        >
          <div style={{ lineHeight: 3 }}>{storyObj?.story}</div>
          <div style={{ marginTop: '20rem' }}>{storyObj?.question}</div>
        </div>
      </main>
    </Modal>
  );
}
