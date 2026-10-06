import { useEffect, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import useEasedProgress from '~/helpers/hooks/useEasedProgress';

// Honest loading bar for AI Story questions: the server sends real milestones
// ('ai_story_questions_progress', the same {step, progress} contract as the
// daily question bar) and the bar eases toward each one without passing it.
// Two steps: writing (the long one), then polishing the choices.
const FIRST_STEP = 'Writing questions...';
const WRITING_PROGRESS = 75;
// How long Sol usually takes to write a level's questions (benchmark p50s,
// 10-06: 8 s at Level 1, 12 s at Level 3, 20 s at Level 5), so the bar keeps
// moving for the whole wait instead of stalling near the mark.
const WRITING_EASE_MS: Record<number, number> = { 1: 8000, 2: 10000, 3: 12000, 4: 16000, 5: 20000 };
const POLISHING_EASE_MS = 4000;

function writingEase(difficulty: number) {
  return WRITING_EASE_MS[Math.round(Number(difficulty))] || 15000;
}

export default function useStoryQuestionProgress({
  storyId,
  difficulty,
  loaded
}: {
  storyId: number;
  difficulty: number;
  loaded: boolean;
}) {
  const writingEaseMs = writingEase(difficulty);
  const { progress, easeTo, reset } = useEasedProgress();
  const [step, setStep] = useState(FIRST_STEP);

  useEffect(() => {
    if (loaded) return;
    reset();
    setStep(FIRST_STEP);
    // writing starts as soon as the request does
    easeTo(WRITING_PROGRESS, writingEaseMs);
  }, [storyId, loaded, easeTo, reset, writingEaseMs]);

  useEffect(() => {
    function handleProgress({
      storyId: progressStoryId,
      step: nextStep,
      progress: mark
    }: {
      storyId: number;
      step: string;
      progress: number;
    }) {
      if (Number(progressStoryId) !== Number(storyId)) return;
      setStep(nextStep);
      easeTo(mark, mark <= WRITING_PROGRESS ? writingEaseMs : POLISHING_EASE_MS);
    }
    socket.on('ai_story_questions_progress', handleProgress);
    return () => {
      socket.off('ai_story_questions_progress', handleProgress);
    };
  }, [storyId, easeTo, writingEaseMs]);

  // a retry starts the bar over from the first step
  function restart() {
    reset();
    setStep(FIRST_STEP);
    easeTo(WRITING_PROGRESS, writingEaseMs);
  }

  return { progress: loaded ? 100 : progress, step, restart };
}
