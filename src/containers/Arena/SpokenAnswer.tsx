import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { v1 as uuidv1 } from 'uuid';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import ArenaButton from './ArenaButton';
import { ARENA } from './theme';
import type { ArenaItem } from './types';

// A spoken answer (C1 / IELTS / TOEFL Speaking): the exam's preparation
// time, then its response time, recorded in the browser and uploaded
// privately (upload context 'arenaSpeech'). One take in a battle, as in the
// real exam; Train's untimed retake may record again. A failed upload keeps
// the take so it can be sent again.

type Phase = 'idle' | 'prep' | 'recording' | 'uploading' | 'done' | 'error';

function recorderType() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const type of [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ]) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return '';
}

function extensionOf(type: string) {
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'webm';
}

export default function SpokenAnswer({
  battleId,
  no,
  task,
  recording,
  finished,
  retakeAllowed,
  korean,
  onSaved
}: {
  battleId: number;
  no: number;
  task: ArenaItem['task'];
  recording: ArenaItem['recording'];
  finished: boolean;
  retakeAllowed: boolean;
  korean: boolean;
  onSaved: (seconds: number) => void;
}) {
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveArenaRecording = useAppContext(
    (v) => v.requestHelpers.saveArenaRecording
  );
  const prepSeconds = task?.prepSeconds || 0;
  const responseSeconds = task?.responseSeconds || 60;
  const [phase, setPhase] = useState<Phase>(recording ? 'done' : 'idle');
  const [left, setLeft] = useState(0);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [playback, setPlayback] = useState('');
  const [seconds, setSeconds] = useState<number | null>(
    recording?.seconds ?? null
  );
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const takeRef = useRef<{ blob: Blob; type: string; seconds: number } | null>(
    null
  );

  useEffect(() => {
    if (recording && phase === 'idle') {
      setPhase('done');
      setSeconds(recording.seconds ?? null);
    }
  }, [recording]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopEverything(), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => (playback ? URL.revokeObjectURL(playback) : undefined),
    [playback]
  );

  const unsupported =
    recorderType() === null || !navigator.mediaDevices?.getUserMedia;

  return (
    <div className={wrapCls}>
      <div className={timesCls}>
        {prepSeconds > 0 && (
          <span>
            {korean ? '준비' : 'Preparation'} {clock(prepSeconds)}
          </span>
        )}
        <span>
          {korean ? '답변' : 'Response'} {clock(responseSeconds)}
        </span>
      </div>
      {unsupported && !finished ? (
        <p className={noteCls}>
          This browser can't record audio. Open the battle in Chrome, Edge or
          Safari to answer.
        </p>
      ) : phase === 'idle' && !finished ? (
        <ArenaButton tone="red" size="md" onClick={handleStart}>
          <Icon icon="microphone" />{' '}
          {prepSeconds ? 'Start (preparation first)' : 'Start recording'}
        </ArenaButton>
      ) : phase === 'prep' ? (
        <div className={liveCls}>
          <span className={phaseLabelCls}>Prepare</span>
          <strong className={clockCls}>{clock(left)}</strong>
          <span className={noteCls}>
            Recording starts by itself when the time is up.
          </span>
        </div>
      ) : phase === 'recording' ? (
        <div className={liveCls}>
          <span className={cx(phaseLabelCls, recLabelCls)}>
            <span className={dotCls} /> Recording
          </span>
          <strong className={clockCls}>{clock(left)}</strong>
          <ArenaButton tone="paper" size="md" onClick={() => stopRecording()}>
            <Icon icon="stop" /> Finish
          </ArenaButton>
        </div>
      ) : phase === 'uploading' ? (
        <p className={noteCls}>Saving your answer… {progress}%</p>
      ) : phase === 'error' ? (
        <div className={liveCls}>
          <span className={errorCls}>{error}</span>
          {takeRef.current ? (
            <ArenaButton tone="red" size="md" onClick={() => void upload()}>
              Send the recording again
            </ArenaButton>
          ) : (
            !finished && (
              <ArenaButton tone="red" size="md" onClick={handleStart}>
                Try again
              </ArenaButton>
            )
          )}
        </div>
      ) : phase === 'done' ? (
        <div className={liveCls}>
          <span className={savedCls}>
            <Icon icon="check" /> Answer recorded
            {seconds ? ` · ${clock(seconds)}` : ''}
          </span>
          {playback && <audio controls src={playback} className={audioCls} />}
          {retakeAllowed && !finished && (
            <ArenaButton tone="paper" size="md" onClick={handleStart}>
              Record again
            </ArenaButton>
          )}
        </div>
      ) : (
        finished && (
          <p className={noteCls}>{korean ? '(녹음 없음)' : '(no recording)'}</p>
        )
      )}
    </div>
  );

  async function handleStart() {
    setError('');
    try {
      // ask for the microphone before the preparation clock starts
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
    } catch {
      setError('Allow the microphone to answer this question.');
      setPhase('error');
      return;
    }
    if (prepSeconds > 0) {
      setPhase('prep');
      countdown(prepSeconds, startRecording);
    } else {
      startRecording();
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const type = recorderType() || '';
    const recorder = type
      ? new MediaRecorder(stream, { mimeType: type })
      : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      releaseStream();
      const mime = recorder.mimeType || type || 'audio/webm';
      const blob = new Blob(chunks, { type: mime });
      const took = Math.max(
        1,
        Math.min(responseSeconds, Math.round((Date.now() - startedAt) / 1000))
      );
      takeRef.current = { blob, type: mime, seconds: took };
      setPlayback(URL.createObjectURL(blob));
      void upload();
    };
    recorderRef.current = recorder;
    recorder.start(1000);
    setPhase('recording');
    countdown(responseSeconds, stopRecording);
  }

  function stopRecording() {
    clearTimer();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  async function upload() {
    const take = takeRef.current;
    if (!take) return;
    setPhase('uploading');
    setProgress(0);
    try {
      const fileName = `answer-${no}.${extensionOf(take.type)}`;
      const key = await uploadFile({
        context: 'arenaSpeech',
        filePath: uuidv1(),
        file: new File([take.blob], fileName, { type: take.type }),
        fileName,
        onUploadProgress: ({
          loaded,
          total
        }: {
          loaded: number;
          total: number;
        }) =>
          setProgress(Math.min(100, Math.round((loaded / (total || 1)) * 100)))
      });
      if (!key) throw new Error('The upload did not finish.');
      const result = await saveArenaRecording({
        battleId,
        no,
        key,
        seconds: take.seconds
      });
      setSeconds(result?.seconds ?? take.seconds);
      takeRef.current = null;
      setPhase('done');
      onSaved(result?.seconds ?? take.seconds);
    } catch (err: any) {
      setError(
        err?.code === 'ARENA_TIME_UP' || err?.code === 'ARENA_CLOSED'
          ? 'Time is up: this recording could not be added.'
          : 'Your recording did not save. Check your connection and send it again.'
      );
      setPhase('error');
    }
  }

  function countdown(from: number, onDone: () => void) {
    clearTimer();
    const endAt = Date.now() + from * 1000;
    setLeft(from);
    timerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        clearTimer();
        onDone();
      }
    }, 250);
  }

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopEverything() {
    clearTimer();
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    releaseStream();
  }
}

function clock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const wrapCls = css`
  margin: 1rem 0 0.4rem;
  padding: 1rem 1.2rem;
  border: 1px solid #111;
  background: #fff;
  font-family: system-ui, sans-serif;
  font-size: 1.3rem;
`;

const timesCls = css`
  display: flex;
  gap: 1.6rem;
  margin-bottom: 0.8rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
  font-variant-numeric: tabular-nums;
`;

const liveCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`;

const phaseLabelCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const recLabelCls = css`
  color: ${ARENA.accent};
`;

const dotCls = css`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: ${ARENA.accent};
  animation: arenaRecPulse 1s ease-in-out infinite;
  @keyframes arenaRecPulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
`;

const clockCls = css`
  font-size: 2.2rem;
  font-variant-numeric: tabular-nums;
`;

const noteCls = css`
  margin: 0;
  color: ${ARENA.inkSoft};
`;

const savedCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  color: ${ARENA.train};
`;

const errorCls = css`
  font-weight: 700;
  color: #b3261e;
`;

const audioCls = css`
  max-width: 100%;
`;
