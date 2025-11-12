import React, { useEffect, useMemo, useState } from 'react';
import NewModal from '~/components/NewModal';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FilterBar from '~/components/FilterBar';
import DictionaryTab from './DictionaryTab';
import EditTab from './EditTab';
import { DndProvider } from 'react-dnd';
import { isMobile } from '~/helpers';
import { useChatContext } from '~/contexts';
import Button from '~/components/Button';
import PronounceButton from '../PronounceButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const Backend = isMobile(navigator) ? TouchBackend : HTML5Backend;

export default function WordModal({
  onHide,
  word
}: {
  onHide: () => void;
  word: string;
}) {
  const onApplyAIGeneratedDefinitions = useChatContext(
    (v) => v.actions.onApplyAIGeneratedDefinitions
  );
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const onEditWord = useChatContext((v) => v.actions.onEditWord);
  const [selectedTab, setSelectedTab] = useState('dictionary');
  const [pendingAIDefinitions, setPendingAIDefinitions] = useState<{
    partOfSpeechOrder: string[];
    partOfSpeeches: any;
  } | null>(null);
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
  // Pronunciation logic is handled by PronounceButton component

  return (
    <DndProvider backend={Backend}>
      <NewModal
        isOpen
        onClose={handleHide}
        size="lg"
        header={
          <div>
            <span>{title}</span>
          </div>
        }
        footer={
          <Button variant="ghost" onClick={handleHide}>
            Close
          </Button>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              className={css`
                font-size: 2.5rem;
                font-weight: bold;
                margin-right: 1rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.7rem;
                }
              `}
            >
              {title}
            </span>
            <PronounceButton
              skeuomorphic
              text={word}
              voice="echo"
              locale="en-US"
              style={{ padding: '0.5rem 0.7rem' }}
              color="darkerGray"
              opacity={0.8}
              ariaLabel="Play pronunciation"
            />
          </div>
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
              onSetPendingAIDefinitions={setPendingAIDefinitions}
              posObj={posObj}
              posOrder={posOrder}
              word={word}
            />
          )}
          {selectedTab === 'edit' && (
            <EditTab
              deletedDefIds={deletedDefIds}
              originalDefinitionOrder={definitionOrder}
              editedDefinitionOrder={editedDefinitionOrder}
              onEditWord={onEditWord}
              originalPosOrder={posOrder}
              posObj={posObj}
              onSetEditedDefinitionOrder={setEditedDefinitionOrder}
              word={word}
            />
          )}
        </div>
      </NewModal>
    </DndProvider>
  );

  function handleHide() {
    if (pendingAIDefinitions) {
      onApplyAIGeneratedDefinitions({
        word,
        ...pendingAIDefinitions
      });
    }
    onHide();
  }
}
