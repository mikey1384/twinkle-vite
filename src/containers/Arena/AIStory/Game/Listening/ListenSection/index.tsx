import React, { useEffect, useRef, useState } from 'react';
import ArenaButton from '../../../../ArenaButton';
import ArenaLoader from '../../../../ArenaLoader';
import { ARENA } from '../../../../theme';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { isMobile } from '~/helpers';
import useEasedProgress from '~/helpers/hooks/useEasedProgress';
import Questions from './Questions';

const deviceIsMobile = isMobile(navigator);
// Matches the API's mark for "script written, voices next".
const SCRIPT_WRITTEN_PROGRESS = 45;
const WRITING_STEP_EASE_MS = 15000;
const VOICE_LINE_EASE_MS = 6000;

export default function ListenSection({
  difficulty,
  isDisabled,
  isGrading,
  onLoadQuestions,
  onReset,
  onGrade,
  onOpenSuccessModal,
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
  onOpenSuccessModal: () => void;
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
  isDisabled: boolean;
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
  // Stays false against an API that doesn't report progress, so the screen
  // keeps its spinner instead of showing a bar stuck at 0%.
  const [progressReported, setProgressReported] = useState(false);
  const {
    progress: loadingProgress,
    easeTo: easeLoadingProgressTo,
    reset: resetLoadingProgress
  } = useEasedProgress();

  useEffect(() => {
    if (isDisabled) return;

    setProgressReported(false);
    resetLoadingProgress();
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
        const errorMessage =
          (error as any)?.response?.data?.error ||
          (error as Error)?.message ||
          'Failed to load audio...';
        setAudioError(errorMessage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, isDisabled]);

  useEffect(() => {
    socket.on('load_listening_status_updated', handleLoadingStatus);
    socket.on('load_listening_progress_updated', handleLoadingProgress);

    function handleLoadingStatus(status: string) {
      setLoadingStatus(status);
    }

    function handleLoadingProgress({ progress }: { progress: number }) {
      setProgressReported(true);
      // Writing steps are one long wait each; voice lines arrive every few
      // seconds, so they ease over a shorter stretch.
      easeLoadingProgressTo(
        progress,
        progress <= SCRIPT_WRITTEN_PROGRESS
          ? WRITING_STEP_EASE_MS
          : VOICE_LINE_EASE_MS
      );
    }

    return () => {
      socket.off('load_listening_status_updated', handleLoadingStatus);
      socket.off('load_listening_progress_updated', handleLoadingProgress);
    };
  }, [easeLoadingProgressTo]);

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
          difficulty={difficulty}
          solveObj={solveObj}
          userChoiceObj={userChoiceObj}
          onSetUserChoiceObj={onSetUserChoiceObj}
          questions={questions}
          questionsLoaded={questionsLoaded}
          onGrade={onGrade}
          onLoadQuestions={onLoadQuestions}
          onOpenSuccessModal={onOpenSuccessModal}
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
            <ArenaButton onClick={onReset}>New Story</ArenaButton>
          </div>
        ) : null}
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          gap: 1.5rem;
        `}
      >
        <div
          className={css`
            font-size: 1.6rem;
            font-weight: bold;
            color: ${ARENA.ink};
            text-align: center;
            padding: 0 1.5rem;
          `}
        >
          Daily listening limit reached. Please try again tomorrow.
        </div>
        <ArenaButton onClick={onReset}>Back</ArenaButton>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {audioError ? (
        <div
          className={css`
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            margin: 2rem;
            font-size: 1.6rem;
            font-weight: bold;
          `}
        >
          <p
            className={css`
              margin-bottom: 2rem;
            `}
          >
            {audioError}
          </p>
          <ArenaButton onClick={onReset}>Try again</ArenaButton>
        </div>
      ) : (
        <div
          className={css`
            width: 100%;
            height: 100%;
            font-size: 1.2em;
            color: ${ARENA.ink};
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          {isPlaying ? (
            <div className={onAirCls} role="status">
              <span className={onAirDotCls} />
              Listen
            </div>
          ) : isLoaded ? (
            countdown !== null ? (
              <div className={countdownCls}>Playing in {countdown}</div>
            ) : (
              <ArenaButton
                tone="blue"
                disabled={!isLoaded}
                onClick={() => {
                  if (deviceIsMobile) {
                    audioRef.current?.play();
                    setIsPlaying(true);
                  } else {
                    setCountdown(3);
                  }
                }}
              >
                Start Listening
              </ArenaButton>
            )
          ) : (
            <ArenaLoader
              text={`${loadingStatus}${'.'.repeat(dotCount)}`}
              progress={progressReported ? loadingProgress : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}

// on air: a sky card with a pulsing dot (opacity only) while the story plays
const onAirCls = css`
  display: inline-flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.4rem 3rem;
  background: ${ARENA.sky};
  color: #fff;
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 ${ARENA.line};
`;

const onAirDotCls = css`
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: 2px solid ${ARENA.line};
  background: ${ARENA.accent};
  animation: arena-on-air 1.2s ease-in-out infinite;
  @keyframes arena-on-air {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.25;
    }
  }
`;

const countdownCls = css`
  font-size: 3rem;
  font-weight: 900;
  color: ${ARENA.ink};
`;
