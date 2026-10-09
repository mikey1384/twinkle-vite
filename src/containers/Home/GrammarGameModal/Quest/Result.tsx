import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import type { QuestAnswer, QuestResult } from './types';
import QuestMarble, { answerLook } from './QuestMarble';
import PixelIcon from './PixelIcon';
import ChallengeModal from '../Review/ChallengeModal';
import useChallengeReviews from '../Review/useChallengeReviews';
import {
  challengeReviewLabel,
  getSavedChallengeReview
} from '../Review/challengeReviews';
import {
  BLUE,
  GOLD,
  INK,
  PARCHMENT,
  PIXEL_FONT,
  TAG,
  button,
  challengeButton,
  frame,
  inkShadow,
  pixelSvg,
  spriteUri
} from './pixelUi';

export default function Result({
  result,
  answers,
  kind,
  onBackToMap
}: {
  result: QuestResult;
  answers: QuestAnswer[];
  kind: string;
  onBackToMap: () => void;
}) {
  const boss = kind === 'fort' || kind === 'castle';
  const goals = result.dailyTaskStatus?.grammarbles;
  // the run's missed questions, for Classic's Challenge (a boss's misses
  // can only be challenged here: its clock doesn't stop for one)
  const [listOpen, setListOpen] = useState(false);
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const { reviews } = useChallengeReviews();
  const challengeable = answers
    .filter((a) => a.challenge && a.questionText)
    .filter(
      (a, i, list) =>
        list.findIndex(
          (b) => b.challenge!.questionId === a.challenge!.questionId
        ) === i
    );
  const allReviewed = challengeable.every(
    (a) =>
      a.challenge!.checked ||
      reviews[a.challenge!.questionId]?.status === 'complete'
  );
  const selectedChallenge = challengeable.find(
    (a) => a.challenge?.questionId === challengeId
  );
  // never "perfect" while the boss (or the stop) still stands
  const perfect = !!result.perfect && (result.cleared || kind === 'nemesis');
  const headline = perfect
    ? boss
      ? 'Flawless! Every hit landed first try.'
      : 'Perfect! Five right answers, not a single miss.'
    : result.cleared
      ? kind === 'castle'
        ? 'Castle cleared! The next world is open.'
        : boss
          ? 'Boss defeated!'
          : 'Stop cleared!'
      : kind === 'nemesis'
        ? 'Nemesis practice done'
        : boss
          ? 'Not yet: the boss is still standing'
          : 'Not cleared yet';
  // display only: the level-complete banner says the headline in one word
  const banner = perfect
    ? 'PERFECT!'
    : kind === 'nemesis'
      ? 'PRACTICE DONE!'
      : result.cleared
        ? kind === 'castle'
          ? 'CASTLE CLEAR!'
          : boss
            ? 'BOSS DEFEATED!'
            : 'STOP CLEAR!'
        : 'NOT YET';
  const celebrate = !!result.cleared;
  const won = celebrate || kind === 'nemesis';
  return (
    <div className={wrapCls}>
      {celebrate && (
        <div className={confettiCls} aria-hidden>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className={i % 2 ? driftRightCls : driftLeftCls}
              style={{
                left: `${c.x}%`,
                background: c.color,
                animationDelay: `${c.delay}ms`,
                animationDuration: `${c.duration}ms`
              }}
            />
          ))}
        </div>
      )}
      <div className={heroCls}>
        <img
          className={heroMarbleCls}
          // the letter this run puts on the map (nemesis runs have none)
          src={spriteUri(result.grade || null, won ? 'happy' : 'strained')}
          width={72}
          height={72}
          alt=""
          aria-hidden
        />
      </div>
      <div className={bannerWrapCls}>
        <div className={cx(bannerCls, !won && bannerMissCls)}>{banner}</div>
        {celebrate &&
          SPARKLES.map((s, i) => (
            <span
              key={i}
              className={sparkleCls}
              style={{
                left: s.x,
                top: s.y,
                animationDelay: `${s.delay}ms`
              }}
              aria-hidden
            >
              <PixelIcon name="sparkle" scale={3} />
            </span>
          ))}
      </div>
      <div className={marblesCls}>
        {answers.map((a, i) => (
          <span
            key={a.position}
            className={popCls}
            style={{ animationDelay: `${300 + i * 60}ms` }}
          >
            {a.grade ? (
              <img
                className={spriteCls}
                src={spriteUri(a.grade, 'happy')}
                width={24}
                height={24}
                alt=""
                title={a.grade}
              />
            ) : (
              <QuestMarble
                look={answerLook(a.isCorrect, a.combo || 1)}
                size={24}
              />
            )}
          </span>
        ))}
      </div>
      <div className={cx(scoreCls, !won && scoreMissCls)}>
        {boss ? `${result.points ?? 0}` : `${result.score}%`}
      </div>
      <div className={headCls}>{headline}</div>
      <div className={lineCls}>
        {boss
          ? `${result.points ?? 0} of ${result.passPoints ?? 490} points needed to defeat the boss`
          : kind === 'nemesis'
            ? `${result.firstTryCorrect} of ${result.size} right on the first try`
            : `${result.rights ?? 0} right · ${result.misses ?? 0} missed${result.misses ? ' (they came back until you got them)' : ''}`}
      </div>
      {result.cleared &&
        kind !== 'nemesis' &&
        result.dailyTaskStatus &&
        (goals?.excellenceQualified ||
          goals?.basicQualified ||
          result.countsForGoals === false) && (
          // which of today's goals stand now (Mikey 10-08: a replay of a
          // node too far back plays today's Grammarbles but meets no goal)
          <div className={cx(lineCls, dailyCls)}>
            {goals?.excellenceQualified ? (
              <>
                <PixelIcon name="star" scale={3} /> Today&apos;s Excellence goal
                is met
              </>
            ) : goals?.basicQualified ? (
              <>
                <PixelIcon name="check" scale={3} /> Today&apos;s Basic goal is
                met
              </>
            ) : (
              "Too far back to count for today's goals. Play a newer stop or boss."
            )}
          </div>
        )}
      <div className={rewardCls}>
        {result.xp || result.coins ? (
          <>
            <span className={rewardTagCls}>
              <PixelIcon name="star" scale={2} />+{result.xp.toLocaleString()}{' '}
              XP
            </span>
            {result.replayCut ? (
              <span className={noRewardCls}>
                Replay: half XP, no Coins until you beat the Logic Tower castle.
              </span>
            ) : boss && !result.cleared ? (
              <span className={noRewardCls}>
                Half XP while the boss stands. Beat it to earn Coins.
              </span>
            ) : (
              <span className={rewardTagCls}>
                <PixelIcon name="coin" scale={2} />+
                {result.coins.toLocaleString()} Coins
              </span>
            )}
          </>
        ) : (
          <span className={noRewardCls}>
            No more XP or Coins today. Your marbles still count.
          </span>
        )}
      </div>
      {listOpen && (
        <div className={challengeListCls}>
          {challengeable.map((a) => {
            const id = a.challenge!.questionId;
            const review = reviews[id];
            const savedReview = getSavedChallengeReview(
              a.challenge!.checked,
              a.challenge!.review
            );
            return (
              <div key={id} className={challengeItemCls}>
                <div className={challengeTextCls}>
                  {a.questionText}
                  {review && (
                    <div className={checkedCls}>
                      {review.status === 'complete'
                        ? review.result.justified
                          ? 'Accepted · question fixed'
                          : 'Not accepted · answer correct'
                        : review.status === 'pending'
                          ? 'Review in progress'
                          : 'Review interrupted'}
                    </div>
                  )}
                </div>
                <button
                  className={
                    review || savedReview ? reviewSmallCls : challengeSmallCls
                  }
                  title={
                    savedReview || review?.status === 'complete'
                      ? 'Read the reviewer’s explanation'
                      : undefined
                  }
                  onClick={() => setChallengeId(id)}
                >
                  <PixelIcon
                    name={
                      savedReview || review?.status === 'complete'
                        ? 'check'
                        : 'flag'
                    }
                    scale={2}
                  />{' '}
                  {challengeReviewLabel(review, savedReview)}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className={buttonsCls}>
        {challengeable.length > 0 && (
          <button
            className={challengeOpenCls}
            aria-expanded={listOpen}
            onClick={() => setListOpen((o) => !o)}
          >
            <PixelIcon name={allReviewed ? 'check' : 'flag'} scale={2} />{' '}
            {allReviewed ? 'View reviews' : 'Review questions'} (
            {challengeable.length})
          </button>
        )}
        <button className={primaryCls} onClick={onBackToMap}>
          Back to map
        </button>
      </div>
      {challengeId != null && (
        <ChallengeModal
          isOpen
          questionId={challengeId}
          questionText={selectedChallenge?.questionText}
          savedReview={getSavedChallengeReview(
            selectedChallenge?.challenge?.checked,
            selectedChallenge?.challenge?.review
          )}
          questKind={kind as 'stop' | 'fort' | 'castle' | 'nemesis'}
          returnLabel="Back to results"
          continueLabel="Back to map"
          onContinue={onBackToMap}
          onClose={() => setChallengeId(null)}
        />
      )}
    </div>
  );
}

// fixed, so every clear looks the same and nothing is random per render
const CONFETTI_COLORS = [
  '#ffcb32',
  '#ff4f6d',
  '#418ceb',
  '#4fd17c',
  '#df3296',
  '#ffffff'
];
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37 + 7) % 96,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i * 97) % 600,
  duration: 1800 + ((i * 131) % 900)
}));
const SPARKLES = [
  { x: '-1.6rem', y: '-1rem', delay: 200 },
  { x: 'calc(100% + 0.4rem)', y: '-0.6rem', delay: 450 },
  { x: '8%', y: 'calc(100% + 0.2rem)', delay: 650 },
  { x: '88%', y: 'calc(100% + 0.4rem)', delay: 900 }
];

// ribbon tails: a notched end tucked behind the banner
const TAIL = [
  'kkkkkkkk',
  'kddddddd',
  '.kdddddd',
  '..kddddd',
  '...kdddd',
  '....kddd',
  '....kddd',
  '...kdddd',
  '..kddddd',
  '.kdddddd',
  'kddddddd',
  'kkkkkkkk'
];
const tail = (d: string, flip: boolean) =>
  `url("${pixelSvg(
    flip
      ? TAIL.map((r) => r.padEnd(8, '.').split('').reverse().join(''))
      : TAIL,
    { k: INK, d }
  )}")`;
const RED = { k: INK, l: '#ff9aa9', f: '#e64560', s: '#a8233c' };

const wrapCls = css`
  ${frame(PARCHMENT, 4)}
  position: relative;
  isolation: isolate;
  overflow: hidden;
  max-width: 560px;
  margin: 2rem auto;
  padding: 1.4rem 1.6rem 1.8rem;
  text-align: center;
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(PARCHMENT, 3)}
    margin: 1rem auto;
    padding: 1rem 0.8rem 1.4rem;
  }
`;

const confettiCls = css`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  span {
    position: absolute;
    top: -12px;
    width: 6px;
    height: 9px;
    box-shadow: 0 0 0 1px rgba(26, 20, 38, 0.6);
    opacity: 0;
    animation-name: questConfettiL;
    animation-timing-function: cubic-bezier(0.3, 0.6, 0.6, 1);
    animation-fill-mode: forwards;
  }
  @keyframes questConfettiL {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0deg);
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(-30px, 420px) rotate(540deg);
    }
  }
  @keyframes questConfettiR {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0deg);
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(30px, 420px) rotate(-540deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;
const driftLeftCls = css`
  animation-name: questConfettiL;
`;
const driftRightCls = css`
  && {
    animation-name: questConfettiR;
  }
`;

const heroCls = css`
  display: flex;
  justify-content: center;
`;
const heroMarbleCls = css`
  image-rendering: pixelated;
  filter: drop-shadow(0 4px 0 rgba(26, 20, 38, 0.3));
  animation: questHeroIn 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  @keyframes questHeroIn {
    from {
      transform: translateY(-24px) scale(0.6);
      opacity: 0;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const bannerWrapCls = css`
  position: relative;
  display: inline-block;
  max-width: calc(100% - 4rem);
  margin: 0.6rem 0 1rem;
`;
const bannerCls = css`
  ${frame(RED, 3)}
  position: relative;
  padding: 0.5rem 1.4rem;
  font-family: ${PIXEL_FONT};
  font-size: 2rem;
  line-height: 1.4;
  color: #fff;
  ${inkShadow(2)}
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0.6rem;
    width: 24px;
    height: 36px;
    z-index: -1;
    background: ${tail('#a8233c', false)} center / 100% 100% no-repeat;
  }
  &::before {
    left: -27px;
  }
  &::after {
    right: -27px;
    background-image: ${tail('#a8233c', true)};
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.4rem;
    padding: 0.4rem 0.8rem;
  }
`;
const bannerMissCls = css`
  ${frame(BLUE, 3)}
  &::before {
    background-image: ${tail('#2a5fb0', false)};
  }
  &::after {
    background-image: ${tail('#2a5fb0', true)};
  }
`;

const sparkleCls = css`
  position: absolute;
  z-index: 1;
  opacity: 0;
  animation: questSparkle 0.7s ease-out 2 both;
  @keyframes questSparkle {
    0% {
      opacity: 0;
      transform: scale(0.3) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.1) rotate(45deg);
    }
    100% {
      opacity: 0;
      transform: scale(0.4) rotate(90deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const marblesCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
`;
const popCls = css`
  display: inline-flex;
  animation: questMarblePop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  @keyframes questMarblePop {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
const spriteCls = css`
  image-rendering: pixelated;
`;

const scoreCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 4rem;
  line-height: 1.3;
  color: #ffcb32;
  ${inkShadow(3)}
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 3.2rem;
  }
`;
const scoreMissCls = css`
  color: #e6ebf5;
`;
const headCls = css`
  margin-top: 0.6rem;
  font-size: 1.8rem;
  font-weight: 800;
  color: ${INK};
`;
const lineCls = css`
  margin-top: 0.6rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #5b4026;
`;
const dailyCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
`;
const rewardCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1.2rem;
`;
const rewardTagCls = css`
  ${frame(TAG, 2)}
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.8rem;
  font-family: ${PIXEL_FONT};
  font-size: 1.2rem;
  line-height: 1.6;
  color: #8a5200;
`;
const noRewardCls = css`
  font-size: 1.4rem;
  font-weight: 800;
  color: #8a5a2b;
`;
const buttonsCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.6rem;
`;
const challengeOpenCls = css`
  ${challengeButton()}
  min-height: 5.2rem;
  padding: 0.6rem 1.4rem;
  font-size: 1.2rem;
`;
const challengeListCls = css`
  ${frame(PARCHMENT, 3)}
  width: min(100%, 52rem);
  max-height: 30vh;
  max-height: 30dvh;
  overflow-y: auto;
  margin-top: 1.2rem;
  padding: 0.6rem 0.8rem;
`;
const challengeItemCls = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0;
  & + & {
    border-top: 2px dashed rgba(26, 20, 38, 0.2);
  }
`;
const challengeTextCls = css`
  flex: 1;
  min-width: 0;
  font-size: 1.3rem;
  color: ${INK};
  text-align: left;
  overflow-wrap: anywhere;
`;
const challengeSmallCls = css`
  ${challengeButton()}
  flex: none;
  padding: 0.3rem 0.9rem;
  font-size: 1rem;
  min-height: 4.4rem;
  max-width: 14rem;
`;
const reviewSmallCls = css`
  ${challengeSmallCls}
  ${button(BLUE, '#2a5fb0', '#fff')}
`;
const checkedCls = css`
  margin-top: 0.6rem;
  font-weight: 700;
  font-size: 1.2rem;
  color: #425338;
`;
const primaryCls = css`
  ${button(GOLD, '#8a5200')}
  min-height: 5.2rem;
  min-width: 18rem;
  margin-bottom: 4px;
  padding: 0.6rem 1.8rem;
  font-size: 1.6rem;
  text-transform: uppercase;
`;
