import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { EarnHubEarner, EarnHubStandings } from '../Bounties/useEarnHub';

interface PageState {
  source: EarnHubStandings;
  entries: EarnHubEarner[];
  nextCursor: string | null;
  loading: boolean;
  error: boolean;
}

export function useEarnStandings(
  source: EarnHubStandings | undefined,
  refreshing: boolean,
  enabled: boolean
) {
  const loadRewardEarnStandings = useAppContext(
    (v) => v.requestHelpers.loadRewardEarnStandings
  );
  const [state, setState] = useState<PageState | null>(null);
  const request = useRef({ sequence: 0 });
  const inFlight = useRef(false);
  const currentSource = useRef(source);
  currentSource.current = enabled && !refreshing ? source : undefined;
  const page = state?.source === source ? state : null;
  useEffect(() => {
    const lifecycle = request.current;
    lifecycle.sequence++;
    inFlight.current = false;
    setState(null);
    return () => {
      lifecycle.sequence++;
    };
  }, [source, enabled, refreshing]);
  return {
    entries: page?.entries || source?.entries || [],
    nextCursor: page ? page.nextCursor : source?.nextCursor || null,
    loadingMore: !!page?.loading,
    error: !!page?.error,
    loadMore
  };

  async function loadMore() {
    const cursor = page ? page.nextCursor : source?.nextCursor;
    if (!source || !enabled || refreshing || inFlight.current || !cursor)
      return;
    const sequence = ++request.current.sequence;
    const previous = page?.entries || source.entries;
    inFlight.current = true;
    setState({
      source,
      entries: previous,
      nextCursor: cursor,
      loading: true,
      error: false
    });
    try {
      const next = await loadRewardEarnStandings({
        period: source.period,
        cursor
      });
      if (
        request.current.sequence !== sequence ||
        currentSource.current !== source
      )
        return;
      if (
        !next ||
        next.period !== source.period ||
        !Array.isArray(next.entries)
      ) {
        throw new Error('Standings could not be loaded.');
      }
      const seen = new Set(previous.map((row) => row.userId));
      setState({
        source,
        entries: [
          ...previous,
          ...next.entries.filter((row: EarnHubEarner) => !seen.has(row.userId))
        ],
        nextCursor: next.nextCursor || null,
        loading: false,
        error: false
      });
    } catch {
      if (
        request.current.sequence === sequence &&
        currentSource.current === source
      ) {
        setState({
          source,
          entries: previous,
          nextCursor: cursor,
          loading: false,
          error: true
        });
      }
    } finally {
      if (request.current.sequence === sequence) inFlight.current = false;
    }
  }
}
