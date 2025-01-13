import React from 'react';
import Loading from '~/components/Loading';
import Definition from '../Definition';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

interface SearchResultProps {
  searchedWord: any;
  socketConnected: boolean;
  notFoundLabel: string;
  isVisible: boolean;
}

export default function SearchResult({
  searchedWord,
  socketConnected,
  notFoundLabel,
  isVisible
}: SearchResultProps) {
  const content =
    !searchedWord || !socketConnected ? (
      <Loading text={socketConnected ? 'Looking up...' : 'Loading...'} />
    ) : (
      <>
        {searchedWord?.content ? (
          <>
            <div
              className={css`
                font-weight: bold;
                font-size: 3rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 2rem;
                }
              `}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                padding: '1rem'
              }}
            >
              {searchedWord?.content}
            </div>
            <Definition wordObj={searchedWord} />
          </>
        ) : (
          <div
            className={css`
              font-size: 2.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.7rem;
              }
            `}
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold'
            }}
          >
            {notFoundLabel}
          </div>
        )}
      </>
    );

  return (
    <div
      className={css`
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, ${isVisible ? '-50%' : '-40%'});
        opacity: ${isVisible ? 1 : 0};
        transition: all 0.3s ease-in-out;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 600px;
        max-height: 80%;
        overflow-y: auto;
        z-index: 1;
        padding: 1rem;
      `}
    >
      {content}
    </div>
  );
}
