import React from 'react';
import Loading from '~/components/Loading';
import Definition from './Definition';
import Icon from '~/components/Icon';
import WordRegisterStatus from './WordRegisterStatus';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

interface VocabularyWidgetProps {
  widgetHeight: string;
  wordRegisterStatus: any;
  inputTextIsEmpty: boolean;
  searchedWord: any;
  socketConnected: boolean;
  notFoundLabel: string;
}

export default function VocabularyWidget({
  widgetHeight,
  wordRegisterStatus,
  inputTextIsEmpty,
  searchedWord,
  socketConnected,
  notFoundLabel
}: VocabularyWidgetProps) {
  return (
    <div
      style={{
        zIndex: 5,
        width: '100%',
        height: widgetHeight,
        boxShadow:
          !wordRegisterStatus && inputTextIsEmpty
            ? `0 -5px 6px -3px ${Color.gray()}`
            : '',
        borderTop:
          !!wordRegisterStatus || !inputTextIsEmpty
            ? `1px solid ${Color.borderGray()}`
            : ''
      }}
    >
      {inputTextIsEmpty && !!wordRegisterStatus && <WordRegisterStatus />}
      {!wordRegisterStatus && inputTextIsEmpty && (
        <div
          className={css`
            padding: 1rem;
            font-size: 3rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            background: ${Color.black()};
            color: #fff;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.7rem;
            }
          `}
        >
          <div>
            <span>Type a word below...</span>
            <Icon style={{ marginLeft: '1rem' }} icon="arrow-down" />
          </div>
        </div>
      )}
      {!inputTextIsEmpty &&
        (!searchedWord || !socketConnected ? (
          <Loading
            style={{ height: '100%' }}
            text={socketConnected ? 'Looking up...' : 'Loading...'}
          />
        ) : (
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
        ))}
    </div>
  );
}
