import React, { Children, useEffect, useRef, useState } from 'react';
import NavButton from './NavButton';
import Button from '~/components/Button';
import ProgressBar from '~/components/ProgressBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import BottomNavButtons from './BottomNavButtons';

const showAllLabel = 'Show All';

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

  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const slideCount = Children.count(children);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    setCurrentSlide(slideIndex);
  }, [slideIndex]);

  function goToSlide(index: number) {
    if (index < 0 || index >= slideCount || index === currentSlide) return;
    beforeSlide(currentSlide, index);
    setIsTransitioning(true);
    setCurrentSlide(index);
    afterSlide(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }

  function handleGoToNextSlide() {
    if (currentSlide < slideCount - slidesToShow) {
      goToSlide(Math.min(currentSlide + slidesToScroll, slideCount - slidesToShow));
    }
  }

  function handleGoToPreviousSlide() {
    if (currentSlide > 0) {
      goToSlide(Math.max(0, currentSlide - slidesToScroll));
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!allowDrag) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!allowDrag) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      touchDeltaX.current = deltaX;
    }
  }

  function handleTouchEnd() {
    if (!allowDrag) return;
    const threshold = 50;
    if (touchDeltaX.current > threshold) {
      handleGoToPreviousSlide();
    } else if (touchDeltaX.current < -threshold) {
      handleGoToNextSlide();
    }
    touchDeltaX.current = 0;
  }

  // Each slide takes up (100 / slidesToShow)% of the visible area
  // The track is slideCount * (100 / slidesToShow)% wide
  const slideWidth = 100 / slidesToShow;
  const trackWidth = slideCount * slideWidth;

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
          overflow: 'hidden',
          maxWidth: '100%',
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
          style={{
            position: 'relative',
            overflow: 'hidden',
            margin: framePadding,
            boxSizing: 'border-box',
            width: '100%'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={css`
              display: flex;
              transition: ${isTransitioning ? 'transform 0.3s ease-out' : 'none'};
            `}
            style={{
              width: `${trackWidth}%`,
              transform: `translateX(-${currentSlide * (100 / slideCount)}%)`
            }}
          >
            {Children.map(children, (child, index) => (
              <div
                key={index}
                style={{
                  flex: `0 0 ${100 / slideCount}%`,
                  width: `${100 / slideCount}%`,
                  boxSizing: 'border-box',
                  padding: `0 ${cellSpacing / 2}px`,
                  overflow: 'hidden'
                }}
              >
                {child}
              </div>
            ))}
          </div>
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
                  variant="solid"
                  tone="raised"
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
}
