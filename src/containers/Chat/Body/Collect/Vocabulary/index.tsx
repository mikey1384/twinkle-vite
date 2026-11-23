import React, { useEffect, useMemo, useRef, useState } from 'react';
import Input from './Input';
import Loading from '~/components/Loading';
import FeedsContainer from './FeedsContainer';
import MonsterDen from './MonsterDen';
import VocabularyWidget from './VocabularyWidget';
import WordMasterBreakModal from './WordMasterBreakModal';
import DiscoveryMoment, {
  DISCOVERY_MIN_WORKING_MS,
  WordDiscovery
} from './DiscoveryMoment';
import FilterBar from '~/components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useInputContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import {
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE,
  CHAT_ID_BASE_NUMBER,
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  LAST_ONLINE_FILTER_LABEL,
  returnWordLevel
} from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { trackEvent } from '~/helpers/analytics';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';
import { css } from '@emotion/css';

export default function Vocabulary({
  displayedThemeColor,
  loadingVocabulary
}: {
  displayedThemeColor: string;
  loadingVocabulary: boolean;
}) {
  const navigate = useNavigate();
  const [searchedWord, setSearchedWord] = useState<any>(null);
  const [kbInset, setKbInset] = useState(0);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const lookUpWord = useAppContext((v) => v.requestHelpers.lookUpWord);
  const collectVocabulary = useAppContext(
    (v) => v.requestHelpers.collectVocabulary
  );
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const fetchWordMasterBreakStatus = useAppContext(
    (v) => v.requestHelpers.fetchWordMasterBreakStatus
  );
  const clearWordMasterBreak = useAppContext(
    (v) => v.requestHelpers.clearWordMasterBreak
  );
  const loadWordMasterQuizQuestion = useAppContext(
    (v) => v.requestHelpers.loadWordMasterQuizQuestion
  );
  const submitWordMasterQuizAnswer = useAppContext(
    (v) => v.requestHelpers.submitWordMasterQuizAnswer
  );
  const spinBreakPassRoulette = useAppContext(
    (v) => v.requestHelpers.spinBreakPassRoulette
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
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onSetWordleModalShown = useChatContext(
    (v) => v.actions.onSetWordleModalShown
  );
  const onSetOmokModalShown = useChatContext(
    (v) => v.actions.onSetOmokModalShown
  );
  const inputText = useInputContext(
    (v) => v.state[VOCAB_CHAT_TYPE]?.text?.trim?.() || ''
  );
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const onSetChessPuzzleModalShown = useHomeContext(
    (v) => v.actions.onSetChessPuzzleModalShown
  );
  const onSetOrderUsersBy = useAppContext(
    (v) => v.user.actions.onSetOrderUsersBy
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordMasterBreak, setWordMasterBreak] = useState<any>(null);
  const [wordMasterBreakLoading, setWordMasterBreakLoading] = useState(false);
  const [wordMasterBreakModalShown, setWordMasterBreakModalShown] =
    useState(false);
  const [strikeAnimationKey, setStrikeAnimationKey] = useState(0);
  const [discovery, setDiscovery] = useState<WordDiscovery | null>(null);
  const discoveryWord = discovery?.word || '';
  // Word Master's state for the word being discovered: the registration feed
  // lands here with the stored definitions, level, rewards and discoverer.
  const discoveryWordObj = useChatContext((v) =>
    discoveryWord ? v.state.wordsObj?.[discoveryWord] : null
  );
  const discoveryWordObjRef = useRef<any>(null);
  discoveryWordObjRef.current = discoveryWordObj;
  const feedsContentRef = useRef<any>(null);
  const text = useRef<string>('');
  const inputRef = useRef(null);
  const timerRef = useRef<any>(null);
  const lastStrikeSyncRef = useRef(0);
  const breakStatusLoadedRef = useRef(false);

  const inputTextIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);
  const wordMasterBlocked = useMemo(
    () => Boolean(wordMasterBreak?.blocked),
    [wordMasterBreak]
  );

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
      if (word?.wordMasterBreak) {
        handleWordMasterBreakUpdate(word.wordMasterBreak, false);
      }
      const shouldTriggerStrikeAnimation = Boolean(
        word?.wordMasterBreak &&
          word?.content &&
          word.content === text.current &&
          !word?.isNew &&
          !word?.canHit &&
          !word?.isCensored
      );
      if (shouldTriggerStrikeAnimation) {
        setStrikeAnimationKey((prev) => prev + 1);
      }
      maybeSyncStrikeCount(word);
      if (word.notFound || (word.content && word.content === text.current)) {
        onSetWordsObj(word);
        setSearchedWord(word);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, socketConnected]);

  const widgetHeight = '10rem';
  const inputAreaHeight = '6.5rem';
  // The Monster Den tab sits next to the feed (Mikey 11-23).
  const [denShown, setDenShown] = useState(false);
  const containerHeight = `calc(100% - ${widgetHeight} - ${inputAreaHeight} - ${kbInset}px)`;

  // A phrase nobody has registered is collected, not discovered, unless it
  // is one of the good phrases (Mikey, 11-23): the lookup marks it
  // collectOnly, and it takes the plain collect path (no discovery moment).
  const isCollectOnlyPhrase = useMemo(
    () => searchedWord?.isNew === true && searchedWord?.collectOnly === true,
    [searchedWord]
  );
  const isNewWord = useMemo(
    () => searchedWord?.isNew === true && !isCollectOnlyPhrase,
    [searchedWord, isCollectOnlyPhrase]
  );
  const canHit = useMemo(
    () => searchedWord?.canHit === true || isCollectOnlyPhrase,
    [searchedWord, isCollectOnlyPhrase]
  );

  const wordIsAlreadyDiscovered = useMemo(
    () => !!searchedWord?.content && !searchedWord?.isNew,
    [searchedWord]
  );

  const isCensored = useMemo(() => !!searchedWord?.isCensored, [searchedWord]);
  const maskWordMasterStatus = useMemo(
    () => Boolean(wordMasterBlocked && searchedWord),
    [wordMasterBlocked, searchedWord]
  );

  const statusMessage = useMemo(() => {
    if (maskWordMasterStatus) {
      return 'Break active';
    }
    if (searchedWord?.notFound) return `No results for "${inputText}"`;
    if (isCensored)
      return 'This word has already been discovered and it is a type of word that cannot be collected';
    // A form counts as its base word (Mikey, 11-22): name the word that
    // submitting actually discovers or collects.
    const baseWord =
      typeof searchedWord?.formOf?.lemma === 'string'
        ? searchedWord.formOf.lemma
        : '';
    if (isNewWord) {
      return baseWord ? `You'll discover: ${baseWord}` : 'New word discovered';
    }
    if (isCollectOnlyPhrase) return 'You can collect this phrase';
    if (canHit) {
      return baseWord ? `You'll collect: ${baseWord}` : 'You can collect this word';
    }
    if (wordIsAlreadyDiscovered)
      return baseWord
        ? `Counts as "${baseWord}", already collected this year`
        : 'Already discovered and already collected this year';
    return '';
  }, [
    searchedWord,
    inputText,
    isNewWord,
    isCollectOnlyPhrase,
    canHit,
    wordIsAlreadyDiscovered,
    isCensored,
    maskWordMasterStatus
  ]);

  // Hands Zero and Ciel the Word Master box as shown: the word typed, what the
  // lookup said about it, and whether a break is blocking collecting, never
  // the word's status while a break masks it.
  useAgentScreenState(
    'wordMaster',
    {
      inputText: inputText.slice(0, 100),
      searchedWord:
        searchedWord && !maskWordMasterStatus
          ? {
              word: searchedWord.content || null,
              notFound: !!searchedWord.notFound,
              isNew: isNewWord,
              canHit,
              alreadyDiscovered: wordIsAlreadyDiscovered,
              isCensored
            }
          : null,
      statusMessage: statusMessage || null,
      errorMessage: vocabErrorMessage || null,
      isSubmitting,
      discovery: discovery
        ? { word: discovery.word, phase: discovery.phase }
        : null,
      breakBlocked: wordMasterBlocked,
      breakModalShown: wordMasterBreakModalShown
    },
    { background: true }
  );

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

  // The AI's definition lines as it writes them, sent only to this member's
  // tabs while their discovery registers. A view only: the reveal uses the
  // stored definitions from the registration feed.
  useEffect(() => {
    if (!discoveryWord) return;
    function handleDiscoveryThought(event: {
      word?: string;
      thoughtContent?: string;
      isComplete?: boolean;
    }) {
      if (String(event?.word || '').toLowerCase() !== discoveryWord) return;
      setDiscovery((prev) =>
        prev?.word === discoveryWord
          ? {
              ...prev,
              streamText: String(event.thoughtContent || ''),
              streamComplete: !!event.isComplete
            }
          : prev
      );
    }
    socket.on('word_discovery_thought_streamed', handleDiscoveryThought);
    return () => {
      socket.off('word_discovery_thought_streamed', handleDiscoveryThought);
    };
  }, [discoveryWord]);

  useEffect(() => {
    if (breakStatusLoadedRef.current) return;
    breakStatusLoadedRef.current = true;
    refreshWordMasterBreakStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column'
      }}
    >
      <div
        className={css`
          z-index: 100;
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
          <nav className={denShown ? '' : 'active'} onClick={() => setDenShown(false)}>
            Word Master
          </nav>
          <nav className={denShown ? 'active' : ''} onClick={() => setDenShown(true)}>
            Den
          </nav>
          <nav onClick={handleFilterClick}>AI Cards</nav>
        </FilterBar>
      </div>
      {denShown && <MonsterDen style={{ width: '100%', height: containerHeight }} />}
      {loadingVocabulary ? (
        <div style={{ height: containerHeight, display: denShown ? 'none' : undefined }}>
          <Loading style={{ height: '50%' }} text="Loading Word Master..." />
        </div>
      ) : (
        // Kept mounted under the Den so the feed keeps its place and live
        // updates.
        <FeedsContainer
          contentRef={feedsContentRef}
          displayedThemeColor={displayedThemeColor}
          onWordMasterBreak={handleWordMasterBreakUpdate}
          style={{
            width: '100%',
            overflow: 'scroll',
            height: containerHeight,
            ...(denShown ? { display: 'none' } : null)
          }}
        />
      )}
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
        onWordMasterBreak={handleWordMasterBreakUpdate}
        wordMasterBreak={wordMasterBreak}
        wordMasterBreakLoading={wordMasterBreakLoading}
        onOpenBreaks={() => setWordMasterBreakModalShown(true)}
        strikeAnimationKey={strikeAnimationKey}
        maskWordMasterStatus={maskWordMasterStatus}
        discoveryMoment={
          discovery ? (
            <DiscoveryMoment
              discovery={discovery}
              wordObj={discoveryWordObj}
              myUserId={userId}
              onDone={() => setDiscovery(null)}
            />
          ) : null
        }
      />
      <div
        style={{
          height: inputAreaHeight,
          background: Color.inputGray(),
          padding: 'CALC(1rem - 2px) 1rem',
          borderTop: '1px solid var(--ui-border)',
          paddingBottom: kbInset ? kbInset : undefined
        }}
      >
        <Input
          onInput={() => {
            if (isSubmitting && discovery?.phase !== 'working') {
              setIsSubmitting(false);
            }
            // Typing the next word puts a finished discovery away.
            if (discovery && discovery.phase !== 'working') {
              setDiscovery(null);
            }
          }}
          onSubmit={handleSubmit}
          innerRef={inputRef}
          registerButtonShown={
            (isNewWord || canHit) && !isCensored && !wordMasterBlocked
          }
          isSubmitting={isSubmitting}
        />
      </div>
      {wordMasterBreakModalShown && (
        <WordMasterBreakModal
          breakStatus={wordMasterBreak || {}}
          isOpen={wordMasterBreakModalShown}
          loading={wordMasterBreakLoading}
          onClose={() => setWordMasterBreakModalShown(false)}
          onRefresh={refreshWordMasterBreakStatus}
          onClearBreak={handleClearWordMasterBreak}
          onPayBreak={handlePayWordMasterBreak}
          onSpinRoulette={handleSpinBreakPassRoulette}
          onLoadQuizQuestion={handleLoadWordMasterQuizQuestion}
          onSubmitQuizAnswer={handleSubmitWordMasterQuizAnswer}
          onOpenWordle={() => {
            setWordMasterBreakModalShown(false);
            onUpdateSelectedChannelId(GENERAL_CHAT_ID);
            navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
            setTimeout(() => {
              onSetWordleModalShown(true);
            }, 300);
          }}
          onOpenGrammarGame={() => {
            setWordMasterBreakModalShown(false);
            navigate('/grammarbles');
          }}
          onOpenArena={() => {
            setWordMasterBreakModalShown(false);
            navigate('/arena');
          }}
          onOpenDailyQuestion={handleOpenDailyQuestion}
          onOpenChessPuzzle={handleOpenChessPuzzle}
          onOpenPendingOmok={handleOpenPendingOmok}
          onOpenOmokStart={handleOpenOmokStart}
          onStartOmokWithUser={handleStartOmokWithUser}
        />
      )}
    </div>
  );

  function handleFilterClick() {
    onSetCollectType(AI_CARD_CHAT_TYPE);
    navigate(`/chat/${AI_CARD_CHAT_TYPE}`);
  }

  function handleOpenDailyQuestion() {
    setWordMasterBreakModalShown(false);
    navigate('/daily-reflection');
  }

  function handleOpenChessPuzzle() {
    setWordMasterBreakModalShown(false);
    navigate('/');
    onSetChessPuzzleModalShown(true);
  }

  function handleOpenPendingOmok(channelId: number) {
    if (!channelId) return;
    setWordMasterBreakModalShown(false);
    onUpdateSelectedChannelId(channelId);
    onUpdateTodayStats({
      newStats: { unansweredOmokMsgChannelId: null }
    });
    navigate(`/chat/${Number(CHAT_ID_BASE_NUMBER) + Number(channelId)}`);
    setTimeout(() => {
      onSetOmokModalShown(true);
    }, 300);
  }

  function handleOpenOmokStart() {
    setWordMasterBreakModalShown(false);
    onSetOrderUsersBy(LAST_ONLINE_FILTER_LABEL);
    navigate('/users');
  }

  async function handleStartOmokWithUser(user: {
    id: number;
    username: string;
    profilePicUrl?: string;
  }) {
    if (!user?.id) return;
    setWordMasterBreakModalShown(false);
    try {
      const { channelId, pathId } = await loadDMChannel({ recipient: user });
      if (!pathId && userId) {
        onOpenNewChatTab({
          user: { username, id: userId, profilePicUrl },
          recipient: {
            username: user.username,
            id: user.id,
            profilePicUrl: user.profilePicUrl
          }
        });
      }
      onUpdateSelectedChannelId(channelId);
      setTimeout(() => {
        navigate(pathId ? `/chat/${pathId}` : `/chat/new`);
        setTimeout(() => {
          onSetOmokModalShown(true);
        }, 300);
      }, 0);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit() {
    if (!searchedWord || inputTextIsEmpty) return;
    if (isCensored) return;
    if (wordMasterBlocked) {
      setWordMasterBreakModalShown(true);
      return;
    }

    if (discovery?.phase === 'working') return;
    if (isNewWord && !isSubmitting && searchedWord.content) {
      return handleDiscover();
    }
    if ((isNewWord || canHit) && !isSubmitting) {
      setIsSubmitting(true);
      try {
        if (!searchedWord.content) {
          throw new Error('Word content is required');
        }

        const vocabPayload = buildVocabularyPayload(searchedWord);
        const result = await collectVocabulary(vocabPayload);
        if (result?.wordMasterBreak) {
          handleWordMasterBreakUpdate(result.wordMasterBreak);
          setIsSubmitting(false);
          return;
        }
        // A collect-only phrase someone else registered at the same moment
        // (their collect won): nothing to pay here.
        if (result?.discoveryRace) {
          setSearchedWord(null);
          setIsSubmitting(false);
          return;
        }
        const { coins, xp, rank } = result;
        trackEvent('vocab_word_collect', {
          word: searchedWord.content,
          is_new_word: !!isNewWord
        });
        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        onSetWordRegisterStatus(searchedWord);

        setSearchedWord(null);
        onEnterComment({ contentType: VOCAB_CHAT_TYPE, text: '' });
        setIsSubmitting(false);
      } catch (error) {
        console.error(error);
        setIsSubmitting(false);
      }
    }
  }

  // Discovering a new word: the robots work while POST /word registers it and
  // writes its definitions, then the reveal. If another member discovers the
  // same word at the same moment, theirs wins and this one settles quietly
  // as "so close" (never an error, and never a second POST that could count
  // as collecting an already-collected word).
  async function handleDiscover() {
    const word = String(searchedWord.content).toLowerCase();
    const wordForStatus = searchedWord;
    const startedAt = Date.now();
    setIsSubmitting(true);
    setDiscovery({
      word,
      wordLevel: returnWordLevel({ frequency: searchedWord.frequency, word }),
      phase: 'working',
      startedAt,
      streamText: '',
      streamComplete: false,
      racing: false
    });
    try {
      // discoverOnly: if the word turns out to be registered already, the
      // server answers "already discovered" instead of treating this as a
      // collect attempt (which would count a strike).
      const vocabPayload = {
        ...buildVocabularyPayload(searchedWord),
        discoverOnly: true
      };
      let result = await collectVocabulary(vocabPayload);
      if (result?.discoveryRace === 'word_registration_in_progress') {
        setDiscovery((prev) =>
          prev?.word === word ? { ...prev, racing: true } : prev
        );
        // The other discovery normally lands within its definition time
        // limit (20 s). Only if it never does (it failed) is the word still
        // free, and one quiet retry discovers it.
        const settled = await waitForRegistration(25000);
        result = settled
          ? { discoveryRace: 'word_already_discovered' }
          : await collectVocabulary(vocabPayload);
      }
      if (result?.wordMasterBreak) {
        setDiscovery(null);
        handleWordMasterBreakUpdate(result.wordMasterBreak);
        setIsSubmitting(false);
        return;
      }
      const registered =
        !result?.discoveryRace && typeof result?.coins === 'number';
      if (registered) {
        trackEvent('vocab_word_collect', { word, is_new_word: true });
        onSetUserState({
          userId,
          newState: {
            twinkleXP: result.xp,
            twinkleCoins: result.coins,
            rank: result.rank
          }
        });
        onSetWordRegisterStatus(wordForStatus);
      }
      const shownFor = Date.now() - startedAt;
      if (shownFor < DISCOVERY_MIN_WORKING_MS) {
        await wait(DISCOVERY_MIN_WORKING_MS - shownFor);
      }
      // The registration feed carries the stored definitions; give it a
      // moment so they arrive with the reveal (it also fills in later).
      await waitForRegistration(1500);
      // A second tab of the same member losing the race to the first one
      // is still this member's discovery.
      const registerFeed =
        discoveryWordObjRef.current?.action === 'register'
          ? discoveryWordObjRef.current
          : null;
      const discovered =
        registered || (!!registerFeed && registerFeed.userId === userId);
      setDiscovery((prev) =>
        prev?.word === word
          ? {
              ...prev,
              phase: discovered ? 'discovered' : 'beaten',
              racing: false
            }
          : prev
      );
      setSearchedWord(null);
      onEnterComment({ contentType: VOCAB_CHAT_TYPE, text: '' });
    } catch (error) {
      console.error(error);
      setDiscovery(null);
    }
    setIsSubmitting(false);

    async function waitForRegistration(timeoutMs: number) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (discoveryWordObjRef.current?.action === 'register') return true;
        await wait(250);
      }
      return discoveryWordObjRef.current?.action === 'register';
    }
  }

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function refreshWordMasterBreakStatus() {
    setWordMasterBreakLoading(true);
    try {
      const data = await fetchWordMasterBreakStatus();
      if (data?.wordMasterBreak) {
        handleWordMasterBreakUpdate(data.wordMasterBreak, true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  function handleWordMasterBreakUpdate(nextBreak: any, showModal = true): void {
    if (!nextBreak) return;
    setWordMasterBreak((prev: any) => {
      // Show modal when break is newly triggered (transition from not-blocked to blocked)
      const wasBlocked = Boolean(prev?.blocked);
      const isNowBlocked = Boolean(nextBreak.blocked);
      if (!wasBlocked && isNowBlocked) {
        setWordMasterBreakModalShown(true);
      } else if (isNowBlocked && showModal) {
        setWordMasterBreakModalShown(true);
      }

      if (!prev?.quiz?.question) return nextBreak;
      const sameQuizBreak =
        prev.breakType === 'vocab_quiz' &&
        nextBreak.breakType === 'vocab_quiz' &&
        prev.activeBreakIndex === nextBreak.activeBreakIndex &&
        !nextBreak.locked;
      if (!sameQuizBreak) return nextBreak;
      if (nextBreak.quiz?.question) return nextBreak;
      return {
        ...nextBreak,
        quiz: {
          ...prev.quiz,
          ...(nextBreak.quiz || {}),
          question: prev.quiz.question
        }
      };
    });
  }

  async function handleClearWordMasterBreak() {
    setWordMasterBreakLoading(true);
    try {
      const result = await clearWordMasterBreak('requirement');
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  async function handlePayWordMasterBreak() {
    setWordMasterBreakLoading(true);
    try {
      const result = await clearWordMasterBreak('pay');
      if (typeof result?.coins === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: result.coins }
        });
      }
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  async function handleSpinBreakPassRoulette() {
    try {
      // Don't update state here - let the roulette animation complete first
      // The refresh will happen in onSpinComplete after animation
      return await spinBreakPassRoulette();
    } catch (error) {
      console.error('Failed to spin break pass roulette:', error);
      throw error;
    }
  }

  async function handleLoadWordMasterQuizQuestion() {
    setWordMasterBreakLoading(true);
    try {
      const result = await loadWordMasterQuizQuestion();
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  async function handleSubmitWordMasterQuizAnswer(selectedIndex: number) {
    setWordMasterBreakLoading(true);
    try {
      const result = await submitWordMasterQuizAnswer(selectedIndex);
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
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

    const {
      content,
      frequency = 1,
      validationReceipt,
      ...rest
    } = searchedWord || {};

    const payload: Record<string, any> = {
      content: content?.toLowerCase?.() || '',
      frequency
    };

    if (typeof validationReceipt === 'string') {
      payload.validationReceipt = validationReceipt;
    }

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

  function maybeSyncStrikeCount(word: any) {
    if (!word || word.isNew || word.canHit || word.isCensored) return;
    const now = Date.now();
    if (now - lastStrikeSyncRef.current < 5000) return;
    lastStrikeSyncRef.current = now;
    refreshWordMasterBreakStatus();
  }
}
