import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';

QuestionViewer.propTypes = {
  questions: PropTypes.array,
  slideIndex: PropTypes.number,
  slidesToShow: PropTypes.number
};

export default function QuestionViewer({
  questions,
  slideIndex = 0,
  slidesToShow = 1
}) {
  const [questionIds, setQuestionIds] = useState(null);
  const [questionObj, setQuestionObj] = useState({});
  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const slideCount = questionIds?.length;

  useEffect(() => {
    const resultObj = questions.reduce((prev, curr, index) => {
      const choices = curr.choices.map((choice) => ({
        label: choice,
        checked: false
      }));
      return {
        ...prev,
        [index]: {
          ...curr,
          choices,
          selectedChoiceIndex: null
        }
      };
    }, {});
    setQuestionObj(resultObj);
    setQuestionIds([...Array(questions.length).keys()]);
  }, [questions]);

  const Slides = useMemo(() => {
    return questionIds?.map((questionId) => (
      <QuestionSlide
        key={questionId}
        gotWrong={questionObj[questionId].gotWrong}
        question={questionObj[questionId].question}
        choices={questionObj[questionId].choices}
        answerIndex={questionObj[questionId].answerIndex}
        onSelectChoice={(selectedIndex) => {
          handleSelectChoice({ selectedIndex, questionId });
        }}
      />
    ));
    function handleSelectChoice({ selectedIndex, questionId }) {
      setQuestionObj((questionObj) => ({
        ...questionObj,
        [questionId]: {
          ...questionObj[questionId],
          choices: questionObj[questionId].choices.map((choice, index) =>
            index === selectedIndex
              ? { ...choice, checked: true }
              : { ...choice, checked: false }
          )
        },
        selectedChoiceIndex: selectedIndex
      }));
      handleGoToNextSlide();
    }

    function handleGoToNextSlide() {
      if (currentSlide < slideCount - slidesToShow) {
        handleGoToSlide(Math.min(currentSlide + 1, slideCount - slidesToShow));
      }
      function handleGoToSlide(index) {
        if (index >= slideCount || index < 0 || currentSlide === index) {
          return;
        }
        setCurrentSlide(index);
      }
    }
  }, [currentSlide, questionIds, questionObj, slideCount, slidesToShow]);

  return (
    <ErrorBoundary componentPath="GrammarGameModal/Game/Carousel/index">
      <SlideContainer>{Slides || <Loading />}</SlideContainer>
    </ErrorBoundary>
  );
}
