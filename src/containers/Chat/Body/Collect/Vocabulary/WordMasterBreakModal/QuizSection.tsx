import React from 'react';
import { css, keyframes } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { SectionHeader } from './RequirementSection';

const timerPulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 ${Color.rose(0)};
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 12px ${Color.rose(0.4)};
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 ${Color.rose(0)};
  }
`;

export default function QuizSection({
  loading,
  onSelectChoice,
  onStartQuiz,
  quiz,
  quizLoading,
  quizLoadProgress,
  quizLoadStep,
  quizQuestion,
  quizResult,
  quizStarted,
  quizTimeRemaining,
  readyCountdown,
  selectedIndex,
  showQuizQuestion,
  showReadyCountdown
}: {
  loading?: boolean;
  onSelectChoice: (index: number) => void;
  onStartQuiz: () => void;
  quiz: any;
  quizLoading: boolean;
  quizLoadProgress: number;
  quizLoadStep: string;
  quizQuestion: any;
  quizResult: any;
  quizStarted: boolean;
  quizTimeRemaining: number | null;
  readyCountdown: number;
  selectedIndex: number | null;
  showQuizQuestion: boolean;
  showReadyCountdown: boolean;
}) {
  const justFailedQuiz =
    quizResult && !quizResult.isCorrect && quizResult.locked;

  return (
    <section
      className={css`
        padding: 1.8rem;
        border-radius: 1.2rem;
        border: 1px solid
          ${justFailedQuiz ? Color.rose(0.4) : Color.borderGray()};
        background: ${justFailedQuiz ? Color.rose(0.04) : Color.white()};
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        box-shadow: 0 10px 20px ${Color.black(0.04)};
      `}
    >
      {justFailedQuiz ? (
        <>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.8rem;
              padding: 1.2rem;
              border-radius: 1rem;
              background: ${Color.rose(0.1)};
              border: 1px solid ${Color.rose(0.3)};
            `}
          >
            <Icon
              icon="times-circle"
              style={{ fontSize: '3rem', color: Color.rose() }}
            />
            <div
              className={css`
                font-size: 1.8rem;
                font-weight: 800;
                color: ${Color.rose()};
              `}
            >
              Quiz Failed
            </div>
            <div
              className={css`
                font-size: 1.3rem;
                color: ${Color.darkerGray()};
                text-align: center;
              `}
            >
              Word Master is locked for today. You can wait until tomorrow or
              pay to bypass.
            </div>
          </div>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1.2rem;
            `}
          >
            <div
              className={css`
                font-size: 1.2rem;
                color: ${Color.gray()};
                font-weight: 600;
              `}
            >
              {`Question ${quiz?.currentIndex ?? 1} of ${
                quiz?.totalQuestions ?? quiz?.questionCount ?? 1
              }`}
            </div>
            <MultipleChoiceQuestion
              question={quizQuestion?.question || ''}
              choices={quizQuestion?.choices || []}
              isGraded={true}
              selectedChoiceIndex={selectedIndex}
              answerIndex={Number(quizResult?.answerIndex || 0)}
              onSelectChoice={() => {}}
              allowReselect={false}
            />
          </div>
        </>
      ) : (
        <>
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              align-items: center;
              justify-content: space-between;
            `}
          >
            <SectionHeader
              title="Timed Vocabulary Quiz"
              description={`Questions: ${quiz?.questionCount ?? 1} | Time: ${
                quiz?.timeLimitSec ?? 0
              }s total`}
              tone="rose"
            />
          </div>

          {showQuizQuestion && typeof quizTimeRemaining === 'number' ? (
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 1rem 1.4rem;
                border-radius: 1.2rem;
                background: ${quizTimeRemaining <= 3
                  ? Color.rose(0.12)
                  : Color.logoBlue(0.12)};
                border: 1px solid
                  ${quizTimeRemaining <= 3
                    ? Color.rose(0.4)
                    : Color.logoBlue(0.3)};
                ${quizTimeRemaining <= 3
                  ? `animation: ${timerPulse} 0.8s ease-in-out infinite;`
                  : ''}
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.6rem;
                  font-size: 1.3rem;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.08em;
                  color: ${quizTimeRemaining <= 3
                    ? Color.rose()
                    : Color.logoBlue()};
                `}
              >
                <Icon icon="clock" />
                Time left
              </div>
              <div
                className={css`
                  font-size: 3rem;
                  font-weight: 800;
                  color: ${quizTimeRemaining <= 3
                    ? Color.rose()
                    : Color.black()};
                `}
              >
                {quizTimeRemaining}s
              </div>
            </div>
          ) : null}

          {!quizStarted || showReadyCountdown ? (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 1rem;
                font-size: 1.3rem;
                color: ${Color.darkerGray()};
              `}
            >
              <div>
                Answer every question before the timer runs out. A wrong answer
                locks Word Master for today.
              </div>
              <div>
                <div
                  className={css`
                    display: flex;
                    justify-content: center;
                    padding-top: 0.4rem;
                  `}
                >
                  <GameCTAButton
                    variant="magenta"
                    icon="bolt"
                    shiny
                    size="xl"
                    disabled={quizLoading || loading || showReadyCountdown}
                    loading={quizLoading}
                    onClick={onStartQuiz}
                    style={{ width: 'min(100%, 320px)' }}
                  >
                    {showReadyCountdown
                      ? `Ready? ${readyCountdown}`
                      : 'Start Quiz'}
                  </GameCTAButton>
                </div>
              </div>
              {quizLoading ? (
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                    padding: 0.8rem 0.9rem;
                    border-radius: 0.9rem;
                    border: 1px solid ${Color.borderGray()};
                    background: ${Color.whiteGray()};
                  `}
                >
                  <div
                    className={css`
                      font-size: 1.2rem;
                      font-weight: 600;
                      color: ${Color.darkerGray()};
                    `}
                  >
                    {quizLoadStep || 'Preparing quiz...'}
                  </div>
                  <div
                    className={css`
                      width: 100%;
                      height: 0.5rem;
                      border-radius: 999px;
                      background: ${Color.borderGray()};
                      overflow: hidden;
                    `}
                  >
                    <div
                      className={css`
                        height: 100%;
                        border-radius: 999px;
                        background: linear-gradient(
                          90deg,
                          ${Color.logoBlue()} 0%,
                          ${Color.oceanBlue()} 100%
                        );
                        transition: width 0.3s ease;
                      `}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, quizLoadProgress)
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 1.2rem;
              `}
            >
              <div
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.gray()};
                  font-weight: 600;
                `}
              >
                {`Question ${quiz?.currentIndex ?? 1} of ${
                  quiz?.totalQuestions ?? quiz?.questionCount ?? 1
                }`}
              </div>
              <MultipleChoiceQuestion
                question={quizQuestion?.question || ''}
                choices={quizQuestion?.choices || []}
                isGraded={Boolean(quizResult)}
                selectedChoiceIndex={selectedIndex}
                answerIndex={Number(quizResult?.answerIndex || 0)}
                onSelectChoice={onSelectChoice}
                allowReselect={false}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
