import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import FilterBar from '~/components/FilterBar';
import DictionaryTab from './DictionaryTab';
import EditTab from './EditTab';
import { useChatContext } from '~/contexts';

export default function WordModal({
  onHide,
  word,
  onWordMasterBreak
}: {
  onHide: () => void;
  word: string;
  onWordMasterBreak?: (status: any) => void;
}) {
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const onEditWord = useChatContext((v) => v.actions.onEditWord);
  const [selectedTab, setSelectedTab] = useState('dictionary');
  const wordObj = useMemo(() => {
    return wordsObj[word] || {};
  }, [word, wordsObj]);

  const {
    noun = [],
    verb = [],
    adjective = [],
    preposition = [],
    adverb = [],
    pronoun = [],
    conjunction = [],
    interjection = [],
    phrase = [],
    determiner = [],
    other = [],
    deletedDefIds = [],
    definitionOrder,
    partOfSpeechOrder = [
      'noun',
      'verb',
      'adjective',
      'preposition',
      'adverb',
      'pronoun',
      'conjunction',
      'interjection',
      'determiner',
      'phrase',
      'other'
    ]
  } = wordObj;
  const partOfSpeeches = useMemo<Record<string, any>>(() => {
    return {
      noun,
      verb,
      adjective,
      preposition,
      adverb,
      pronoun,
      conjunction,
      interjection,
      determiner,
      phrase,
      other
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordObj]);
  const posObj = useMemo(() => {
    const result: Record<string, any> = {
      adjective: {},
      adverb: {},
      conjunction: {},
      interjection: {},
      noun: {},
      preposition: {},
      pronoun: {},
      verb: {},
      determiner: {},
      phrase: {},
      other: {}
    };
    for (const key in partOfSpeeches) {
      for (const { id, definition } of partOfSpeeches[key]) {
        result[key][id] = {
          id,
          title: definition
        };
      }
    }
    return result;
  }, [partOfSpeeches]);

  const posOrder = partOfSpeechOrder.filter(
    (pos: any) => Object.keys(posObj[pos] || {}).length > 0
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
  const [editedDefinitionOrder, setEditedDefinitionOrder] =
    useState(definitionOrder);

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
        {selectedTab === 'dictionary' && (
          <DictionaryTab
            deletedDefIds={deletedDefIds}
            definitionOrder={editedDefinitionOrder}
            onHide={onHide}
            posObj={posObj}
            posOrder={posOrder}
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
            onSetEditedDefinitionOrder={setEditedDefinitionOrder}
            word={word}
          />
        )}
      </LegacyModalLayout>
    </Modal>
  );
}
