import { useEffect, useRef, useState } from 'react';
import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';
import { useAppContext } from '~/contexts';
import { getLoadMoreToken } from '../helpers';
import type { PublicBuildSort } from '../types';

export default function useGlobalBuildSearch({
  searchQuery,
  sort,
  owner = '',
  userId
}: {
  searchQuery: string;
  sort: PublicBuildSort;
  owner?: string;
  userId: number | null;
}) {
  const loadPublicBuilds = useAppContext(
    (v) => v.requestHelpers.loadPublicBuilds
  );
  const loadCollaboratingBuilds = useAppContext(
    (v) => v.requestHelpers.loadCollaboratingBuilds
  );
  const [publicBuilds, setPublicBuilds] = useState<BuildProjectListItemData[]>(
    []
  );
  const [publicLoadMoreToken, setPublicLoadMoreToken] = useState<
    string | null
  >(null);
  const [teamBuilds, setTeamBuilds] = useState<BuildProjectListItemData[]>([]);
  const [teamLoadMoreToken, setTeamLoadMoreToken] = useState<string | null>(
    null
  );
  const [searching, setSearching] = useState(false);
  const [loadingMorePublic, setLoadingMorePublic] = useState(false);
  const [loadingMoreTeam, setLoadingMoreTeam] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if ((!searchQuery && !owner) || !userId) {
      requestIdRef.current += 1;
      setPublicBuilds([]);
      setTeamBuilds([]);
      setPublicLoadMoreToken(null);
      setTeamLoadMoreToken(null);
      setSearching(false);
      setLoadingMorePublic(false);
      setLoadingMoreTeam(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setSearching(true);
    // Clear superseded state up front: stale results must not render under
    // the new query, stale cursors must not feed its load-more requests, and
    // invalidated in-flight load-more requests skip their own flag reset.
    setPublicBuilds([]);
    setTeamBuilds([]);
    setPublicLoadMoreToken(null);
    setTeamLoadMoreToken(null);
    setLoadingMorePublic(false);
    setLoadingMoreTeam(false);
    void handleSearch();

    async function handleSearch() {
      try {
        // With an owner filter, results are that user's public builds: the
        // viewer's own builds must not be excluded (the owner may be the
        // viewer), and the viewer-scoped team-builds search does not apply.
        const [publicData, teamData] = await Promise.all([
          loadPublicBuilds({
            sort,
            scope: 'all',
            excludeMine: !owner,
            search: searchQuery,
            owner
          }),
          owner ? Promise.resolve(null) : loadCollaboratingBuilds({ search: searchQuery })
        ]);
        if (requestId !== requestIdRef.current) return;
        setPublicBuilds(publicData?.builds || []);
        setPublicLoadMoreToken(getLoadMoreToken(publicData));
        setTeamBuilds(teamData?.builds || []);
        setTeamLoadMoreToken(getLoadMoreToken(teamData));
      } catch (error) {
        console.error('Failed to search builds:', error);
        if (requestId !== requestIdRef.current) return;
        setPublicBuilds([]);
        setTeamBuilds([]);
        setPublicLoadMoreToken(null);
        setTeamLoadMoreToken(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setSearching(false);
        }
      }
    }
    // Request helpers are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sort, owner, userId]);

  return {
    loadingMorePublic,
    loadingMoreTeam,
    publicBuilds,
    publicHasMore: Boolean(publicLoadMoreToken),
    searching,
    teamBuilds,
    teamHasMore: Boolean(teamLoadMoreToken),
    onLoadMorePublic: handleLoadMorePublic,
    onLoadMoreTeam: handleLoadMoreTeam
  };

  async function handleLoadMorePublic() {
    if (!publicLoadMoreToken || loadingMorePublic) return;
    const requestId = requestIdRef.current;
    setLoadingMorePublic(true);
    try {
      const data = await loadPublicBuilds({
        sort,
        scope: 'all',
        excludeMine: !owner,
        search: searchQuery,
        owner,
        ...(/^\d+$/.test(publicLoadMoreToken)
          ? { lastId: Number(publicLoadMoreToken) }
          : { cursor: publicLoadMoreToken })
      });
      if (requestId !== requestIdRef.current) return;
      setPublicBuilds((currentBuilds) =>
        appendUniqueBuilds(currentBuilds, data?.builds || [])
      );
      setPublicLoadMoreToken(getLoadMoreToken(data));
    } catch (error) {
      console.error('Failed to load more search results:', error);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMorePublic(false);
      }
    }
  }

  async function handleLoadMoreTeam() {
    if (!teamLoadMoreToken || loadingMoreTeam) return;
    const requestId = requestIdRef.current;
    setLoadingMoreTeam(true);
    try {
      const data = await loadCollaboratingBuilds({
        search: searchQuery,
        cursor: teamLoadMoreToken
      });
      if (requestId !== requestIdRef.current) return;
      setTeamBuilds((currentBuilds) =>
        appendUniqueBuilds(currentBuilds, data?.builds || [])
      );
      setTeamLoadMoreToken(getLoadMoreToken(data));
    } catch (error) {
      console.error('Failed to load more team search results:', error);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMoreTeam(false);
      }
    }
  }
}

function appendUniqueBuilds(
  currentBuilds: BuildProjectListItemData[],
  newBuilds: BuildProjectListItemData[]
) {
  const seenIds = new Set(currentBuilds.map((build) => Number(build.id)));
  return [
    ...currentBuilds,
    ...newBuilds.filter((build) => !seenIds.has(Number(build.id)))
  ];
}
