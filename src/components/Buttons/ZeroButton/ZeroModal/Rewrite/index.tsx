import React, { useEffect, useMemo, useRef, useState } from 'react';
import Menu from './Menu';
import RichText from '~/components/Texts/RichText';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import { useAppContext, useViewContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { ResponseObj } from '../types';
import { isTablet, isMobile } from '~/helpers';
import { audioRef } from '~/constants/state';
import Button from '~/components/Button';

const deviceIsMobile = isMobile(navigator) && !isTablet(navigator);

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
  const contentKey = `${contentId}-${contentType}`;
  const mounted = useRef(true);
  const onSetAudioKey = useViewContext((v) => v.actions.onSetAudioKey);
  const audioKey = useViewContext((v) => v.state.audioKey);
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
  const [isDownloadButtonShown, setIsDownloadButtonShown] = useState(false);
  const responseIdentifier = useRef(Math.floor(Math.random() * 1000000000));

  useEffect(() => {
    audioRef.key = audioKey;
  }, [audioKey]);

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
      if (identifier !== responseIdentifier.current) return setPreparing(false);
      await handlePrepareAudio(response);
    }

    return function cleanUp() {
      socket.off('zeros_review_updated', handleZeroReviewUpdated);
      socket.off('zeros_review_finished', handleZeroReviewFinished);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mounted.current = true;
    setLoadingType('');
    return function cleanUp() {
      mounted.current = false;
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
    if (elapsedTime < 15) {
      return 'Long texts tend to take longer to prepare, hang tight...';
    }
    return 'Almost there...';
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
      init();
    }

    async function init() {
      setPreparing(true);
      if (audioRef.player) {
        setIsPlaying(false);
        audioRef.player.pause();
        audioRef.player = null;
      }
      try {
        const data = await textToSpeech(contentToRead);
        if (mounted.current) {
          const url = URL.createObjectURL(
            new Blob([data], { type: 'audio/mp3' })
          );
          setAudioUrl(url);
          audioRef.player = new Audio(url);
          setIsDownloadButtonShown(true);
          audioRef.player.onended = () => {
            setIsPlaying(false);
          };
          onSetAudioKey(contentKey);
          if (!deviceIsMobile) {
            setIsPlaying(true);
            audioRef.player.play();
          }
        }
      } catch (error) {
        console.error('Error generating TTS:', error);
        audioRef.player = null;
      } finally {
        setPreparing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, contentFetchedFromContext, contentKey]);

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
            onPrepareAudio={handlePrepareAudio}
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
          <div style={{ marginBottom: '2rem', display: 'flex' }}>
            <Button loading={preparing} skeuomorphic onClick={handleAudioClick}>
              <Icon icon={isPlaying ? 'stop' : 'volume'} />
              <span style={{ marginLeft: '0.7rem' }}>
                {isPlaying ? 'Stop' : 'Speak'}
              </span>
            </Button>
            {isDownloadButtonShown && (
              <Button
                style={{ marginLeft: '1rem' }}
                skeuomorphic
                onClick={handleDownloadClick}
              >
                <Icon icon="download" />
              </Button>
            )}
          </div>
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
    if (isPlaying) {
      if (audioRef.player) {
        audioRef.player.pause();
      }
      setIsPlaying(false);
    } else {
      onSetAudioKey(contentKey);
      if (audioRef.player && audioKey === contentKey) {
        audioRef.player.play();
        setIsPlaying(true);
        audioRef.player.onended = () => {
          setIsPlaying(false);
        };
      } else {
        const contentToRead = content || contentFetchedFromContext;
        await handlePrepareAudio(contentToRead);
      }
    }
  }

  async function handlePrepareAudio(contentToRead: string) {
    setPreparing(true);
    if (audioRef.player) {
      setIsPlaying(false);
      audioRef.player.pause();
      audioRef.player = null;
    }
    try {
      const data = await textToSpeech(contentToRead);
      if (mounted.current) {
        const url = URL.createObjectURL(
          new Blob([data], { type: 'audio/mp3' })
        );
        setAudioUrl(url);
        audioRef.player = new Audio(url);
        setIsDownloadButtonShown(true);
        audioRef.player.onended = () => {
          setIsPlaying(false);
        };
        if (!deviceIsMobile) {
          onSetAudioKey(contentKey);
          setIsPlaying(true);
          audioRef.player.play();
        }
      }
    } catch (error) {
      console.error('Error generating TTS:', error);
      audioRef.player = null;
    } finally {
      setPreparing(false);
    }
  }

  function handleDownloadClick() {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${contentKey}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
