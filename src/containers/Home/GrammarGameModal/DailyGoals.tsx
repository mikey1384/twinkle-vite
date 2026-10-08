import React from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useNotiContext } from '~/contexts';
import Icon from '~/components/Icon';
import { NEON, PIXEL_FONT, READ_FONT, rgba } from './ClassicArcade/theme';
import { GOLD, INK, PARCHMENT, PLATE, frame } from './Quest/pixelUi';

// Grammarbles' own Basic / Excellence board (Mikey 10-07: a layout made for
// the game, not the site's daily-task strip). Each goal has two routes —
// Classic's and Quest's — and either one meets it.
//   Basic: clear today's Classic level, or in Quest clear a stop at 70%+
//   accuracy or beat a boss (a B average).
//   Excellence: Classic's target (your usual score or the next level), or in
//   Quest clear a stop with no misses or beat a boss with an A average.
// Quest's route is how well you play, not how far you get (Mikey 10-07).
export default function DailyGoals({
  look,
  status: statusProp,
  className
}: {
  look: 'classic' | 'quest';
  status?: any;
  className?: string;
}) {
  const fromStats = useNotiContext(
    (v) => v.state.todayStats?.dailyTaskStatus?.grammarbles
  );
  const status = statusProp || fromStats;
  const s = look === 'quest' ? QUEST : CLASSIC;
  if (!status) return null;
  const level = Math.max(1, Number(status.currentLevel) || 1);
  const goals = [
    {
      key: 'basic',
      icon: 'check',
      name: 'Basic',
      met: !!status.basicQualified,
      via: status.basicVia as string | null,
      classic: `Clear Lv${level}`,
      // the map's letters (Mikey 10-07): B = 70%, A = 90%, S = 100%; only on
      // nodes that count today, which the map marks (Mikey 10-08: the bar
      // rises with the learner, questMap.goalFloor)
      quest: 'B or better on a stop or boss that counts today'
    },
    {
      key: 'excellence',
      icon: 'star',
      name: 'Excellence',
      met: !!status.excellenceQualified,
      via: status.excellenceVia as string | null,
      classic: classicExcellenceTarget(status),
      quest: 'S on a stop or A+ on a boss that counts today'
    }
  ];
  return (
    <div className={cx(boardCls, s.board, className)}>
      <div className={cx(headCls, s.head)}>Today&apos;s goals</div>
      {goals.map((goal) => (
        <div key={goal.key} className={rowCls}>
          <div className={cx(goalCls, s.goal, goal.met && s.goalMet)}>
            <span className={cx(dotCls, s.dot, goal.met && s.dotMet)}>
              <Icon icon={goal.icon} />
            </span>
            {goal.name}
          </div>
          <div className={routesCls}>
            {(['classic', 'quest'] as const).map((route) => (
              <div
                key={route}
                className={cx(
                  routeCls,
                  s.route,
                  goal.met && goal.via === route && s.routeMet,
                  goal.met && goal.via !== route && s.routeIdle
                )}
              >
                <span className={cx(routeNameCls, s.routeName)}>
                  {route === 'classic' ? 'Classic' : 'Quest'}
                </span>
                <span className={routeTextCls}>
                  {goal.met && goal.via === route
                    ? 'Done!'
                    : route === 'classic'
                      ? goal.classic
                      : goal.quest}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Classic's Excellence target, short (the modes the server returns)
function classicExcellenceTarget(status: any) {
  const level = Math.max(1, Number(status.currentLevel) || 1);
  const cap = Number(status.levelCap) || 5;
  const score =
    typeof status.comparisonScore === 'number'
      ? ` ${status.comparisonScore.toLocaleString('en-US')}`
      : '';
  switch (status.excellenceMode) {
    case 'score-or-next-level':
      // usual = the median of the last 7 days played at this level (Mikey 10-08)
      return `Beat your usual${score} or clear Lv${level + 1}`;
    case 'total-score':
      return `Beat your usual Lv${cap} total${score}`;
    case 'all-perfect':
      return `All ${cap} levels perfect`;
    case 'score':
      return `Beat yesterday's${score}`;
    case 'next-level':
      return `Clear Lv${Math.min(level + 1, cap)}`;
    case 'baseline':
      return level >= cap ? `Clear all ${cap} levels` : `Clear Lv${level + 1}`;
    default:
      return 'Not available today';
  }
}

const boardCls = css`
  width: 100%;
  max-width: 46rem;
  padding: 1rem 1.2rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.8rem 0.8rem 0.9rem;
    gap: 0.5rem;
  }
`;
const headCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1.1rem;
  line-height: 1.4;
  text-align: center;
`;
const rowCls = css`
  display: grid;
  grid-template-columns: 10.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 8.6rem minmax(0, 1fr);
    gap: 0.5rem;
  }
`;
const goalCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font: 800 1.4rem ${READ_FONT};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.25rem;
    gap: 0.4rem;
  }
`;
const dotCls = css`
  flex: none;
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 1.1rem;
`;
const routesCls = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`;
const routeCls = css`
  min-width: 0;
  padding: 0.45rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;
const routeNameCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 0.75rem;
  line-height: 1.5;
  letter-spacing: 0.04em;
`;
const routeTextCls = css`
  font: 700 1.2rem/1.3 ${READ_FONT};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;

// Classic: neon glass
const CLASSIC = {
  board: css`
    border-radius: 16px;
    background: linear-gradient(
      180deg,
      rgba(20, 26, 84, 0.82),
      rgba(10, 12, 48, 0.9)
    );
    border: 2px solid ${rgba(NEON.cyanRgb, 0.5)};
    box-shadow:
      0 0 18px ${rgba(NEON.cyanRgb, 0.22)},
      inset 0 0 24px rgba(0, 0, 0, 0.45);
    color: ${NEON.ink};
  `,
  head: css`
    color: ${NEON.cyan};
    text-shadow: 0 0 8px ${rgba(NEON.cyanRgb, 0.7)};
  `,
  goal: css`
    color: ${NEON.inkSoft};
  `,
  goalMet: css`
    color: ${NEON.ink};
  `,
  dot: css`
    color: ${NEON.inkSoft};
    border: 2px solid ${rgba(NEON.violetRgb, 0.55)};
    background: rgba(255, 255, 255, 0.05);
  `,
  dotMet: css`
    color: ${NEON.navy};
    border-color: ${NEON.green};
    background: ${NEON.green};
    box-shadow: 0 0 10px ${rgba(NEON.greenRgb, 0.7)};
  `,
  route: css`
    border-radius: 10px;
    background: rgba(10, 12, 46, 0.7);
    border: 1px solid ${rgba(NEON.violetRgb, 0.4)};
    color: ${NEON.ink};
  `,
  routeMet: css`
    border-color: ${NEON.green};
    background: ${rgba(NEON.greenRgb, 0.16)};
    box-shadow: 0 0 10px ${rgba(NEON.greenRgb, 0.4)};
  `,
  routeIdle: css`
    opacity: 0.45;
  `,
  routeName: css`
    color: ${NEON.cyan};
  `
};

// Quest: pixel plates
const QUEST = {
  board: css`
    ${frame(PLATE, 2)}
    color: #fff3d0;
  `,
  head: css`
    color: #fff3d0;
  `,
  goal: css`
    color: #e6dcc0;
  `,
  goalMet: css`
    color: #fff3d0;
  `,
  dot: css`
    ${frame(PLATE, 1)}
    color: #c9bfa3;
    border-radius: 0;
  `,
  dotMet: css`
    ${frame(GOLD, 1)}
    color: ${INK};
  `,
  route: css`
    ${frame(PARCHMENT, 1)}
    color: ${INK};
  `,
  routeMet: css`
    ${frame(GOLD, 1)}
  `,
  routeIdle: css`
    opacity: 0.5;
  `,
  routeName: css`
    color: #6e3d1b;
  `
};
