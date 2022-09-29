import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import QuestionCarousel from './QuestionCarousel';

Game.propTypes = {
  questions: PropTypes.array
};

export default function Game({ questions = [] }) {
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const statusRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  return (
    <div style={{ width: '100%', padding: '0 3rem 2rem 3rem' }}>
      {questions.length > 0 ? (
        <QuestionCarousel
          currentSlideIndex={currentSlideIndex}
          onAfterSlide={(index) => {
            statusRef.current = null;
            setSubmitDisabled(true);
            setCurrentSlideIndex(index);
          }}
          questions={questions}
          submitDisabled={submitDisabled}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}
