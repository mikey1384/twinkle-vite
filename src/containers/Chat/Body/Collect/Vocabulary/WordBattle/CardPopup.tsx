import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { backdropUri, SHIELD, STAR, SWORD } from './art';
import { BattleEvent, cardBanner, cardTier } from './turns';

const PIXEL_FONT = "'Press Start 2P', monospace";

type CardEvent = Extract<BattleEvent, { kind: 'card' }>;

// An AI card the server picked for this turn (word battles v2, Mikey 11-24):
// it flies in, flips, glows in its rarity's colour and does its job: boosts
// a strike, or blocks, parries or counters an attack. Every animation runs
// once with steps() (light on phones), pauses while the tab is hidden, and
// shows its last frame under reduced motion. The member never picks a card.
export default function CardPopup({
  event,
  leaving,
  paused
}: {
  event: CardEvent;
  // The card slides away before the battle goes on.
  leaving: boolean;
  paused: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const { card } = event;
  const tier = cardTier(card);
  const quality = tier === 'black' ? 'black' : card.quality;
  const banner = cardBanner(event);
  const image =
    !imageFailed && card.imagePath
      ? /^(https?:|data:)/.test(card.imagePath)
        ? card.imagePath
        : `${cloudFrontURL}${card.imagePath}`
      : null;
  const level = Math.max(1, Math.min(6, Number(card.level) || 1));
  const special = quality === 'legendary' || quality === 'black';
  return (
    <div
      className={cx(stageCls, leaving && leavingCls, paused && pausedCls)}
      role="status"
      aria-label={banner.title}
    >
      <div className={cx(cardCls, cardShake(event.outcome === 'fail'))} style={cardVars(quality, level)}>
        <div className={cardInnerCls}>
          <div className={cx(faceCls, frontCls, quality === 'black' && blackFaceCls)}>
            <div className={artCls} style={{ backgroundImage: `url("${backdropUri(Math.min(5, level))}")` }}>
              {image ? (
                <img src={image} alt="" className={photoCls} onError={() => setImageFailed(true)} />
              ) : (
                <img src={STAR} alt="" className={emblemCls} />
              )}
            </div>
            <div className={plateCls}>{card.word.toUpperCase()}</div>
            <span className={qualityCls}>{quality === 'black' ? 'BLACK' : quality.toUpperCase()}</span>
          </div>
          <div className={cx(faceCls, backCls)} />
        </div>
        <div className={glowCls} />
        {special &&
          [
            [-12, 16],
            [112, 34],
            [-8, 124],
            [110, 146]
          ].map(([x, y], i) => (
            <img key={i} src={STAR} alt="" className={sparkleCls} style={{ left: x, top: y }} />
          ))}
      </div>
      <div className={bannerCls}>
        <img src={event.job === 'attack' ? SWORD : SHIELD} alt="" className={bannerIconCls} />
        <span>
          {banner.title}
          <span className={whyCls}>{banner.why}</span>
        </span>
      </div>
      {effectFor(event)}
    </div>
  );
}

function effectFor(event: CardEvent) {
  switch (event.outcome) {
    case 'block':
      return <div className={cx(burstCls, sideCls, whiteCls)}>BLOCKED!</div>;
    case 'parry':
      return (
        <>
          <div className={sparkCls}>
            <img src={STAR} alt="" />
          </div>
          <div className={cx(burstCls, sideCls)}>
            -{event.damage || 0}
            <span className={subCls}>PARRY!</span>
          </div>
        </>
      );
    case 'counter':
      return (
        <>
          <div className={beamCls} />
          <div className={cx(burstCls, sideCls, bigCls)}>
            -{event.damage || 0}
            <span className={subCls}>COUNTER!</span>
          </div>
        </>
      );
    case 'boost':
      return <div className={cx(burstCls, sideCls)}>POWER!</div>;
    default:
      return null;
  }
}

const QUALITY_COLOURS: Record<string, string> = {
  common: '#e8e4f4',
  superior: '#22c55e',
  rare: '#b14cff',
  elite: '#f06446',
  legendary: '#f2b632',
  black: '#9d8cff'
};
const LEVEL_COLOURS = ['#418ceb', '#ff69b4', '#ff8c00', '#df3296', '#c9971a', '#0a0f32'];

function cardVars(quality: string, level: number) {
  return {
    ['--qc' as any]: QUALITY_COLOURS[quality] || QUALITY_COLOURS.common,
    ['--lv' as any]: LEVEL_COLOURS[level - 1]
  } as React.CSSProperties;
}

const stageCls = css`
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 74px;
  gap: 10px;
  pointer-events: none;
  background: rgba(15, 11, 26, 0.55);
  @media (max-width: 480px) {
    padding-top: 70px;
    gap: 8px;
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-delay: 0ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;

const pausedCls = css`
  *,
  *::before,
  *::after {
    animation-play-state: paused !important;
  }
`;

const leavingCls = css`
  > div:first-child {
    animation: card-out 0.35s steps(4) 1 forwards !important;
  }
  > div:nth-child(2) {
    opacity: 0;
  }
  @keyframes card-out {
    100% {
      transform: translate(120px, 140px) scale(0.2);
      opacity: 0;
    }
  }
`;

const cardCls = css`
  position: relative;
  width: 132px;
  height: 184px;
  perspective: 700px;
  animation: card-in 0.45s steps(5) 1 both;
  @keyframes card-in {
    0% {
      transform: translateY(120px) scale(0.5);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }
  @media (max-width: 480px) {
    width: 104px;
    height: 146px;
  }
`;

function cardShake(on: boolean) {
  return on
    ? css`
        animation: card-in 0.45s steps(5) 1 both, card-wobble 0.4s steps(4) 1 1.1s;
        @keyframes card-wobble {
          25% {
            transform: translateX(-6px) rotate(-4deg);
          }
          75% {
            transform: translateX(6px) rotate(4deg);
          }
        }
      `
    : undefined;
}

const cardInnerCls = css`
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: card-flip 0.55s steps(6) 0.15s 1 both;
  @keyframes card-flip {
    0% {
      transform: rotateY(180deg);
    }
    100% {
      transform: rotateY(0);
    }
  }
`;

const faceCls = css`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border: 4px solid var(--lv);
  background: #111111;
`;

const frontCls = css`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const blackFaceCls = css`
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 5px #6a5cff;
`;

const backCls = css`
  transform: rotateY(180deg);
  background: #241b3d;
  display: flex;
  align-items: center;
  justify-content: center;
  &::after {
    content: '';
    width: 46px;
    height: 46px;
    border: 4px solid #ffffff;
    transform: rotate(45deg);
    box-shadow: 0 0 0 6px #241b3d, 0 0 0 9px #6d6290;
  }
`;

const artCls = css`
  flex: 1;
  position: relative;
  background-size: cover;
  background-position: center;
  image-rendering: pixelated;
  overflow: hidden;
`;

const photoCls = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const emblemCls = css`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 46%;
  transform: translate(-50%, -50%);
  image-rendering: pixelated;
`;

const plateCls = css`
  background: var(--lv);
  color: #ffffff;
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  text-align: center;
  padding: 6px 2px 5px;
  letter-spacing: 1px;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 480px) {
    font-size: 8px;
  }
`;

const qualityCls = css`
  position: absolute;
  top: 5px;
  left: 5px;
  font-family: ${PIXEL_FONT};
  font-size: 6px;
  padding: 3px 4px;
  background: rgba(15, 11, 26, 0.85);
  color: var(--qc);
  border: 1px solid var(--qc);
`;

// A fixed glow whose opacity pulses three times (cheaper than animating
// the shadow itself).
const glowCls = css`
  position: absolute;
  inset: -4px;
  pointer-events: none;
  box-shadow: 0 0 0 4px var(--qc), 0 0 26px 8px var(--qc);
  opacity: 0;
  animation: card-glow 0.5s steps(2) 0.7s 3 alternate both;
  @keyframes card-glow {
    0% {
      opacity: 0.35;
    }
    100% {
      opacity: 1;
    }
  }
`;

const sparkleCls = css`
  position: absolute;
  width: 14px;
  height: 14px;
  image-rendering: pixelated;
  animation: card-blink 0.4s steps(2) 0.8s 4 alternate both;
  @keyframes card-blink {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;

const bannerCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  line-height: 1.6;
  text-align: center;
  color: #ffffff;
  background: #0f0b1a;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 3px #0f0b1a;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 92%;
  animation: banner-in 0.3s steps(3) 0.6s 1 both;
  @keyframes banner-in {
    0% {
      transform: translateY(-10px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @media (max-width: 480px) {
    font-size: 8px;
  }
`;

const bannerIconCls = css`
  width: 22px;
  height: 22px;
  image-rendering: pixelated;
  flex: none;
`;

const whyCls = css`
  display: block;
  font-size: 8px;
  color: #8d84a8;
  margin-top: 3px;
  @media (max-width: 480px) {
    font-size: 7px;
  }
`;

const burstCls = css`
  position: absolute;
  font-family: ${PIXEL_FONT};
  font-size: 18px;
  color: #ffd34d;
  text-shadow: 3px 3px 0 #0f0b1a, -2px -2px 0 #0f0b1a;
  white-space: nowrap;
  animation: card-burst 0.8s steps(4) 1s 1 both;
  @keyframes card-burst {
    0% {
      transform: translate(-50%, 10px) scale(0.6);
      opacity: 0;
    }
    40% {
      transform: translate(-50%, -6px) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -24px) scale(1);
      opacity: 1;
    }
  }
`;

const sideCls = css`
  top: 30%;
  left: 80%;
  @media (max-width: 480px) {
    left: 76%;
    font-size: 14px;
  }
`;

const whiteCls = css`
  color: #ffffff;
`;

const bigCls = css`
  font-size: 24px;
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const subCls = css`
  display: block;
  font-size: 9px;
  text-align: center;
  margin-top: 6px;
  color: #ffffff;
`;

const sparkCls = css`
  position: absolute;
  left: 80%;
  top: 42%;
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%);
  animation: card-spark 0.5s steps(3) 0.9s 1 both;
  img {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  @keyframes card-spark {
    0% {
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 1;
    }
    60% {
      transform: translate(-50%, -50%) scale(1.3);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
  }
`;

const beamCls = css`
  position: absolute;
  left: calc(50% - 9px);
  width: 18px;
  bottom: 18%;
  height: 46%;
  background: #ffffff;
  box-shadow: 0 0 0 4px #b48cff, 0 0 0 8px #6a5cff;
  transform-origin: bottom;
  animation: card-beam 0.5s steps(4) 0.9s 1 both;
  @keyframes card-beam {
    0% {
      transform: scaleY(0);
      opacity: 1;
    }
    70% {
      transform: scaleY(1);
      opacity: 1;
    }
    100% {
      transform: scaleY(1);
      opacity: 0;
    }
  }
`;
