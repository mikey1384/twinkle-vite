import React, { useEffect, useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Loading from '~/components/Loading';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { GOLD, INK, PARCHMENT, PIXEL_FONT, WOOD, frame } from './Quest/pixelUi';
import { NEON, READ_FONT, rgba } from './ClassicArcade/theme';

// Grammarbles leaderboards, drawn in each game's look (Mikey 10-07: the old
// site list didn't fit the games). Classic ranks Grammarbles XP on neon glass;
// Quest ranks marble points (clear 1, shiny 2, gold 3 per grammar point) on a
// parchment board. The board fills the page; only its list scrolls.
export default function Rankings({
  rankingsTab,
  onSetRankingsTab,
  quest = false
}: {
  rankingsTab: string;
  onSetRankingsTab: (arg0: string) => void;
  quest?: boolean;
}) {
  const loadGrammarRankings = useAppContext((v) =>
    quest
      ? v.requestHelpers.loadGrammarQuestRankings
      : v.requestHelpers.loadGrammarRankings
  );
  const [loading, setLoading] = useState(true);
  const [allRanks, setAllRanks] = useState<any[]>([]);
  const [top30s, setTop30s] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const myId = useKeyContext((v) => v.myState.userId);
  const users = useMemo(
    () => (rankingsTab === 'all' && myRank ? allRanks : top30s),
    [allRanks, myRank, rankingsTab, top30s]
  );
  const target = quest ? 'marblePoints' : 'xpEarned';
  const unit = quest ? 'marble pts' : 'XP';
  const s = quest ? QUEST : CLASSIC;

  useEffect(() => {
    init();
    async function init() {
      try {
        const {
          all,
          top30s,
          myRank: loadedMyRank
        } = (await loadGrammarRankings()) || {};
        setMyRank(loadedMyRank || null);
        setAllRanks(all || []);
        setTop30s(top30s || []);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cx(boardCls, s.board)}>
      <div className={headCls}>
        <div className={cx(titleCls, s.title)}>
          {quest ? 'Marble Masters' : 'Leaderboard'}
        </div>
        {!!myRank && (
          <div className={togglesCls}>
            {[
              ['all', 'My ranking'],
              ['top30', 'Top 30']
            ].map(([key, label]) => (
              <button
                key={key}
                className={cx(s.toggle, rankingsTab === key && s.toggleOn)}
                onClick={() => onSetRankingsTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={listCls}>
        {loading ? (
          <Loading />
        ) : users.length ? (
          users.map((user) => {
            const rank = Number(user.rank) || null;
            const me = user.id === myId;
            return (
              <div
                key={user.id}
                className={cx(
                  rowCls,
                  s.row,
                  me && s.me,
                  !!rank && rank <= 3 && s.podium
                )}
              >
                <span
                  className={cx(
                    rankCls,
                    s.rank,
                    !!rank && rank <= 3 && MEDALS[rank - 1]
                  )}
                >
                  {rank || '–'}
                </span>
                <span className={picCls}>
                  <ProfilePic
                    style={{ width: '100%' }}
                    profilePicUrl={user.profilePicUrl}
                    userId={user.id}
                  />
                </span>
                <span className={nameCls}>
                  <UsernameText
                    color={quest ? INK : NEON.ink}
                    user={user}
                    className={cx(usernameCls, s.name)}
                    activityContext="grammar"
                    activityPoints={user[target] || 0}
                  />
                </span>
                <span className={cx(scoreCls, s.score)}>
                  {addCommasToNumber(Number(user[target]) || 0)}
                  <small> {unit}</small>
                </span>
              </div>
            );
          })
        ) : (
          <div className={cx(emptyCls, s.name)}>
            No one on the board yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}

const boardCls = css`
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;
const headCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 1rem 1.2rem 0.8rem;
`;
const titleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1.6rem;
  line-height: 1.4;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;
const togglesCls = css`
  display: flex;
  gap: 0.6rem;
`;
const listCls = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.2rem 1.2rem 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.2rem 0.7rem 0.8rem;
  }
`;
const rowCls = css`
  display: grid;
  grid-template-columns: 4.2rem 3.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  min-height: 5rem;
  padding: 0.5rem 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 3.4rem 3rem minmax(0, 1fr) auto;
    gap: 0.6rem;
    padding: 0.4rem 0.6rem;
  }
`;
const rankCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1.3rem;
  text-align: center;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;
const picCls = css`
  width: 3.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 3rem;
  }
`;
const nameCls = css`
  min-width: 0;
`;
const usernameCls = css`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.6rem;
  font-weight: 800;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.4rem;
  }
`;
const scoreCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1.2rem;
  white-space: nowrap;
  small {
    font-family: ${READ_FONT};
    font-size: 1.1rem;
    font-weight: 700;
    opacity: 0.8;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1rem;
  }
`;
const emptyCls = css`
  padding: 3rem 1rem;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
`;
// gold, silver, bronze
const MEDALS = [
  css`
    color: #ffd54a !important;
    text-shadow: 0 0 8px rgba(255, 213, 74, 0.7);
  `,
  css`
    color: #dfe6f2 !important;
    text-shadow: 0 0 8px rgba(223, 230, 242, 0.6);
  `,
  css`
    color: #ff9f5a !important;
    text-shadow: 0 0 8px rgba(255, 159, 90, 0.6);
  `
];

// Quest: a parchment board in a wooden frame
const QUEST = {
  board: css`
    ${frame(WOOD, 3)}
    background-clip: padding-box;
    padding: 0.4rem;
  `,
  title: css`
    color: #fff3d0;
    text-shadow: 2px 2px 0 ${INK};
  `,
  toggle: css`
    ${frame(PARCHMENT, 2)}
    padding: 0.5rem 1rem;
    font-family: ${PIXEL_FONT};
    font-size: 0.95rem;
    color: ${INK};
    cursor: pointer;
  `,
  toggleOn: css`
    ${frame(GOLD, 2)}
  `,
  row: css`
    ${frame(PARCHMENT, 2)}
    color: ${INK};
  `,
  me: css`
    ${frame(GOLD, 2)}
  `,
  podium: css``,
  rank: css`
    color: #6e3d1b;
  `,
  name: css`
    color: ${INK};
  `,
  score: css`
    color: #6e3d1b;
  `
};

// Classic: neon glass
const CLASSIC = {
  board: css`
    border-radius: 18px;
    background: linear-gradient(
      180deg,
      rgba(20, 22, 80, 0.75),
      rgba(10, 10, 46, 0.85)
    );
    border: 2px solid ${rgba(NEON.violetRgb, 0.5)};
    box-shadow:
      0 0 24px ${rgba(NEON.violetRgb, 0.25)},
      inset 0 0 30px rgba(0, 0, 0, 0.4);
  `,
  title: css`
    color: ${NEON.cyan};
    text-shadow: 0 0 10px ${rgba(NEON.cyanRgb, 0.7)};
  `,
  toggle: css`
    padding: 0.6rem 1.1rem;
    border-radius: 10px;
    font-family: ${PIXEL_FONT};
    font-size: 0.95rem;
    color: ${NEON.cyan};
    background: rgba(12, 14, 56, 0.9);
    border: 2px solid ${rgba(NEON.cyanRgb, 0.5)};
    cursor: pointer;
  `,
  toggleOn: css`
    color: ${NEON.navy};
    background: ${NEON.cyan};
    box-shadow: 0 0 12px ${rgba(NEON.cyanRgb, 0.7)};
  `,
  row: css`
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid ${rgba(NEON.violetRgb, 0.3)};
    color: ${NEON.ink};
  `,
  me: css`
    background: ${rgba(NEON.cyanRgb, 0.14)};
    border-color: ${NEON.cyan};
    box-shadow: 0 0 12px ${rgba(NEON.cyanRgb, 0.4)};
  `,
  podium: css`
    border-color: ${rgba(NEON.goldRgb, 0.55)};
  `,
  rank: css`
    color: ${NEON.inkSoft};
  `,
  name: css`
    color: ${NEON.ink};
  `,
  score: css`
    color: ${NEON.gold};
    text-shadow: 0 0 8px ${rgba(NEON.goldRgb, 0.5)};
  `
};
