import React, { useEffect, useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { ARENA } from '../theme';

// AI Story's leaderboard in Arena's look (Mikey 10-24, as Grammarbles drew
// its boards in its own look): one paper board, ink header with the My
// ranking / Top 30 switch, podium colors for the top three. Same data as
// before (AI Story XP); only the list scrolls.
export default function Rankings({
  rankingsTab,
  onSetUsermenuShown,
  onSetRankingsTab
}: {
  rankingsTab: string;
  onSetUsermenuShown: (shown: boolean) => void;
  onSetRankingsTab: (tab: string) => void;
}) {
  const loadAIStoryRankings = useAppContext(
    (v) => v.requestHelpers.loadAIStoryRankings
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

  useEffect(() => {
    init();
    async function init() {
      try {
        const {
          all,
          top30s,
          myRank: loadedMyRank
        } = (await loadAIStoryRankings()) || {};
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
    <div className={wrapCls}>
      <div className={boardCls}>
        <div className={headCls}>
          <span className={titleCls}>Leaderboard</span>
          {!!myRank && (
            <div className={togglesCls}>
              {[
                ['all', 'My ranking'],
                ['top30', 'Top 30']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={cx(toggleCls, rankingsTab === key && toggleOnCls)}
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
            <div className={loadingCls}>
              <Icon icon="spinner" pulse /> Loading the board
            </div>
          ) : users.length ? (
            users.map((user) => {
              const rank = Number(user.rank) || null;
              const me = user.id === myId;
              return (
                <div
                  key={user.id}
                  className={cx(
                    rowCls,
                    !!rank && rank <= 3 && PODIUM[rank - 1],
                    me && meCls
                  )}
                >
                  <span className={rankCls}>{rank || '–'}</span>
                  <span className={picCls}>
                    <ProfilePic
                      style={{ width: '100%' }}
                      profilePicUrl={user.profilePicUrl}
                      userId={user.id}
                    />
                  </span>
                  <span className={nameCls}>
                    <UsernameText
                      color={ARENA.ink}
                      user={user}
                      className={usernameCls}
                      onMenuShownChange={onSetUsermenuShown}
                      activityContext="aiStories"
                      activityPoints={user.xpEarned || 0}
                    />
                  </span>
                  <span className={scoreCls}>
                    {addCommasToNumber(Number(user.xpEarned) || 0)}
                    <small> XP</small>
                  </span>
                </div>
              );
            })
          ) : (
            <div className={emptyCls}>
              No one on the board yet. Be the first!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const wrapCls = css`
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  justify-content: center;
  padding: 1.6rem 2rem 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem;
  }
`;

const boardCls = css`
  width: 100%;
  max-width: 56rem;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  overflow: hidden;
`;

const headCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.9rem 1.2rem;
  background: ${ARENA.ink};
  border-bottom: 3px solid ${ARENA.line};
`;

const titleCls = css`
  color: #fff;
  font-size: 1.8rem;
  font-weight: 900;
`;

const togglesCls = css`
  display: flex;
  gap: 0.6rem;
`;

const toggleCls = css`
  padding: 0.3rem 1rem;
  border: 2px solid #fff;
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
`;

const toggleOnCls = css`
  background: #fff;
  color: ${ARENA.ink};
`;

const listCls = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const rowCls = css`
  display: grid;
  grid-template-columns: 3.4rem 3.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.2rem;
  border-bottom: 2px dashed ${ARENA.inkSoft};
  &:last-child {
    border-bottom: none;
  }
`;

const PODIUM = ['#ffe08a', '#e6e9ef', '#f6c9a4'].map(
  (color) => css`
    background: ${color};
    > span:first-child {
      background: ${ARENA.ink};
      color: #fff;
    }
  `
);

const meCls = css`
  box-shadow: inset 5px 0 0 ${ARENA.train};
  background: #eaf6ee;
`;

const rankCls = css`
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${ARENA.line};
  border-radius: 50%;
  background: ${ARENA.paper};
  font-size: 1.3rem;
  font-weight: 900;
`;

const picCls = css`
  width: 3.6rem;
  display: inline-flex;
`;

const nameCls = css`
  min-width: 0;
`;

const usernameCls = css`
  font-size: 1.5rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const scoreCls = css`
  font-size: 1.5rem;
  font-weight: 900;
  white-space: nowrap;
  small {
    font-size: 1.1rem;
    color: ${ARENA.inkSoft};
  }
`;

const emptyCls = css`
  padding: 3rem 1.2rem;
  text-align: center;
  font-size: 1.5rem;
  color: ${ARENA.inkSoft};
`;

const loadingCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1.2rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: ${ARENA.inkSoft};
`;
