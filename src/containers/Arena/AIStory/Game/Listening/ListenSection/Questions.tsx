import React from 'react';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import Button from '~/components/Button';
import GradientButton from '~/components/Buttons/GradientButton';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import useStoryQuestionProgress from '../../useStoryQuestionProgress';
import {
  StoryQuestionLabel,
  StoryQuestionNote,
  StoryScoreLine,
  storyScore
} from '../../StoryQuestionExtras';

export default function Questions({
  difficulty,
  isGrading,
  solveObj,
  onGrade,
  onOpenSuccessModal,
  questions,
  questionsLoaded,
  onLoadQuestions,
  questionsLoadError,
  storyId,
  userChoiceObj,
  onSetUserChoiceObj
}: {
  difficulty: number;
  isGrading: boolean;
  solveObj: any;
  onGrade: () => void;
  onOpenSuccessModal: () => void;
  questions: any[];
  questionsLoaded: boolean;
  storyId: number;
  onLoadQuestions: (storyId: number) => void;
  onSetUserChoiceObj: (userChoiceObj: any) => void;
  questionsLoadError: boolean;
  userChoiceObj: any;
}) {
  const {
    progress: loadingProgress,
    step: loadingStep,
    restart: restartLoadingProgress
  } = useStoryQuestionProgress({
    storyId,
    difficulty,
    loaded: questionsLoaded
  });

  // Every question must have a selected choice before the attempt can be
  // submitted — an unanswered question would be sent as null and auto-marked
  // wrong (also enforced server-side).
  const allAnswered =
    questions.length > 0 &&
    questions.every(
      (question: any) => typeof userChoiceObj[question.id] === 'number'
    );

  return (
    <div
      className={css`
        display: flex;
        width: 100%;
        justify-content: center;
      `}
    >
      <div
        className={css`
          width: 50%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          @media (max-width: ${tabletMaxWidth}) {
            width: 70%;
          }
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        {questionsLoadError ? (
          <div
            className={css`
              margin-top: 5rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
            `}
          >
            <div>There was an error while loading the questions.</div>
            <GradientButton
              style={{ marginTop: '3rem' }}
              onClick={() => {
                restartLoadingProgress();
                onLoadQuestions(storyId);
              }}
            >
              Retry
            </GradientButton>
          </div>
        ) : !questionsLoaded ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
            `}
          >
            <Loading text={loadingStep} />
            {/* a fixed slot: inside a centered column a 100%-wide bar would
                collapse to nothing (same layout as the daily question bar) */}
            <div style={{ width: '60%', maxWidth: '42rem', minWidth: '20rem' }}>
              <ProgressBar progress={loadingProgress} />
            </div>
          </div>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: center;
              width: 100%;
              height: 100%;
            `}
          >
            {questions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  marginTop: index === 0 ? 0 : '7rem',
                  width: '100%'
                }}
              >
                <MultipleChoiceQuestion
                  isGraded={solveObj.isGraded}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                  question={
                    <div>
                      <StoryQuestionLabel question={question} />
                      <b>{question.question}</b>
                    </div>
                  }
                  choices={question.choices}
                  selectedChoiceIndex={userChoiceObj[question.id]}
                  answerIndex={question.answerIndex}
                  disabled={isGrading}
                  onSelectChoice={(choiceIndex) =>
                    onSetUserChoiceObj((obj: any) => ({
                      ...obj,
                      [question.id]: choiceIndex
                    }))
                  }
                />
                {solveObj.isGraded && <StoryQuestionNote question={question} />}
              </div>
            ))}
            <div
              style={{
                marginTop: '10rem',
                width: '100%',
                justifyContent: 'center',
                display: 'flex'
              }}
            >
              {solveObj.isGraded ? (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingBottom: '5rem'
                  }}
                >
                  <StoryScoreLine solveObj={solveObj} questions={questions} />
                  {storyScore(solveObj, questions).isPassed ? (
                    <div style={{ marginTop: '2rem' }}>
                      <Button
                        variant="solid"
                        color="gold"
                        onClick={() => onOpenSuccessModal()}
                      >
                        Reopen Clear Screen
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingBottom: '10rem'
                  }}
                >
                  <GradientButton
                    loading={isGrading}
                    disabled={!allAnswered}
                    onClick={onGrade}
                  >
                    Finish
                  </GradientButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
