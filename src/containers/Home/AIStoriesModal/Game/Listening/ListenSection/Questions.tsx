import React, { useEffect, useState } from 'react';
import Question from '~/components/Question';
import GradientButton from '~/components/Buttons/GradientButton';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Questions({
  isGrading,
  solveObj,
  onGrade,
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
  questions: any[];
  questionsLoaded: boolean;
  storyId: number;
  onLoadQuestions: (storyId: number) => void;
  onSetUserChoiceObj: (userChoiceObj: any) => void;
  questionsLoadError: boolean;
  userChoiceObj: any;
}) {
  const [loadingProgress, setLoadingProgress] = useState(0);

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
          <div>
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
            `}
          >
            {questions.map((question, index) => (
              <Question
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
                onSelectChoice={(index) =>
                  onSetUserChoiceObj((obj: any) => ({
                    ...obj,
                    [question.id]: index
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
                  <GradientButton loading={isGrading} onClick={onGrade}>
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
