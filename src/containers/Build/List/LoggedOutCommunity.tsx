import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import ProjectListItem, {
  type BuildProjectListItemData
} from '~/components/Build/ProjectListItem';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import type { BuildStudioBrowseMode } from '~/contexts/Build/reducer';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';
import TabFilter from '../TabFilter';
import { buildBrowseModeTabs } from './constants/tabs';
import {
  getBuildScrollAnchorId,
  getPublicBuildSort,
  getLoadMoreToken
} from './helpers';
import { getBuildListTabPath } from './helpers/url';
import {
  buildPageTopGap,
  mobileBottomNavClearance
} from './constants/layout';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const pageClass = css`
  width: 100%;
  max-width: 980px;
  box-sizing: border-box;
  margin: ${buildPageTopGap} auto 0;
  padding: 0 2rem 3rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem ${mobileBottomNavClearance};
  }
`;

const heroClass = css`
  margin-bottom: 1.4rem;
  padding: 1.8rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fafbff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const heroTitleClass = css`
  margin: 0 0 0.4rem;
  font-size: 2rem;
  color: var(--chat-text);
  font-family: ${displayFontFamily};
  font-weight: 900;
  line-height: 1.1;
`;

const heroBodyClass = css`
  margin: 0;
  font-size: 1.15rem;
  color: var(--chat-text);
  opacity: 0.86;
  line-height: 1.5;
`;

const heroActionClass = css`
  flex-shrink: 0;
`;

const browseModeFilterWrapClass = css`
  margin-bottom: 1rem;
`;

const buildGridClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const emptyStateClass = css`
  padding: 2.2rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fafbff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
`;

const emptyTitleClass = css`
  margin: 0 0 0.6rem;
  font-size: 2rem;
  color: var(--chat-text);
  font-family: ${displayFontFamily};
  font-weight: 900;
  line-height: 1.1;
`;

const emptyBodyClass = css`
  margin: 0;
  font-size: 1.25rem;
  color: var(--chat-text);
  opacity: 0.86;
  line-height: 1.5;
`;

const loadMoreWrapClass = css`
  margin-top: 1.6rem;
  display: flex;
  justify-content: center;
`;

export default function LoggedOutCommunity({
  browseMode
}: {
  browseMode: BuildStudioBrowseMode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const loadPublicBuilds = useAppContext(
    (v) => v.requestHelpers.loadPublicBuilds
  );
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const [builds, setBuilds] = useState<BuildProjectListItemData[]>([]);
  const [loadMoreToken, setLoadMoreToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Which browseMode the current `builds` belong to. `loading` alone leaves a
  // one-render stale window on mode switches (it only flips in the passive
  // load effect, after the restoration layout effect has already run against
  // the previous mode's list), so restoration readiness must compare modes.
  const [loadedBrowseMode, setLoadedBrowseMode] =
    useState<BuildStudioBrowseMode | null>(null);
  const loadingMoreRef = useRef(false);
  const buildListRef = useRef<HTMLDivElement | null>(null);

  useScrollAnchorRestoration({
    anchorKey: `/build:loggedout:${browseMode}`,
    containerRef: buildListRef,
    initialScroll: { type: 'top' },
    itemsReady:
      !loading && builds.length > 0 && loadedBrowseMode === browseMode
  });
  // Bumped on every browseMode (re)load so an in-flight load-more from a
  // previous sort can detect it is stale and skip appending.
  const requestIdRef = useRef(0);

  const runtimeBackTo = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    let canceled = false;
    requestIdRef.current += 1;
    setLoading(true);
    handleLoad();

    async function handleLoad() {
      try {
        const data = await loadPublicBuilds({
          sort: getPublicBuildSort('community', browseMode),
          scope: 'all'
        });
        if (!canceled) {
          setBuilds((data?.builds || []) as BuildProjectListItemData[]);
          setLoadMoreToken(getLoadMoreToken(data));
        }
      } catch (error) {
        console.error('Failed to load community builds:', error);
        if (!canceled) {
          setBuilds([]);
          setLoadMoreToken(null);
        }
      } finally {
        if (!canceled) {
          setLoadedBrowseMode(browseMode);
          setLoading(false);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // loadPublicBuilds is a stable request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browseMode]);

  return (
    <div className={pageClass}>
      <div className={heroClass}>
        <div>
          <h1 className={heroTitleClass}>Community Builds</h1>
          <p className={heroBodyClass}>
            Apps published by the Twinkle community. Log in to build your own
            with Lumine.
          </p>
        </div>
        <div className={heroActionClass}>
          <Button
            variant="soft"
            tone="raised"
            color="green"
            size="lg"
            uppercase={false}
            onClick={onOpenSigninModal}
          >
            Log In
          </Button>
        </div>
      </div>

      <div className={browseModeFilterWrapClass}>
        <TabFilter
          activeTab={browseMode}
          density="compact"
          onChange={handleBrowseModeChange}
          tabs={buildBrowseModeTabs}
        />
      </div>

      {loading ? (
        <Loading text="Loading builds..." />
      ) : builds.length === 0 ? (
        <div className={emptyStateClass}>
          <h2 className={emptyTitleClass}>No Community Builds Yet</h2>
          <p className={emptyBodyClass}>
            Check back soon — published community apps will show up here.
          </p>
        </div>
      ) : (
        <>
          <div ref={buildListRef} className={buildGridClass}>
            {builds.map((build) => (
              <div
                key={build.id}
                data-scroll-anchor-id={getBuildScrollAnchorId(build)}
                data-scroll-anchor-secondary-id={String(build.id)}
                data-scroll-anchor-content-key={`build:${build.id}`}
              >
                <ProjectListItem
                  build={build}
                  to={`/app/${build.id}`}
                  navigationState={{
                    runtimeBackTo,
                    runtimeBackLabel: 'Back to Community Builds'
                  }}
                  updatedAtSource="publicVersion"
                  showCollaborationRequestAction={false}
                  showFavoriteAction={false}
                  showVisibilityBadge={false}
                />
              </div>
            ))}
          </div>
          {loadMoreToken ? (
            <div className={loadMoreWrapClass}>
              <LoadMoreButton
                loading={loadingMore}
                onClick={handleLoadMore}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  function handleBrowseModeChange(nextBrowseMode: BuildStudioBrowseMode) {
    if (nextBrowseMode === browseMode) return;
    navigate(getBuildListTabPath('community', nextBrowseMode));
  }

  async function handleLoadMore() {
    if (loadingMoreRef.current || !loadMoreToken) return;
    const requestId = requestIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const params: {
        sort: 'recent' | 'popular' | 'forks';
        scope: 'all';
        cursor?: string;
        lastId?: number;
      } = {
        sort: getPublicBuildSort('community', browseMode),
        scope: 'all'
      };
      if (/^\d+$/.test(loadMoreToken)) {
        params.lastId = Number(loadMoreToken);
      } else {
        params.cursor = loadMoreToken;
      }
      const data = await loadPublicBuilds(params);
      // Bail if the browseMode changed while this request was in flight, so
      // we don't append a previous sort's results or clobber the new cursor.
      if (requestIdRef.current !== requestId) return;
      setBuilds((currentBuilds) => [
        ...currentBuilds,
        ...((data?.builds || []) as BuildProjectListItemData[])
      ]);
      setLoadMoreToken(getLoadMoreToken(data));
    } catch (error) {
      console.error('Failed to load more community builds:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }
}
