import React, { useEffect, useState } from 'react';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import Button from '~/components/Button';
import GradientButton from '~/components/Buttons/GradientButton';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';

export default function Questions({
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
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Hands Zero and Ciel the questions, choices and picks shown here, plus the
  // score and correct choices once graded, never the answer key before that.
  useAgentScreenState('aiStoryQuestions', {
    loaded: questionsLoaded,
    graded: !!solveObj?.isGraded,
    numCorrect: solveObj?.isGraded ? solveObj.numCorrect : null,
    questions: questions.slice(0, 30).map((question: any) => ({
      question: String(question.question || '').slice(0, 500),
      choices: question.choices,
      selectedIndex:
        typeof userChoiceObj[question.id] === 'number'
          ? userChoiceObj[question.id]
          : null,
      answerIndex: solveObj?.isGraded ? (question.answerIndex ?? null) : null
    }))
  });

  useEffect(() => {
    if (!questionsLoaded && loadingProgress < 99) {
      setTimeout(() => {
        setLoadingProgress(loadingProgress + 1);
      }, 500);
    }
    if (questionsLoaded) {
      setLoadingProgress(100);
    }
  }, [loadingProgress, questionsLoaded]);

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
                setLoadingProgress(0);
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
            `}
          >
            <Loading text="Generating Questions..." />
            <ProgressBar progress={loadingProgress} />
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
              <MultipleChoiceQuestion
                key={question.id}
                isGraded={solveObj.isGraded}
                style={{
                  marginTop: index === 0 ? 0 : '7rem',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center'
                }}
                question={<b>{question.question}</b>}
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
                  <div
                    style={{
                      color:
                        solveObj.numCorrect === questions.length
                          ? Color.green()
                          : '',
                      fontWeight:
                        solveObj.numCorrect === questions.length ? 'bold' : ''
                    }}
                  >
                    {solveObj.numCorrect} / {questions.length} correct
                    {solveObj.numCorrect === questions.length ? '!' : ''}
                  </div>
                  {solveObj.numCorrect === questions.length ? (
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
