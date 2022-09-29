import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from '../QuestionSlide';
import * as d3Ease from 'd3-ease';
import { Animate } from 'react-move';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { useExploreContext } from '~/contexts';
import { css } from '@emotion/css';

Carousel.propTypes = {
  afterSlide: PropTypes.func,
  beforeSlide: PropTypes.func,
  className: PropTypes.string,
  onSelectChoice: PropTypes.func,
  questionIds: PropTypes.array,
  questionObj: PropTypes.object,
  slideIndex: PropTypes.number,
  slidesToShow: PropTypes.number,
  style: PropTypes.object
};

export default function Carousel({
  afterSlide = () => {},
  beforeSlide = () => {},
  className,
  onSelectChoice,
  questionIds,
  questionObj,
  slideIndex = 0,
  slidesToShow = 1,
  style
}) {
  const clickSafe = useExploreContext((v) => v.state.videos.clickSafe);
  const onClickSafeOff = useExploreContext((v) => v.actions.onClickSafeOff);
  const onClickSafeOn = useExploreContext((v) => v.actions.onClickSafeOn);

  const DEFAULT_DURATION = 300;
  const DEFAULT_EASING = 'easeCircleOut';
  const DEFAULT_EDGE_EASING = 'easeElasticOut';
  const [left, setLeft] = useState(0);
  const [easing, setEasing] = useState(DEFAULT_EASING);
  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const [dragging, setDragging] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [touchObject, setTouchObject] = useState({});
  const [loaded, setLoaded] = useState(false);
  const FrameRef = useRef(null);
  const scrollYRef = useRef(null);
  const firstSlide = FrameRef.current?.childNodes?.[0]?.childNodes?.[0];
  const slideCount = questionIds?.length;

  useEffect(() => {
    setSlideWidth(FrameRef.current.offsetWidth / slidesToShow);
    setLoaded(true);
  }, [firstSlide, slidesToShow]);

  useEffect(() => {
    addEvent(window, 'resize', onResize);
    addEvent(document, 'readystatechange', onReadyStateChange);
    return function cleanUp() {
      removeEvent(window, 'resize', onResize);
      removeEvent(document, 'readystatechange', onReadyStateChange);
    };
  });

  return (
    <ErrorBoundary componentPath="GrammarGameModal/Game/Carousel/index">
      <div
        className={
          className ||
          css`
            width: 100%;
          `
        }
        style={{
          display: loaded ? 'block' : 'none',
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
          onTouchEnd={handleSwipe}
          onTouchCancel={handleSwipe}
          onMouseMove={(e) => {
            if (dragging) {
              const direction = swipeDirection(
                touchObject.startX,
                e.clientX,
                touchObject.startY,
                e.clientY
              );
              if (direction !== 0) {
                e.preventDefault();
              }
              let length = Math.round(
                Math.sqrt(Math.pow(e.clientX - touchObject.startX, 2))
              );
              setTouchObject({
                ...touchObject,
                endX: e.clientX,
                endY: e.clientY,
                length,
                direction
              });
            }
          }}
          onMouseUp={(e) => {
            if (dragging) {
              handleSwipe(e);
            }
          }}
          onMouseLeave={(e) => {
            if (dragging) {
              handleSwipe(e);
            }
          }}
          onClick={handleClick}
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
                  cursor: dragging ? 'pointer' : 'inherit',
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
                        onSelectChoice({ selectedIndex, questionId });
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

  function handleClick(e) {
    if (clickSafe) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopPropagation();
      }
    }
  }

  function getTargetLeft(touchOffset, slide) {
    const target = slide || currentSlide;
    const offset = 0 - (touchOffset || 0);
    const left = slideWidth * target;
    return (left - offset) * -1;
  }

  function getOffsetDeltas() {
    const offset = getTargetLeft(touchObject.length * touchObject.direction);
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

  function handleSwipe() {
    if (typeof touchObject.length !== 'undefined' && touchObject.length > 44) {
      onClickSafeOn();
    } else {
      onClickSafeOff();
    }
    if (touchObject.length > slideWidth / slidesToShow / 5) {
      if (touchObject.direction === 1) {
        if (currentSlide >= slideCount - slidesToShow) {
          setEasing(DEFAULT_EDGE_EASING);
        } else {
          handleGoToNextSlide();
        }
      } else if (touchObject.direction === -1) {
        if (currentSlide <= 0) {
          setEasing(DEFAULT_EDGE_EASING);
        } else {
          handleGoToPreviousSlide();
        }
      }
    } else {
      goToSlide(currentSlide);
    }
    setTouchObject({});
    setDragging(false);
    scrollYRef.current = null;
  }

  function handleGoToNextSlide() {
    if (currentSlide < slideCount - slidesToShow) {
      goToSlide(Math.min(currentSlide + 1, slideCount - slidesToShow));
    }
  }

  function handleGoToPreviousSlide() {
    if (currentSlide > 0) {
      goToSlide(Math.max(0, currentSlide - 1));
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

  function swipeDirection(x1, x2, y1, y2) {
    const xDist = x1 - x2;
    const yDist = y1 - y2;
    const r = Math.atan2(yDist, xDist);
    const maxAngle = 10;

    let swipeAngle = Math.round((r * 180) / Math.PI);
    if (swipeAngle < 0) {
      swipeAngle = 360 - Math.abs(swipeAngle);
    }
    if (swipeAngle >= 0 && swipeAngle <= maxAngle) {
      return 1;
    }
    if (swipeAngle <= 360 && swipeAngle >= 360 - maxAngle) {
      return 1;
    }
    if (swipeAngle >= 180 - maxAngle && swipeAngle <= 180 + maxAngle) {
      return -1;
    }
    return 0;
  }
}
