import React, { useState } from 'react';
import PosBlock from './PosBlock';
import EmptyDictionary from './EmptyDictionary';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts/hooks';

export default function DictionaryTab({
  deletedDefIds,
  definitionOrder,
  onHide,
  posObj,
  posOrder,
  word
}: {
  deletedDefIds: number[];
  definitionOrder: { [key: string]: number[] };
  onHide: () => void;
  posObj: { [key: string]: { [key: number]: { title: string } } };
  posOrder: string[];
  word: string;
}) {
  const [pendingAIDefinitions, setPendingAIDefinitions] = useState<{
    partOfSpeechOrder: string[];
    partOfSpeeches: any;
  } | null>(null);

  const onApplyAIGeneratedDefinitions = useChatContext(
    (v) => v.actions.onApplyAIGeneratedDefinitions
  );

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordModal/DictionaryTab">
      <main>
        <p
          className={css`
            font-weight: bold;
            font-size: 3rem;
            margin-bottom: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2rem;
            }
          `}
        >
          {word}
        </p>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            width: 50%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          {posOrder.length === 0 ? (
            <EmptyDictionary
              word={word}
              onAIDefinitionsGenerated={setPendingAIDefinitions}
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
      </main>
      <footer>
        <Button transparent onClick={handleClose}>
          Close
        </Button>
      </footer>
    </ErrorBoundary>
  );

  function handleClose() {
    if (pendingAIDefinitions) {
      onApplyAIGeneratedDefinitions({
        word,
        ...pendingAIDefinitions
      });
    }
    onHide();
  }
}
