import React from 'react';
import Bubble from './Bubble';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function ProgressBar({
  isOnStreak,
  isCompleted,
  questions,
  selectedIndex,
  style
}: {
  isOnStreak: boolean;
  isCompleted: boolean;
  questions: any[];
  selectedIndex: number;
  style: React.CSSProperties;
}) {
  const roleS = useRoleColor('grammarGameScoreS', { fallback: 'gold' });
  const roleA = useRoleColor('grammarGameScoreA', { fallback: 'magenta' });
  const roleB = useRoleColor('grammarGameScoreB', { fallback: 'orange' });
  const roleC = useRoleColor('grammarGameScoreC', { fallback: 'pink' });
  const roleD = useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' });
  const roleF = useRoleColor('grammarGameScoreF', { fallback: 'gray' });

  const colorS = (opacity?: number) =>
    roleS.getColor(opacity) || Color.gold(opacity ?? 1);
  const colorA = (opacity?: number) =>
    roleA.getColor(opacity) || Color.magenta(opacity ?? 1);
  const colorB = (opacity?: number) =>
    roleB.getColor(opacity) || Color.orange(opacity ?? 1);
  const colorC = (opacity?: number) =>
    roleC.getColor(opacity) || Color.pink(opacity ?? 1);
  const colorD = (opacity?: number) =>
    roleD.getColor(opacity) || Color.logoBlue(opacity ?? 1);
  const colorF = (opacity?: number) =>
    roleF.getColor(opacity) || Color.gray(opacity ?? 1);

  const className = css`
    .waving {
      animation: wave ease-in-out;
      animation-duration: 200ms;
    }
    .ball {
      display: inline-block;
      width: 100%;
      height: 100%;
      border-radius: 100%;
      position: relative;
      background: radial-gradient(
        #81e8f6,
        #76deef 10%,
        #055194 80%,
        #062745 100%
      );
    }

    .ball:after {
      content: '';
      position: absolute;
      top: 5%;
      left: 10%;
      width: 80%;
      height: 80%;
      border-radius: 100%;
      -webkit-filter: blur(1px);
      filter: blur(1px);
      z-index: 2;
      -webkit-transform: rotateZ(-30deg);
      transform: rotateZ(-30deg);
    }

    .gloss {
      background: radial-gradient(
        rgba(240, 245, 255, 0.9),
        rgba(240, 245, 255, 0.9) 40%,
        rgba(225, 238, 255, 0.8) 60%,
        rgba(43, 130, 255, 0.4)
      );
    }

    .gradedS {
      background: radial-gradient(
        ${colorS(0.9)},
        ${colorS(0.9)} 40%,
        ${colorS(0.8)} 60%,
        rgba(143, 130, 255, 0.4)
      );
    }

    .streak {
      background: linear-gradient(
        -45deg,
        ${colorS()},
        ${colorA()},
        ${colorB()},
        ${colorC()}
      );
      background-size: 200% 200%;
      animation: Gradient ${selectedIndex === 9 ? 0.3 : 1}s ease infinite;
    }

    .gradedA {
      background: radial-gradient(
        ${colorA(0.9)},
        ${colorA(0.9)} 40%,
        ${colorA(0.8)} 60%,
        rgba(143, 130, 255, 0.4)
      );
    }

    .gradedB {
      background: radial-gradient(
        ${colorB(0.9)},
        ${colorB(0.9)} 40%,
        ${colorB(0.8)} 60%,
        rgba(143, 130, 255, 0.4)
      );
    }

    .gradedC {
      background: radial-gradient(
        ${colorC(0.9)},
        ${colorC(0.9)} 40%,
        ${colorC(0.8)} 60%,
        rgba(143, 130, 255, 0.4)
      );
    }

    .gradedD {
      background: radial-gradient(
        ${colorD(0.9)},
        ${colorD(0.9)} 40%,
        ${colorD(0.8)} 60%,
        rgba(143, 130, 255, 0.4)
      );
    }

    .gradedF {
      background: radial-gradient(
        ${colorF(0.9)},
        ${colorF(0.9)} 40%,
        ${colorF(0.8)} 60%,
        rgba(143, 130, 255, 0.4)
      );
    }

    .gloss:after {
      display: block;
      background: radial-gradient(
        circle at 50% 80%,
        rgba(255, 255, 255, 0),
        rgba(255, 255, 255, 0) 74%,
        white 80%,
        white 84%,
        rgba(255, 255, 255, 0) 100%
      );
    }

    .gloss {
      width: 50px;
      height: 50px;
      display: inline-block;
      @media (max-width: ${mobileMaxWidth}) {
        margin-top: 2rem;
        width: 30px;
        height: 30px;
      }
    }
  `;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      {questions.map((question, index) => {
        return (
          <Bubble
            key={index}
            index={index}
            isOnStreak={isOnStreak}
            isCompleted={isCompleted}
            question={question}
            style={{
              marginLeft: index === 0 ? 0 : '-1rem',
              zIndex: 10 - index
            }}
          />
        );
      })}
    </div>
  );
}
