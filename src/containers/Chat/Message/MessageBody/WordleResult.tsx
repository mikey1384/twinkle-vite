import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useWordleLabels } from '~/helpers/hooks';
import { getWordleBannerLevelColor } from '../../constants/wordlePresentation';
import moment from 'moment';

// Its Reply and reaction row come from the shared card frame in MessageBody.
export default function WordleResult({
  username,
  userId,
  myId,
  wordleResult,
  timeStamp
}: {
  myId: number;
  userId: number;
  username: string;
  timeStamp: number;
  wordleResult: any;
}) {
  const { isSolved, numGuesses } = wordleResult;
  const isQuickSolve = isSolved && (numGuesses === 1 || numGuesses === 2);

  const {
    guessLabel,
    bonusLabel,
    resultLabel,
    guessLabelColor,
    solutionLabel
  } = useWordleLabels({
    ...wordleResult,
    wordLevelColor: getWordleBannerLevelColor(wordleResult.wordLevel),
    username,
    userId,
    myId
  });

  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  return (
    <div
      aria-label="Wordle result"
      className={css`
        container-type: inline-size;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        border-radius: ${borderRadius};
        .reward-amount-label {
          display: inline-block;
          white-space: nowrap;
          color: ${isQuickSolve ? Color.gold() : 'inherit'};
          font-size: ${isQuickSolve ? '2.6rem' : 'inherit'};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${isQuickSolve ? 'max(22px, 2.3rem)' : 'inherit'};
          }
        }
      `}
      style={{
        width: 'calc(100% - 2.4rem)',
        background: Color.darkBlueGray(),
        color: '#fff',
        margin: '0.6rem 1.2rem 1rem',
        position: 'relative'
      }}
    >
      {isSolved && (
        <Icon
          icon="trophy"
          color={Color.gold()}
          style={{
            position: 'absolute',
            top: '1.3rem',
            left: '1.2rem',
            fontSize: '2.2rem'
          }}
        />
      )}
      <div
        className={css`
          grid-area: 1 / 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: max(28px, 2.8rem) 56px;
          font-size: 1.6rem;
          text-align: center;
          @container (min-width: 720px) {
            padding-block: 1.4rem;
          }
          @media (max-width: ${mobileMaxWidth}) {
            font-size: max(14px, 1.4rem);
          }
        `}
      >
        {guessLabel && (
          <p
            style={{
              marginBottom: '0.5rem',
              color: guessLabelColor,
              fontWeight: 'bold'
            }}
            className={css`
              font-size: ${numGuesses === 1
                ? '3rem'
                : numGuesses === 2
                ? '2.5rem'
                : numGuesses === 3
                ? '2.2rem'
                : '2rem'};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: ${numGuesses === 1
                  ? 'max(20px, 2.3rem)'
                  : numGuesses === 2
                  ? 'max(18px, 2rem)'
                  : numGuesses === 3
                  ? 'max(16px, 1.7rem)'
                  : 'max(15px, 1.5rem)'};
              }
            `}
          >
            {guessLabel}
          </p>
        )}
        <div style={{ maxWidth: '100%', overflowWrap: 'anywhere' }}>
          {resultLabel}
        </div>
        <p style={{ marginTop: '0.5rem' }}>{solutionLabel}</p>
        {bonusLabel && (
          <p
            style={{
              marginTop: '0.5rem',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: Color.gold()
            }}
          >
            <Icon icon="bolt" />
            {bonusLabel}
          </p>
        )}
      </div>
      <div
        className={css`
          grid-area: 1 / 1;
          align-self: end;
          justify-self: end;
          margin: 0 1.2rem 0.7rem;
          text-align: right;
          white-space: nowrap;
          font-size: max(11px, 1.1rem);
        `}
      >
        {displayedTimeStamp}
      </div>
    </div>
  );
}
