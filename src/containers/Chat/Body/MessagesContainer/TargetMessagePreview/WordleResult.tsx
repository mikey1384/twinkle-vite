import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { useWordleLabels } from '~/helpers/hooks';
import moment from 'moment';

export default function WordleResult({
  userId,
  username,
  onClose,
  timeStamp,
  wordleResult
}: {
  userId: number;
  username: string;
  onClose: () => void;
  timeStamp: number;
  wordleResult: any;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const { resultLabel, solutionLabel } = useWordleLabels({
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
      componentPath="MessagesContainer/TargetMessagesPreview/WordleResult"
      style={{ width: '100%', height: '100%' }}
    >
      <Icon
        icon="times"
        size="lg"
        style={{
          position: 'absolute',
          right: '1.7rem',
          top: '4rem',
          cursor: 'pointer'
        }}
        onClick={onClose}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          background: Color.darkBlueGray(),
          color: '#fff',
          marginBottom: '1.5rem',
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
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
            }
          `}
        >
          <div style={{ textAlign: 'center' }}>{resultLabel}</div>
          <p style={{ marginTop: '0.5rem' }}>{solutionLabel}</p>
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
    </ErrorBoundary>
  );
}
