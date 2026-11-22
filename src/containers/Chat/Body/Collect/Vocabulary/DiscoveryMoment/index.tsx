import React, { useEffect, useMemo, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { WordMasterLevelBadge } from '~/components/WordMasterBadges';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Definition from '../Definition';
import RobotWorkshop, { CheeringRobots, Sparkle } from './RobotWorkshop';
import StreamScroll from './StreamScroll';
import { LetterTiles, LevelStars, getWordLevelColor } from './WordTiles';

// The moment a member discovers a new word (Mikey 11-22): while POST /word
// registers it and the AI writes its definitions (5-8 s, sometimes more),
// Twinkle's robots are visibly at work and the definition streams onto the
// writer robot's scroll; then the celebration and the reveal. Collecting an
// existing word never shows this.
//
// Built from parts the coming word battle reuses (DESIGN in
// work/word-quest-design-20261122): LetterTiles + LevelStars for "A wild
// <word> appears!", Robot/Sparkle for its art, and this card's shell.

export type DiscoveryPhase = 'working' | 'discovered' | 'beaten';

export interface WordDiscovery {
  word: string;
  wordLevel: number;
  phase: DiscoveryPhase;
  startedAt: number;
  // The definition lines streamed while the AI writes them.
  streamText: string;
  streamComplete: boolean;
  // Another member is registering the same word right now.
  racing: boolean;
}

// The shortest the workshop shows before the reveal, so a fast discovery
// still reads as a moment rather than a flash.
export const DISCOVERY_MIN_WORKING_MS = 1300;

const EXTRA_STATUS_LINES = [
  'Polishing every word',
  'Double-checking the meaning',
  'Almost there'
];

export function getDiscoveryStatusLine(
  elapsedMs: number,
  discovery: Pick<WordDiscovery, 'racing' | 'streamText' | 'streamComplete'>
) {
  if (discovery.racing) {
    return 'Another explorer found this word at the same moment. Checking who was first';
  }
  if (discovery.streamComplete) return "Filing it in Twinkle's word vault";
  if (discovery.streamText) return 'Writing the definition';
  if (elapsedMs < 1500) return "Checking Twinkle's dictionary";
  if (elapsedMs < 3200) return 'Stamping it NEW';
  if (elapsedMs < 9000) return 'Writing the definition';
  return EXTRA_STATUS_LINES[
    Math.floor((elapsedMs - 9000) / 3000) % EXTRA_STATUS_LINES.length
  ];
}

const cardIn = keyframes`
  0% { opacity: 0; transform: translate(-50%, 1.5rem) scale(0.94); }
  100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
`;
const headlineIn = keyframes`
  0% { opacity: 0; transform: scale(0.4); }
  60% { opacity: 1; transform: scale(1.12); }
  100% { opacity: 1; transform: scale(1); }
`;
const riseIn = keyframes`
  0% { opacity: 0; transform: translateY(0.8rem); }
  100% { opacity: 1; transform: translateY(0); }
`;
const dots = keyframes`
  0%, 20% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
`;
const burst = keyframes`
  0% { opacity: 1; transform: translate(0, 0) scale(0.3) rotate(0deg); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1) rotate(160deg); }
`;

const BURST = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  const reach = index % 2 ? 9 : 13;
  return {
    dx: `${Math.cos(angle) * reach * 1.6}rem`,
    dy: `${Math.sin(angle) * reach * 0.7}rem`,
    color: [Color.gold(), Color.logoBlue(), Color.pink(), Color.orange()][
      index % 4
    ],
    size: index % 3 ? '1.8rem' : '2.6rem'
  };
});

export default function DiscoveryMoment({
  discovery,
  wordObj,
  myUserId,
  onDone
}: {
  discovery: WordDiscovery;
  // The word as Word Master's state knows it; the registration feed fills in
  // the stored definitions, level, rewards and discoverer.
  wordObj?: any;
  myUserId?: number;
  onDone: () => void;
}) {
  const { word, phase } = discovery;
  const working = phase === 'working';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!working) return;
    const timer = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(timer);
  }, [working]);

  const registerFeed = wordObj?.action === 'register' ? wordObj : null;
  const myFeed = registerFeed && registerFeed.userId === myUserId;
  const level = Number(registerFeed?.wordLevel) || discovery.wordLevel || 3;
  const levelColor = getWordLevelColor(level);
  const winnerName =
    phase === 'beaten' && registerFeed && !myFeed
      ? registerFeed.username
      : null;
  const storedDefinitionsShown = useMemo(
    () =>
      !!registerFeed &&
      Object.values(registerFeed).some(
        (value) =>
          Array.isArray(value) &&
          value.some((item: any) => item && typeof item.definition === 'string')
      ),
    [registerFeed]
  );
  const statusLine = getDiscoveryStatusLine(
    now - discovery.startedAt,
    discovery
  );

  return (
    <div
      role="status"
      className={css`
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 0);
        z-index: 2;
        width: 90%;
        max-width: 600px;
        max-height: calc(100vh - 19rem);
        overflow-x: hidden;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8rem;
        padding: 1.6rem 2rem 1.8rem;
        background: ${Color.white()};
        border-radius: 1rem;
        border-top: 0.5rem solid ${levelColor};
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16);
        animation: ${cardIn} 320ms cubic-bezier(0.2, 1, 0.4, 1) both;
        @media (max-width: ${mobileMaxWidth}) {
          width: 94%;
          padding: 1.2rem 1.2rem 1.4rem;
          gap: 0.6rem;
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `}
    >
      {working ? (
        <div
          className={css`
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          `}
        >
          <PixelChip color={Color.gold()} textColor="rgb(110, 70, 0)">
            NEW WORD
          </PixelChip>
          <LevelBlock level={level} />
        </div>
      ) : (
        <Headline
          text={phase === 'discovered' ? 'NEW WORD DISCOVERED!' : 'SO CLOSE!'}
          color={phase === 'discovered' ? Color.orange() : Color.logoBlue()}
        />
      )}

      <div
        className={css`
          position: relative;
          width: 100%;
        `}
      >
        <LetterTiles
          word={word}
          level={level}
          mode={
            working
              ? 'assembling'
              : phase === 'discovered'
                ? 'celebrating'
                : 'resting'
          }
        />
        {phase === 'discovered' && <Burst />}
      </div>

      {working ? (
        <>
          <RobotWorkshop word={word} level={level} />
          <StreamScroll
            text={discovery.streamText}
            writing={!discovery.streamComplete}
          />
          <div
            aria-live="polite"
            className={css`
              display: flex;
              align-items: center;
              gap: 0.6rem;
              min-height: 2.4rem;
              font-size: 1.5rem;
              font-weight: 700;
              color: ${Color.darkGray()};
              text-align: center;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
          >
            <span key={statusLine} className={rise(0)}>
              {statusLine}
            </span>
            <span
              aria-hidden="true"
              className={css`
                white-space: nowrap;
              `}
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className={css`
                    animation: ${dots} 1.2s ease-in-out ${dot * 0.2}s infinite;
                    @media (prefers-reduced-motion: reduce) {
                      animation: none;
                    }
                  `}
                >
                  .
                </span>
              ))}
            </span>
          </div>
        </>
      ) : (
        <>
          <div
            className={`${rise(100)} ${css`
              font-size: 1.8rem;
              line-height: 1.4;
              text-align: center;
              color: ${Color.darkerGray()};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}`}
          >
            {phase === 'discovered' ? (
              <>
                You&apos;re the first on Twinkle to find <b>{word}</b>!
              </>
            ) : (
              <>
                {winnerName ? <b>{winnerName}</b> : 'Another explorer'}{' '}
                discovered <b>{word}</b> moments before you.
              </>
            )}
          </div>
          <div
            className={`${rise(180)} ${css`
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
              gap: 0.8rem;
            `}`}
          >
            <LevelBlock level={level} delayMs={300} />
            {myFeed && phase === 'discovered' && (
              <>
                {Number(registerFeed.xpReward) > 0 && (
                  <RewardChip
                    color={Color.logoBlue()}
                    label={`+${addCommasToNumber(registerFeed.xpReward)} XP`}
                  />
                )}
                {Number(registerFeed.coinReward) > 0 && (
                  <RewardChip
                    color={Color.orange()}
                    icon="coins"
                    label={`+${addCommasToNumber(registerFeed.coinReward)}`}
                  />
                )}
              </>
            )}
          </div>
          {storedDefinitionsShown ? (
            <div
              className={`${rise(260)} ${css`
                width: 100%;
                font-size: 1.5rem;
                border-radius: 0.8rem;
                background: ${Color.highlightGray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.3rem;
                }
              `}`}
            >
              <Definition wordObj={registerFeed} isNewWord />
            </div>
          ) : discovery.streamComplete && discovery.streamText ? (
            <div
              className={`${rise(260)} ${css`
                width: 100%;
              `}`}
            >
              <StreamScroll text={discovery.streamText} writing={false} />
            </div>
          ) : null}
          <div
            className={`${rise(340)} ${css`
              display: flex;
              width: 100%;
              align-items: flex-end;
              justify-content: space-between;
              gap: 1rem;
              margin-top: 0.4rem;
              @media (max-width: ${mobileMaxWidth}) {
                svg {
                  width: 11rem;
                }
              }
            `}`}
          >
            {phase === 'discovered' ? <CheeringRobots /> : <span />}
            <Button variant="solid" color="logoBlue" onClick={onDone}>
              Keep collecting
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function rise(delayMs: number) {
  return css`
    animation: ${riseIn} 420ms ease-out ${delayMs}ms both;
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `;
}

function PixelChip({
  children,
  color,
  textColor
}: {
  children: React.ReactNode;
  color: string;
  textColor: string;
}) {
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        font-family: 'Press Start 2P', monospace;
        font-size: 1.1rem;
        line-height: 1;
        padding: 0.7rem 1rem;
        border-radius: 0.6rem;
        background: ${color};
        color: ${textColor};
        box-shadow: 0 0.3rem 0 rgba(0, 0, 0, 0.15);
        animation: ${headlineIn} 480ms cubic-bezier(0.2, 1.3, 0.4, 1) both;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 0.9rem;
          padding: 0.6rem 0.8rem;
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `}
    >
      <Sparkle size="1.2em" color={textColor} />
      {children}
    </span>
  );
}

function Headline({ text, color }: { text: string; color: string }) {
  return (
    <div
      className={css`
        font-family: 'Press Start 2P', monospace;
        font-size: 2.2rem;
        line-height: 1.4;
        text-align: center;
        color: ${color};
        text-shadow: 0 0.3rem 0 rgba(0, 0, 0, 0.12);
        animation: ${headlineIn} 560ms cubic-bezier(0.2, 1.3, 0.4, 1) both;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.5rem;
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `}
    >
      {text}
    </div>
  );
}

function LevelBlock({
  level,
  delayMs = 0
}: {
  level: number;
  delayMs?: number;
}) {
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
      `}
    >
      <LevelStars level={level} delayMs={delayMs} />
      <WordMasterLevelBadge level={level} />
    </span>
  );
}

function RewardChip({
  color,
  label,
  icon
}: {
  color: string;
  label: string;
  icon?: any;
}) {
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.9rem;
        border-radius: 1rem;
        font-size: 1.3rem;
        font-weight: 800;
        color: ${color};
        background: ${Color.white()};
        border: 0.15rem solid ${color};
      `}
    >
      {icon && <Icon icon={icon} />}
      {label}
    </span>
  );
}

function Burst() {
  return (
    <div
      aria-hidden="true"
      className={css`
        position: absolute;
        left: 50%;
        top: 50%;
        width: 0;
        height: 0;
        pointer-events: none;
        z-index: 1;
        @media (prefers-reduced-motion: reduce) {
          display: none;
        }
      `}
    >
      {BURST.map(({ dx, dy, color, size }, index) => (
        <span
          key={index}
          style={{ '--dx': dx, '--dy': dy } as React.CSSProperties}
          className={css`
            position: absolute;
            left: -0.7rem;
            top: -0.7rem;
            width: ${size};
            height: ${size};
            animation: ${burst} 900ms cubic-bezier(0.1, 0.8, 0.3, 1)
              ${index * 25}ms both;
          `}
        >
          <Sparkle size="100%" color={color} />
        </span>
      ))}
    </div>
  );
}
