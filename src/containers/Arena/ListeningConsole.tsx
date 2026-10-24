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
            .map((track) => track.label.replace(/번$/, ''))
            .join(', ')} twice)`;
  return `${how}, as in the real exam. No replays.`;
}

export interface ListeningTrack {
  label: string;
  src: string;
  plays: number;
}

type Step =
  | { kind: 'audio'; src: string; label: string }
  | { kind: 'gap'; ms: number; label: string };

function buildSteps(examKey: string, tracks: ListeningTrack[]): Step[] {
  const steps: Step[] = [
    {
      kind: 'audio',
      src: arenaMediaURL(`audio/${examKey}/intro.mp3`),
      label: '안내 방송'
    }
  ];
  for (const track of tracks) {
    for (let play = 0; play < track.plays; play++) {
      steps.push({ kind: 'audio', src: track.src, label: track.label });
      steps.push({
        kind: 'gap',
        ms: play + 1 < track.plays ? REPEAT_GAP_MS : ANSWER_GAP_MS,
        label: track.label
      });
    }
  }
  steps.push({
    kind: 'audio',
    src: arenaMediaURL(`audio/${examKey}/outro.mp3`),
    label: '안내 방송'
  });
  return steps;
}

export default function ListeningConsole({
  battleId,
  examKey,
  tracks
}: {
  battleId: number;
  examKey: string;
  tracks: ListeningTrack[];
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
    audio.play().catch(() => setBlocked(true));
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
        <span>듣기 평가가 끝났습니다. Listening is over.</span>
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
          {step.kind === 'audio'
            ? `${step.label} 방송 중`
            : `${step.label} 답할 시간`}
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
