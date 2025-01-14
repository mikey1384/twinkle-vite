import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import Definition from '../../Definition';
import WordModal from '../WordModal';
import SearchLoading from './SearchLoading';

interface PromptMessageProps {
  isSearching?: boolean;
  searchedWord?: any;
  socketConnected?: boolean;
  notFoundLabel?: string;
  wordRegisterStatus?: any;
  notRegistered?: boolean;
  alreadyRegistered?: boolean;
  vocabErrorMessage?: string;
  isSubmitting?: boolean;
  notDiscoveredYetLabel?: string;
  alreadyDiscoveredLabel?: string;
}

export default function PromptMessage({
  isSearching,
  searchedWord,
  socketConnected,
  notFoundLabel,
  wordRegisterStatus,
  notRegistered,
  alreadyRegistered,
  vocabErrorMessage,
  isSubmitting,
  notDiscoveredYetLabel,
  alreadyDiscoveredLabel
}: PromptMessageProps) {
  const showLoading = isSearching && (!searchedWord || !socketConnected);
  const showContent = isSearching && searchedWord && socketConnected;
  const [wordModalShown, setWordModalShown] = useState(false);

  const heightStyle = useMemo(() => {
    if (!isSearching) return '4rem';
    if (showLoading) return '8rem';
    if (searchedWord?.content || wordRegisterStatus) {
      return 'min(300%, calc(100vh - 20rem))';
    }
    // for "not found" state
    return '15rem';
  }, [isSearching, showLoading, searchedWord?.content, wordRegisterStatus]);

  const showStatusBar =
    notRegistered || alreadyRegistered || vocabErrorMessage || isSubmitting;

  return (
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
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
        width: ${isSearching ? '90%' : 'auto'};
        max-width: ${isSearching ? '600px' : 'none'};
        height: ${heightStyle};
        overflow: hidden;
        transform-origin: bottom center;

        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.3rem;
          height: ${!isSearching
            ? '4rem'
            : showLoading
            ? '7rem'
            : searchedWord?.content || wordRegisterStatus
            ? 'min(250%, calc(100vh - 20rem))'
            : '12rem'};
        }
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          margin-top: auto;
          min-height: 0;
        `}
      >
        {showStatusBar && (
          <div
            className={css`
              font-size: 2rem;
              width: 100%;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
            style={{
              display: 'flex',
              background: vocabErrorMessage
                ? Color.rose()
                : notRegistered
                ? Color.green()
                : Color.darkerGray(),
              color: '#fff',
              padding: '1rem',
              justifyContent: 'center',
              alignItems: 'center',
              height: '7rem'
            }}
          >
            {vocabErrorMessage ||
              (notRegistered
                ? isSubmitting
                  ? 'Collecting...'
                  : notDiscoveredYetLabel
                : alreadyDiscoveredLabel)}
          </div>
        )}

        {!showContent && !showLoading && (
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
                color: Color.black(0.7),
                '@media (max-width: ${mobileMaxWidth})': {
                  fontSize: '1.2rem'
                }
              }}
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
                  <Definition wordObj={searchedWord} />
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
                  <Icon
                    icon="exclamation-circle"
                    style={{
                      fontSize: '3rem',
                      color: Color.rose(),
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div
                    className={css`
                      font-size: 2.5rem;
                      font-weight: bold;
                      margin-bottom: 0.5rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.7rem;
                      }
                    `}
                  >
                    Word Not Found
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
                    {notFoundLabel}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {wordModalShown && (
        <WordModal
          word={wordRegisterStatus?.content}
          onHide={() => setWordModalShown(false)}
        />
      )}
    </div>
  );
}
