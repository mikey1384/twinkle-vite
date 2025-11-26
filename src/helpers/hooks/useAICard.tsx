import { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  cardLevelHash,
  cardProps,
  qualityProps
} from '~/constants/defaultValues';
import holoUrl from './holo.webp';
import sparklesUrl from './sparkles.gif';

// Rainbow gradient colors
const color1 = '#ec9bb6';
const color2 = '#ccac6f';
const color3 = '#69e4a5';
const color4 = '#8ec5d6';
const color5 = '#b98cce';

export default function useAICard(card: any) {
  const {
    memoizedCardQuality,
    memoizedQualityProps,
    cardColor,
    promptText,
    engine
  } = useMemo(() => {
    const mq = cardProps[card?.quality] || [];
    const mp = qualityProps[card?.quality] || {};

    const cardObj: any = card?.level ? cardLevelHash[card.level] : {};
    const derivedColor = Color[card?.isBurned ? 'black' : cardObj.color]?.();

    function getPromptText(prompt = '', word = '', colorStr = '') {
      if (!word) return prompt;
      const regex = new RegExp(word, 'gi');
      return prompt.replace(regex, (matched) => {
        return `<b style="color:${Color[colorStr]?.()}">${matched}</b>`;
      });
    }
    const finalPromptText = card?.word
      ? getPromptText(card?.prompt, card?.word, cardObj.color)
      : card?.prompt || '';
    const finalEngine = card?.engine || 'DALL-E 2';

    return {
      memoizedCardQuality: mq,
      memoizedQualityProps: mp,
      cardColor: derivedColor,
      promptText: finalPromptText,
      engine: finalEngine
    };
  }, [
    card?.quality,
    card?.level,
    card?.prompt,
    card?.word,
    card?.isBurned,
    card?.engine
  ]);

  if (!card) return {};

  const isGlowy = memoizedCardQuality.includes('glowy') && !card.isBurned;
  const isGlossy = memoizedCardQuality.includes('glossy') && !card.isBurned;
  const isGrad = memoizedCardQuality.includes('grad') && !card.isBurned;
  const isSparky = memoizedCardQuality.includes('sparky') && !card.isBurned;
  const isPrism = memoizedCardQuality.includes('prism') && !card.isBurned;
  // Quality color for glow (green for superior, purple for rare, etc.)
  const qualityColor = memoizedQualityProps.color || cardColor;

  return {
    promptText,
    cardColor,
    engine,
    cardCss: css`
      .card {
        will-change: transform, opacity, filter;
        transform: translateZ(0);
        touch-action: pan-y;
        position: relative;
        overflow: hidden;
        border-radius: 5% / 3.5%;
        transform-origin: center;

        /* Base shadow - varies by quality */
        box-shadow: ${
          isPrism
            ? `0px 0px 7px ${qualityColor},
               0px 0px 10px ${qualityColor},
               0 0 12px ${qualityColor},
               0 0 15px ${qualityColor},
               0 0 7px 2px rgba(255, 255, 255, 0.3),
               0 35px 28px -22px rgba(15, 23, 42, 0.35)`
            : isGlowy
            ? `0px 0px 7px ${qualityColor},
               0px 0px 7px ${qualityColor},
               0 0 7px ${qualityColor},
               0 0 7px ${qualityColor},
               0 0 7px 2px rgba(255, 255, 255, 0.3),
               0 35px 28px -22px rgba(15, 23, 42, 0.35)`
            : `-5px -5px 5px -5px ${cardColor},
               3px 3px 3px -3px ${cardColor},
               -5px -5px 7px -3px transparent,
               5px 5px 7px -3px transparent,
               0 0 3px 0px rgba(255, 255, 255, 0),
               0 24px 22px -18px rgba(15, 23, 42, 0.35)`
        };

        background-color: ${cardColor};

        /* Smooth transitions */
        transition:
          transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
          box-shadow 0.2s ease;

        /* Hover: lift + enhanced glow */
        &:hover {
          transform: translateY(-6px);
          ${
            isPrism
              ? `box-shadow:
                  -20px -20px 30px -25px ${qualityColor},
                  20px 20px 30px -25px ${qualityColor},
                  -7px -7px 10px -5px ${qualityColor},
                  7px 7px 10px -5px ${qualityColor},
                  0 0 20px 6px ${qualityColor},
                  0 55px 35px -30px rgba(15, 23, 42, 0.5);`
              : isGlowy
              ? `box-shadow:
                  -20px -20px 30px -25px ${qualityColor},
                  20px 20px 30px -25px ${qualityColor},
                  -7px -7px 10px -5px ${qualityColor},
                  7px 7px 10px -5px ${qualityColor},
                  0 0 13px 4px rgba(255, 255, 255, 0.3),
                  0 55px 35px -30px rgba(15, 23, 42, 0.5);`
              : `box-shadow:
                  -8px -8px 15px -10px ${cardColor},
                  8px 8px 15px -10px ${cardColor},
                  0 45px 30px -25px rgba(0, 0, 0, 0.4);`
          }
          ${
            isGrad
              ? `background-image: linear-gradient(
                   115deg,
                   transparent 20%,
                   ${color1} 36%,
                   ${color2} 43%,
                   ${color3} 50%,
                   ${color4} 57%,
                   ${color5} 64%,
                   transparent 80%
                 );`
              : ''
          }
        }

        /* Shine layer (::before) */
        &:before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
          background-repeat: no-repeat;
          background-position: 50% 50%;
          background-size: 300% 300%;
          opacity: 0.5;
          mix-blend-mode: color-dodge;
          transition: all 0.33s ease;
          pointer-events: none;
          z-index: 2;
          ${
            !card.isBurned
              ? `background-image: linear-gradient(
                   115deg,
                   transparent 0%,
                   ${color1} 25%,
                   transparent 47%,
                   transparent 53%,
                   ${cardColor} 75%,
                   transparent 100%
                 );`
              : ''
          }
          ${card.isBurned ? 'opacity: 1;' : 'filter: brightness(0.5) contrast(1);'}
          ${isGlossy ? 'transition: none; animation: gloss 7s ease-in-out infinite;' : ''}
        }

        /* Sparkle/holo layer (::after) - now pure CSS! */
        &:after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
          opacity: 0;
          mix-blend-mode: color-dodge;
          transition: all 0.33s ease;
          pointer-events: none;
          z-index: 3;
        }

        ${
          isPrism
            ? `
          &:after {
            background-image:
              /* Prismatic light refraction - diagonal bands */
              linear-gradient(
                45deg,
                transparent 0%,
                rgba(255, 0, 0, 0.15) 10%,
                rgba(255, 165, 0, 0.15) 20%,
                rgba(255, 255, 0, 0.15) 30%,
                rgba(0, 255, 0, 0.15) 40%,
                rgba(0, 127, 255, 0.15) 50%,
                rgba(75, 0, 130, 0.15) 60%,
                rgba(148, 0, 211, 0.15) 70%,
                transparent 80%,
                transparent 100%
              ),
              /* Crystalline shimmer */
              conic-gradient(
                from 0deg at 50% 50%,
                #ff000070 0deg, #ff880070 30deg, #ffff0070 60deg,
                #00ff0070 90deg, #00ffff70 120deg, #0088ff70 150deg,
                #0000ff70 180deg, #8800ff70 210deg, #ff00ff70 240deg,
                #ff008870 270deg, #ff000070 300deg, #ff880070 330deg, #ff000070 360deg
              ),
              url(${sparklesUrl}),
              url(${holoUrl}),
              /* Rainbow gradient */
              linear-gradient(
                125deg,
                #ff008460 15%,
                #fca40050 30%,
                #ffff0040 40%,
                #00ff8a30 60%,
                #00cfff50 70%,
                #cc4cfa60 85%
              );
            background-position: 50% 50%;
            background-size: 300% 300%, 150% 150%, 160%, 160%, 100% 100%;
            background-blend-mode: overlay;
            filter: brightness(1) contrast(1) saturate(1.1);
            transition: all 0.33s ease;
            animation: holoRainbow 8s linear infinite, prismShift 12s ease-in-out infinite;
            opacity: 0.8;
          }
        `
            : isSparky
            ? `
          &:after {
            background-image:
              conic-gradient(
                from 0deg at 50% 50%,
                #ff000060 0deg, #ff880060 30deg, #ffff0060 60deg,
                #00ff0060 90deg, #00ffff60 120deg, #0088ff60 150deg,
                #0000ff60 180deg, #8800ff60 210deg, #ff00ff60 240deg,
                #ff008860 270deg, #ff000060 300deg, #ff880060 330deg, #ff000060 360deg
              ),
              url(${sparklesUrl}),
              url(${holoUrl}),
              linear-gradient(
                125deg,
                #ff008450 15%,
                #fca40040 30%,
                #ffff0030 40%,
                #00ff8a20 60%,
                #00cfff40 70%,
                #cc4cfa50 85%
              );
            background-position: 50% 50%;
            background-size: 150% 150%, 160%, 160%, 100% 100%;
            background-blend-mode: overlay;
            filter: brightness(1) contrast(1);
            transition: all 0.33s ease;
            animation: holoRainbow 8s linear infinite;
            opacity: 0.75;
          }
        `
            : ''
        }

        &:hover:after {
          ${isPrism ? 'filter: brightness(1.1) contrast(1.1) saturate(1.2);' : !card.isBurned ? 'filter: brightness(1) contrast(1);' : ''}
          opacity: 1;
        }

        &:hover:before {
          animation: none;
          ${
            isGrad
              ? `background-image: linear-gradient(
                   110deg,
                   transparent 25%,
                   ${color1} 48%,
                   ${cardColor} 52%,
                   transparent 75%
                 );`
              : ''
          }
          background-position: 50% 50%;
          background-size: 250% 250%;
          opacity: 0.88;
          ${!card.isBurned ? 'filter: brightness(0.66) contrast(1.33);' : ''}
          transition: none;
        }

        &:hover:before,
        &:hover:after {
          animation: none;
        }

        /* Idle animation class */
        &.animated {
          transition: none;
          animation: holoCard 12s ease 0s 1;
          &:before {
            transition: none;
            animation: holoGradient 12s ease 0s 1;
          }
          &:after {
            transition: none;
            animation: holoSparkle 12s ease 0s 1${isPrism ? ', prismShift 12s ease-in-out infinite' : ''};
          }
        }

        /* Card dimensions */
        width: clamp(12.9vw, 32vh, 30vw);
        height: clamp(20vw, 46vh, 42vw);
        @media (max-width: ${mobileMaxWidth}) {
          width: clamp(25vw, 16vh, 35vw);
          height: clamp(30vw, 25vh, 50vw);
        }
      }

      /* Sparkle idle animation */
      @keyframes holoSparkle {
        0%, 100% {
          opacity: 0.75;
          background-position: 50% 50%;
          filter: brightness(1.2) contrast(1.25);
        }
        5%, 8% {
          opacity: 1;
          background-position: 40% 40%;
          filter: brightness(0.8) contrast(1.2);
        }
        13%, 16% {
          opacity: 0.5;
          background-position: 50% 50%;
          filter: brightness(1.2) contrast(0.8);
        }
        35%, 38% {
          opacity: 1;
          background-position: 60% 60%;
          filter: brightness(1) contrast(1);
        }
        55% {
          opacity: 0.33;
          background-position: 45% 45%;
          filter: brightness(1.2) contrast(1.25);
        }
      }

      /* Glossy shine animation */
      @keyframes gloss {
        0%, 100% {
          background-position: 0% 50%;
          opacity: 0.4;
        }
        50% {
          background-position: 100% 50%;
          opacity: 0.7;
        }
      }

      /* Holographic rainbow rotation */
      @keyframes holoRainbow {
        0% {
          filter: brightness(1) contrast(1) hue-rotate(0deg);
        }
        100% {
          filter: brightness(1) contrast(1) hue-rotate(360deg);
        }
      }

      /* Gradient idle animation */
      @keyframes holoGradient {
        0%, 100% {
          opacity: 0.5;
          background-position: 50% 50%;
          filter: brightness(0.5) contrast(1);
        }
        5%, 9% {
          background-position: 100% 100%;
          opacity: 1;
          filter: brightness(0.75) contrast(1.25);
        }
        13%, 17% {
          background-position: 0% 0%;
          opacity: 0.88;
        }
        35%, 39% {
          background-position: 100% 100%;
          opacity: 1;
          filter: brightness(0.5) contrast(1);
        }
        55% {
          background-position: 0% 0%;
          opacity: 1;
          filter: brightness(0.75) contrast(1.25);
        }
      }

      /* Card rotation idle animation */
      @keyframes holoCard {
        0%, 100% {
          transform: rotateZ(0deg) rotateX(0deg) rotateY(0deg);
        }
        5%, 8% {
          transform: rotateZ(0deg) rotateX(6deg) rotateY(-20deg);
        }
        13%, 16% {
          transform: rotateZ(0deg) rotateX(-9deg) rotateY(32deg);
        }
        35%, 38% {
          transform: rotateZ(3deg) rotateX(12deg) rotateY(20deg);
        }
        55% {
          transform: rotateZ(-3deg) rotateX(-12deg) rotateY(-27deg);
        }
      }

      /* Prism shift animation - diagonal light band movement */
      @keyframes prismShift {
        0%, 100% {
          background-position: 0% 0%, 50% 50%, 50% 50%, 50% 50%, 50% 50%;
        }
        50% {
          background-position: 100% 100%, 50% 50%, 50% 50%, 50% 50%, 50% 50%;
        }
      }
    `
  };
}
