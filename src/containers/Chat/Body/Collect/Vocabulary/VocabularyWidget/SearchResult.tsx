import React from 'react';
import Loading from '~/components/Loading';
import Definition from '../Definition';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

interface SearchResultProps {
  searchedWord: any;
  socketConnected: boolean;
  notFoundLabel: string;
}

export default function SearchResult({
  searchedWord,
  socketConnected,
  notFoundLabel
}: SearchResultProps) {
  if (!searchedWord || !socketConnected) {
    return (
      <Loading
        style={{ height: '100%' }}
        text={socketConnected ? 'Looking up...' : 'Loading...'}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        paddingRight: '1rem',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'scroll'
      }}
    >
      {searchedWord?.content && (
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
      )}
      {!searchedWord?.content && (
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
    </div>
  );
}
