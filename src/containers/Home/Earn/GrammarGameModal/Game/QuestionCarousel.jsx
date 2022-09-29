import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import * as d3Ease from 'd3-ease';
import { Animate } from 'react-move';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

Carousel.propTypes = {
  afterSlide: PropTypes.func,
  beforeSlide: PropTypes.func,
  questions: PropTypes.array,
  slideIndex: PropTypes.number,
  slidesToShow: PropTypes.number,
  style: PropTypes.object
};

export default function Carousel({
  afterSlide = () => {},
  beforeSlide = () => {},
  questions,
  slideIndex = 0,
  slidesToShow = 1,
  style
}) {
  const [questionIds, setQuestionIds] = useState([]);
  const [questionObj, setQuestionObj] = useState({});
  const DEFAULT_DURATION = 300;
  const DEFAULT_EASING = 'easeCircleOut';
  const [left, setLeft] = useState(0);
  const [easing, setEasing] = useState(DEFAULT_EASING);
  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const [slideWidth, setSlideWidth] = useState(0);
  const FrameRef = useRef(null);
  const slideCount = questionIds?.length;

  useEffect(() => {
    setSlideWidth(FrameRef.current.offsetWidth / slidesToShow);
  }, [slidesToShow]);

  useEffect(() => {
    addEvent(window, 'resize', onResize);
    addEvent(document, 'readystatechange', onReadyStateChange);
    return function cleanUp() {
      removeEvent(window, 'resize', onResize);
      removeEvent(document, 'readystatechange', onReadyStateChange);
    };
  });

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

  return (
    <ErrorBoundary componentPath="GrammarGameModal/Game/Carousel/index">
      <div
        style={{
          width: '100%',
          position: 'relative',
          fontSize: '1.5rem',
          height: 'auto',
          boxSizing: 'border-box',
          visibility: slideWidth ? 'visible' : 'hidden',
          ...style
        }}
      >
        <div
          className="slider-frame"
          ref={FrameRef}
          style={{
            position: 'relative',
            display: 'block',
            overflowX: 'hidden',
            height: 'auto',
            margin: 0,
            padding: '6px',
            transform: 'translate3d(0, 0, 0)',
            boxSizing: 'border-box'
          }}
        >
          <Animate
            show
            start={{ tx: 0, ty: 0 }}
            update={() => {
              const { tx, ty } = getOffsetDeltas();
              return {
                tx,
                ty,
                timing: {
                  duration: DEFAULT_DURATION,
                  ease: d3Ease[easing]
                },
                events: {
                  end: () => {
                    const newLeft = getTargetLeft();
                    if (newLeft !== left) {
                      setLeft(newLeft);
                    }
                  }
                }
              };
            }}
          >
            {({ tx, ty }) => (
              <ul
                style={{
                  position: 'relative',
                  transform: `translate3d(${tx}px, ${ty}px, 0)`,
                  display: !!slideWidth ? 'block' : 'none',
                  margin: 0,
                  padding: 0,
                  height: 'auto',
                  width: slideWidth * slideCount,
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                {questionIds.map((questionId, index) => (
                  <li
                    style={{
                      display: 'inline-block',
                      listStyleType: 'none',
                      verticalAlign: 'top',
                      width: slideWidth,
                      height: 'auto',
                      boxSizing: 'border-box',
                      MozBoxSizing: 'border-box',
                      marginLeft: -0.5,
                      marginRight: -0.5,
                      marginTop: 'auto',
                      marginBottom: 'auto'
                    }}
                    key={index}
                  >
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
                  </li>
                ))}
              </ul>
            )}
          </Animate>
        </div>
      </div>
    </ErrorBoundary>
  );

  function getTargetLeft() {
    const target = currentSlide;
    const left = slideWidth * target;
    return left * -1;
  }

  function getOffsetDeltas() {
    const offset = getTargetLeft();
    return {
      tx: [offset],
      ty: [0]
    };
  }

  function goToSlide(index) {
    if (index >= slideCount || index < 0 || currentSlide === index) {
      return;
    }
    setEasing(DEFAULT_EASING);
    beforeSlide(currentSlide, index);
    setLeft(getTargetLeft(slideWidth, currentSlide));
    setCurrentSlide(index);
    afterSlide(index);
  }

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
      goToSlide(Math.min(currentSlide + 1, slideCount - slidesToShow));
    }
  }

  function onResize() {
    renderDimensions(FrameRef);
  }

  function onReadyStateChange() {
    renderDimensions(FrameRef);
  }

  function renderDimensions(ref) {
    const firstSlide = ref.current.childNodes[0].childNodes[0];
    if (firstSlide) {
      firstSlide.style.height = 'auto';
    }
    setSlideWidth(ref.current.offsetWidth / slidesToShow);
  }
}
