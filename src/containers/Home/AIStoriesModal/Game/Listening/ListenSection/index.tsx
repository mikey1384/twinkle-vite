import React, { useEffect, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css, keyframes } from '@emotion/css';
import { socket } from '~/constants/io';
import { isMobile } from '~/helpers';
import Questions from './Questions';

const deviceIsMobile = isMobile(navigator);

export default function ListenSection({
  difficulty,
  isGrading,
  onLoadQuestions,
  onReset,
  onGrade,
  onSetAttemptId,
  onSetStoryId,
  onSetUserChoiceObj,
  questions,
  questionsLoaded,
  questionsLoadError,
  solveObj,
  storyId,
  topic,
  topicKey,
  type,
  userChoiceObj
}: {
  difficulty: number;
  isGrading: boolean;
  onLoadQuestions: (storyId: number) => void;
  onReset: () => void;
  onGrade: () => void;
  onSetAttemptId: (attemptId: number) => void;
  onSetStoryId: (storyId: number) => void;
  onSetUserChoiceObj: (userChoiceObj: any) => void;
  questions: any[];
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  storyId: number;
  topic: string;
  topicKey: string;
  type: string;
  userChoiceObj: any;
}) {
  const loadAIStoryListeningAudio = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningAudio
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Loading Story');
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };

    async function loadAudio() {
      try {
        const {
          attemptId: newAttemptId,
          storyId,
          audioBlob
        } = await loadAIStoryListeningAudio({
          difficulty,
          topic,
          topicKey,
          type
        });
        onSetStoryId(storyId);
        onSetAttemptId(newAttemptId);
        onLoadQuestions(storyId);
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        setIsLoaded(true);

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setIsFinished(true);
        };

        audioRef.current.onerror = (e) => {
          console.error('Error playing audio:', e);
          setIsPlaying(false);
        };
      } catch (error) {
        console.error('Error loading audio:', error);
        setAudioError('Failed to load audio.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  useEffect(() => {
    socket.on('load_listening_status_updated', handleLoadingStatus);

    function handleLoadingStatus(status: string) {
      setLoadingStatus(status);
    }

    return () => {
      socket.off('load_listening_status_updated', handleLoadingStatus);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prevCount) => (prevCount + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setCountdown(null);
    }
  }, [countdown]);

  if (isFinished) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          marginTop: '10rem',
          padding: '2rem'
        }}
      >
        <Questions
          solveObj={solveObj}
          userChoiceObj={userChoiceObj}
          onSetUserChoiceObj={onSetUserChoiceObj}
          questions={questions}
          questionsLoaded={questionsLoaded}
          onGrade={onGrade}
          onLoadQuestions={onLoadQuestions}
          questionsLoadError={questionsLoadError}
          storyId={storyId}
          isGrading={isGrading}
        />
        {solveObj.isGraded ? (
          <div
            style={{
              width: '100%',
              paddingBottom: '10rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <GradientButton onClick={onReset}>New Story</GradientButton>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {audioError ? (
        <div
          className={css`
            margin: 20px;
            font-size: 1.2em;
            color: red;
          `}
        >
          {audioError}
        </div>
      ) : (
        <div
          className={css`
            width: 100%;
            font-size: 1.2em;
            color: #333;
            text-align: center;
          `}
        >
          {isPlaying ? (
            <div
              className={css`
                font-family: 'Arial', sans-serif;
                font-size: 2em;
                font-weight: bold;
                color: ${Color.darkerGray()};
              `}
            >
              Listen
            </div>
          ) : isLoaded ? (
            countdown !== null ? (
              <div
                className={css`
                  font-size: 1.8em;
                  font-weight: bold;
                  color: ${Color.darkerGray()};
                `}
              >
                Playing in {countdown}
              </div>
            ) : (
              <button
                onClick={() => {
                  if (deviceIsMobile) {
                    audioRef.current?.play();
                    setIsPlaying(true);
                  } else {
                    setCountdown(3);
                  }
                }}
                disabled={!isLoaded}
                className={css`
                  background: linear-gradient(135deg, #6e8efb, #a777e3);
                  border: none;
                  color: white;
                  padding: 15px 30px;
                  font-size: 1em;
                  font-weight: bold;
                  border-radius: 5px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  cursor: pointer;
                  transition: background 0.3s ease-in-out, transform 0.2s ease;

                  &:hover {
                    background: linear-gradient(135deg, #5a75f6, #945ad1);
                  }

                  &:disabled {
                    background: linear-gradient(135deg, #ddd, #ccc);
                    cursor: not-allowed;
                  }
                `}
              >
                Start Listening
              </button>
            )
          ) : (
            <div
              className={css`
                width: 100%;
                display: flex;
                justify-content: center;
              `}
            >
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  text-align: center;
                `}
              >
                <div
                  className={css`
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: ${keyframes`
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    `} 2s linear infinite;
                    margin-bottom: 2rem;
                  `}
                />
                <div
                  className={css`
                    font-family: 'Arial', sans-serif;
                    font-weight: bold;
                    color: ${Color.darkerGray()};
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    font-size: 2rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.8rem;
                    }
                  `}
                >
                  {loadingStatus}
                  {'.'.repeat(dotCount)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
