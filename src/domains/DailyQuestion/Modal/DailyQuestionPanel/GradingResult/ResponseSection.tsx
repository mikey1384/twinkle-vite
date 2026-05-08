import React from 'react';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function ResponseSection({
  aiSelectedVersion,
  aiShareTarget,
  canShareToFeed,
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
  originalResponse: string;
  preparingAIVersionTarget: 'zero' | 'ciel' | null;
  question: string;
  refinedResponse: string | null;
  refining: boolean;
  response: string;
  selectedVersion: 'original' | 'refined';
  showAIVersionSelector: boolean;
  showVersionSelector: boolean;
  onAiSelectedVersionChange: (
    version: 'original' | 'refined' | 'both'
  ) => void;
  onRefine: () => void;
  onSelectedVersionChange: (version: 'original' | 'refined') => void;
}) {
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
              onClick={() => onSelectedVersionChange('original')}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              My Original
            </nav>
            <nav
              className={selectedVersion === 'refined' ? 'active' : ''}
              onClick={() => onSelectedVersionChange('refined')}
            >
              <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
              AI Polished
            </nav>
          </FilterBar>

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
              onClick={() => onAiSelectedVersionChange('original')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              Original (raw)
            </nav>
            <nav
              className={aiSelectedVersion === 'refined' ? 'active' : ''}
              onClick={() => onAiSelectedVersionChange('refined')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
              AI‑polished
            </nav>
            <nav
              className={aiSelectedVersion === 'both' ? 'active' : ''}
              onClick={() => onAiSelectedVersionChange('both')}
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

            {canShareToFeed && !refinedResponse && (
              <div
                className={css`
                  margin-top: 1rem;
                `}
              >
                <Button
                  variant="soft"
                  color="logoBlue"
                  onClick={onRefine}
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
    </>
  );
}
