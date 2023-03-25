import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import LongText from '~/components/Texts/LongText';
import GradientButton from '~/components/Buttons/GradientButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ContentContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
  loadComplete: PropTypes.bool.isRequired,
  questionObj: PropTypes.object,
  storyObj: PropTypes.object.isRequired
};

export default function ContentContainer({
  loading,
  loadComplete,
  questionObj,
  storyObj
}) {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!loadComplete && loadingProgress < 99) {
      setTimeout(() => {
        setLoadingProgress(loadingProgress + 1);
      }, 500);
    }
    if (loadComplete) {
      setLoadingProgress(100);
    }
  }, [loadComplete, loading, loadingProgress]);

  return loading ? (
    <div style={{ marginTop: '20vh' }}>
      <Loading text="Generating a Story..." />
      <ProgressBar progress={loadingProgress} />
    </div>
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
      <LongText maxLines={100}>{storyObj.story}</LongText>
      {!!storyObj.story && (
        <div
          style={{
            marginTop: '10rem',
            width: '100%',
            justifyContent: 'center',
            display: 'flex'
          }}
        >
          <GradientButton onClick={handleFinishRead}>Finished</GradientButton>
        </div>
      )}
      {storyObj.explanation ? (
        <div style={{ marginTop: '7rem', marginBottom: '1rem' }}>
          ===============================
        </div>
      ) : (
        ''
      )}
      <LongText maxLines={100}>{storyObj.explanation}</LongText>
    </div>
  );

  function handleFinishRead() {
    console.log('got here', questionObj);
  }
}
