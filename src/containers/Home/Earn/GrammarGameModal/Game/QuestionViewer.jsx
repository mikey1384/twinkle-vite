import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';
import correct from './correct_sound.mp3';

QuestionViewer.propTypes = {
  questions: PropTypes.array
};

const correctSound = new Audio(correct);

export default function QuestionViewer({ questions }) {
  const timerRef = useRef(null);
  const [questionIds, setQuestionIds] = useState(null);
  const [questionObj, setQuestionObj] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gotWrong, setGotWrong] = useState(false);
  const loadingRef = useRef(false);

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
        selectedChoiceIndex={questionObj[questionId].selectedChoiceIndex}
        onCorrectAnswer={handleSelectCorrectAnswer}
        onSetGotWrong={handleSetGotWrong}
        gotWrong={gotWrong}
      />
    ));
    async function handleSelectCorrectAnswer() {
      if (!loadingRef.current) {
        loadingRef.current = true;
        setQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            selectedChoiceIndex: prev[currentIndex].answerIndex
          }
        }));
        correctSound.play();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (currentIndex < questionIds.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          loadingRef.current = false;
        }
      }
    }
    function handleSetGotWrong(index) {
      if (!loadingRef.current) {
        loadingRef.current = true;
        setGotWrong(true);
        setQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            selectedChoiceIndex: index
          }
        }));
        timerRef.current = setTimeout(() => {
          setQuestionObj((prev) => ({
            ...prev,
            [currentIndex]: {
              ...prev[currentIndex],
              selectedChoiceIndex: null
            }
          }));
          setGotWrong(false);
          loadingRef.current = false;
        }, 1000);
      }
    }
  }, [currentIndex, gotWrong, questionIds, questionObj]);

  return (
    <ErrorBoundary componentPath="GrammarGameModal/Game/Carousel/index">
      <SlideContainer selectedIndex={currentIndex}>
        {Slides || <Loading />}
      </SlideContainer>
    </ErrorBoundary>
  );
}
