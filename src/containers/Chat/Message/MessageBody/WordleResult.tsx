import React, { useContext, useMemo, useState } from 'react';
import ActionMenu from './ActionMenu';
import Icon from '~/components/Icon';
import LocalContext from '../../Context';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useWordleLabels } from '~/helpers/hooks';
import { getWordleBannerLevelColor } from '../../constants/wordlePresentation';
import moment from 'moment';

const replyLabel = 'Reply';

export default function WordleResult({
  channelId,
  messageId,
  username,
  userId,
  myId,
  onReplyClick,
  wordleResult,
  timeStamp
}: {
  channelId: number;
  messageId: number;
  myId: number;
  userId: number;
  username: string;
  onReplyClick: (target: any) => void;
  timeStamp: number;
  wordleResult: any;
}) {
  const [dropdownShown, setDropdownShown] = useState(false);
  const {
    actions: { onSetReplyTarget }
  } = useContext(LocalContext);
  const { isSolved, numGuesses } = wordleResult;

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
      role="article"
      tabIndex={0}
      aria-label="Wordle result"
      className={css`
        border-radius: ${borderRadius};
        border: 1px solid ${isSolved ? Color.gold(0.55) : Color.gray(0.4)};
        border-top: 3px solid ${isSolved ? Color.gold() : Color.gray()};
        .menu-button {
          display: ${dropdownShown ? 'block' : 'none'};
        }
        &:hover,
        &:focus-within {
          .menu-button {
            display: block;
          }
        }
        .reward-amount-label {
          display: inline-block;
          white-space: nowrap;
          color: ${isSolved ? Color.gold() : 'inherit'};
          font-size: ${numGuesses <= 2 ? '2.6rem' : '2.2rem'};
          font-weight: 800;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${numGuesses <= 2
              ? 'max(22px, 2.3rem)'
              : 'max(20px, 2rem)'};
          }
        }
        @media (max-width: 1024px), (pointer: coarse) {
          .menu-button {
            display: block;
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
        style={{
          position: 'absolute',
          top: '0.6rem',
          right: '0.8rem'
        }}
      >
        <ActionMenu
          label="Wordle result actions"
          items={[
            {
              id: 'reply',
              label: (
                <>
                  <Icon icon="reply" />
                  <span>{replyLabel}</span>
                </>
              ),
              onClick: () => {
                onSetReplyTarget({
                  channelId,
                  target: {
                    id: messageId,
                    wordleResult,
                    timeStamp,
                    userId,
                    username
                  }
                });
                onReplyClick({
                  id: messageId,
                  wordleResult,
                  timeStamp,
                  userId,
                  username
                });
              }
            }
          ]}
          onShownChange={setDropdownShown}
        />
      </div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 1.2rem 56px 0.7rem;
          font-size: 1.6rem;
          text-align: center;
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
        <div>{resultLabel}</div>
        <p style={{ marginTop: '0.5rem' }}>{solutionLabel}</p>
        {bonusLabel && (
          <p
            style={{
              marginTop: '0.5rem',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.3rem 1rem',
              borderRadius: '2rem',
              fontSize: 'max(11px, 1.2rem)',
              background: Color.gold(),
              color: Color.darkBlueGray()
            }}
          >
            <Icon icon="bolt" />
            {bonusLabel}
          </p>
        )}
      </div>
      <div
        style={{
          textAlign: 'right',
          padding: '0 1.2rem 0.7rem'
        }}
        className={css`
          font-size: max(11px, 1.1rem);
        `}
      >
        {displayedTimeStamp}
      </div>
    </div>
  );
}
