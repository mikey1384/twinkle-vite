import React, { useEffect, useRef } from 'react';
import Carousel from '~/components/Carousel';
import QuestionSlide from './QuestionSlide';
import { css } from '@emotion/css';
import { scrollElementToCenter, isMobile } from '~/helpers';
import { mobileMaxWidth } from '~/constants/css';

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
  useEffect(() => {
    const scrollModifier = deviceIsMobile ? -150 : -250;
    scrollElementToCenter(CarouselRef.current, scrollModifier);
  }, []);

  return (
    <div ref={CarouselRef}>
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
