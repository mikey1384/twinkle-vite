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
  bonusRouletteOpen,
  word,
  onWordMasterBreak,
  header,
  footerNote,
  concealed = false
}: {
  header?: React.ReactNode;
  footerNote?: React.ReactNode;
  // A re-hunt is open over this word: its definitions stay out of sight
  // (space kept) until it ends.
  concealed?: boolean;
  deletedDefIds: number[];
  definitionOrder: { [key: string]: number[] };
  onHide: () => void;
  posObj: { [key: string]: { [key: number]: { title: string } } };
  posOrder: string[];
  // The word's first Bonus Chance spin is unused although it has definitions
  // (they came free at discovery): the roulette stays on offer.
  bonusRouletteOpen: boolean;
  word: string;
  onWordMasterBreak?: (status: any) => void;
}) {
  const [pendingAIDefinitions, setPendingAIDefinitions] = useState<{
    partOfSpeechOrder: string[];
    partOfSpeeches: any;
  } | null>(null);

  const onApplyAIGeneratedDefinitions = useChatContext(
    (v) => v.actions.onApplyAIGeneratedDefinitions
  );
  const onSetWordsObj = useChatContext((v) => v.actions.onSetWordsObj);
  // Its own spin changes neither until the modal closes (handleClose).
  const bonusChanceShown = posOrder.length === 0 || bonusRouletteOpen;

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordModal/DictionaryTab">
      <main>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            width: 50%;
            padding: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          {header}
          <div style={concealed ? { visibility: 'hidden' } : undefined} aria-hidden={concealed || undefined}>
          {posOrder.map((pos, index) => {
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
          })}
          {bonusChanceShown && (
            <div style={{ marginTop: posOrder.length > 0 ? '2rem' : 0 }}>
              <EmptyDictionary
                word={word}
                onAIDefinitionsGenerated={setPendingAIDefinitions}
                onWordMasterBreak={onWordMasterBreak}
              />
            </div>
          )}
          {footerNote}
          </div>
        </div>
      </main>
      <footer>
        <Button variant="ghost" onClick={handleClose}>
          Close
        </Button>
      </footer>
    </ErrorBoundary>
  );

  function handleClose() {
    if (pendingAIDefinitions) {
      // The wheel only writes definitions for a word that had none; one that
      // already had them keeps its own (and any order edits).
      if (posOrder.length === 0) {
        onApplyAIGeneratedDefinitions({
          word,
          ...pendingAIDefinitions
        });
      }
      // Spun (or found already spun): the first spin is used either way.
      onSetWordsObj({ content: word, bonusRouletteOpen: false });
    }
    onHide();
  }
}
