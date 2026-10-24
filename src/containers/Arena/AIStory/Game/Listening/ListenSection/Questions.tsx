import React from 'react';
import ArenaButton from '../../../../ArenaButton';
import ArenaLoader from '../../../../ArenaLoader';
import ArenaChoiceQuestion from '../../../../ArenaChoiceQuestion';
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
            <ArenaButton
              style={{ marginTop: '3rem' }}
              onClick={() => {
                restartLoadingProgress();
                onLoadQuestions(storyId);
              }}
            >
              Retry
            </ArenaButton>
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
            <ArenaLoader text={loadingStep} progress={loadingProgress} />
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
                  marginTop: index === 0 ? 0 : '2.4rem',
                  width: '100%'
                }}
              >
                <ArenaChoiceQuestion
                  number={index + 1}
                  isGraded={solveObj.isGraded}
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
                      <ArenaButton
                        tone="gold"
                        onClick={() => onOpenSuccessModal()}
                      >
                        Reopen Clear Screen
                      </ArenaButton>
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
                  <ArenaButton
                    tone="train"
                    loading={isGrading}
                    disabled={!allAnswered}
                    onClick={onGrade}
                  >
                    Finish
                  </ArenaButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
