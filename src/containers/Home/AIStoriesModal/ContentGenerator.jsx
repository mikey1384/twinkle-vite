import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ContentGenerator.propTypes = {
  loading: PropTypes.bool.isRequired,
  loadComplete: PropTypes.bool.isRequired,
  storyObj: PropTypes.object.isRequired
};
export default function ContentGenerator({ loading, loadComplete, storyObj }) {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!loadComplete && loadingProgress < 99) {
      setTimeout(() => {
        setLoadingProgress(loadingProgress + 1);
      }, 350);
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
      <div
        dangerouslySetInnerHTML={{ __html: storyObj?.story }}
        style={{ lineHeight: 3 }}
      />
    </div>
  );
}
