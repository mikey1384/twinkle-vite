import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import FilterBar from '~/components/FilterBar';
import DictionaryTab from './DictionaryTab';
import EditTab from './EditTab';
import Button from '~/components/Button';
import WordBattleGate, {
  BattleExamples,
  BattleTrophy,
  isBattleLocked
} from '../WordBattle';
import { useChatContext } from '~/contexts';
import {
  buildPosObj,
  definitionsByPos,
  DefinitionOrder,
  normalizeDefinitionOrder,
  normalizePosOrder
} from './wordShape';

export default function WordModal({
  onHide,
  word,
  typedWord,
  onWordMasterBreak
}: {
  onHide: () => void;
  word: string;
  // The form the member saw when it differs from the word (a Wordle answer
  // ACIDS opens "acid"): the battle's spelling bee never asks for it.
  typedWord?: string;
  onWordMasterBreak?: (status: any) => void;
}) {
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const onEditWord = useChatContext((v) => v.actions.onEditWord);
  const [selectedTab, setSelectedTab] = useState('dictionary');
  // A re-hunt opened from the RAN AWAY card hides the definitions meanwhile.
  const [hunting, setHunting] = useState(false);
  const wordObj = useMemo(() => {
    return wordsObj[word] || {};
  }, [word, wordsObj]);

  const {
    deletedDefIds: rawDeletedDefIds,
    definitionOrder: rawDefinitionOrder,
    bonusRouletteOpen = false,
    partOfSpeechOrder: rawPartOfSpeechOrder
  } = wordObj;
  const deletedDefIds = useMemo<number[]>(
    () => (Array.isArray(rawDeletedDefIds) ? rawDeletedDefIds : []),
    [rawDeletedDefIds]
  );
  // Every shape read defensively (wordShape.ts): a part of speech, an order
  // or a definition list that is missing or malformed is skipped.
  const partOfSpeeches = useMemo(() => definitionsByPos(wordObj), [wordObj]);
  const posObj = useMemo(() => buildPosObj(partOfSpeeches), [partOfSpeeches]);
  // Follows the word as it changes while the modal is open (a battle's
  // unlocked definitions arrive after the first render).
  const definitionOrder = useMemo(
    () => normalizeDefinitionOrder(rawDefinitionOrder, partOfSpeeches),
    [rawDefinitionOrder, partOfSpeeches]
  );
  const posOrder = useMemo(
    () =>
      normalizePosOrder(rawPartOfSpeechOrder).filter(
        (pos) => Object.keys(posObj[pos] || {}).length > 0
      ),
    [rawPartOfSpeechOrder, posObj]
  );

  useEffect(() => {
    if (posOrder.length === 0) {
      setSelectedTab('dictionary');
    }
  }, [posOrder]);

  const title = useMemo(() => {
    if (selectedTab === 'edit') return `Edit Definitions of "${word}"`;
    return word;
  }, [selectedTab, word]);
  // The member's reorder in the Edit tab; until then, the word's own order.
  const [definitionOrderEdit, setDefinitionOrderEdit] =
    useState<DefinitionOrder | null>(null);
  const editedDefinitionOrder = definitionOrderEdit ?? definitionOrder;
  const handleSetEditedDefinitionOrder = useCallback(
    (next: DefinitionOrder | ((prev: DefinitionOrder) => DefinitionOrder)) =>
      setDefinitionOrderEdit((prev) =>
        typeof next === 'function' ? next(prev ?? definitionOrder) : next
      ),
    [definitionOrder]
  );

  return (
    <Modal
      modalKey="WordModal"
      isOpen
      size="xl"
      onClose={onHide}
      hasHeader={false}
      bodyPadding={0}
      allowOverflow
    >
      <LegacyModalLayout wrapped>
        <header>{title}</header>
        {posOrder.length > 0 && (
          <FilterBar>
            <nav
              className={selectedTab === 'dictionary' ? 'active' : ''}
              onClick={() => setSelectedTab('dictionary')}
            >
              Dictionary
            </nav>
            <nav
              className={selectedTab === 'edit' ? 'active' : ''}
              onClick={() => setSelectedTab('edit')}
            >
              Edit
            </nav>
          </FilterBar>
        )}
        {selectedTab === 'dictionary' && isBattleLocked(wordObj) && (
          <>
            <main>
              <div style={{ width: '100%', padding: '2rem' }}>
                <WordBattleGate
                  wordObj={{ ...wordObj, content: typedWord || word }}
                  onUnlocked={() => {}}
                />
              </div>
            </main>
            <footer>
              <Button variant="ghost" onClick={onHide}>
                Close
              </Button>
            </footer>
          </>
        )}
        {selectedTab === 'dictionary' && !isBattleLocked(wordObj) && (
          <DictionaryTab
            header={
              <BattleTrophy wordObj={{ ...wordObj, content: word }} onHuntingChange={setHunting} />
            }
            concealed={hunting}
            footerNote={<BattleExamples examples={wordObj.examples} />}
            deletedDefIds={deletedDefIds}
            definitionOrder={editedDefinitionOrder}
            onHide={onHide}
            posObj={posObj}
            posOrder={posOrder}
            bonusRouletteOpen={!!bonusRouletteOpen}
            word={word}
            onWordMasterBreak={onWordMasterBreak}
          />
        )}
        {selectedTab === 'edit' && (
          <EditTab
            deletedDefIds={deletedDefIds}
            originalDefinitionOrder={definitionOrder}
            editedDefinitionOrder={editedDefinitionOrder}
            onEditWord={onEditWord}
            onHide={onHide}
            originalPosOrder={posOrder}
            posObj={posObj}
            onSetEditedDefinitionOrder={handleSetEditedDefinitionOrder}
            word={word}
          />
        )}
      </LegacyModalLayout>
    </Modal>
  );
}
