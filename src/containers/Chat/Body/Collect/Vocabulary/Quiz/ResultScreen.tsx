import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

export default function ResultScreen({
  result,
  onClose,
  quiz
}: {
  result: {
    isPassed: boolean;
    numCorrect: number;
    total: number;
    grades: string[];
  };
  onClose: () => void;
  quiz?: {
    attemptIndex: number;
    attemptsPlayed: number;
    attemptsRemaining: number;
    numQuestions: number;
    numCorrect: number;
    numS: number;
    numA: number;
    questionPoints: number;
    bonusPoints: number;
    totalPoints: number;
    allPerfect: boolean;
    finalized: boolean;
    bestAttemptIndex: number | null;
    bestAttemptTotal: number;
    bestAttemptQuestionPoints?: number;
    bestAttemptBonusPoints?: number;
    historyId: number | null;
    maxAttempts: number;
  } | null;
}) {
  const { isPassed, grades } = result;
  // Theme colors for each letter grade
  const colorS = useKeyContext((v) => v.theme.grammarGameScoreS.color);
  const colorA = useKeyContext((v) => v.theme.grammarGameScoreA.color);
  const colorB = useKeyContext((v) => v.theme.grammarGameScoreB.color);
  const colorC = useKeyContext((v) => v.theme.grammarGameScoreC.color);
  const colorD = useKeyContext((v) => v.theme.grammarGameScoreD.color);
  const colorF = useKeyContext((v) => v.theme.grammarGameScoreF.color);

  const letterColor: { [key: string]: string } = {
    S: colorS,
    A: colorA,
    B: colorB,
    C: colorC,
    D: colorD,
    F: colorF
  };

  const gradePoints: Record<string, number> = {
    S: 1,
    A: 1,
    B: 0,
    C: 0,
    D: 0,
    F: 0
  };

  // Count grades
  const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const g of grades) {
    const key = counts[g] != null ? g : 'F';
    counts[key]++;
  }
  // Compute total score and perfect
  const baseQuestionPoints = grades.reduce(
    (acc, g) => acc + (gradePoints[g] || 0),
    0
  );
  const questionPoints = quiz ? quiz.questionPoints : baseQuestionPoints;
  const bonusPoints = quiz ? quiz.bonusPoints || 0 : 0;
  const shownTotal = questionPoints + bonusPoints;
  const equation = (() => {
    const parts: string[] = [];
    const sCount = counts.S || 0;
    const aCount = counts.A || 0;
    if (sCount) parts.push(`1 × ${sCount} (S)`);
    if (aCount) parts.push(`1 × ${aCount} (A)`);
    if (!parts.length) parts.push('0');
    if (bonusPoints > 0) parts.push(`${bonusPoints} bonus`);
    return parts.join(' + ');
  })();

  const funFont =
    "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

  return (
    <div className={outerWrapCls(isPassed)}>
      <div className={cardCls(funFont)}>
        <h3 className="result-title">{isPassed ? 'Quiz Cleared' : 'Quiz Failed'}</h3>
        <div className="grade-row">
          {(['S', 'A'] as const)
            .filter((letter) => counts[letter] > 0)
            .map((letter) => (
              <div key={letter} className={gradeBadgeCls(letterColor[letter])}>
                <span>{letter}</span>
                <small>×{counts[letter]}</small>
              </div>
            ))}
        </div>
        {quiz && (
          <div className="points-card">
            <div className="points-title">Word Master Points</div>
            <div className="points-total">{quiz.totalPoints}</div>
            <div className="points-stats">
              <div>
                Attempt {quiz.attemptIndex} / {quiz.maxAttempts}
              </div>
              <div>
                Question pts: {quiz.questionPoints} | Bonus: {quiz.bonusPoints}
              </div>
              <div>
                Best score so far: {quiz.bestAttemptTotal}
                {quiz.bestAttemptIndex
                  ? ` (Attempt #${quiz.bestAttemptIndex})`
                  : ''}
              </div>
              <div>
                Attempts remaining: {Math.max(quiz.attemptsRemaining, 0)}
              </div>
            </div>
            {quiz.finalized && (
              <div className="points-footer">Word Master score recorded!</div>
            )}
          </div>
        )}
        <div className="equation">
          <div>
            {equation} = {shownTotal}
          </div>
          {bonusPoints > 0 && (
            <div className="perfect">Perfect score! +{bonusPoints} bonus</div>
          )}
        </div>
        {!isPassed && (
          <div className="locked-msg">
            Locked until tomorrow (or unlock with coins)
          </div>
        )}
        <div className="cta">
          <GameCTAButton
            icon="arrow-right"
            onClick={onClose}
            variant={isPassed ? 'logoBlue' : 'magenta'}
            size="lg"
            shiny
          >
            Continue
          </GameCTAButton>
        </div>
      </div>
    </div>
  );
}

const outerWrapCls = (isPassed: boolean) => css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    ${isPassed ? Color.logoBlue(0.18) : Color.pink(0.18)},
    ${isPassed ? Color.green(0.16) : Color.red(0.14)},
    rgba(255, 255, 255, 0.8)
  );
  padding: 2.5rem 1.5rem;
`;

const cardCls = (funFont: string) => css`
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid ${Color.borderGray()};
  border-radius: 16px;
  box-shadow: 0 12px 28px ${Color.black(0.12)};
  padding: 2.4rem 2.6rem;
  max-width: 48rem;
  width: 92%;
  text-align: center;
  font-family: ${funFont};

  .result-title {
    margin: 0;
    font-size: 2.4rem;
    font-weight: 800;
    color: ${Color.logoBlue()};
    letter-spacing: 1px;
  }

  .result-subtitle {
    margin: 0.4rem 0 1.6rem 0;
    font-size: 1.2rem;
    color: ${Color.darkGray()};
  }

  .grade-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
    margin-bottom: 2rem;
  }

  .points-card {
    margin: 0 auto 2rem;
    padding: 1.4rem 1.2rem;
    max-width: 28rem;
    background: linear-gradient(
      135deg,
      ${Color.logoBlue(0.15)},
      ${Color.green(0.12)},
      ${Color.gold(0.14)}
    );
    border-radius: 1.2rem;
    border: 2px solid ${Color.logoBlue(0.35)};
    color: ${Color.darkGray()};
    box-shadow: 0 8px 18px ${Color.black(0.12)};

    .points-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: ${Color.logoBlue()};
      letter-spacing: 0.6px;
    }

    .points-total {
      margin-top: 0.4rem;
      font-size: 2.6rem;
      font-weight: 800;
      color: ${Color.blue()};
    }

    .points-stats {
      margin-top: 0.8rem;
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .points-footer {
      margin-top: 0.8rem;
      font-weight: 600;
      color: ${Color.green()};
    }
  }

  .equation {
    font-size: 1.1rem;
    color: ${Color.darkerGray()};
  }

  .perfect {
    margin-top: 0.6rem;
    color: ${Color.magenta()};
    font-weight: 700;
  }

  .correct {
    margin-top: 2rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: ${Color.darkGray()};
  }

  .locked-msg {
    margin-top: 1.2rem;
    color: ${Color.red()};
    font-size: 1.2rem;
    font-weight: 700;
  }

  .cta {
    margin-top: 2.4rem;
  }
`;

const gradeBadgeCls = (colorKey: string) => css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  border-radius: 18px;
  background: linear-gradient(
    145deg,
    ${getThemeColor(colorKey, 0.85)},
    ${getThemeColor(colorKey, 0.65)}
  );
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  font-size: 1.4rem;
  gap: 0.4rem;
  box-shadow: 0 6px 14px ${Color.black(0.18)};
  border: 2px solid ${getThemeColor(colorKey, 0.95)};

  small {
    font-size: 0.7rem;
    letter-spacing: 0.4px;
  }
`;

function getThemeColor(colorKey: string, opacity = 1) {
  const fn = Color[colorKey];
  return (fn || Color.logoBlue)(opacity);
}
