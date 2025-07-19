import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useWordleLabels } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import moment from 'moment';

export default function WordleResult({
  userId,
  username,
  timeStamp,
  wordleResult
}: {
  userId: number;
  username: string;
  timeStamp: number;
  wordleResult: any;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const { numGuesses } = wordleResult;
  const {
    bonusLabel,
    guessLabel,
    guessLabelColor,
    resultLabel,
    solutionLabel
  } = useWordleLabels({
    ...wordleResult,
    username,
    userId,
    myId
  });
  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  return (
    <ErrorBoundary
      componentPath="Message/TargetMessage/WordleResult"
      style={{ width: '100%', height: '100%' }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          marginTop: '0.5rem',
          marginBottom: '1rem',
          padding: '1.5rem',
          border: `1px solid ${Color.lightGray()}`,
          background: Color.wellGray(),
          display: 'flex',
          alignItems: 'center',
          borderRadius
        }}
      >
        <div
          style={{
            width: '100%',
            background: Color.darkBlueGray(),
            color: '#fff',
            position: 'relative'
          }}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              width: 100%;
              height: 100%;
              padding: 2rem 1rem;
              font-size: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
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
                    ? '2.9rem'
                    : numGuesses === 2
                    ? '2.4rem'
                    : numGuesses === 3
                    ? '2.1rem'
                    : '1.9rem'};
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: ${numGuesses === 1
                      ? '2.1rem'
                      : numGuesses === 2
                      ? '1.8rem'
                      : numGuesses === 3
                      ? '1.5rem'
                      : '1.3rem'};
                  }
                `}
              >
                {guessLabel}
              </p>
            )}
            <div style={{ textAlign: 'center' }}>{resultLabel}</div>
            <p style={{ marginTop: '0.5rem' }}>{solutionLabel}</p>
            {bonusLabel && (
              <p
                style={{
                  marginTop: '0.5rem',
                  fontWeight: 'bold',
                  color: Color.brownOrange()
                }}
              >
                {bonusLabel}
              </p>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '8px'
            }}
            className={css`
              font-size: 0.8rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.6rem;
              }
            `}
          >
            {displayedTimeStamp}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
