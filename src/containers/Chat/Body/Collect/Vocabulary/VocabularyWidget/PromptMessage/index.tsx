import { css, keyframes } from '@emotion/css';
import React, { useEffect, useMemo, useState } from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import Definition from '../../Definition';
import WordModal from '../../WordModal';
import SearchLoading from './SearchLoading';
import StatusBar from './StatusBar';
import ErrorMessage from './ErrorMessage';
import ErrorBoundary from '~/components/ErrorBoundary';

interface PromptMessageProps {
  isSearching?: boolean;
  isCensored?: boolean;
  searchedWord?: any;
  socketConnected?: boolean;
  vocabErrorMessage?: string;
  isSubmitting?: boolean;
  isNewWord?: boolean;
  wordRegisterStatus?: any;
  statusMessage: string;
  canHit?: boolean;
  wordMasterBlocked?: boolean;
  onWordMasterBreak?: (status: any) => void;
}

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const bubbleBounce = keyframes`
  0%, 100% {
    transform: translate(-50%, 0);
  }
  50% {
    transform: translate(-50%, -8px);
  }
`;

const bubbleFadeOut = keyframes`
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, 0);
  }
`;

export default function PromptMessage({
  isSearching,
  isCensored,
  searchedWord,
  socketConnected,
  vocabErrorMessage,
  isNewWord,
  isSubmitting,
  wordRegisterStatus,
  statusMessage,
  canHit,
  wordMasterBlocked,
  onWordMasterBreak
}: PromptMessageProps) {
  const [wordModalShown, setWordModalShown] = useState(false);
  const [promptVisible, setPromptVisible] = useState(true);
  const [promptExiting, setPromptExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setPromptExiting(true);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setPromptVisible(false);
    }, 3500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const showLoading = isSearching && (!searchedWord || !socketConnected);
  const showContent =
    isSearching && searchedWord && socketConnected && !vocabErrorMessage;

  const heightStyle = useMemo(() => {
    if (!isSearching) {
      return promptVisible ? '4rem' : '0';
    }
    if (showLoading) return '8rem';
    if (searchedWord?.content || wordRegisterStatus) {
      return 'min(300%, calc(100vh - 20rem))';
    }
    return '25rem';
  }, [isSearching, showLoading, searchedWord?.content, wordRegisterStatus, promptVisible]);

  const showStatusBar = useMemo(
    () => isSearching && (vocabErrorMessage || statusMessage || isSubmitting),
    [vocabErrorMessage, statusMessage, isSubmitting, isSearching]
  );

  const statusBarBackground = useMemo(() => {
    if (isCensored) return Color.rose();
    if (vocabErrorMessage) return Color.rose();
    if (isNewWord)
      return {
        background: 'linear-gradient(135deg, #ffe259 0%, #ffa751 100%)',
        backgroundSize: '200% 200%',
        animation: `${gradientAnimation} 3s ease infinite`
      };
    if (canHit) return Color.green();
    return Color.darkerGray();
  }, [vocabErrorMessage, isNewWord, canHit, isCensored]);

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/VocabularyWidget/PromptMessage">
      {vocabErrorMessage ? (
        <ErrorMessage message={vocabErrorMessage} />
      ) : (
        <div
          className={css`
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translate(-50%, 0);
            background: ${Color.white()};
            border-radius: 1rem;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: ${isSearching ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'};
            z-index: 1;
            width: ${isSearching ? '90%' : 'auto'};
            max-width: ${isSearching ? '600px' : 'none'};
            height: ${heightStyle};
            overflow: hidden;
            transform-origin: bottom center;
            ${!isSearching && promptVisible
              ? `animation: ${promptExiting ? bubbleFadeOut : bubbleBounce} ${promptExiting ? '0.5s ease forwards' : '1s ease-in-out infinite'};`
              : ''}

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
              height: ${heightStyle};
              width: ${isSearching ? '90%' : 'auto'};
            }
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              width: 100%;
              height: 100%;
              min-height: 0;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            `}
          >
            {showStatusBar && (
              <StatusBar
                message={isSubmitting ? 'Collecting...' : statusMessage}
                background={statusBarBackground}
              />
            )}
            {!showContent && !showLoading && !showStatusBar && promptVisible && (
              <div
                className={css`
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.7rem;
                  color: ${Color.darkerGray()};
                  font-size: 1.7rem;
                  background: ${Color.white()};
                  padding: 0.7rem 2rem;
                  white-space: nowrap;
                  font-weight: 500;
                  letter-spacing: 0.02em;

                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.4rem;
                    padding: 0.5rem 1.5rem;
                    gap: 0.5rem;
                  }
                `}
              >
                <span>Type a word below</span>
                <Icon
                  icon="arrow-down"
                  style={{
                    fontSize: '1.4rem',
                    color: Color.black(0.7)
                  }}
                  className={css`
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.2rem;
                    }
                  `}
                />
              </div>
            )}

            {showLoading && (
              <SearchLoading
                text={socketConnected ? 'Looking up...' : 'Loading...'}
              />
            )}

            {showContent && (
              <>
                <div
                  className={css`
                    width: 100%;
                    padding: 2rem;
                    background: ${Color.white()};
                    overflow-y: auto;
                    flex: 1;
                    min-height: 0;
                  `}
                >
                  {searchedWord?.content ? (
                    <>
                      <div
                        className={css`
                          font-weight: bold;
                          font-size: 3rem;
                          margin-bottom: 1rem;
                          @media (max-width: ${mobileMaxWidth}) {
                            font-size: 2rem;
                          }
                        `}
                      >
                        {searchedWord.content}
                      </div>
                      <Definition
                        wordObj={searchedWord}
                        isNewWord={isNewWord}
                        canHit={canHit}
                        wordMasterBlocked={wordMasterBlocked}
                        onWordMasterBreak={onWordMasterBreak}
                      />
                    </>
                  ) : (
                    <div
                      className={css`
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 1rem;
                        padding: 2rem;
                        color: ${Color.darkerGray()};
                        text-align: center;

                        @media (max-width: ${mobileMaxWidth}) {
                          padding: 1.5rem;
                        }
                      `}
                    >
                      <div
                        className={css`
                          margin-top: 1.5rem;
                          font-size: 2.5rem;
                          font-weight: bold;
                          display: flex;
                          align-items: center;
                          @media (max-width: ${mobileMaxWidth}) {
                            font-size: 1.7rem;
                          }
                        `}
                      >
                        <Icon
                          icon="exclamation-circle"
                          style={{
                            fontSize: '3rem',
                            color: Color.cranberry()
                          }}
                        />
                        <span style={{ marginLeft: '0.7rem' }}>
                          Word Not Found
                        </span>
                      </div>
                      <div
                        className={css`
                          font-size: 1.7rem;
                          opacity: 0.9;
                          @media (max-width: ${mobileMaxWidth}) {
                            font-size: 1.3rem;
                          }
                        `}
                      >
                        {statusMessage}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {wordModalShown && (
            <WordModal
              key={wordRegisterStatus?.content}
              word={wordRegisterStatus?.content}
              onHide={() => setWordModalShown(false)}
              wordMasterBlocked={wordMasterBlocked}
              onWordMasterBreak={onWordMasterBreak}
            />
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}
