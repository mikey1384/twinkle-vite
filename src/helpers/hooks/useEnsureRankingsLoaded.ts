import { useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';

interface RankingsResponse {
  all: object[];
  top30s: object[];
  allMonthly: object[];
  top30sMonthly: object[];
  myMonthlyRank: number;
  myAllTimeRank: number;
  myAllTimeXP: number;
  myMonthlyXP: number;
}

let activeRankingsRequestKey = '';
let activeRankingsRequest: Promise<RankingsResponse> | null = null;

export default function useEnsureRankingsLoaded({
  enabled = true
}: { enabled?: boolean } = {}) {
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleXP = useKeyContext((v) => v.myState.twinkleXP);
  const rankingsLoaded = useNotiContext((v) => v.state.rankingsLoaded);
  const rankingsTwinkleXP = useNotiContext((v) => v.state.rankingsTwinkleXP);
  const rankingsUserId = useNotiContext((v) => v.state.rankingsUserId);
  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const [loading, setLoading] = useState(false);
  const loadRef = useRef(0);
  const rankingsAreCurrent = Boolean(
    userId &&
      typeof twinkleXP === 'number' &&
      rankingsLoaded &&
      rankingsUserId === userId &&
      rankingsTwinkleXP === twinkleXP
  );

  useEffect(() => {
    if (
      !enabled ||
      !userId ||
      typeof twinkleXP !== 'number' ||
      rankingsAreCurrent
    ) {
      return;
    }

    const loadId = loadRef.current + 1;
    const requestKey = `${userId}:${twinkleXP}`;
    loadRef.current = loadId;
    setLoading(true);
    handleLoadRankings();

    async function handleLoadRankings() {
      try {
        const {
          all,
          top30s,
          allMonthly,
          top30sMonthly,
          myMonthlyRank,
          myAllTimeRank,
          myAllTimeXP,
          myMonthlyXP
        } = await loadRankingsForKey(requestKey, loadRankings);
        if (loadRef.current !== loadId) return;
        onGetRanks({
          all,
          top30s,
          allMonthly,
          top30sMonthly,
          myMonthlyRank,
          myAllTimeRank,
          myAllTimeXP,
          myMonthlyXP,
          rankingsTwinkleXP: twinkleXP,
          userId
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (loadRef.current === loadId) {
          setLoading(false);
        }
      }
    }

    return () => {
      loadRef.current += 1;
    };
    // loadRankings and onGetRanks are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, twinkleXP, rankingsAreCurrent]);

  useEffect(() => {
    if (!enabled || rankingsAreCurrent) {
      setLoading(false);
    }
  }, [enabled, rankingsAreCurrent]);

  return { loading, rankingsAreCurrent };
}

function loadRankingsForKey(
  requestKey: string,
  loadRankings: () => Promise<RankingsResponse>
) {
  if (activeRankingsRequest && activeRankingsRequestKey === requestKey) {
    return activeRankingsRequest;
  }

  activeRankingsRequestKey = requestKey;
  activeRankingsRequest = loadRankings().finally(() => {
    if (activeRankingsRequestKey === requestKey) {
      activeRankingsRequest = null;
      activeRankingsRequestKey = '';
    }
  });
  return activeRankingsRequest;
}
