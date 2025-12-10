import React, { useState, useCallback } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';

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
  response,
  grade,
  xpAwarded,
  feedback,
  responseId,
  isShared: initialIsShared,
  onClose
}: {
  question: string;
  response: string;
  grade: string;
  xpAwarded: number;
  feedback: string;
  responseId: number;
  isShared: boolean;
  onClose: () => void;
}) {
  const shareDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.shareDailyQuestionResponse
  );
  const refineDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.refineDailyQuestionResponse
  );

  const [sharing, setSharing] = useState(false);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [shareError, setShareError] = useState<string | null>(null);
  const [refinedResponse, setRefinedResponse] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<
    'original' | 'refined'
  >('refined');

  const handleRefine = useCallback(async () => {
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
  }, [responseId, refineDailyQuestionResponse, refinedResponse, refining]);

  const handleShareClick = useCallback(async () => {
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
  }, [responseId, refineDailyQuestionResponse, refinedResponse, refining]);

  const handleConfirmShare = useCallback(async () => {
    try {
      setSharing(true);
      setShareError(null);

      const textToShare =
        selectedVersion === 'refined' && refinedResponse
          ? refinedResponse
          : response;

      const result = await shareDailyQuestionResponse({
        responseId,
        responseText: textToShare
      });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      setIsShared(true);
      setShowVersionSelector(false);
    } catch (err) {
      console.error('Failed to share:', err);
      setShareError('Failed to share. Please try again.');
    } finally {
      setSharing(false);
    }
  }, [
    responseId,
    shareDailyQuestionResponse,
    selectedVersion,
    refinedResponse,
    response
  ]);

  const gradeColor = gradeColors[grade] || Color.darkerGray();
  const gradeLabel = gradeLabels[grade] || '';
  const gradeSymbol = gradeSymbols[grade] || '?';
  const canShare = grade !== 'Fail' && !isShared;

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
          <div
            className={css`
              display: flex;
              gap: 0.5rem;
              margin-bottom: 1rem;
            `}
          >
            <button
              onClick={() => setSelectedVersion('original')}
              className={css`
                flex: 1;
                padding: 0.75rem;
                border: 2px solid
                  ${selectedVersion === 'original'
                    ? Color.logoBlue()
                    : Color.borderGray()};
                border-radius: 8px;
                background: ${selectedVersion === 'original'
                  ? Color.logoBlue() + '10'
                  : 'white'};
                color: ${selectedVersion === 'original'
                  ? Color.logoBlue()
                  : Color.darkerGray()};
                font-weight: ${selectedVersion === 'original' ? 600 : 400};
                cursor: pointer;
                transition: all 0.2s;
                &:hover {
                  border-color: ${Color.logoBlue()};
                }
              `}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              My Original
            </button>
            <button
              onClick={() => setSelectedVersion('refined')}
              className={css`
                flex: 1;
                padding: 0.75rem;
                border: 2px solid
                  ${selectedVersion === 'refined'
                    ? Color.logoBlue()
                    : Color.borderGray()};
                border-radius: 8px;
                background: ${selectedVersion === 'refined'
                  ? Color.logoBlue() + '10'
                  : 'white'};
                color: ${selectedVersion === 'refined'
                  ? Color.logoBlue()
                  : Color.darkerGray()};
                font-weight: ${selectedVersion === 'refined' ? 600 : 400};
                cursor: pointer;
                transition: all 0.2s;
                &:hover {
                  border-color: ${Color.logoBlue()};
                }
              `}
            >
              <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
              AI Polished
            </button>
          </div>

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
              {selectedVersion === 'refined' ? refinedResponse : response}
            </p>
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
            {canShare && !refinedResponse && (
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
                  loading={refining}
                >
                  <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                  {refining ? 'Polishing...' : 'See AI-polished version'}
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
        {canShare && !showVersionSelector && (
          <Button
            variant="solid"
            color="logoBlue"
            onClick={handleShareClick}
            disabled={refining}
            loading={refining}
          >
            <Icon icon="share" style={{ marginRight: '0.5rem' }} />
            {refining ? 'Preparing...' : 'Share to Feed'}
          </Button>
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
        {!!isShared && (
          <span
            className={css`
              display: flex;
              align-items: center;
              color: ${Color.green()};
              font-size: 1.3rem;
            `}
          >
            <Icon icon="check" style={{ marginRight: '0.5rem' }} />
            Shared to Feed
          </span>
        )}
        {!showVersionSelector && (
          <Button variant="solid" color="green" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
      <div style={{ minHeight: '3rem', flexShrink: 0 }} />
    </div>
  );
}
