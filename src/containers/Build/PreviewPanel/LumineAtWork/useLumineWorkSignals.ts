import { useEffect, useRef, useState } from 'react';

const WRITING_HOLD_MS = 6000;
const LINGER_MS = 2600;

// Turns the run's streamed files into the scene's beats:
// - writingRecently: files changed in the last few seconds (typing poses);
// - saveSignal: +1 when Lumine moves on from a finished file, or a run
//   completes (a celebration);
// - lingering: the few seconds after a completed run, so the celebration
//   plays before the scene gives way to the new preview.
export default function useLumineWorkSignals({
  running,
  streamingProjectFiles,
  streamingFocusFilePath,
  terminalState
}: {
  running: boolean;
  streamingProjectFiles: unknown;
  streamingFocusFilePath: string | null;
  terminalState: 'complete' | 'error' | 'stopped' | null;
}) {
  const [writingRecently, setWritingRecently] = useState(false);
  const [saveSignal, setSaveSignal] = useState(0);
  const [lingering, setLingering] = useState(false);
  const lastFocusRef = useRef<string | null>(null);
  const wasRunningRef = useRef(running);

  useEffect(() => {
    if (!running || !streamingProjectFiles) return;
    setWritingRecently(true);
    const timer = window.setTimeout(
      () => setWritingRecently(false),
      WRITING_HOLD_MS
    );
    return () => window.clearTimeout(timer);
  }, [running, streamingProjectFiles]);

  useEffect(() => {
    const previous = lastFocusRef.current;
    lastFocusRef.current = streamingFocusFilePath;
    if (running && previous && streamingFocusFilePath && previous !== streamingFocusFilePath) {
      setSaveSignal((n) => n + 1);
    }
  }, [running, streamingFocusFilePath]);

  // The terminal state can land a moment after `running` turns off, so a
  // completion within a few seconds of the stop still celebrates.
  const stoppedAtRef = useRef(0);
  const celebratedStopRef = useRef(0);
  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = running;
    if (running) {
      setLingering(false);
      return;
    }
    setWritingRecently(false);
    if (wasRunning) stoppedAtRef.current = Date.now();
    const stoppedAt = stoppedAtRef.current;
    if (
      terminalState !== 'complete' ||
      !stoppedAt ||
      celebratedStopRef.current === stoppedAt ||
      Date.now() - stoppedAt > 4000
    ) {
      return;
    }
    celebratedStopRef.current = stoppedAt;
    setSaveSignal((n) => n + 1);
    setLingering(true);
  }, [running, terminalState]);

  useEffect(() => {
    if (!lingering) return;
    const timer = window.setTimeout(() => setLingering(false), LINGER_MS);
    return () => window.clearTimeout(timer);
  }, [lingering]);

  return { writingRecently, saveSignal, lingering };
}
