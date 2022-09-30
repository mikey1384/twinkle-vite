import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';

QuestionViewer.propTypes = {
  questions: PropTypes.array
};

export default function QuestionViewer({ questions }) {
  const [questionIds, setQuestionIds] = useState(null);
  const [questionObj, setQuestionObj] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideCount = questionIds?.length;

  useEffect(() => {
    const resultObj = questions.reduce((prev, curr, index) => {
      return {
        ...prev,
        [index]: {
          ...curr,
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
        question={questionObj[questionId].question}
        choices={questionObj[questionId].choices}
        answerIndex={questionObj[questionId].answerIndex}
        onSelectChoice={(selectedIndex) => {
          handleSelectChoice({ selectedIndex, questionId });
        }}
      />
    ));
    function handleSelectChoice({ selectedIndex, questionId }) {
      if (selectedIndex === questionObj[questionId]?.answerIndex) {
        handleGoToNextSlide();
      } else {
        console.log('wrong');
      }
    }

    function handleGoToNextSlide() {
      if (currentIndex === slideCount - 1) {
        return;
      }
      setCurrentIndex((index) => index + 1);
    }
  }, [currentIndex, questionIds, questionObj, slideCount]);

  return (
    <ErrorBoundary componentPath="GrammarGameModal/Game/Carousel/index">
      <SlideContainer selectedIndex={currentIndex}>
        {Slides || <Loading />}
      </SlideContainer>
    </ErrorBoundary>
  );
}
