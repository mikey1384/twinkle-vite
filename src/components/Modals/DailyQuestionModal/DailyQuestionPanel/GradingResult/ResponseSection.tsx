import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { PAPER, paperSecondaryButtonCls } from '../../paperTheme';

export default function ResponseSection({
  aiSelectedVersion,
  aiShareTarget,
  canShareToFeed,
  isPictureDay = false,
  originalResponse,
  preparingAIVersionTarget,
  question,
  refinedResponse,
  refining,
  response,
  selectedVersion,
  showAIVersionSelector,
  showVersionSelector,
  onAiSelectedVersionChange,
  onRefine,
  onSelectedVersionChange
}: {
  aiSelectedVersion: 'original' | 'refined' | 'both';
  aiShareTarget: 'zero' | 'ciel' | null;
  canShareToFeed: boolean;
  isPictureDay?: boolean;
  originalResponse: string;
  preparingAIVersionTarget: 'zero' | 'ciel' | null;
  question: string;
  refinedResponse: string | null;
  refining: boolean;
  response: string;
  selectedVersion: 'original' | 'refined';
  showAIVersionSelector: boolean;
  showVersionSelector: boolean;
  onAiSelectedVersionChange: (version: 'original' | 'refined' | 'both') => void;
  onRefine: () => void;
  onSelectedVersionChange: (version: 'original' | 'refined') => void;
}) {
  // A "polish" identical to what the author typed is not offered or labelled as AI-polished.
  const polishUnchanged = isPolishUnchanged(
    refinedResponse,
    originalResponse || response
  );
  return (
    <>
      {showVersionSelector && refinedResponse && (
        <div
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <h4
            className={css`
              font-size: 1.3rem;
              color: ${PAPER.inkSoft};
              margin-bottom: 0.75rem;
            `}
          >
            Choose version to share:
          </h4>
          <div className={segmentedCls}>
            <button
              type="button"
              aria-pressed={selectedVersion === 'original'}
              className={selectedVersion === 'original' ? 'active' : ''}
              onClick={() => onSelectedVersionChange('original')}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              My Original
            </button>
            {!polishUnchanged && (
              <button
                type="button"
                aria-pressed={selectedVersion === 'refined'}
                className={selectedVersion === 'refined' ? 'active' : ''}
                onClick={() => onSelectedVersionChange('refined')}
              >
                <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                AI Polished
              </button>
            )}
          </div>
          {polishUnchanged && <PolishUnchangedNote />}

          <div
            className={css`
              padding: 1rem;
              background: ${PAPER.paperDeep};
              border-radius: 12px;
              max-height: 200px;
              overflow-y: auto;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${PAPER.inkSoft};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            <p
              className={css`
                font-family: ${PAPER.serif};
                font-size: 1.6rem;
                color: ${PAPER.ink};
                line-height: 1.65;
                white-space: pre-wrap;
              `}
            >
              {selectedVersion === 'refined' && !polishUnchanged
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
              color: ${PAPER.inkSoft};
              margin-bottom: 0.75rem;
            `}
          >
            Choose version to share with{' '}
            {aiShareTarget === 'ciel' ? 'Ciel' : 'Zero'}:
          </h4>
          <div className={segmentedCls}>
            <button
              type="button"
              aria-pressed={aiSelectedVersion === 'original'}
              className={aiSelectedVersion === 'original' ? 'active' : ''}
              onClick={() => onAiSelectedVersionChange('original')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              Original (raw)
            </button>
            {!polishUnchanged && (
              <button
                type="button"
                aria-pressed={aiSelectedVersion === 'refined'}
                className={aiSelectedVersion === 'refined' ? 'active' : ''}
                onClick={() => onAiSelectedVersionChange('refined')}
                style={{ minWidth: '9rem' }}
              >
                <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                AI‑polished
              </button>
            )}
            {!polishUnchanged && (
              <button
                type="button"
                aria-pressed={aiSelectedVersion === 'both'}
                className={aiSelectedVersion === 'both' ? 'active' : ''}
                onClick={() => onAiSelectedVersionChange('both')}
                style={{ minWidth: '9rem' }}
              >
                <Icon icon="copy" style={{ marginRight: '0.5rem' }} />
                Both
              </button>
            )}
          </div>
          {polishUnchanged && <PolishUnchangedNote />}

          <div
            className={css`
              padding: 1rem;
              background: ${PAPER.paperDeep};
              border-radius: 12px;
              max-height: 220px;
              overflow-y: auto;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${PAPER.inkSoft};
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
                    color: ${PAPER.inkSoft};
                    margin-bottom: 0.3rem;
                    font-weight: 600;
                  `}
                >
                  Original (raw)
                </p>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${PAPER.ink};
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
                    color: ${PAPER.blue};
                    margin-bottom: 0.3rem;
                    font-weight: 600;
                  `}
                >
                  AI‑polished
                </p>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${PAPER.ink};
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
                  color: ${PAPER.ink};
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

      {!showVersionSelector && !showAIVersionSelector && (
        <details
          open={isPictureDay || undefined}
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <summary
            className={css`
              cursor: pointer;
              font-size: 1.3rem;
              color: ${PAPER.inkSoft};
              padding: 0.5rem 0;
              &:hover {
                color: ${PAPER.ink};
              }
            `}
          >
            {isPictureDay ? 'Your description' : 'Your answer'}
          </summary>
          <div
            className={css`
              margin-top: 1rem;
              padding: 1rem;
              background: ${PAPER.paperDeep};
              border-radius: 12px;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${PAPER.inkSoft};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            <p
              className={css`
                font-family: ${PAPER.serif};
                font-size: 1.6rem;
                color: ${PAPER.ink};
                line-height: 1.65;
                white-space: pre-wrap;
              `}
            >
              {response}
            </p>

            {canShareToFeed && !refinedResponse && (
              <div
                className={css`
                  margin-top: 1rem;
                `}
              >
                <button
                  aria-busy={refining && !preparingAIVersionTarget}
                  type="button"
                  className={paperSecondaryButtonCls}
                  onClick={onRefine}
                  disabled={refining}
                >
                  <Icon icon="magic" />
                  {refining && !preparingAIVersionTarget
                    ? 'Polishing...'
                    : 'See AI-polished version'}
                  {(refining && !preparingAIVersionTarget) && (
                    <Icon icon="spinner" pulse style={{ marginLeft: '0.7rem' }} />
                  )}
                </button>
              </div>
            )}

            {refinedResponse && polishUnchanged && <PolishUnchangedNote />}
            {refinedResponse && !polishUnchanged && (
              <div
                className={css`
                  margin-top: 1rem;
                  padding-top: 1rem;
                  border-top: 1px solid ${PAPER.line};
                `}
              >
                <h5
                  className={css`
                    font-size: 1.2rem;
                    color: ${PAPER.blue};
                    margin-bottom: 0.5rem;
                  `}
                >
                  <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                  AI-Polished Version:
                </h5>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${PAPER.ink};
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
    </>
  );
}

export function isPolishUnchanged(
  refinedResponse: string | null,
  originalResponse: string
) {
  if (!refinedResponse) return false;
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
  return normalize(refinedResponse) === normalize(originalResponse);
}

function PolishUnchangedNote() {
  return (
    <p
      className={css`
        margin-top: 1rem;
        font-size: 1.2rem;
        color: ${PAPER.inkSoft};
        line-height: 1.5;
      `}
    >
      <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
      The AI polish came back with the same wording as yours, so it will be
      shared exactly as you wrote it.
    </p>
  );
}

const segmentedCls = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding: 0.3rem;
  margin-bottom: 1rem;
  border-radius: 999px;
  background: ${PAPER.paperDeep};
  border: 1px solid ${PAPER.line};
  button {
    display: inline-flex;
    border: 0;
    background: transparent;
    font-family: inherit;
    align-items: center;
    padding: 0.6rem 1.3rem;
    border-radius: 999px;
    font-size: 1.3rem;
    font-weight: 600;
    color: ${PAPER.inkSoft};
    cursor: pointer;
    user-select: none;
  }
  button:hover {
    color: ${PAPER.ink};
  }
  button:focus-visible {
    outline: 2px solid ${PAPER.blue};
    outline-offset: 2px;
  }
  button.active {
    background: ${PAPER.paper};
    color: ${PAPER.ink};
    box-shadow: 0 1px 3px rgba(80, 60, 30, 0.15);
  }
`;
