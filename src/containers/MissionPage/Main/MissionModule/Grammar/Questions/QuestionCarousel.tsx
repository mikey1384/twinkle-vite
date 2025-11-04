import React, { useEffect, useMemo, useRef } from 'react';
import Carousel from '~/components/Carousel';
import QuestionSlide from './QuestionSlide';
import { css } from '@emotion/css';
import { scrollElementToCenter, isMobile } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

const deviceIsMobile = isMobile(navigator);

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
}: {
  conditionPassStatus: string;
  currentSlideIndex: number;
  onAfterSlide: (index: number) => any;
  onCheckNavCondition: (v: any) => any;
  objectiveMessage: string;
  questionIds: number[];
  questionObj: any;
  onSelectChoice: (params: {
    selectedIndex: number;
    questionId: number;
  }) => any;
  submitDisabled: boolean;
}) {
  const CarouselRef = useRef(null);
  const progressColorKey = useKeyContext((v) => v.theme.carouselProgress.color);
  const resolvedProgressColor = useMemo(() => {
    const fn = Color[progressColorKey as keyof typeof Color];
    return typeof fn === 'function' ? fn() : progressColorKey;
  }, [progressColorKey]);
  useEffect(() => {
    const scrollModifier = deviceIsMobile ? -150 : -250;
    scrollElementToCenter(CarouselRef.current, scrollModifier);
  }, []);
  const totalQuestions = questionIds.length;
  const currentQuestionNumber = currentSlideIndex + 1;
  const progressPercent =
    totalQuestions > 0 ? (currentQuestionNumber / totalQuestions) * 100 : 0;

  return (
    <div ref={CarouselRef}>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 1.4rem;
          align-items: center;
          width: 100%;
          text-align: center;
        `}
      >
        <div
          className={css`
            font-size: 2.1rem;
            font-weight: 700;
            color: ${Color.darkerGray()};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.8rem;
            }
          `}
        >
          Question {currentQuestionNumber}
          <span
            className={css`
              font-family: 'Roboto Mono', 'Courier New', monospace;
              margin-left: 0.5rem;
              font-weight: 700;
              color: ${resolvedProgressColor};
            `}
          >
            /{totalQuestions}
          </span>
        </div>
        <div
          className={css`
            position: relative;
            width: 100%;
            max-width: 48rem;
            height: 0.8rem;
            border-radius: 999px;
            background: rgba(148, 163, 184, 0.25);
            overflow: hidden;
            @media (max-width: ${mobileMaxWidth}) {
              max-width: 100%;
            }
          `}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: Color[progressColorKey as keyof typeof Color]
                ? Color[progressColorKey as keyof typeof Color](0.75)
                : resolvedProgressColor,
              borderRadius: 'inherit',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>
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
  );
}
