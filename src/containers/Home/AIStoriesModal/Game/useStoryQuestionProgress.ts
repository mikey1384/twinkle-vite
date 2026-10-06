import { useEffect, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import useEasedProgress from '~/helpers/hooks/useEasedProgress';

// Honest loading bar for AI Story questions: the server sends real milestones
// ('ai_story_questions_progress', the same {step, progress} contract as the
// daily question bar) and the bar eases toward each one without passing it.
// Two steps: writing (the long one), then polishing the choices.
const FIRST_STEP = 'Writing questions...';
const WRITING = { progress: 75, easeMs: 7000 };
const POLISHING_EASE_MS = 4000;

function easeFor(progress: number) {
  return progress <= WRITING.progress ? WRITING.easeMs : POLISHING_EASE_MS;
}

export default function useStoryQuestionProgress({
  storyId,
  loaded
}: {
  storyId: number;
  loaded: boolean;
}) {
  const { progress, easeTo, reset } = useEasedProgress();
  const [step, setStep] = useState(FIRST_STEP);

  useEffect(() => {
    if (loaded) return;
    reset();
    setStep(FIRST_STEP);
    // writing starts as soon as the request does
    easeTo(WRITING.progress, WRITING.easeMs);
  }, [storyId, loaded, easeTo, reset]);

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
      easeTo(mark, easeFor(mark));
    }
    socket.on('ai_story_questions_progress', handleProgress);
    return () => {
      socket.off('ai_story_questions_progress', handleProgress);
    };
  }, [storyId, easeTo]);

  // a retry starts the bar over from the first step
  function restart() {
    reset();
    setStep(FIRST_STEP);
    easeTo(WRITING.progress, WRITING.easeMs);
  }

  return { progress: loaded ? 100 : progress, step, restart };
}
