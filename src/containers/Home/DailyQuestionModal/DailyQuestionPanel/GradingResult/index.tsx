import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { priceTable } from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import {
  isFocusOptionId,
  isVibeOptionId,
  type FocusOptionId,
  type VibeOptionId
} from '../questionPreferences';
import { useRoleColor } from '~/theme/useRoleColor';
import {
  DEFAULT_REWARD_COLOR,
  DEFAULT_XP_NUMBER_COLOR
} from './constants';
import GradeOverview from './GradeOverview';
import Preferences from './Preferences';
import ResponseSection from './ResponseSection';
import ShareActions from './ShareActions';

export default function GradingResult({
  question,
  questionId,
  response,
  originalResponse,
  initialRefinedResponse,
  grade,
  masterpieceType,
  xpAwarded,
  feedback,
  responseId,
  streak = 1,
  streakMultiplier = 1,
  usedRepair = false,
  isShared: initialIsShared,
  sharedWithZero: initialSharedWithZero,
  sharedWithCiel: initialSharedWithCiel,
  initialNextQuestionCategory,
  initialCurrentFocus,
  initialPaidTomorrowVibeSelections,
  initialPaidCurrentFocusSelections,
  initialReusableCurrentFocusSelection,
  isAdultUser = false,
  onClose
}: {
  question: string;
  questionId: number | null;
  response: string;
  originalResponse: string;
  initialRefinedResponse: string | null;
  grade: string;
  masterpieceType?: 'heart' | 'mind' | 'heart_and_mind' | null;
  xpAwarded: number;
  feedback: string;
  responseId: number;
  streak?: number;
  streakMultiplier?: number;
  usedRepair?: boolean;
  isShared: boolean;
  sharedWithZero: boolean;
  sharedWithCiel: boolean;
  initialNextQuestionCategory?: string | null;
  initialCurrentFocus?: string | null;
  initialPaidTomorrowVibeSelections?: string[];
  initialPaidCurrentFocusSelections?: string[];
  initialReusableCurrentFocusSelection?: string | null;
  isAdultUser?: boolean;
  onClose: () => void;
}) {
  const shareDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.shareDailyQuestionResponse
  );
  const shareDailyQuestionWithAI = useAppContext(
    (v) => v.requestHelpers.shareDailyQuestionWithAI
  );
  const refineDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.refineDailyQuestionResponse
  );
  const setDailyQuestionNextCategory = useAppContext(
    (v) => v.requestHelpers.setDailyQuestionNextCategory
  );
  const setDailyQuestionCurrentFocus = useAppContext(
    (v) => v.requestHelpers.setDailyQuestionCurrentFocus
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const { userId, twinkleCoins } = useKeyContext((v) => v.myState);
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const { colorKey: doneColor } = useRoleColor('done', { fallback: 'blue' });
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const xpNumberColor = xpNumberRole.getColor() || DEFAULT_XP_NUMBER_COLOR;
  const rewardColor = DEFAULT_REWARD_COLOR;

  const [sharing, setSharing] = useState(false);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [sharedWithZero, setSharedWithZero] = useState(initialSharedWithZero);
  const [sharedWithCiel, setSharedWithCiel] = useState(initialSharedWithCiel);
  const [sharingWithZero, setSharingWithZero] = useState(false);
  const [sharingWithCiel, setSharingWithCiel] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [preparingAIVersionTarget, setPreparingAIVersionTarget] = useState<
    'zero' | 'ciel' | null
  >(null);
  const [refinedResponse, setRefinedResponse] = useState<string | null>(
    initialRefinedResponse || null
  );
  const [refining, setRefining] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<
    'original' | 'refined'
  >('refined');
  const [showAIVersionSelector, setShowAIVersionSelector] = useState(false);
  const [aiShareTarget, setAiShareTarget] = useState<'zero' | 'ciel' | null>(
    null
  );
  const [aiSelectedVersion, setAiSelectedVersion] = useState<
    'original' | 'refined' | 'both'
  >('refined');
  const [nextCategory, setNextCategory] = useState<string | null>(
    initialNextQuestionCategory || null
  );
  const [currentFocus, setCurrentFocus] = useState<string | null>(
    initialCurrentFocus || null
  );
  const [reusableFocusSelection, setReusableFocusSelection] =
    useState<FocusOptionId | null>(() => {
      if (
        isFocusOptionId(initialReusableCurrentFocusSelection) &&
        initialReusableCurrentFocusSelection !== 'infer'
      ) {
        return initialReusableCurrentFocusSelection;
      }
      return null;
    });
  const [ownedVibeSelections, setOwnedVibeSelections] = useState<
    VibeOptionId[]
  >(() => {
    const ownedSelections = new Set<VibeOptionId>();
    for (const selection of initialPaidTomorrowVibeSelections || []) {
      if (!isVibeOptionId(selection) || selection === 'default') continue;
      ownedSelections.add(selection);
    }
    if (
      isVibeOptionId(initialNextQuestionCategory) &&
      initialNextQuestionCategory !== 'default'
    ) {
      ownedSelections.add(initialNextQuestionCategory);
    }
    return Array.from(ownedSelections);
  });
  const [ownedFocusSelections, setOwnedFocusSelections] = useState<
    FocusOptionId[]
  >(() => {
    const ownedSelections = new Set<FocusOptionId>();
    for (const selection of initialPaidCurrentFocusSelections || []) {
      if (!isFocusOptionId(selection) || selection === 'infer') continue;
      ownedSelections.add(selection);
    }
    return Array.from(ownedSelections);
  });
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isSettingVibe, setIsSettingVibe] = useState(false);
  const [isSettingFocus, setIsSettingFocus] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    type: 'vibe' | 'focus';
    selection: string;
    price: number;
  } | null>(null);

  async function handleRefine() {
    if (refinedResponse || refining) return;

    try {
      setRefining(true);
      setShareError(null);

      const result = await refineDailyQuestionResponse({ responseId });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      setRefinedResponse(result.refinedText);
    } catch (err) {
      console.error('Failed to refine:', err);
      setShareError('Failed to refine response. Please try again.');
    } finally {
      setRefining(false);
    }
  }

  async function handleShareClick() {
    if (!refinedResponse && !refining) {
      try {
        setRefining(true);
        setShareError(null);

        const result = await refineDailyQuestionResponse({ responseId });

        if (result.error) {
          setShareError(result.error);
          setRefining(false);
          return;
        }

        setRefinedResponse(result.refinedText);
        setRefining(false);
        setShowVersionSelector(true);
      } catch (err) {
        console.error('Failed to refine:', err);
        setShareError('Failed to prepare share options. Please try again.');
        setRefining(false);
      }
      return;
    }

    setShowVersionSelector(true);
  }

  async function handleConfirmShare() {
    try {
      setSharing(true);
      setShareError(null);

      const rawResponseText = originalResponse || response;
      const textToShare =
        selectedVersion === 'refined' && refinedResponse
          ? refinedResponse
          : rawResponseText;

      const result = await shareDailyQuestionResponse({
        responseId,
        responseText: textToShare
      });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      if (result.feed) {
        onLoadNewFeeds([result.feed]);
      }

      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }

      setIsShared(true);
      setShowVersionSelector(false);
    } catch (err) {
      console.error('Failed to share:', err);
      setShareError('Failed to share. Please try again.');
    } finally {
      setSharing(false);
    }
  }

  function isFocusSelectionFreeToday(selection: FocusOptionId) {
    if (selection === 'infer') return true;
    if (ownedFocusSelections.includes(selection)) return true;
    return (
      (currentFocus || 'infer') === 'infer' &&
      reusableFocusSelection === selection
    );
  }

  function handleOpenVibeModal() {
    if (!canChooseTomorrowPreferences) return;
    setShareError(null);
    setIsVibeModalOpen(true);
  }

  function handleOpenFocusModal() {
    if (!canChooseTomorrowPreferences) return;
    setShareError(null);
    setIsFocusModalOpen(true);
  }

  function handleSelectVibe(selection: VibeOptionId) {
    if (selection === (nextCategory || 'default')) {
      setIsVibeModalOpen(false);
      return;
    }
    const alreadyOwned = ownedVibeSelections.includes(selection);
    if (selection === 'default' || alreadyOwned) {
      void applyVibeSelection(selection);
      return;
    }
    if (availableTwinkleCoins < tomorrowVibePrice) {
      return;
    }
    setIsVibeModalOpen(false);
    setPendingPayment({
      type: 'vibe',
      selection,
      price: tomorrowVibePrice
    });
  }

  function handleSelectFocus(selection: FocusOptionId) {
    if (selection === (currentFocus || 'infer')) {
      setIsFocusModalOpen(false);
      return;
    }
    if (isFocusSelectionFreeToday(selection)) {
      void applyFocusSelection(selection);
      return;
    }
    if (availableTwinkleCoins < currentFocusPrice) {
      return;
    }
    setIsFocusModalOpen(false);
    setPendingPayment({
      type: 'focus',
      selection,
      price: currentFocusPrice
    });
  }

  async function applyVibeSelection(selection: VibeOptionId) {
    try {
      setIsSettingVibe(true);
      setShareError(null);
      const content = selection === 'follow_up' ? feedback : undefined;
      const answer =
        selection === 'follow_up'
          ? (refinedResponse || '').trim() ||
            (originalResponse || response || '').trim()
          : undefined;
      const result = await setDailyQuestionNextCategory({
        category: selection,
        content,
        answer
      });
      if (result.error) {
        setShareError(result.error);
        return;
      }
      setNextCategory(result.nextQuestionCategory || null);
      if (selection !== 'default') {
        setOwnedVibeSelections((prev) =>
          prev.includes(selection) ? prev : [...prev, selection]
        );
      }
      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }
      setIsVibeModalOpen(false);
    } catch (err) {
      console.error('Failed to set tomorrow vibe:', err);
      setShareError('Failed to set tomorrow vibe. Please try again.');
    } finally {
      setIsSettingVibe(false);
      setPendingPayment(null);
    }
  }

  async function applyFocusSelection(selection: FocusOptionId) {
    try {
      setIsSettingFocus(true);
      setShareError(null);
      const result = await setDailyQuestionCurrentFocus({
        currentFocus: selection
      });
      if (result.error) {
        setShareError(result.error);
        return;
      }
      setCurrentFocus(result.currentFocus || null);
      const coinsCharged = Number(result.coinsCharged) || 0;
      const isSelectionOwnedForDay =
        result.isSelectionOwnedForDay === true ||
        (result.isSelectionOwnedForDay === undefined && coinsCharged > 0);
      const isSelectionExplicitlyNotOwned =
        result.isSelectionOwnedForDay === false;
      if (selection !== 'infer') {
        setOwnedFocusSelections((prev) => {
          if (isSelectionOwnedForDay) {
            return prev.includes(selection) ? prev : [...prev, selection];
          }
          if (isSelectionExplicitlyNotOwned) {
            return prev.filter((item) => item !== selection);
          }
          return prev;
        });
      }
      setReusableFocusSelection((prev) => {
        if (result.reusableCurrentFocusSelection === null) {
          return null;
        }
        if (
          isFocusOptionId(result.reusableCurrentFocusSelection) &&
          result.reusableCurrentFocusSelection !== 'infer'
        ) {
          return result.reusableCurrentFocusSelection;
        }
        if (selection !== 'infer' && coinsCharged > 0) {
          return selection;
        }
        return prev;
      });
      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }
      setIsFocusModalOpen(false);
    } catch (err) {
      console.error('Failed to set current focus:', err);
      setShareError('Failed to set current focus. Please try again.');
    } finally {
      setIsSettingFocus(false);
      setPendingPayment(null);
    }
  }

  async function handleConfirmPendingPayment() {
    if (!pendingPayment) return;
    if (pendingPayment.type === 'vibe') {
      await applyVibeSelection(pendingPayment.selection as VibeOptionId);
      return;
    }
    await applyFocusSelection(pendingPayment.selection as FocusOptionId);
  }

  const canShareToFeed = grade !== 'Fail';
  const canShareToFeedNow = canShareToFeed && !isShared;
  const hasResponseText = !!(originalResponse || response);
  const canShareToAI = hasResponseText;
  const canShareWithZero = canShareToAI && !sharedWithZero;
  const canShareWithCiel = canShareToAI && !sharedWithCiel;
  const canChooseTomorrowPreferences = grade !== 'Fail';
  const tomorrowVibePrice = priceTable.dailyQuestionTomorrowVibe;
  const currentFocusPrice = priceTable.dailyQuestionCurrentFocus;
  const availableTwinkleCoins = twinkleCoins || 0;
  const isFollowUpSelected = (nextCategory || 'default') === 'follow_up';
  const shareCoinsReward = grade === 'Masterpiece' ? 10000 : 1000;
  const alreadySharedWithAnyAI = sharedWithZero || sharedWithCiel;
  const canGetAIShareCoins = grade !== 'Fail' && !alreadySharedWithAnyAI;

  return (
    <div
      className={css`
        padding: 1.5rem;
      `}
    >
      <GradeOverview
        feedback={feedback}
        grade={grade}
        masterpieceType={masterpieceType}
        rewardColor={rewardColor}
        streak={streak}
        streakMultiplier={streakMultiplier}
        usedRepair={usedRepair}
        xpAwarded={xpAwarded}
        xpNumberColor={xpNumberColor}
      />

      <ResponseSection
        aiSelectedVersion={aiSelectedVersion}
        aiShareTarget={aiShareTarget}
        canShareToFeed={canShareToFeed}
        originalResponse={originalResponse}
        preparingAIVersionTarget={preparingAIVersionTarget}
        question={question}
        refinedResponse={refinedResponse}
        refining={refining}
        response={response}
        selectedVersion={selectedVersion}
        showAIVersionSelector={showAIVersionSelector}
        showVersionSelector={showVersionSelector}
        onAiSelectedVersionChange={setAiSelectedVersion}
        onRefine={handleRefine}
        onSelectedVersionChange={setSelectedVersion}
      />

      {shareError && (
        <p
          className={css`
            color: ${Color.rose()};
            font-size: 1.2rem;
            text-align: center;
            margin-bottom: 1rem;
          `}
        >
          {shareError}
        </p>
      )}

      {!showVersionSelector &&
        !showAIVersionSelector &&
        (canShareToFeedNow || canShareWithZero || canShareWithCiel) && (
          <p
            className={css`
              text-align: center;
              font-size: 1.2rem;
              color: ${Color.darkerGray()};
              margin-bottom: 0.5rem;
            `}
          >
            You can choose to share your original response or an AI-polished
            version
          </p>
        )}

      <ShareActions
        aiShareTarget={aiShareTarget}
        canGetAIShareCoins={canGetAIShareCoins}
        canShareToAI={canShareToAI}
        canShareToFeed={canShareToFeed}
        canShareToFeedNow={canShareToFeedNow}
        canShareWithCiel={canShareWithCiel}
        canShareWithZero={canShareWithZero}
        preparingAIVersionTarget={preparingAIVersionTarget}
        refinedResponse={refinedResponse}
        shareCoinsReward={shareCoinsReward}
        sharing={sharing}
        sharingWithCiel={sharingWithCiel}
        sharingWithZero={sharingWithZero}
        showAIVersionSelector={showAIVersionSelector}
        showVersionSelector={showVersionSelector}
        refining={refining}
        onCancelAIVersionSelector={handleCancelAIVersionSelector}
        onCancelVersionSelector={() => setShowVersionSelector(false)}
        onConfirmShare={handleConfirmShare}
        onConfirmShareWithAI={handleConfirmShareWithAI}
        onShareClick={handleShareClick}
        onShareWithAI={handleShareWithAI}
      />

      <Preferences
        availableTwinkleCoins={availableTwinkleCoins}
        canChooseTomorrowPreferences={canChooseTomorrowPreferences}
        currentFocus={currentFocus}
        currentFocusPrice={currentFocusPrice}
        doneColor={doneColor}
        isAdultUser={isAdultUser}
        isFocusModalOpen={isFocusModalOpen}
        isFocusSelectionFreeToday={isFocusSelectionFreeToday}
        isFollowUpSelected={isFollowUpSelected}
        isSettingFocus={isSettingFocus}
        isSettingVibe={isSettingVibe}
        isVibeModalOpen={isVibeModalOpen}
        nextCategory={nextCategory}
        onClose={onClose}
        ownedVibeSelections={ownedVibeSelections}
        pendingPayment={pendingPayment}
        showAIVersionSelector={showAIVersionSelector}
        showVersionSelector={showVersionSelector}
        tomorrowVibePrice={tomorrowVibePrice}
        onCloseFocusModal={() => !isSettingFocus && setIsFocusModalOpen(false)}
        onCloseVibeModal={() => !isSettingVibe && setIsVibeModalOpen(false)}
        onConfirmPendingPayment={handleConfirmPendingPayment}
        onDismissPendingPayment={() => setPendingPayment(null)}
        onOpenFocusModal={handleOpenFocusModal}
        onOpenVibeModal={handleOpenVibeModal}
        onSelectFocus={handleSelectFocus}
        onSelectVibe={handleSelectVibe}
      />
    </div>
  );

  async function handleShareWithAI(target: 'zero' | 'ciel') {
    if (!hasResponseText) return;
    if (refining && !refinedResponse) return;
    setShareError(null);

    let refinedTextForOpen = refinedResponse;
    const needsRefineForAI = !refinedTextForOpen && responseId > 0;
    if (needsRefineForAI) {
      try {
        setPreparingAIVersionTarget(target);
        setRefining(true);
        const result = await refineDailyQuestionResponse({ responseId });
        if (result.error) {
          setShareError(result.error);
          return;
        }
        refinedTextForOpen = result.refinedText;
        setRefinedResponse(result.refinedText);
      } catch (err) {
        console.error('Failed to refine:', err);
        setShareError('Failed to refine response. Please try again.');
        return;
      } finally {
        setRefining(false);
        setPreparingAIVersionTarget(null);
      }
    }

    setAiShareTarget(target);
    setAiSelectedVersion(refinedTextForOpen ? 'refined' : 'original');
    setShowAIVersionSelector(true);
  }

  async function handleConfirmShareWithAI() {
    if (!aiShareTarget || !hasResponseText) return;
    try {
      if (aiShareTarget === 'zero') setSharingWithZero(true);
      if (aiShareTarget === 'ciel') setSharingWithCiel(true);
      setShareError(null);

      const refinedTextToSend =
        aiSelectedVersion === 'refined' || aiSelectedVersion === 'both'
          ? refinedResponse || undefined
          : undefined;

      const result = await shareDailyQuestionWithAI({
        responseId: responseId || undefined,
        questionId,
        question,
        target: aiShareTarget,
        version: aiSelectedVersion,
        responseText: refinedTextToSend,
        originalResponse: originalResponse || response,
        grade,
        feedback,
        thinkHard: thinkHardState[aiShareTarget]?.global
      });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      if (result.channelId) {
        socket.emit('join_chat_group', result.channelId);
      }

      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }

      if (aiShareTarget === 'zero') setSharedWithZero(true);
      if (aiShareTarget === 'ciel') setSharedWithCiel(true);

      setShowAIVersionSelector(false);
      setAiShareTarget(null);
    } catch (err) {
      console.error('Failed to share with AI:', err);
      setShareError('Failed to share with AI. Please try again.');
    } finally {
      if (aiShareTarget === 'zero') setSharingWithZero(false);
      if (aiShareTarget === 'ciel') setSharingWithCiel(false);
    }
  }

  function handleCancelAIVersionSelector() {
    setShowAIVersionSelector(false);
    setAiShareTarget(null);
  }
}
