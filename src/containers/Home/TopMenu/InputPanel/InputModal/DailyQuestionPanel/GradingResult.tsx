import React, { useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import NextDayCountdown from '~/components/NextDayCountdown';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useHomeContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import { socket } from '~/constants/sockets/api';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

const gradeColors: Record<string, string> = {
  Masterpiece: '#FFD700', // Gold
  Pass: '#4CAF50', // Green
  Fail: '#f44336' // Red
};

const gradeLabels: Record<string, string> = {
  Masterpiece: 'Masterpiece',
  Pass: 'Pass',
  Fail: 'Fail'
};

const gradeSymbols: Record<string, string> = {
  Masterpiece: '★',
  Pass: '✓',
  Fail: '✗'
};

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function GradingResult({
  question,
  questionId,
  response,
  originalResponse,
  initialRefinedResponse,
  grade,
  xpAwarded,
  feedback,
  responseId,
  isShared: initialIsShared,
  sharedWithZero: initialSharedWithZero,
  sharedWithCiel: initialSharedWithCiel,
  onClose
}: {
  question: string;
  questionId: number | null;
  response: string;
  originalResponse: string;
  initialRefinedResponse: string | null;
  grade: string;
  xpAwarded: number;
  feedback: string;
  responseId: number;
  isShared: boolean;
  sharedWithZero: boolean;
  sharedWithCiel: boolean;
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
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const { userId } = useKeyContext((v) => v.myState);
  const { colorKey: doneColor } = useRoleColor('done', { fallback: 'blue' });

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
    // If we haven't refined yet, fetch refinement first
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

    // If already refined, show version selector
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

      // Add to home feed for real-time update
      if (result.feed) {
        onLoadNewFeeds([result.feed]);
      }

      // Update user's coin balance in real-time
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

  const gradeColor = gradeColors[grade] || Color.darkerGray();
  const gradeLabel = gradeLabels[grade] || '';
  const gradeSymbol = gradeSymbols[grade] || '?';
  const canShareToFeed = grade !== 'Fail';
  const canShareToFeedNow = canShareToFeed && !isShared;
  const hasResponseText = !!(originalResponse || response);
  const canShareToAI = hasResponseText;
  const canShareWithZero = canShareToAI && !sharedWithZero;
  const canShareWithCiel = canShareToAI && !sharedWithCiel;

  // Coin rewards: 1,000 for Pass, 10,000 for Masterpiece (Fail gets nothing)
  const shareCoinsReward = grade === 'Masterpiece' ? 10000 : 1000;
  // AI share reward is only available if passed AND not already shared with either bot
  const alreadySharedWithAnyAI = sharedWithZero || sharedWithCiel;
  const canGetAIShareCoins = grade !== 'Fail' && !alreadySharedWithAnyAI;

  return (
    <div
      className={css`
        padding: 1.5rem;
      `}
    >
      {/* Grade Display */}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        `}
      >
        <div
          className={css`
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: ${gradeColor};
            display: flex;
            align-items: center;
            justify-content: center;
            animation: ${pulseAnimation} 2s ease-in-out infinite;
            box-shadow: 0 4px 20px ${gradeColor}40;
          `}
        >
          <span
            className={css`
              font-size: 3rem;
              font-weight: bold;
              color: white;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            `}
          >
            {gradeSymbol}
          </span>
        </div>
        <p
          className={css`
            font-size: 1.5rem;
            color: ${gradeColor};
            margin-top: 0.5rem;
            font-weight: 600;
          `}
        >
          {gradeLabel}
        </p>
      </div>

      {/* XP Awarded */}
      {xpAwarded > 0 && (
        <div
          className={css`
            text-align: center;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: linear-gradient(
              90deg,
              transparent,
              ${Color.gold()}20,
              transparent
            );
            background-size: 200% 100%;
            animation: ${shimmerAnimation} 2s linear infinite;
            border-radius: 8px;
          `}
        >
          <Icon
            icon="star"
            style={{ color: Color.gold(), marginRight: '0.5rem' }}
          />
          <span
            className={css`
              font-size: 1.5rem;
              font-weight: bold;
              color: ${Color.gold()};
            `}
          >
            +{xpAwarded.toLocaleString()} XP
          </span>
        </div>
      )}

      {/* Feedback */}
      <div
        className={css`
          background: ${Color.highlightGray()};
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        `}
      >
        <h4
          className={css`
            font-size: 1.3rem;
            color: ${Color.darkerGray()};
            margin-bottom: 0.5rem;
          `}
        >
          Feedback
        </h4>
        <p
          className={css`
            font-size: 1.4rem;
            color: ${Color.black()};
            line-height: 1.6;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
            }
          `}
        >
          {feedback}
        </p>
      </div>

      {/* Version Selector - shown after clicking Share */}
      {showVersionSelector && refinedResponse && (
        <div
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <h4
            className={css`
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
              margin-bottom: 0.75rem;
            `}
          >
            Choose version to share:
          </h4>
          <FilterBar
            style={{
              fontSize: '1.3rem',
              height: '3.8rem'
            }}
          >
            <nav
              className={selectedVersion === 'original' ? 'active' : ''}
              onClick={() => setSelectedVersion('original')}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              My Original
            </nav>
            <nav
              className={selectedVersion === 'refined' ? 'active' : ''}
              onClick={() => setSelectedVersion('refined')}
            >
              <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
              AI Polished
            </nav>
          </FilterBar>

          {/* Preview of selected version */}
          <div
            className={css`
              padding: 1rem;
              background: ${Color.wellGray()};
              border-radius: 8px;
              max-height: 200px;
              overflow-y: auto;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            <p
              className={css`
                font-size: 1.3rem;
                color: ${Color.black()};
                line-height: 1.6;
                white-space: pre-wrap;
              `}
            >
              {selectedVersion === 'refined'
                ? refinedResponse
                : originalResponse || response}
            </p>
          </div>
        </div>
      )}

      {showAIVersionSelector && aiShareTarget && (
        <div
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <h4
            className={css`
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
              margin-bottom: 0.75rem;
            `}
          >
            Choose version to share with{' '}
            {aiShareTarget === 'ciel' ? 'Ciel' : 'Zero'}:
          </h4>
          <FilterBar
            style={{
              fontSize: '1.3rem',
              height: '3.8rem'
            }}
          >
            <nav
              className={aiSelectedVersion === 'original' ? 'active' : ''}
              onClick={() => setAiSelectedVersion('original')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              Original (raw)
            </nav>
            <nav
              className={aiSelectedVersion === 'refined' ? 'active' : ''}
              onClick={() => setAiSelectedVersion('refined')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
              AI‑polished
            </nav>
            <nav
              className={aiSelectedVersion === 'both' ? 'active' : ''}
              onClick={() => setAiSelectedVersion('both')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="copy" style={{ marginRight: '0.5rem' }} />
              Both
            </nav>
          </FilterBar>

          <div
            className={css`
              padding: 1rem;
              background: ${Color.wellGray()};
              border-radius: 8px;
              max-height: 220px;
              overflow-y: auto;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            {aiSelectedVersion === 'both' ? (
              <>
                <p
                  className={css`
                    font-size: 1.15rem;
                    color: ${Color.darkerGray()};
                    margin-bottom: 0.3rem;
                    font-weight: 600;
                  `}
                >
                  Original (raw)
                </p>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    line-height: 1.6;
                    white-space: pre-wrap;
                    margin-bottom: 1rem;
                  `}
                >
                  {originalResponse || response}
                </p>
                <p
                  className={css`
                    font-size: 1.15rem;
                    color: ${Color.logoBlue()};
                    margin-bottom: 0.3rem;
                    font-weight: 600;
                  `}
                >
                  AI‑polished
                </p>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    line-height: 1.6;
                    white-space: pre-wrap;
                  `}
                >
                  {refinedResponse || '(not available)'}
                </p>
              </>
            ) : (
              <p
                className={css`
                  font-size: 1.3rem;
                  color: ${Color.black()};
                  line-height: 1.6;
                  white-space: pre-wrap;
                `}
              >
                {aiSelectedVersion === 'refined'
                  ? refinedResponse || originalResponse || response
                  : originalResponse || response}
              </p>
            )}
          </div>
        </div>
      )}

      {/* View Response - shown when not in version selector mode */}
      {!showVersionSelector && (
        <details
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <summary
            className={css`
              cursor: pointer;
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
              padding: 0.5rem 0;
              &:hover {
                color: ${Color.black()};
              }
            `}
          >
            View your response
          </summary>
          <div
            className={css`
              margin-top: 1rem;
              padding: 1rem;
              background: ${Color.wellGray()};
              border-radius: 8px;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            <p
              className={css`
                font-size: 1.3rem;
                color: ${Color.black()};
                line-height: 1.6;
                white-space: pre-wrap;
              `}
            >
              {response}
            </p>

            {/* Refine button inside the details */}
            {canShareToFeed && !refinedResponse && (
              <div
                className={css`
                  margin-top: 1rem;
                `}
              >
                <Button
                  variant="soft"
                  color="logoBlue"
                  onClick={handleRefine}
                  disabled={refining}
                  loading={refining && !preparingAIVersionTarget}
                >
                  <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                  {refining && !preparingAIVersionTarget
                    ? 'Polishing...'
                    : 'See AI-polished version'}
                </Button>
              </div>
            )}

            {refinedResponse && (
              <div
                className={css`
                  margin-top: 1rem;
                  padding-top: 1rem;
                  border-top: 1px solid ${Color.borderGray()};
                `}
              >
                <h5
                  className={css`
                    font-size: 1.2rem;
                    color: ${Color.logoBlue()};
                    margin-bottom: 0.5rem;
                  `}
                >
                  <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                  AI-Polished Version:
                </h5>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    line-height: 1.6;
                    white-space: pre-wrap;
                  `}
                >
                  {refinedResponse}
                </p>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Share Error */}
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

      {/* Actions */}
      <div
        className={css`
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 1.5rem;
        `}
      >
        {canShareToFeed && !showVersionSelector && !showAIVersionSelector && (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            <Button
              variant="solid"
              color="logoBlue"
              onClick={handleShareClick}
              disabled={!canShareToFeedNow || refining}
              loading={
                canShareToFeedNow && refining && !preparingAIVersionTarget
              }
            >
              <Icon icon="share" style={{ marginRight: '0.5rem' }} />
              {!canShareToFeedNow ? (
                <>
                  <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                  Shared to Feed
                </>
              ) : refining && !preparingAIVersionTarget ? (
                'Preparing...'
              ) : (
                'Share to Feed'
              )}
            </Button>
            {canShareToFeedNow && (
              <span
                className={css`
                  margin-top: 0.4rem;
                  font-size: 1.1rem;
                  color: ${Color.orange()};
                  font-weight: 600;
                `}
              >
                +{shareCoinsReward.toLocaleString()} coins
              </span>
            )}
          </div>
        )}
        {!showVersionSelector && !showAIVersionSelector && canShareToAI && (
          <>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
              `}
            >
              <Button
                color="logoBlue"
                variant="solid"
                tone="raised"
                onClick={() => handleShareWithAI('zero')}
                disabled={
                  !canShareWithZero ||
                  sharingWithCiel ||
                  sharingWithZero ||
                  preparingAIVersionTarget !== null
                }
                loading={
                  sharingWithZero ||
                  (preparingAIVersionTarget === 'zero' &&
                    refining &&
                    !refinedResponse)
                }
              >
                <img
                  src={zero}
                  alt="Zero"
                  className={css`
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    object-fit: contain;
                    background: #fff;
                  `}
                />
                {!canShareWithZero ? (
                  <>
                    <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                    Shared with Zero
                  </>
                ) : sharingWithZero ? (
                  'Sharing with Zero...'
                ) : (
                  'Share with Zero'
                )}
              </Button>
              {canShareWithZero && canGetAIShareCoins && (
                <span
                  className={css`
                    margin-top: 0.4rem;
                    font-size: 1.1rem;
                    color: ${Color.orange()};
                    font-weight: 600;
                  `}
                >
                  +{shareCoinsReward.toLocaleString()} coins
                </span>
              )}
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
              `}
            >
              <Button
                color="purple"
                variant="solid"
                tone="raised"
                onClick={() => handleShareWithAI('ciel')}
                disabled={
                  !canShareWithCiel ||
                  sharingWithCiel ||
                  sharingWithZero ||
                  preparingAIVersionTarget !== null
                }
                loading={
                  sharingWithCiel ||
                  (preparingAIVersionTarget === 'ciel' &&
                    refining &&
                    !refinedResponse)
                }
              >
                <img
                  src={ciel}
                  alt="Ciel"
                  className={css`
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    object-fit: contain;
                    background: #fff;
                  `}
                />
                {!canShareWithCiel ? (
                  <>
                    <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                    Shared with Ciel
                  </>
                ) : sharingWithCiel ? (
                  'Sharing with Ciel...'
                ) : (
                  'Share with Ciel'
                )}
              </Button>
              {canShareWithCiel && canGetAIShareCoins && (
                <span
                  className={css`
                    margin-top: 0.4rem;
                    font-size: 1.1rem;
                    color: ${Color.orange()};
                    font-weight: 600;
                  `}
                >
                  +{shareCoinsReward.toLocaleString()} coins
                </span>
              )}
            </div>
          </>
        )}
        {showVersionSelector && (
          <>
            <Button
              variant="ghost"
              onClick={() => setShowVersionSelector(false)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="logoBlue"
              onClick={handleConfirmShare}
              disabled={sharing}
              loading={sharing}
            >
              <Icon icon="share" style={{ marginRight: '0.5rem' }} />
              {sharing ? 'Sharing...' : 'Confirm Share'}
            </Button>
          </>
        )}
        {showAIVersionSelector && aiShareTarget && (
          <>
            <Button variant="ghost" onClick={handleCancelAIVersionSelector}>
              Cancel
            </Button>
            <Button
              variant="solid"
              color={aiShareTarget === 'ciel' ? 'purple' : 'logoBlue'}
              onClick={handleConfirmShareWithAI}
              disabled={sharingWithZero || sharingWithCiel}
              loading={
                aiShareTarget === 'zero' ? sharingWithZero : sharingWithCiel
              }
            >
              <Icon icon="share" style={{ marginRight: '0.5rem' }} />
              {aiShareTarget === 'zero'
                ? sharingWithZero
                  ? 'Sharing with Zero...'
                  : 'Confirm Share with Zero'
                : sharingWithCiel
                ? 'Sharing with Ciel...'
                : 'Confirm Share with Ciel'}
            </Button>
          </>
        )}
      </div>

      <NextDayCountdown
        label="Next Daily Reflection"
        className={css`
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: ${Color.darkerGray()};
          font-size: 1.3rem;
        `}
        labelClassName={css`
          font-weight: 700;
          margin-bottom: 0.3rem;
          color: ${Color.black()};
        `}
        timerClassName={css`
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: ${Color.logoBlue()};
        `}
      />

      {/* Done button - below countdown */}
      {!showVersionSelector && !showAIVersionSelector && (
        <div
          className={css`
            display: flex;
            justify-content: center;
            margin-top: 1.5rem;
          `}
        >
          <Button variant="solid" color={doneColor} onClick={onClose}>
            Done
          </Button>
        </div>
      )}
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
        feedback
      });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      if (result.channelId) {
        socket.emit('join_chat_group', result.channelId);
      }

      // Update user's coin balance in real-time
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
