import React, { useEffect, useMemo, useRef, useState } from 'react';
import NewModal from '~/components/NewModal';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FilterBar from '~/components/FilterBar';
import DictionaryTab from './DictionaryTab';
import EditTab from './EditTab';
import { DndProvider } from 'react-dnd';
import { isMobile } from '~/helpers';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useViewContext
} from '~/contexts';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { audioRef } from '~/constants/state';
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
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const editRef = useRef<any>(null);
  const [editDisabled, setEditDisabled] = useState(true);
  const [editPosting, setEditPosting] = useState(false);

  // Pronunciation state
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
  const audioKey = useViewContext((v) => v.state.audioKey);
  const onSetAudioKey = useViewContext((v) => v.actions.onSetAudioKey);
  const [preparingAudio, setPreparingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // Voice: Zero only ('echo')
  const ZERO_VOICE = 'echo';
  const [contentKey, setContentKey] = useState(
    `pronounce-${word}-${ZERO_VOICE}`
  );
  const preloadPromisesRef = useRef<Record<string, Promise<void> | null>>({
    [ZERO_VOICE]: null
  });
  const preloadedAudioRef = useRef<Record<string, HTMLAudioElement | null>>({
    [ZERO_VOICE]: null
  });
  const preloadedUrlRef = useRef<Record<string, string | null>>({
    [ZERO_VOICE]: null
  });
  useEffect(() => {
    // Reset key when the target word changes
    setContentKey(`pronounce-${word}-${ZERO_VOICE}`);
  }, [word]);

  useEffect(() => {
    const playing =
      audioKey === contentKey && audioRef.player && !audioRef.player.paused;
    setIsPlaying(!!playing);
    if (playing) {
      audioRef.player.onended = () => setIsPlaying(false);
    }
  }, [audioKey, contentKey]);

  // Preload Zero's voice in background when modal opens or word changes
  useEffect(() => {
    let canceled = false;

    // Capture ref objects at effect time
    const preloadPromises = preloadPromisesRef.current;
    const preloadedAudio = preloadedAudioRef.current;
    const preloadedUrls = preloadedUrlRef.current;

    async function preload(voice: string) {
      if (preloadPromises[voice]) return preloadPromises[voice]!;

      const promise = (async () => {
        try {
          const data = await textToSpeech(word, voice);
          if (canceled) return;
          const audioBlob = new Blob([data], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.preload = 'auto';
          preloadedAudio[voice] = audio;
          preloadedUrls[voice] = audioUrl;
        } catch {
          // Swallow errors; we'll attempt on-demand if needed
          if (canceled) return;
          preloadedAudio[voice] = null;
          preloadedUrls[voice] = null;
        }
      })();

      preloadPromises[voice] = promise;
      return promise;
    }

    // Start preload for Zero voice
    preload(ZERO_VOICE);

    return () => {
      canceled = true;
      // Cleanup URLs for this word when unmounting or changing word
      [ZERO_VOICE].forEach((v: string) => {
        try {
          if (preloadedAudio[v]) {
            preloadedAudio[v]!.pause();
          }
          if (preloadedUrls[v]) {
            URL.revokeObjectURL(preloadedUrls[v]!);
          }
        } catch {
          // Swallow errors
        }
        preloadedAudio[v] = null;
        preloadedUrls[v] = null;
        preloadPromises[v] = null;
      });
    };
  }, [word, textToSpeech]);

  async function handlePronounce() {
    try {
      // If already playing, stop and exit
      if (audioRef.player && isPlaying) {
        audioRef.player.pause();
        setIsPlaying(false);
        return;
      }

      // Always use Zero's voice
      const nextVoice = ZERO_VOICE;
      const nextKey = `pronounce-${word}-${nextVoice}`;

      // Stop any existing audio
      if (audioRef.player) {
        audioRef.player.pause();
      }

      // Ensure preload finished or await if in-flight
      const existingAudio = preloadedAudioRef.current[nextVoice];
      if (!existingAudio && preloadPromisesRef.current[nextVoice]) {
        setPreparingAudio(true);
        await preloadPromisesRef.current[nextVoice];
      } else if (!existingAudio && !preloadPromisesRef.current[nextVoice]) {
        // Fallback: kick off preload now if it failed earlier
        setPreparingAudio(true);
        const data = await textToSpeech(word, nextVoice);
        const audioBlob = new Blob([data], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        preloadedAudioRef.current[nextVoice] = audio;
        preloadedUrlRef.current[nextVoice] = audioUrl;
      }

      const player = preloadedAudioRef.current[nextVoice];
      if (!player) throw new Error('Audio failed to preload');

      // Set global key and player, then play
      setContentKey(nextKey);
      onSetAudioKey(nextKey);
      audioRef.player = player;
      audioRef.key = nextKey;
      player.currentTime = 0;
      setIsPlaying(true);
      player.play();
      player.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error(error);
    } finally {
      setPreparingAudio(false);
    }
  }

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
          selectedTab === 'edit' ? (
            <>
              <Button
                transparent
                style={{ marginRight: '0.7rem' }}
                onClick={handleHide}
              >
                Close
              </Button>
              <Button
                color={doneColor}
                disabled={editDisabled || editPosting}
                loading={editPosting}
                onClick={() => editRef.current?.apply?.()}
              >
                Apply
              </Button>
            </>
          ) : (
            <>
              <Button transparent onClick={handleHide}>
                Close
              </Button>
            </>
          )
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
            <Button
              skeuomorphic
              onClick={handlePronounce}
              loading={preparingAudio}
              style={{ padding: '0.5rem 0.7rem' }}
              color="darkerGray"
              opacity={0.8}
              aria-label="Play pronunciation"
            >
              <Icon icon={isPlaying ? 'stop' : 'volume'} />
            </Button>
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
              ref={editRef}
              deletedDefIds={deletedDefIds}
              originalDefinitionOrder={definitionOrder}
              editedDefinitionOrder={editedDefinitionOrder}
              onEditWord={onEditWord}
              originalPosOrder={posOrder}
              posObj={posObj}
              onSetEditedDefinitionOrder={setEditedDefinitionOrder}
              onDisabledChange={setEditDisabled}
              onPostingChange={setEditPosting}
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
