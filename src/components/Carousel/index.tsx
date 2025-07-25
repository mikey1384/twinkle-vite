import React, { Children, useEffect, useRef, useState } from 'react';
import NavButton from './NavButton';
import Button from '~/components/Button';
import ProgressBar from '~/components/ProgressBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import * as d3Ease from 'd3-ease';
import { Animate } from 'react-move';
import { Color } from '~/constants/css';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import BottomNavButtons from './BottomNavButtons';
import localize from '~/constants/localize';

const showAllLabel = localize('showAll');

export default function Carousel({
  allowDrag = true,
  afterSlide = () => null,
  beforeSlide = () => null,
  className,
  cellSpacing = 0,
  children,
  conditionPassStatus,
  framePadding = '0px',
  nextButtonDisabled,
  onCheckNavCondition,
  onFinish,
  onShowAll = () => null,
  progressBar,
  slideIndex = 0,
  slidesToScroll = 1,
  slidesToShow = 1,
  slideWidthMultiplier = 1,
  showAllButton,
  style,
  title
}: {
  afterSlide?: (index: number) => any;
  allowDrag?: boolean;
  beforeSlide?: (currentSlide: number, index: any) => any;
  cellSpacing?: number;
  children: any;
  className?: string;
  conditionPassStatus?: string;
  framePadding?: string;
  nextButtonDisabled?: boolean;
  onCheckNavCondition?: (v: any) => any;
  onFinish?: () => any;
  onShowAll?: () => any;
  progressBar?: boolean;
  slideIndex?: number;
  slidesToScroll?: number;
  slidesToShow?: number;
  slideWidthMultiplier?: number;
  showAllButton?: boolean;
  style?: any;
  title?: any;
}) {
  const carouselProgressColor = useKeyContext(
    (v) => v.theme.carouselProgress.color
  );
  const carouselProgressCompleteColor = useKeyContext(
    (v) => v.theme.carouselProgressComplete.color
  );
  const DEFAULT_DURATION = 300;
  const DEFAULT_EASING = 'easeCircleOut';
  const DEFAULT_EDGE_EASING = 'easeElasticOut';
  const [left, setLeft] = useState(0);
  const [easing, setEasing] = useState(DEFAULT_EASING);
  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const [dragging, setDragging] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [slideCount, setSlideCount] = useState(Children.count(children));
  const [touchObject, setTouchObject] = useState<any>({});
  const FrameRef = useRef(null);
  const scrollYRef: React.MutableRefObject<any> = useRef(null);

  useEffect(() => {
    addEvent(window, 'resize', onResize);
    addEvent(document, 'readystatechange', onReadyStateChange);
    renderDimensions(FrameRef);
    return function cleanUp() {
      removeEvent(window, 'resize', onResize);
      removeEvent(document, 'readystatechange', onReadyStateChange);
    };
  });

  useEffect(() => {
    setSlideCount(Children.count(children));
  }, [children]);

  return (
    <ErrorBoundary componentPath="Carousel/index">
      <div
        className={
          className ||
          css`
            width: 100%;
          `
        }
        style={{
          position: 'relative',
          fontSize: '1.5rem',
          height: 'auto',
          boxSizing: 'border-box',
          visibility: slideWidth ? 'visible' : 'hidden',
          ...style
        }}
      >
        {progressBar && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <ProgressBar
              progress={((currentSlide + 1) / slideCount) * 100}
              color={
                currentSlide + 1 === slideCount
                  ? Color[carouselProgressCompleteColor]()
                  : Color[carouselProgressColor]()
              }
              style={{ width: '100%' }}
              text={`${currentSlide + 1}/${slideCount}`}
            />
            {title}
          </div>
        )}
        <div
          className="slider-frame"
          ref={FrameRef}
          style={{
            position: 'relative',
            display: 'block',
            overflowX: 'hidden',
            height: 'auto',
            margin: framePadding,
            padding: '6px',
            transform: 'translate3d(0, 0, 0)',
            boxSizing: 'border-box'
          }}
          onTouchStart={(e) => {
            if (allowDrag) {
              setTouchObject({
                startX: e.touches[0].pageX,
                startY: e.touches[0].pageY
              });
            }
          }}
          onTouchMove={(e) => {
            if (!scrollYRef.current) {
              scrollYRef.current = (
                document.scrollingElement || document.documentElement
              ).scrollTop;
            }
            const direction = swipeDirection(
              touchObject.startX,
              e.touches[0].pageX,
              touchObject.startY,
              e.touches[0].pageY
            );
            if (direction !== 0) {
              e.preventDefault();
              if (scrollYRef.current) {
                window.scroll(0, scrollYRef.current);
              }
            }
            const length = Math.round(
              Math.sqrt(Math.pow(e.touches[0].pageX - touchObject.startX, 2))
            );
            setTouchObject({
              ...touchObject,
              endX: e.touches[0].pageX,
              endY: e.touches[0].pageY,
              length,
              direction
            });
          }}
          onTouchEnd={handleSwipe}
          onTouchCancel={handleSwipe}
          onMouseDown={(e) => {
            if (allowDrag) {
              setTouchObject({
                startX: e.clientX,
                startY: e.clientY
              });
              setDragging(true);
            }
          }}
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
              const length = Math.round(
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
          onMouseUp={() => {
            if (dragging) {
              handleSwipe();
            }
          }}
          onMouseLeave={() => {
            if (dragging) {
              handleSwipe();
            }
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
                  ease: d3Ease[easing as keyof typeof d3Ease]
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
                  display: 'block',
                  margin: `0px ${(cellSpacing / 2) * -1}px`,
                  padding: 0,
                  height: 'auto',
                  width: slideWidth * slideCount + cellSpacing * slideCount,
                  cursor: dragging ? 'pointer' : 'inherit',
                  boxSizing: 'border-box'
                }}
              >
                {slideCount > 1
                  ? formatChildren({
                      children,
                      slideWidth,
                      cellSpacing
                    })
                  : children}
              </ul>
            )}
          </Animate>
        </div>
        {!progressBar && (
          <>
            <NavButton
              left
              key={0}
              disabled={currentSlide === 0}
              onGoToNextSlide={handleGoToPreviousSlide}
            />
            <div key={1}>
              {showAllButton ? (
                <Button
                  skeuomorphic
                  color="darkerGray"
                  className={css`
                    position: absolute;
                    top: CALC(50% - 2rem);
                    right: -0.5rem;
                    opacity: 0.9;
                    &:hover {
                      opacity: 1;
                    }
                  `}
                  onClick={onShowAll}
                >
                  {showAllLabel}
                </Button>
              ) : (
                <NavButton
                  disabled={slideCount - (currentSlide + 1) < slidesToShow}
                  onGoToNextSlide={handleGoToNextSlide}
                />
              )}
            </div>
          </>
        )}
        {progressBar && (
          <BottomNavButtons
            conditionPassStatus={conditionPassStatus}
            currentSlide={currentSlide}
            onFinish={onFinish}
            onPrev={handleGoToPreviousSlide}
            onCheckNavCondition={onCheckNavCondition}
            onNext={handleGoToNextSlide}
            slideCount={slideCount}
            nextButtonDisabled={nextButtonDisabled}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  function formatChildren({
    children,
    slideWidth,
    cellSpacing
  }: {
    children: React.ReactNode;
    slideWidth: number;
    cellSpacing: number;
  }) {
    return Children.map(children, (child, index) => (
      <li
        style={{
          display: 'inline-block',
          listStyleType: 'none',
          verticalAlign: 'top',
          width: slideWidth,
          height: 'auto',
          boxSizing: 'border-box',
          MozBoxSizing: 'border-box',
          marginLeft: cellSpacing / 2 - 0.5,
          marginRight: cellSpacing / 2 - 0.5,
          marginTop: 'auto',
          marginBottom: 'auto'
        }}
        key={index}
      >
        {child}
      </li>
    ));
  }

  function getTargetLeft(touchOffset?: number, slide?: number) {
    const target = slide || currentSlide;
    const offset = 0 - cellSpacing * target - (touchOffset || 0);
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

  function goToSlide(index: number) {
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
      goToSlide(
        Math.min(currentSlide + slidesToScroll, slideCount - slidesToShow)
      );
    }
  }

  function handleGoToPreviousSlide() {
    if (currentSlide > 0) {
      goToSlide(Math.max(0, currentSlide - slidesToScroll));
    }
  }

  function onResize() {
    renderDimensions(FrameRef);
  }

  function onReadyStateChange() {
    renderDimensions(FrameRef);
  }

  function renderDimensions(ref: React.RefObject<any>) {
    const firstSlide = ref.current.childNodes[0].childNodes[0];
    if (firstSlide) {
      firstSlide.style.height = 'auto';
    }
    setSlideWidth(
      (ref.current.offsetWidth / slidesToShow -
        cellSpacing * (1 - 1 / slidesToShow)) *
        slideWidthMultiplier
    );
  }

  function swipeDirection(x1: number, x2: number, y1: number, y2: number) {
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
