import PropTypes from 'prop-types';
import Carousel from './Carousel';
import QuestionSlide from './QuestionSlide';
import ErrorBoundary from '~/components/ErrorBoundary';

QuestionCarousel.propTypes = {
  conditionPassStatus: PropTypes.string.isRequired,
  currentSlideIndex: PropTypes.number.isRequired,
  onAfterSlide: PropTypes.func.isRequired,
  questionIds: PropTypes.array.isRequired,
  questionObj: PropTypes.object.isRequired,
  onSelectChoice: PropTypes.func.isRequired
};

export default function QuestionCarousel({
  conditionPassStatus,
  currentSlideIndex,
  onAfterSlide,
  questionIds,
  questionObj,
  onSelectChoice
}) {
  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/GameCarousel">
      <div>
        <Carousel
          slidesToShow={1}
          slidesToScroll={1}
          slideIndex={currentSlideIndex}
          afterSlide={onAfterSlide}
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
