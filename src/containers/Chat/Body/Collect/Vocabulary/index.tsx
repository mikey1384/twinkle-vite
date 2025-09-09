import React, { useEffect, useMemo, useRef, useState } from 'react';
import Input from './Input';
import Loading from '~/components/Loading';
import FeedsContainer from './FeedsContainer';
import VocabularyQuiz from './Quiz';
import VocabularyWidget from './VocabularyWidget';
import FilterBar from '~/components/FilterBar';
import RejectedTracker from './RejectedTracker';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  useAppContext,
  useChatContext,
  useInputContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import { VOCAB_CHAT_TYPE, AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function Vocabulary({
  loadingVocabulary
}: {
  loadingVocabulary: boolean;
}) {
  const navigate = useNavigate();
  const [searchedWord, setSearchedWord] = useState<any>(null);
  const [kbInset, setKbInset] = useState(0);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const lookUpWord = useAppContext((v) => v.requestHelpers.lookUpWord);
  const loadVocabRejectedCount = useAppContext(
    (v) => v.requestHelpers.loadVocabRejectedCount
  );
  const collectVocabulary = useAppContext(
    (v) => v.requestHelpers.collectVocabulary
  );
  const unlockWordMaster = useAppContext(
    (v) => v.requestHelpers.unlockWordMaster
  );
  const vocabErrorMessage = useChatContext((v) => v.state.vocabErrorMessage);
  const wordRegisterStatus = useChatContext((v) => v.state.wordRegisterStatus);
  const onSetCollectType = useAppContext(
    (v) => v.user.actions.onSetCollectType
  );
  const onSetWordRegisterStatus = useChatContext(
    (v) => v.actions.onSetWordRegisterStatus
  );
  const onSetWordsObj = useChatContext((v) => v.actions.onSetWordsObj);
  const inputText = useInputContext(
    (v) => v.state[VOCAB_CHAT_TYPE]?.text?.trim?.() || ''
  );
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const userId = useKeyContext((v) => v.myState.userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [unlockCost, setUnlockCost] = useState<number | null>(null);
  const [nextUnlockAt, setNextUnlockAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const feedsContentRef = useRef<any>(null);
  const text = useRef<string>('');
  const inputRef = useRef(null);
  const timerRef = useRef<any>(null);

  const inputTextIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);

  useEffect(() => {
    text.current = inputText;
    setSearchedWord(null);
    if (!inputTextIsEmpty) {
      clearTimeout(timerRef.current);
      if (socketConnected) {
        timerRef.current = setTimeout(() => changeInput(inputText), 1000);
      }
    }
    async function changeInput(input: string) {
      const word = await lookUpWord(input);
      const normalizedInput = input?.trim?.().toLowerCase?.() || '';
      const normalizedContent = word?.content?.toLowerCase?.() || '';
      if (
        word.notFound ||
        (normalizedContent && normalizedContent === normalizedInput)
      ) {
        onSetWordsObj(word);
        setSearchedWord(word);
      }
      // If the lookup resulted in a rejected attempt log (already collected this year and not censored), refresh counter
      if (
        word &&
        word.isNew === false &&
        word.canHit === false &&
        !word.isCensored
      ) {
        try {
          const { count, locked, unlockCost, nextUnlockAt } =
            await loadVocabRejectedCount();
          if (typeof count === 'number') setRejectedCount(count);
          if (typeof locked === 'boolean') setLocked(!!locked);
          if (typeof unlockCost === 'number') setUnlockCost(unlockCost);
          if (typeof nextUnlockAt === 'number') setNextUnlockAt(nextUnlockAt);
        } catch {
          // ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, socketConnected]);

  useEffect(() => {
    // initial load of today's untested/unsolved rejected attempts
    (async () => {
      try {
        const { count, locked, unlockCost, nextUnlockAt } =
          await loadVocabRejectedCount();
        if (typeof count === 'number') setRejectedCount(count);
        if (typeof locked === 'boolean') setLocked(!!locked);
        if (typeof unlockCost === 'number') setUnlockCost(unlockCost);
        if (typeof nextUnlockAt === 'number') setNextUnlockAt(nextUnlockAt);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const widgetHeight = useMemo(() => '10rem', []);
  const quizHeight = useMemo(() => '38rem', []);
  const lockedBarHeight = useMemo(() => '10rem', []);
  const containerHeight = useMemo(
    () =>
      `calc(100% - ${widgetHeight} - 6.5rem - ${kbInset}px - 1rem - env(safe-area-inset-bottom, 0px))`,
    [widgetHeight, kbInset]
  );
  const containerHeightWithQuiz = useMemo(
    () =>
      `calc(100% - ${quizHeight} - ${kbInset}px - 1rem - env(safe-area-inset-bottom, 0px))`,
    [quizHeight, kbInset]
  );
  const containerHeightLocked = useMemo(
    () =>
      `calc(100% - ${lockedBarHeight} - ${kbInset}px - 1rem - env(safe-area-inset-bottom, 0px))`,
    [lockedBarHeight, kbInset]
  );
  // While loading, widget is not visible yet; don't subtract its height
  const containerHeightLoading = useMemo(
    () => `calc(100% - 6.5rem - ${kbInset}px - 1rem - env(safe-area-inset-bottom, 0px))`,
    [kbInset]
  );

  useEffect(() => {
    if (!locked || !nextUnlockAt) {
      setCountdown('');
      return;
    }
    function format(seconds: number) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.max(0, seconds % 60);
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      const ss = s.toString().padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    const tick = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, nextUnlockAt - nowSec);
      setCountdown(format(diff));
      if (diff === 0) setLocked(false);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locked, nextUnlockAt]);

  const isNewWord = useMemo(() => searchedWord?.isNew === true, [searchedWord]);
  const canHit = useMemo(() => searchedWord?.canHit === true, [searchedWord]);

  const wordIsAlreadyDiscovered = useMemo(
    () => !!searchedWord?.content && !searchedWord?.isNew,
    [searchedWord]
  );

  const isCensored = useMemo(() => !!searchedWord?.isCensored, [searchedWord]);

  const statusMessage = useMemo(() => {
    if (searchedWord?.notFound) return `No results for "${inputText}"`;
    if (isCensored)
      return 'This word has already been discovered and it is a type of word that cannot be collected';
    if (isNewWord) return 'New word discovered';
    if (canHit) return 'You can collect this word';
    if (wordIsAlreadyDiscovered)
      return 'Already discovered and already collected this year';
    return '';
  }, [
    searchedWord,
    inputText,
    isNewWord,
    canHit,
    wordIsAlreadyDiscovered,
    isCensored
  ]);

  useEffect(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;

    vv.addEventListener('resize', handleApply);
    vv.addEventListener('scroll', handleApply);
    return () => {
      vv.removeEventListener('resize', handleApply);
      vv.removeEventListener('scroll', handleApply);
    };

    function handleApply() {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset);
    }
  });

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <div
        className={css`
          z-index: 100;
          box-shadow: 0 3px 5px -3px ${Color.black(0.6)};
          width: 100%;
        `}
      >
        <FilterBar
          style={{
            height: '4.5rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav className="active">Word Master</nav>
          <nav onClick={handleFilterClick}>AI Cards</nav>
        </FilterBar>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.8rem 0'
        }}
      >
        <RejectedTracker count={rejectedCount} total={10} />
      </div>
      {loadingVocabulary ? (
        <div style={{ height: containerHeightLoading }}>
          <Loading style={{ height: '50%' }} text="Loading Word Master..." />
        </div>
      ) : (
        <>
          <FeedsContainer
            contentRef={feedsContentRef}
            style={{
              width: '100%',
              overflow: 'scroll',
              height:
                rejectedCount >= 10 && !locked
                  ? containerHeightWithQuiz
                  : locked
                  ? containerHeightLocked
                  : containerHeight,
              position: 'relative',
              zIndex: 4
            }}
          />
          {rejectedCount >= 10 && !locked ? (
            <div style={{ height: quizHeight }}>
              <VocabularyQuiz
                onUpdateRejectedCount={setRejectedCount}
                onDone={(passed?: boolean) => {
                  if (!passed) {
                    setLocked(true);
                  }
                }}
              />
            </div>
          ) : !locked ? (
            <VocabularyWidget
              widgetHeight={widgetHeight}
              wordRegisterStatus={wordRegisterStatus}
              inputTextIsEmpty={inputTextIsEmpty}
              searchedWord={searchedWord}
              socketConnected={socketConnected}
              vocabErrorMessage={vocabErrorMessage}
              isSubmitting={isSubmitting}
              statusMessage={statusMessage}
              canHit={canHit}
              isNewWord={isNewWord}
              isCensored={isCensored}
            />
          ) : null}
        </>
      )}
      {!(rejectedCount >= 10 || locked) && (
        <div
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              min-height: 5.5rem;
            }
          `}
          style={{
            minHeight: '6.5rem',
            background: Color.inputGray(),
            padding: '1rem 1rem',
            borderTop: `1px solid ${Color.borderGray()}`,
            boxSizing: 'border-box',
            // Always keep at least 1rem bottom padding; add keyboard + safe-area
            paddingBottom: `calc(${kbInset || 0}px + 1rem + env(safe-area-inset-bottom, 0px))`
          }}
        >
          <Input
            onInput={() => {
              if (isSubmitting) {
                setIsSubmitting(false);
              }
            }}
            onSubmit={handleSubmit}
            innerRef={inputRef}
            registerButtonShown={(isNewWord || canHit) && !isCensored}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
      {locked && (
        <div
          style={{
            height: lockedBarHeight,
            background: 'linear-gradient(90deg, #418CEB1A, #8A2BE21A)',
            padding: '0.8rem 1.5rem',
            borderTop: `1px solid ${Color.borderGray()}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 1.2rem;
              flex-wrap: wrap;
              color: ${Color.darkerGray()};
            `}
          >
            <div
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                color: ${Color.darkerGray()};
                white-space: nowrap;
              `}
            >
              Unlocks in {countdown || '--:--:--'}
            </div>
            <button
              className={css`
                padding: 0.9rem 1.8rem;
                background: ${Color.green()};
                color: #fff;
                border-radius: 9999px;
                border: none;
                cursor: pointer;
                font-weight: 700;
                box-shadow: 0 4px 12px ${Color.green(0.35)};
              `}
              onClick={async () => {
                try {
                  const { success } = await unlockWordMaster();
                  if (success) {
                    setLocked(false);
                    const { count } = await loadVocabRejectedCount();
                    if (typeof count === 'number') setRejectedCount(count);
                    // no-op
                  }
                } catch {}
              }}
            >
              {unlockCost
                ? `Unlock for ${unlockCost.toLocaleString()} coins`
                : 'Unlock for 100,000 coins'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function handleFilterClick() {
    onSetCollectType(AI_CARD_CHAT_TYPE);
    navigate(`/chat/${AI_CARD_CHAT_TYPE}`);
  }

  async function handleSubmit() {
    if (!searchedWord || inputTextIsEmpty) return;
    if (isCensored) return;

    if ((isNewWord || canHit) && !isSubmitting) {
      setIsSubmitting(true);
      try {
        if (!searchedWord.content) {
          throw new Error('Word content is required');
        }

        const vocabPayload = buildVocabularyPayload(searchedWord);
        const { coins, xp, rank } = await collectVocabulary(vocabPayload);
        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        onSetWordRegisterStatus(searchedWord);

        setSearchedWord(null);
        onEnterComment({ contentType: VOCAB_CHAT_TYPE, text: '' });
        setIsSubmitting(false);
        // Refresh rejected count in case this resulted in a rejected attempt
        try {
          const { count, locked, unlockCost, nextUnlockAt } =
            await loadVocabRejectedCount();
          if (typeof count === 'number') setRejectedCount(count);
          if (typeof locked === 'boolean') setLocked(!!locked);
          if (typeof unlockCost === 'number') setUnlockCost(unlockCost);
          if (typeof nextUnlockAt === 'number') setNextUnlockAt(nextUnlockAt);
        } catch {}
      } catch (error) {
        console.error(error);
        setIsSubmitting(false);
        // Also attempt to refresh count on error
        try {
          const { count, locked, unlockCost, nextUnlockAt } =
            await loadVocabRejectedCount();
          if (typeof count === 'number') setRejectedCount(count);
          if (typeof locked === 'boolean') setLocked(!!locked);
          if (typeof unlockCost === 'number') setUnlockCost(unlockCost);
          if (typeof nextUnlockAt === 'number') setNextUnlockAt(nextUnlockAt);
        } catch {}
      }
    }
  }

  function buildVocabularyPayload(searchedWord: any) {
    const recognizedPartsOfSpeech = [
      'noun',
      'verb',
      'adjective',
      'adverb',
      'preposition',
      'pronoun',
      'conjunction',
      'interjection',
      'phrase',
      'determiner',
      'other'
    ];

    const { content, frequency = 1, ...rest } = searchedWord || {};

    const payload: Record<string, any> = {
      content: content?.toLowerCase?.() || '',
      frequency
    };

    const otherDefinitions: { definition: string }[] = [];

    for (const [key, value] of Object.entries(rest)) {
      if (Array.isArray(value)) {
        if (recognizedPartsOfSpeech.includes(key)) {
          payload[key] = value.map((item: any) => {
            if (typeof item === 'object' && item.definition) {
              return { definition: item.definition };
            } else if (typeof item === 'string') {
              return { definition: item };
            } else {
              return { definition: String(item) };
            }
          });
        } else {
          for (const item of value) {
            if (typeof item === 'object' && item.definition) {
              otherDefinitions.push({ definition: item.definition });
            } else if (typeof item === 'string') {
              otherDefinitions.push({ definition: item });
            } else {
              otherDefinitions.push({ definition: String(item) });
            }
          }
        }
      }
    }

    if (otherDefinitions.length > 0) {
      payload.other = otherDefinitions;
    }

    return payload;
  }
}
