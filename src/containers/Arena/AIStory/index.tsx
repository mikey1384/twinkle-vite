import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import Icon from '~/components/Icon';
import Game from './Game';
import Rankings from './Rankings';
import Button from '~/components/Button';
import ClearScreen from './ClearScreen';
import ErrorBoundary from '~/components/ErrorBoundary';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useNotiContext, useViewContext } from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus, sleep } from '~/helpers';
import { getStoredItem, setStoredItem } from '~/helpers/userDataHelpers';
import { mobileMaxWidth } from '~/constants/css';
import { APP_SHELL_HEADER_OFFSET_STYLE } from '~/constants/appShell';
import { ARENA } from '../theme';

interface AIStoryClearFollowUp {
  storyId: number;
  difficulty: number;
  isListening: boolean;
  numQuestions: number;
  imagePath?: string;
  // what the pass actually paid, as stored by the API (never recomputed here)
  xpRewardAmount: number;
  coinRewardAmount: number;
}

// AI Story inside Arena's Train (Mikey 10-24: Arena replaces the old AI
// Stories modal; the game itself is unchanged). onHide goes back to Train.
export default function AIStory({ onHide }: { onHide: () => void }) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const MainRef: React.RefObject<any> = useRef(null);
  const [resetNumber, setResetNumber] = useState(0);
  // bumped to remount the game fresh (Story menu from the clear screen)
  const [gameKey, setGameKey] = useState(0);
  const [activeTab, setActiveTab] = useState('game');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [displayedSection, setDisplayedSection] = useState('story');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [attemptId, setAttemptId] = useState(0);
  const [difficulty, setDifficulty] = useState(
    () => Number(getStoredItem('story-difficulty')) || 3
  );
  const [, setDropdownShown] = useState(false);
  const loadAIStoryTopic = useAppContext(
    (v) => v.requestHelpers.loadAIStoryTopic
  );
  const loadAIStoryClear = useAppContext(
    (v) => v.requestHelpers.loadAIStoryClear
  );
  const clearUnavailableAIStoryDailyTask = useAppContext(
    (v) => v.requestHelpers.clearUnavailableAIStoryDailyTask
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const [dailyTask, setDailyTask] = useState<any>(null);
  const [readCount, setReadCount] = useState(0);
  const [listenCount, setListenCount] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [topic, setTopic] = useState('');
  const [topicKey, setTopicKey] = useState('');
  const [clearScreenShown, setClearScreenShown] = useState(false);
  const [clearScreenStory, setClearScreenStory] =
    useState<AIStoryClearFollowUp | null>(null);
  const [storyId, setStoryId] = useState(0);
  const [storyType, setStoryType] = useState('');
  const [loadingTopic, setLoadingTopic] = useState(true);
  const [topicLoadError, setTopicLoadError] = useState(false);
  const [usermenuShown, setUsermenuShown] = useState(false);
  const [isCloseLocked, setIsCloseLocked] = useState(false);
  const [preservingDailyTask, setPreservingDailyTask] = useState(false);
  const [unavailableActionMessage, setUnavailableActionMessage] = useState('');
  const [solveObj, setSolveObj] = useState<{
    numCorrect: number;
    isGraded: boolean;
    totalQuestions?: number;
    bonusCorrect?: number;
    bonusQuestions?: number;
    isPassed?: boolean;
  }>({
    numCorrect: 0,
    isGraded: false
  });
  const [gameMode, setGameMode] = useState('read');
  const requestRef: React.RefObject<any> = useRef(null);
  const aiStoryTask = todayStats?.dailyTaskStatus?.aiStory;
  const aiStoryTaskDone = !!aiStoryTask?.isPassed;
  const aiStoryUnavailableCleared = !!aiStoryTask?.isUnavailableCleared;

  useEffect(() => {
    if (AI_FEATURES_DISABLED) {
      setLoadingTopic(false);
      setTopicLoadError(false);
      return;
    }
    setStoredItem('story-difficulty', String(difficulty));
    const currentRequestId = Math.random();
    requestRef.current = currentRequestId;
    if (difficulty && currentRequestId) {
      handleLoadTopic({ difficulty, currentRequestId });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, resetNumber]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isGameStarted) {
        e.preventDefault();
        const message =
          'You will lose your progress if you leave. Are you sure?';
        return message;
      }
    }

    function handlePopState(e: PopStateEvent) {
      if (isGameStarted) {
        e.preventDefault();
        setShowConfirm(true);
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isGameStarted]);

  return (
    <ErrorBoundary componentPath="Arena/AIStory">
      <div className={cx(panelCls, isGameStarted && playingCls)}>
        <div className={panelBarCls}>
          <button
            type="button"
            className={backCls}
            onClick={handleHide}
            aria-label="Back to Train"
          >
            <Icon icon="arrow-left" />
            <span>Train</span>
          </button>
          <span className={titleCls}>AI Story</span>
          <span className={trainTagCls}>Train</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {!isGameStarted && !AI_FEATURES_DISABLED ? (
            <div className={tabsCls} role="tablist">
              {(['game', 'rankings'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={cx(tabCls, activeTab === tab && tabActiveCls)}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'game' ? 'Game' : 'Rankings'}
                </button>
              ))}
            </div>
          ) : null}
          <div
            style={{
              width: '100%',
              padding: 0,
              justifyContent: 'flex-start',
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              ...(activeTab === 'rankings'
                ? { overflow: 'hidden' }
                : { overflow: 'auto' })
            }}
            ref={MainRef}
          >
            {AI_FEATURES_DISABLED ? (
              <div
                style={{
                  width: '100%',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <AIDisabledNotice title="AI Stories Are Unavailable" />
                <div
                  style={{
                    maxWidth: '52rem',
                    textAlign: 'center',
                    lineHeight: 1.5
                  }}
                >
                  {aiStoryUnavailableCleared
                    ? 'AI Story is marked complete for today so your Daily Tasks streak is protected.'
                    : aiStoryTaskDone
                      ? 'AI Story is already complete for today.'
                      : unavailableActionMessage ||
                        "Press the button below to preserve today's Daily Tasks streak while AI Story is unavailable."}
                </div>
                <Button
                  color="logoBlue"
                  loading={preservingDailyTask}
                  disabled={aiStoryTaskDone}
                  onClick={handleUnavailableAIStoryClear}
                >
                  Preserve Daily Task Streak
                </Button>
              </div>
            ) : activeTab === 'game' ? (
              <>
                {/* the clear screen is a view here, not a modal (Mikey 10-24);
                  the story stays mounted underneath so "Back to story" returns
                  to the graded questions */}
                {clearScreenShown && clearScreenStory && (
                  <ClearScreen
                    initialImagePath={clearScreenStory.imagePath}
                    isListening={clearScreenStory.isListening}
                    onHide={handleCloseClearScreen}
                    onStoryMenu={handleStoryMenu}
                    numQuestions={clearScreenStory.numQuestions}
                    difficulty={clearScreenStory.difficulty}
                    xpRewardAmount={clearScreenStory.xpRewardAmount}
                    coinRewardAmount={clearScreenStory.coinRewardAmount}
                    storyId={clearScreenStory.storyId}
                  />
                )}
                <div
                  style={{
                    width: '100%',
                    display:
                      clearScreenShown && clearScreenStory ? 'none' : 'contents'
                  }}
                >
                  <Game
                    key={gameKey}
                    attemptId={attemptId}
                    dailyTask={dailyTask}
                    difficulty={Number(difficulty)}
                    displayedSection={displayedSection}
                    gameMode={gameMode}
                    isGameStarted={isGameStarted}
                    onSetIsGameStarted={setIsGameStarted}
                    loadingTopic={loadingTopic}
                    onLoadTopic={handleLoadTopic}
                    onSetAttemptId={setAttemptId}
                    onSetDropdownShown={setDropdownShown}
                    onSetGameMode={setGameMode}
                    onSetResetNumber={setResetNumber}
                    onSetSolveObj={setSolveObj}
                    onSetStoryId={setStoryId}
                    onSetDifficulty={setDifficulty}
                    onSetDisplayedSection={setDisplayedSection}
                    onSetIsCloseLocked={setIsCloseLocked}
                    onSetDailyTask={setDailyTask}
                    onOpenClearScreen={handleOpenCurrentClearScreen}
                    onSetQuestions={setQuestions}
                    onSetTopicLoadError={setTopicLoadError}
                    readCount={readCount}
                    listenCount={listenCount}
                    questions={questions}
                    storyId={storyId}
                    MainRef={MainRef}
                    storyType={storyType}
                    topic={topic}
                    topicKey={topicKey}
                    topicLoadError={topicLoadError}
                    solveObj={solveObj}
                  />
                </div>
              </>
            ) : null}
            {!AI_FEATURES_DISABLED && activeTab === 'rankings' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Rankings
                  onSetRankingsTab={setRankingsTab}
                  onSetUsermenuShown={setUsermenuShown}
                  rankingsTab={rankingsTab}
                />
              </div>
            )}
          </div>
        </div>
        {showConfirm && (
          <ConfirmModal
            onHide={() => setShowConfirm(false)}
            title="Warning"
            description="If you leave the game, this story and all your related progress will be lost."
            descriptionFontSize="2rem"
            onConfirm={handleConfirmClose}
            confirmButtonColor="red"
            confirmButtonLabel="Leave anyway"
            isReverseButtonOrder
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleLoadTopic({
    difficulty,
    currentRequestId
  }: {
    difficulty: number;
    currentRequestId: number;
  }) {
    setLoadingTopic(true);
    try {
      const {
        dailyTaskStatus,
        topic,
        topicKey,
        type,
        dailyTask,
        readCount,
        listenCount
      } = await tryLoadTopic({
        difficulty,
        retries: 3,
        timeout: 1000,
        currentRequestId
      });
      if (currentRequestId === requestRef.current) {
        setTopic(topic);
        setStoryType(type);
        setTopicKey(topicKey);
        setDailyTask(dailyTaskStatus?.aiStory || dailyTask || null);
        setReadCount(readCount);
        setListenCount(listenCount);
        if (dailyTaskStatus) {
          onApplyTodayStatsProgress({
            newStats: buildTodayStatsPatchFromDailyTaskStatus(dailyTaskStatus)
          });
        }
        setLoadingTopic(false);
      }
    } catch (error) {
      console.error('Failed to load topic:', error);
      setLoadingTopic(false);
      setTopicLoadError(true);
    }
  }

  async function tryLoadTopic({
    difficulty,
    retries,
    timeout,
    currentRequestId
  }: {
    difficulty: number;
    retries: number;
    timeout: number;
    currentRequestId: number;
  }) {
    for (let i = 0; i < retries; i++) {
      try {
        const {
          dailyTaskStatus,
          topic,
          topicKey,
          type,
          dailyTask,
          readCount,
          listenCount
        } = await loadAIStoryTopic(difficulty);
        if (currentRequestId === requestRef.current) {
          return {
            topic,
            topicKey,
            type,
            dailyTaskStatus,
            dailyTask,
            readCount,
            listenCount
          };
        } else {
          return {};
        }
      } catch (error) {
        console.error(`Error on attempt ${i + 1}:`, error);
        if (i < retries - 1) {
          await sleep(timeout);
        }
      }
    }
    throw new Error('Failed to load topic after maximum retries');
  }

  async function loadClearedStory(storyId: number) {
    const result = await loadAIStoryClear(storyId);
    const story = result?.story;
    if (!story?.storyId) return null;
    return {
      storyId: Number(story.storyId),
      difficulty: Number(story.difficulty || 1),
      isListening: Boolean(story.isListening),
      numQuestions: Number(story.numQuestions || 0),
      imagePath: story.imagePath || '',
      xpRewardAmount: Number(story.xpRewardAmount || 0),
      coinRewardAmount: Number(story.coinRewardAmount || 0)
    };
  }

  async function handleOpenCurrentClearScreen(targetStoryId = storyId) {
    if (!targetStoryId) return;
    try {
      const story = await loadClearedStory(targetStoryId);
      if (!story) return;
      setClearScreenStory(story);
      setClearScreenShown(true);
      // the view replaces the story in place; start it at the top
      if (MainRef.current) MainRef.current.scrollTop = 0;
    } catch (error) {
      console.error('Failed to open AI Story rewards:', error);
    }
  }

  // the clear screen's Story menu (Mikey 10-24): back to level and Read/
  // Listen, the same reset as the story's New Story button
  function handleStoryMenu() {
    setClearScreenShown(false);
    setClearScreenStory(null);
    setStoryId(0);
    setQuestions([]);
    setDisplayedSection('story');
    setSolveObj({ numCorrect: 0, isGraded: false });
    setIsCloseLocked(false);
    setIsGameStarted(false);
    setResetNumber((n) => n + 1);
    setGameKey((k) => k + 1);
    if (MainRef.current) MainRef.current.scrollTop = 0;
  }

  function handleCloseClearScreen() {
    setClearScreenShown(false);
    setClearScreenStory(null);
  }

  async function handleUnavailableAIStoryClear() {
    if (preservingDailyTask || aiStoryTaskDone) return;
    setPreservingDailyTask(true);
    try {
      const result = await clearUnavailableAIStoryDailyTask();
      if (result?.dailyTaskStatus) {
        setDailyTask(result.dailyTaskStatus.aiStory || null);
        onApplyTodayStatsProgress({
          newStats: buildTodayStatsPatchFromDailyTaskStatus(
            result.dailyTaskStatus
          )
        });
        setUnavailableActionMessage(
          'AI Story was marked complete for Daily Tasks streak preservation.'
        );
      } else {
        setUnavailableActionMessage(
          'Could not preserve the AI Story Daily Task right now.'
        );
      }
    } catch (error) {
      console.error(error);
      setUnavailableActionMessage(
        'Could not preserve the AI Story Daily Task right now.'
      );
    } finally {
      setPreservingDailyTask(false);
    }
  }

  function handleHide() {
    if (usermenuShown) return;
    // a story in progress is never a trap (Mikey 10-24): leaving is always
    // allowed, with a warning that the story and its progress will be lost
    if (isCloseLocked || (isGameStarted && !solveObj.isGraded)) {
      setShowConfirm(true);
    } else {
      onHide();
    }
  }

  function handleConfirmClose() {
    setShowConfirm(false);
    onHide();
  }
}

// the old modal was 80vh tall; on the page the panel takes the room below the
// back bar and scrolls inside, like the modal body did
// Arena's paper card (Mikey 10-24: AI Story takes the Arena look)
const panelCls = css`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 3px solid ${ARENA.line};
  border-radius: 14px;
  box-shadow: 5px 5px 0 ${ARENA.line};
  overflow: hidden;
`;

// a story in play fills the screen and scrolls inside; the menu hugs its
// content
const playingCls = css`
  height: calc(100dvh - ${APP_SHELL_HEADER_OFFSET_STYLE} - 5rem);
  min-height: 52rem;
  @media (max-width: ${mobileMaxWidth}) {
    height: auto;
    min-height: calc(100dvh - 20rem);
  }
`;

const panelBarCls = css`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0.9rem 1.4rem;
  border-bottom: 3px solid ${ARENA.line};
`;

const backCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border: none;
  background: none;
  color: ${ARENA.inkSoft};
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.4rem 0;
  &:hover:not(:disabled) {
    color: ${ARENA.ink};
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const titleCls = css`
  font-size: 1.8rem;
  font-weight: 900;
`;

const trainTagCls = css`
  margin-left: auto;
  padding: 0.2rem 0.8rem;
  border: 2px solid ${ARENA.line};
  border-radius: 6px;
  background: ${ARENA.train};
  color: #fff;
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const tabsCls = css`
  display: flex;
  gap: 1rem;
  padding: 1.2rem 1.4rem 0;
`;

const tabCls = css`
  padding: 0.6rem 1.6rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
`;

const tabActiveCls = css`
  background: ${ARENA.ink};
  color: #fff;
`;
