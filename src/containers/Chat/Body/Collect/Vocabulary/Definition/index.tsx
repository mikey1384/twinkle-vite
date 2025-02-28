import React, { useState, useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import WordModal from '../WordModal';
import PosBlock from './PosBlock';
import { css } from '@emotion/css';

export default function Definition({
  style,
  wordObj,
  isNewWord,
  canHit
}: {
  style?: React.CSSProperties;
  wordObj: any;
  isNewWord?: boolean;
  canHit?: boolean;
}) {
  const [wordModalShown, setWordModalShown] = useState(false);
  const editButtonShown = useMemo(
    () => Boolean(wordObj.id) && !isNewWord && !canHit,
    [wordObj.id, isNewWord, canHit]
  );
  const {
    partOfSpeechOrder = [
      'noun',
      'verb',
      'adjective',
      'preposition',
      'adverb',
      'pronoun',
      'conjunction',
      'interjection',
      'phrase',
      'determiner',
      'other'
    ]
  } = wordObj;

  const filteredPosOrder = useMemo(
    () => partOfSpeechOrder.filter((pos: any) => wordObj[pos]?.length > 0),
    [partOfSpeechOrder, wordObj]
  );

  return (
    <div
      style={{
        padding: '1rem',
        position: 'relative',
        ...style
      }}
    >
      {editButtonShown && filteredPosOrder?.length > 0 && (
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <Button
            className={css`
              opacity: 0.8;
              &:hover {
                opacity: 1;
              }
            `}
            skeuomorphic
            onClick={() => setWordModalShown(true)}
          >
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '0.7rem' }}>Edit</span>
          </Button>
        </div>
      )}
      {filteredPosOrder.length === 0 ? (
        <div
          className={css`
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: center;
          `}
        >
          <div
            onClick={() => {
              if (canHit || isNewWord) return;
              setWordModalShown(true);
            }}
            className={css`
              cursor: ${canHit || isNewWord ? 'default' : 'pointer'};
              font-size: 3rem;
              font-weight: bold;
              width: 50px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              &::before {
                content: '';
                position: absolute;
                inset: -3px;
                border-radius: 50%;
                padding: 3px;
                background: linear-gradient(
                  45deg,
                  #ffd700,
                  #ff69b4,
                  #9370db,
                  #4169e1
                );
                -webkit-mask: linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
                mask: linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                animation: gradient 3s ease infinite;
                background-size: 300% 300%;
              }
              span {
                background: linear-gradient(
                  45deg,
                  #ffd700,
                  #ff69b4,
                  #9370db,
                  #4169e1
                );
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: gradient 3s ease infinite;
                background-size: 300% 300%;
              }
              @keyframes gradient {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
            `}
          >
            <span>?</span>
          </div>
        </div>
      ) : (
        filteredPosOrder.map((pos: any) => {
          return <PosBlock key={pos} wordObj={wordObj} pos={pos} />;
        })
      )}
      {wordModalShown && (
        <WordModal
          key={wordObj.content}
          onHide={() => setWordModalShown(false)}
          word={wordObj.content}
        />
      )}
    </div>
  );
}
