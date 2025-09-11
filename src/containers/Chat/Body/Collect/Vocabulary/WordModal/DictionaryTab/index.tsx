import React from 'react';
import PosBlock from './PosBlock';
import EmptyDictionary from './EmptyDictionary';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function DictionaryTab({
  deletedDefIds,
  definitionOrder,
  onSetPendingAIDefinitions,
  posObj,
  posOrder,
  word
}: {
  deletedDefIds: number[];
  definitionOrder: { [key: string]: number[] };
  onSetPendingAIDefinitions: (data: {
    partOfSpeechOrder: string[];
    partOfSpeeches: any;
  }) => void;
  posObj: { [key: string]: { [key: number]: { title: string } } };
  posOrder: string[];
  word: string;
}) {
  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordModal/DictionaryTab">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          min-width: 70%;
          padding: 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        {posOrder.length === 0 ? (
          <EmptyDictionary
            word={word}
            onAIDefinitionsGenerated={onSetPendingAIDefinitions}
          />
        ) : (
          posOrder.map((pos, index) => {
            return (
              <PosBlock
                key={pos}
                partOfSpeech={pos}
                contentObj={posObj[pos]}
                deletedDefIds={deletedDefIds}
                definitionIds={definitionOrder[pos]}
                style={{ marginTop: index > 0 ? '1.5rem' : 0 }}
              />
            );
          })
        )}
      </div>
    </ErrorBoundary>
  );
}
