import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import Story from './Story';
import Questions from './Questions';

import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ContentContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
  loadComplete: PropTypes.bool.isRequired,
  questions: PropTypes.array,
  storyObj: PropTypes.object.isRequired,
  onLoadQuestions: PropTypes.func.isRequired,
  onScrollToTop: PropTypes.func.isRequired,
  questionsLoaded: PropTypes.bool
};

export default function ContentContainer({
  loading,
  loadComplete,
  questions,
  storyObj,
  onLoadQuestions,
  onScrollToTop,
  questionsLoaded
}) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [displayedSection, setDisplayedSection] = useState('story');

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

  return (
    <div
      className={css`
        width: 50%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      {loading ? (
        <div style={{ marginTop: '20vh' }}>
          <Loading text="Generating a Story..." />
          <ProgressBar progress={loadingProgress} />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            marginTop: displayedSection === 'story' ? '60vh' : '10rem',
            marginBottom: displayedSection === 'story' ? '60vh' : '10rem',
            padding: '2rem',
            fontSize: '1.7rem'
          }}
        >
          {displayedSection === 'story' && (
            <Story
              story={storyObj.story}
              explanation={storyObj.explanation}
              questionsLoaded={questionsLoaded}
              onLoadQuestions={onLoadQuestions}
              onFinishRead={handleFinishRead}
            />
          )}
          {displayedSection === 'questions' && (
            <Questions
              questions={questions}
              onReadAgain={handleReadAgain}
              questionsLoaded={questionsLoaded}
            />
          )}
        </div>
      )}
    </div>
  );

  function handleFinishRead() {
    onScrollToTop();
    setDisplayedSection('questions');
  }

  function handleReadAgain() {
    onScrollToTop();
    setDisplayedSection('story');
  }
}
