import React, { useEffect, useMemo, useRef, useState } from 'react';
import Menu from './Menu';
import RichText from '~/components/Texts/RichText';
import FilterBar from '~/components/FilterBar';
import { useContentState } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { socket } from '~/constants/io';
import { ResponseObj } from '../types';

export default function Rewrite({
  contentId,
  contentType,
  content,
  onSetSelectedSection
}: {
  contentId?: number;
  contentType?: string;
  content?: string;
  onSetSelectedSection: (section: string) => void;
}) {
  const [responseObj, setResponseObj] = useState<ResponseObj>({
    grammar: '',
    rewrite: {
      zero: {
        easy: '',
        intermediate: '',
        hard: ''
      },
      kpop: {
        easy: '',
        intermediate: '',
        hard: ''
      },
      shakespear: {
        easy: '',
        intermediate: '',
        hard: ''
      },
      poem: {
        easy: '',
        intermediate: '',
        hard: ''
      },
      rap: {
        easy: '',
        intermediate: '',
        hard: ''
      },
      youtuber: {
        easy: '',
        intermediate: '',
        hard: ''
      }
    },
    easy: ''
  });
  const [selectedStyle, setSelectedStyle] = useState('zero');
  const [wordLevel, setWordLevel] = useState('intermediate');
  const [loadingType, setLoadingType] = useState('');
  const responseIdentifier = useRef(Math.floor(Math.random() * 1000000000));

  useEffect(() => {
    socket.on('zeros_review_updated', handleZeroReviewUpdated);

    function handleZeroReviewUpdated({
      response,
      identifier,
      type,
      wordLevel,
      style
    }: {
      response: string;
      identifier: number;
      type: string;
      difficulty: string;
      wordLevel: string;
      style: string;
    }) {
      if (identifier === responseIdentifier.current)
        setResponseObj((responseObj: ResponseObj) => ({
          ...responseObj,
          [type]:
            type === 'rewrite'
              ? {
                  ...(responseObj.rewrite || {}),
                  [style]: {
                    ...(responseObj.rewrite[style] || {}),
                    [wordLevel]: response
                  }
                }
              : response
        }));
    }

    return function cleanUp() {
      socket.removeListener('zeros_review_updated', handleZeroReviewUpdated);
    };
  });

  useEffect(() => {
    setLoadingType('');
  }, [selectedStyle, wordLevel]);

  const response = useMemo(() => {
    if (loadingType === 'grammar') return responseObj.grammar;
    if (loadingType === 'rewrite') {
      return responseObj.rewrite[selectedStyle][wordLevel];
    }
    if (loadingType === 'easy') return responseObj.easy;
    return '';
  }, [
    loadingType,
    responseObj.easy,
    responseObj.grammar,
    responseObj.rewrite,
    selectedStyle,
    wordLevel
  ]);

  const { content: contentFetchedFromContext } = useContentState({
    contentId: contentId as number,
    contentType: contentType as string
  });

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding-bottom: 3rem;
      `}
    >
      <FilterBar>
        <nav className="active" onClick={() => onSetSelectedSection('rewrite')}>
          Rewrite
        </nav>
        <nav onClick={() => onSetSelectedSection('upgrade')}>
          Upgrade AI Card
        </nav>
      </FilterBar>
      <div
        className={css`
          width: 100%;
          display: flex;
          > .menu {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            flex-grow: 1;
          }
          > .content {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            width: 50%;
          }
          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
            > .menu {
              width: 100%;
            }
            > .content {
              padding-top: 10rem;
              width: 100%;
              padding-bottom: 7rem;
            }
          }
        `}
      >
        <div className="menu">
          <Menu
            style={{ marginTop: '2rem' }}
            content={content || contentFetchedFromContext}
            loadingType={loadingType}
            onSetLoadingType={setLoadingType}
            onSetSelectedStyle={setSelectedStyle}
            selectedStyle={selectedStyle}
            identifier={responseIdentifier.current}
            responseObj={responseObj}
            wordLevel={wordLevel}
            onSetWordLevel={setWordLevel}
          />
        </div>
        <div className="content">
          {response ? (
            <RichText
              key={response}
              maxLines={100}
              style={{
                opacity: 1,
                marginBottom: '3rem',
                fontWeight: 'bold',
                fontFamily: 'Roboto mono, monospace',
                textAlign: response?.length < 30 ? 'center' : 'left',
                color: Color.darkerGray()
              }}
            >
              {response}
            </RichText>
          ) : null}
          <p
            style={{
              marginTop: response ? '3rem' : 0,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical'
            }}
          >{`"${content || contentFetchedFromContext}"`}</p>
        </div>
      </div>
    </div>
  );
}
