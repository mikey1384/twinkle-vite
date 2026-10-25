import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { ARENA } from './theme';
import { arenaMediaURL } from './media';

// The listening section as the real exam broadcasts it (Mikey 2026-10-24):
// the Korean announcer's opening, every item as often as the exam plays it
// (수능 영어: once, 16-17 twice) with time
// to answer after each, then the closing line. No pause, no replay, no
// scrubbing. Browsers need one tap before sound, so the broadcast starts on
// a "Start listening" tap; after that it runs on its own. A reload resumes
// at the item that was playing, never replaying finished ones.

// exams whose broadcast opens and closes with the announcer's recording
// (audio/<exam>/intro.mp3, outro.mp3); the others start at the first item
const ANNOUNCED_EXAMS = new Set(['suneung-eng']);

// exams whose broadcast calls each recording's number first, in the exam's
// language (수능 "십일 번.", TOSEL "Number five.", 레벨테스트 "Numbers fifteen
// and sixteen."). A battle fills each slot with any bank item of its type,
// so the call is the PRINTED number: audio/<exam>/calls/<label>.mp3, then
// the recording tool's 0.9 s pause (Mikey 10-25). The recordings under a
// <paper>-v2/ folder have their own call cut out; an older recording still
// holds the authored number's call and plays as it is, never called twice.
const CALLED_EXAMS: Record<string, 'ko' | 'en'> = {
  'suneung-eng': 'ko',
  'tosel-ba': 'en',
  'lt-eng-e6': 'en'
};
const CALL_GAP_MS = 900;
const CALL_FREE_RECORDING = /-v2\/[^/]+$/;

const ANSWER_GAP_MS = 8000;
const REPEAT_GAP_MS = 4000;

// how often this paper's recordings play, as the real exam does it
function playsNote(tracks: ListeningTrack[]) {
  const twice = tracks.filter((track) => track.plays > 1);
  const how =
    !twice.length
      ? 'Each recording plays once'
      : twice.length === tracks.length
        ? 'Each recording plays twice'
        : `Each recording plays once (${twice
            .map((track) => track.label)
            .join(', ')} twice)`;
  return `${how}, as in the real exam. No replays.`;
}

export interface ListeningTrack {
  label: string;
  // the printed label as a file name (a set "15~16" is 15-16)
  callKey: string;
  audioPath: string;
  src: string;
  plays: number;
}

// call: the number call and its pause, shown as the recording playing
type Step =
  | { kind: 'audio'; src: string; label: string; call?: boolean }
  | { kind: 'gap'; ms: number; label: string; call?: boolean };

function buildSteps(examKey: string, tracks: ListeningTrack[]): Step[] {
  const announced = ANNOUNCED_EXAMS.has(examKey);
  const steps: Step[] = announced
    ? [
        {
          kind: 'audio',
          src: arenaMediaURL(`audio/${examKey}/intro.mp3`),
          label: '안내 방송'
        }
      ]
    : [];
  for (const track of tracks) {
    if (examKey === 'c1-advanced') {
      // Directions and the preview pause play once; only the extract
      // repeats. Files are produced together by arena_audio.py.
      steps.push({
        kind: 'audio',
        src: arenaMediaURL(track.audioPath.replace(/\.mp3$/, '-intro.mp3')),
        label: 'Directions · Read the questions'
      });
    }
    const called =
      !!CALLED_EXAMS[examKey] && CALL_FREE_RECORDING.test(track.audioPath);
    for (let play = 0; play < track.plays; play++) {
      // every play is called, as the real broadcast does (TOSEL's second)
      if (called) {
        steps.push({
          kind: 'audio',
          src: arenaMediaURL(`audio/${examKey}/calls/${track.callKey}.mp3`),
          label: track.label,
          call: true
        });
        steps.push({
          kind: 'gap',
          ms: CALL_GAP_MS,
          label: track.label,
          call: true
        });
      }
      steps.push({ kind: 'audio', src: track.src, label: track.label });
      steps.push({
        kind: 'gap',
        ms: play + 1 < track.plays ? REPEAT_GAP_MS : ANSWER_GAP_MS,
        label: track.label
      });
    }
  }
  if (announced) {
    steps.push({
      kind: 'audio',
      src: arenaMediaURL(`audio/${examKey}/outro.mp3`),
      label: '안내 방송'
    });
  }
  if (examKey === 'c1-advanced' && tracks.length) {
    steps.push({ kind: 'gap', ms: 120000, label: 'Check your listening answers' });
  }
  return steps;
}

export default function ListeningConsole({
  battleId,
  examKey,
  tracks,
  english
}: {
  battleId: number;
  examKey: string;
  tracks: ListeningTrack[];
  // an English-language exam's broadcast reads in English
  english: boolean;
}) {
  const storageKey = `arena-listening-${battleId}`;
  const steps = useRef(buildSteps(examKey, tracks)).current;
  const [index, setIndex] = useState(() => {
    try {
      return Number(sessionStorage.getItem(storageKey)) || 0;
    } catch {
      return 0;
    }
  });
  const [started, setStarted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const done = index >= steps.length;
  const step = steps[index];

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, String(index));
    } catch {
      // the broadcast still runs; a reload would restart this item
    }
  }, [index, storageKey]);

  useEffect(() => {
    if (!started || done) return;
    if (step.kind === 'gap') {
      const timer = window.setTimeout(() => setIndex((i) => i + 1), step.ms);
      return () => window.clearTimeout(timer);
    }
    const audio = new Audio(step.src);
    audioRef.current = audio;
    audio.onended = () => setIndex((i) => i + 1);
    // a missing recording must not stall the paper: skip it
    audio.onerror = () => setIndex((i) => i + 1);
    // only a browser's sound block needs another tap; a recording that
    // can't load is skipped by onerror
    audio.play().catch((error) => {
      if (error?.name === 'NotAllowedError') setBlocked(true);
    });
    return () => {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    };
  }, [started, index, done, step]);

  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <div className={consoleCls}>
      {done ? (
        <span>
          {english ? 'Listening is over.' : '듣기 평가가 끝났습니다.'}
        </span>
      ) : !started || blocked ? (
        <button
          type="button"
          className={startCls}
          onClick={() => {
            setBlocked(false);
            setStarted(true);
          }}
        >
          <Icon icon="play" />{' '}
          {index === 0 ? 'Start listening' : 'Resume listening'}
        </button>
      ) : (
        <span className={nowCls}>
          <Icon icon="volume-high" />{' '}
          {step.label === '안내 방송'
            ? '안내 방송 중'
            : english
              ? step.kind === 'audio' || step.call
                ? `Now playing: ${step.label}`
                : `Time to answer: ${step.label}`
              : step.kind === 'audio' || step.call
                ? `${step.label}번 방송 중`
                : `${step.label}번 답할 시간`}
        </span>
      )}
      <span className={noteCls}>{playsNote(tracks)}</span>
    </div>
  );
}

const consoleCls = css`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  margin-bottom: 1.2rem;
  background: #fff7e0;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  font-family: system-ui, sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  column-span: all;
`;

const startCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.2rem;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: ${ARENA.accent};
  color: #fff;
  font: inherit;
  cursor: pointer;
`;

const nowCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const noteCls = css`
  font-size: 1.15rem;
  font-weight: 500;
  color: ${ARENA.inkSoft};
`;
