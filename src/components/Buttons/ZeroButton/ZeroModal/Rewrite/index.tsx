import React, { useEffect, useMemo, useRef, useState } from 'react';
import Menu from './Menu';
import RichText from '~/components/Texts/RichText';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { socket } from '~/constants/io';
import { ResponseObj } from '../types';
import { isMobile } from '~/helpers';
import Button from '~/components/Button';

const deviceIsMobile = isMobile(navigator);

export default function Rewrite({
  contentId,
  contentType,
  content,
  onSetSelectedSection,
  workshopLabel
}: {
  contentId?: number;
  contentType?: string;
  content?: string;
  onSetSelectedSection: (section: string) => void;
  workshopLabel: string;
}) {
  const mounted = useRef(true);
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
  const [isPlaying, setIsPlaying] = useState(false);
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
  const [preparing, setPreparing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState('zero');
  const [wordLevel, setWordLevel] = useState('intermediate');
  const [loadingType, setLoadingType] = useState('');
  const responseIdentifier = useRef(Math.floor(Math.random() * 1000000000));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    socket.on('zeros_review_updated', handleZeroReviewUpdated);
    socket.on('zeros_review_finished', handleZeroReviewFinished);

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

    async function handleZeroReviewFinished({
      identifier,
      response
    }: {
      identifier: number;
      type: string;
      style: string;
      wordLevel: number;
      response: string;
    }) {
      if (deviceIsMobile) return;
      if (identifier !== responseIdentifier.current) return setPreparing(false);
      try {
        setPreparing(true);
        setElapsedTime(0); // Reset elapsed time
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        const data = await textToSpeech(response);
        if (mounted.current) {
          const audioUrl = URL.createObjectURL(data);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audioRef.current.play();
        }
      } catch (error) {
        console.error('Error generating TTS:', error);
        audioRef.current = null;
      } finally {
        setPreparing(false);
        responseIdentifier.current = Math.floor(Math.random() * 1000000000);
      }
    }

    return function cleanUp() {
      socket.removeListener('zeros_review_updated', handleZeroReviewUpdated);
      socket.removeListener('zeros_review_finished', handleZeroReviewFinished);
    };
  });

  useEffect(() => {
    mounted.current = true;
    setLoadingType('');
    return function cleanUp() {
      mounted.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [selectedStyle, wordLevel]);

  useEffect(() => {
    let timer: any;
    if (preparing) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0); // Reset elapsed time when not preparing
    }
    return () => clearInterval(timer);
  }, [preparing]);

  const preparingMessage = useMemo(() => {
    if (elapsedTime < 5) return 'Getting ready to speak...';
    if (elapsedTime < 10) return 'Still preparing...';
    return 'Almost there, hang tight...';
  }, [elapsedTime]);

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

  useEffect(() => {
    const contentToRead = content || contentFetchedFromContext;
    if (contentToRead) {
      onMount(contentToRead);
    }
    async function onMount(content: string) {
      if (deviceIsMobile) return;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreparing(true);
      try {
        const data = await textToSpeech(content);
        if (mounted.current) {
          const audioUrl = URL.createObjectURL(data);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audioRef.current.play();
        }
      } catch (error) {
        audioRef.current = null;
        console.error('Error generating TTS:', error);
      } finally {
        setPreparing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, contentFetchedFromContext]);

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
      {false && (
        <FilterBar>
          <nav
            className="active"
            onClick={() => onSetSelectedSection('rewrite')}
          >
            Rewrite
          </nav>
          <nav onClick={() => onSetSelectedSection('upgrade')}>
            {workshopLabel}
          </nav>
        </FilterBar>
      )}
      <div
        className={css`
          width: 100%;
          display: flex;
          padding: 2rem;
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
            onUpdateIdentifier={(newIdentifier: number) => {
              responseIdentifier.current = newIdentifier;
            }}
            responseObj={responseObj}
            wordLevel={wordLevel}
            onSetWordLevel={setWordLevel}
          />
        </div>
        <div className="content">
          {preparing && (
            <div
              className={css`
                display: flex;
                align-items: center;
                color: ${Color.gray()};
                margin-bottom: 1rem;
              `}
            >
              <Icon icon="spinner" pulse />
              <span style={{ marginLeft: '0.5rem' }}>{preparingMessage}</span>
            </div>
          )}
          {deviceIsMobile && (
            <div style={{ position: 'absolute', top: '4rem' }}>
              <Button
                loading={preparing}
                skeuomorphic
                onClick={handleAudioClick}
              >
                <Icon icon={isPlaying ? 'stop' : 'volume'} />
                <span style={{ marginLeft: '1rem' }}>
                  {isPlaying ? 'Stop' : 'Speak'}
                </span>
              </Button>
            </div>
          )}
          {response ? (
            <RichText
              key={response}
              maxLines={100}
              style={{
                opacity: 1,
                marginBottom: '3rem',
                fontWeight: 'bold',
                fontFamily: 'Roboto mono, monospace',
                textAlign: response?.length < 30 ? 'center' : 'justify',
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

  async function handleAudioClick() {
    const textToSpeak = response || content || contentFetchedFromContext;
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setPreparing(true);
      try {
        const data = await textToSpeech(textToSpeak);
        const audioUrl = URL.createObjectURL(data);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audioRef.current.play();
        audioRef.current.onended = () => {
          audioRef.current = null;
          setIsPlaying(false);
        };
        setIsPlaying(true);
      } catch (error) {
        setIsPlaying(false);
        console.error(error);
      } finally {
        setPreparing(false);
      }
    }
  }
}
