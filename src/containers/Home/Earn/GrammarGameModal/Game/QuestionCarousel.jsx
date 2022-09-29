import PropTypes from 'prop-types';
import Carousel from '~/components/Carousel';
import QuestionSlide from './QuestionSlide';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

QuestionCarousel.propTypes = {
  conditionPassStatus: PropTypes.string.isRequired,
  currentSlideIndex: PropTypes.number.isRequired,
  onAfterSlide: PropTypes.func.isRequired,
  onCheckNavCondition: PropTypes.func.isRequired,
  objectiveMessage: PropTypes.string.isRequired,
  questionIds: PropTypes.array.isRequired,
  questionObj: PropTypes.object.isRequired,
  onSelectChoice: PropTypes.func.isRequired,
  submitDisabled: PropTypes.bool
};

export default function QuestionCarousel({
  conditionPassStatus,
  currentSlideIndex,
  onAfterSlide,
  onCheckNavCondition,
  objectiveMessage,
  questionIds,
  questionObj,
  onSelectChoice,
  submitDisabled
}) {
  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/GameCarousel">
      <div>
        <Carousel
          allowDrag={false}
          conditionPassStatus={conditionPassStatus}
          progressBar
          slidesToShow={1}
          slidesToScroll={1}
          slideIndex={currentSlideIndex}
          afterSlide={onAfterSlide}
          nextButtonDisabled={submitDisabled}
          onCheckNavCondition={onCheckNavCondition}
          title={
            <div
              className={css`
                width: 100%;
                text-align: center;
                margin-top: 6rem;
                margin-bottom: -1rem;
                @media (max-width: ${mobileMaxWidth}) {
                  margin-top: 3rem;
                  margin-bottom: -2rem;
                  > h2 {
                    font-size: 2rem;
                  }
                }
              `}
            >
              <h2>{objectiveMessage}</h2>
            </div>
          }
        >
          {questionIds.map((questionId) => (
            <QuestionSlide
              key={questionId}
              gotWrong={questionObj[questionId].gotWrong}
              question={questionObj[questionId].question}
              choices={questionObj[questionId].choices}
              answerIndex={questionObj[questionId].answerIndex}
              conditionPassStatus={conditionPassStatus}
              onSelectChoice={(selectedIndex) => {
                onSelectChoice({ selectedIndex, questionId });
              }}
            />
          ))}
        </Carousel>
      </div>
    </ErrorBoundary>
  );
}
