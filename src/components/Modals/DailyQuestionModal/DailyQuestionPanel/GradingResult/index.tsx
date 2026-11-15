import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { PAPER, paperTextButtonCls } from '../../paperTheme';
import { cloudFrontURL, priceTable } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import { useDailyPicture } from '~/components/DailyPictureViewer';
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
} from '../helpers/questionPreferences';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { DEFAULT_REWARD_COLOR, DEFAULT_XP_NUMBER_COLOR } from './constants';
import GradeOverview from './GradeOverview';
import Preferences from './Preferences';
import ReflectionStatsPanel from './ReflectionStatsPanel';
import ResponseSection, { isPolishUnchanged } from './ResponseSection';
import ShareActions from './ShareActions';

export default function GradingResult({
  question,
  questionId,
  isKeywordDay = false,
  picturePath = '',
  isPictureDay = false,
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
  mode = 'classic',
  onClose
}: {
  question: string;
  questionId: number | null;
  isKeywordDay?: boolean;
  // Picture Day: the picture the member chose
  picturePath?: string;
  isPictureDay?: boolean;
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
  mode?: 'classic' | 'training';
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
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const { colorKey: doneColor } = useRoleColor('done', { fallback: 'blue' });
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const xpNumberColor = xpNumberRole.getColor() || DEFAULT_XP_NUMBER_COLOR;
  const rewardColor = DEFAULT_REWARD_COLOR;
  // Picture Day: the picture opens in the standard image viewer, whose Edit
  // Image can replace it (11-15); the server answer is what's shown
  const picture = useDailyPicture({
    picturePath,
    responseId,
    ownerId: Number(userId) || null,
    surface: 'result'
  });

  const [sharing, setSharing] = useState(false);
  const sharingRef = useRef(false);
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

  // When the polish came back identical to the original, share the original (never label it polished).
  useEffect(() => {
    if (isPolishUnchanged(refinedResponse, originalResponse || response)) {
      setSelectedVersion('original');
      setAiSelectedVersion('original');
    }
  }, [refinedResponse, originalResponse, response]);

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
    if (sharingRef.current) return;

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
        setSelectedVersion(
          isPolishUnchanged(result.refinedText, originalResponse || response)
            ? 'original'
            : 'refined'
        );
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

  async function handleConfirmShare(versionOverride?: 'original' | 'refined') {
    if (sharingRef.current) return;
    sharingRef.current = true;
    const version = versionOverride || selectedVersion;

    try {
      setSharing(true);
      setShareError(null);

      const rawResponseText = originalResponse || response;
      const textToShare =
        version === 'refined' && refinedResponse
          ? refinedResponse
          : rawResponseText;

      const result = await shareDailyQuestionResponse({
        responseId,
        responseText: textToShare,
        version
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
      sharingRef.current = false;
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
  // tomorrow's vibe and focus belong to Classic
  const canChooseTomorrowPreferences = grade !== 'Fail' && mode === 'classic';
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
        isKeywordDay={isKeywordDay}
        masterpieceType={masterpieceType}
        rewardColor={rewardColor}
        streak={streak}
        streakMultiplier={streakMultiplier}
        usedRepair={usedRepair}
        xpAwarded={xpAwarded}
        xpNumberColor={xpNumberColor}
      />

      {picture.shownPath && (
        <div className={pictureWrapCls}>
          <button
            type="button"
            className={pictureButtonCls}
            aria-label="Open picture to view or edit"
            onClick={picture.openViewer}
          >
            <img
              src={`${cloudFrontURL}/${picture.shownPath}`}
              alt={originalResponse || response}
            />
            <span className={pictureHintCls} aria-hidden="true">
              <Icon icon="expand" />
              View &amp; edit
            </span>
          </button>
          {picture.canRestoreOriginal && (
            <button
              type="button"
              className={paperTextButtonCls}
              disabled={picture.restoring}
              onClick={() => void picture.restoreOriginal()}
            >
              {picture.restoring
                ? 'Switching back…'
                : 'Use the original picture'}
            </button>
          )}
          {picture.restoreError && (
            <p role="alert" className={pictureErrorCls}>
              {picture.restoreError}
            </p>
          )}
          {picture.viewer}
        </div>
      )}

      {grade !== 'Fail' && responseId > 0 && (
        <ReflectionStatsPanel
          responseId={responseId}
          prominent={mode === 'training'}
        />
      )}

      <ResponseSection
        aiSelectedVersion={aiSelectedVersion}
        aiShareTarget={aiShareTarget}
        canShareToFeed={canShareToFeed}
        isPictureDay={isPictureDay}
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
            color: ${PAPER.warn};
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
        !isPolishUnchanged(refinedResponse, originalResponse || response) &&
        (canShareToFeedNow || canShareWithZero || canShareWithCiel) && (
          <p
            className={css`
              text-align: center;
              font-size: 1.2rem;
              color: ${PAPER.inkSoft};
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
        onConfirmShare={() => handleConfirmShare()}
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

    if (isKeywordDay && !isPictureDay) {
      await performShareWithAI({ target, version: 'refined' });
      return;
    }

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
    setAiSelectedVersion(
      refinedTextForOpen &&
        !isPolishUnchanged(refinedTextForOpen, originalResponse || response)
        ? 'refined'
        : 'original'
    );
    setShowAIVersionSelector(true);
  }

  async function handleConfirmShareWithAI() {
    if (!aiShareTarget || !hasResponseText) return;
    const refinedTextToSend =
      aiSelectedVersion === 'refined' || aiSelectedVersion === 'both'
        ? refinedResponse || undefined
        : undefined;

    await performShareWithAI({
      target: aiShareTarget,
      version: aiSelectedVersion,
      refinedText: refinedTextToSend
    });
  }

  async function performShareWithAI({
    target,
    version,
    refinedText
  }: {
    target: 'zero' | 'ciel';
    version: 'original' | 'refined' | 'both';
    refinedText?: string;
  }) {
    try {
      if (target === 'zero') setSharingWithZero(true);
      if (target === 'ciel') setSharingWithCiel(true);
      setShareError(null);

      const result = await shareDailyQuestionWithAI({
        responseId: responseId || undefined,
        questionId,
        question,
        target,
        version,
        responseText: refinedText,
        originalResponse: originalResponse || response,
        grade,
        feedback,
        thinkHard: thinkHardState[target]?.global
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

      if (target === 'zero') setSharedWithZero(true);
      if (target === 'ciel') setSharedWithCiel(true);

      setShowAIVersionSelector(false);
      setAiShareTarget(null);
    } catch (err) {
      console.error('Failed to share with AI:', err);
      setShareError('Failed to share with AI. Please try again.');
    } finally {
      if (target === 'zero') setSharingWithZero(false);
      if (target === 'ciel') setSharingWithCiel(false);
    }
  }

  function handleCancelAIVersionSelector() {
    setShowAIVersionSelector(false);
    setAiShareTarget(null);
  }
}

const pictureWrapCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto 1.6rem;
  max-width: calc(560 * var(--px));
`;

const pictureButtonCls = css`
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: zoom-in;
  img {
    display: block;
    width: 100%;
    border-radius: 14px;
    border: 1px solid ${PAPER.line};
    background: ${PAPER.paperDeep};
  }
`;

// A small corner pill, sized like My pictures' "Your pick" tag; the icon is
// held to the text size so it can never grow over the picture.
const pictureHintCls = css`
  position: absolute;
  right: 0.7rem;
  bottom: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  background: ${PAPER.paper};
  border: 1px solid ${PAPER.lineStrong};
  color: ${PAPER.ink};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  svg {
    flex: none;
    width: 1em;
    height: 1em;
  }
`;

const pictureErrorCls = css`
  margin: 0.4rem 0 0;
  font-size: 1.2rem;
  color: ${PAPER.warn};
`;
