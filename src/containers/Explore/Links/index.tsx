import React, { useEffect, useRef, useState } from 'react';
import AddLinkModal from './AddLinkModal';
import Button from '~/components/Button';
import SectionPanel from '~/components/SectionPanel';
import LinkGroup from './LinkGroup';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const addLinkLabel = localize('addLink');
const allLinksLabel = localize('allLinks');
const madeByUsersLabel = localize('madeByUsers');
const noUploadedLinksLabel = localize('noLinks');
const recommendedLabel = localize('recommendedLinks');

export default function Links() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadByUserUploads = useAppContext(
    (v) => v.requestHelpers.loadByUserUploads
  );
  const loadRecommendedUploads = useAppContext(
    (v) => v.requestHelpers.loadRecommendedUploads
  );
  const loadUploads = useAppContext((v) => v.requestHelpers.loadUploads);
  const byUserLoaded = useExploreContext((v) => v.state.links.byUserLoaded);
  const byUserLinks = useExploreContext((v) => v.state.links.byUserLinks);
  const loadMoreByUserLinksButtonShown = useExploreContext(
    (v) => v.state.links.loadMoreByUserLinksButtonShown
  );
  const recommendedsLoaded = useExploreContext(
    (v) => v.state.links.recommendedsLoaded
  );
  const recommendeds = useExploreContext((v) => v.state.links.recommendeds);
  const loadMoreRecommendedsButtonShown = useExploreContext(
    (v) => v.state.links.loadMoreRecommendedsButtonShown
  );
  const loaded = useExploreContext((v) => v.state.links.loaded);
  const links = useExploreContext((v) => v.state.links.links);
  const loadMoreLinksButtonShown = useExploreContext(
    (v) => v.state.links.loadMoreLinksButtonShown
  );
  const prevUserId = useExploreContext((v) => v.state.prevUserId);
  const onLoadByUserLinks = useExploreContext(
    (v) => v.actions.onLoadByUserLinks
  );
  const onLoadMoreByUserLinks = useExploreContext(
    (v) => v.actions.onLoadMoreByUserLinks
  );
  const onLoadLinks = useExploreContext((v) => v.actions.onLoadLinks);
  const onLoadMoreLinks = useExploreContext((v) => v.actions.onLoadMoreLinks);
  const onLoadRecommendedLinks = useExploreContext(
    (v) => v.actions.onLoadRecommendedLinks
  );
  const onLoadMoreRecommendedLinks = useExploreContext(
    (v) => v.actions.onLoadMoreRecommendedLinks
  );

  const [addLinkModalShown, setAddLinkModalShown] = useState(false);
  const lastId = useRef(null);
  const lastByUserId = useRef(null);
  const lastRecommendedId = useRef(null);
  const lastRecommendedTime = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (recommendeds.length > 0) {
      lastRecommendedId.current = recommendeds[recommendeds.length - 1].feedId;
      lastRecommendedTime.current =
        recommendeds[recommendeds.length - 1].lastInteraction;
    }
  }, [recommendeds]);

  useEffect(() => {
    if (links.length > 0) {
      lastId.current = links[links.length - 1].id;
    }
  }, [links]);

  useEffect(() => {
    if (byUserLinks.length > 0) {
      lastByUserId.current = byUserLinks[byUserLinks.length - 1].id;
    }
  }, [byUserLinks]);

  useEffect(() => {
    init();
    async function init() {
      if (!loaded || prevUserId !== userId) {
        handleLoadLinksMadeByUsers();
        handleLoadRecommendedLinks();
        handleLoadLinks();
      }
    }

    async function handleLoadLinksMadeByUsers() {
      const { results, loadMoreButton } = await loadByUserUploads({
        contentType: 'url',
        limit: 1
      });
      onLoadByUserLinks({
        links: results,
        loadMoreButton
      });
    }

    async function handleLoadRecommendedLinks() {
      const {
        results: recommendedLinks,
        loadMoreButton: loadMoreRecommendsButton
      } = await loadRecommendedUploads({
        contentType: 'url',
        limit: 5
      });
      onLoadRecommendedLinks({
        links: recommendedLinks,
        loadMoreButton: loadMoreRecommendsButton
      });
    }

    async function handleLoadLinks() {
      const { results: links, loadMoreButton } = await loadUploads({
        contentType: 'url',
        limit: 10
      });

      onLoadLinks({ links, loadMoreButton });
      loadedRef.current = true;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, prevUserId, userId]);

  return (
    <ErrorBoundary componentPath="Explore/Links">
      <div>
        <SectionPanel
          title={madeByUsersLabel}
          emptyMessage="No User Made Content"
          isEmpty={byUserLinks.length === 0}
          loaded={byUserLoaded}
          onLoadMore={handleLoadMoreByUserLinks}
          loadMoreButtonShown={loadMoreByUserLinksButtonShown}
        >
          <LinkGroup links={byUserLinks} />
        </SectionPanel>
        <SectionPanel
          title={recommendedLabel}
          style={{ marginTop: '2.5rem' }}
          emptyMessage="No Recommended Links"
          isEmpty={recommendeds.length === 0}
          loaded={recommendedsLoaded}
          onLoadMore={handleLoadMoreRecommendeds}
          loadMoreButtonShown={loadMoreRecommendedsButtonShown}
        >
          <LinkGroup links={recommendeds} />
        </SectionPanel>
        <SectionPanel
          title={allLinksLabel}
          style={{ marginTop: '2.5rem' }}
          button={
            <Button
              skeuomorphic
              color="darkerGray"
              onClick={() => setAddLinkModalShown(true)}
            >
              + {addLinkLabel}
            </Button>
          }
          emptyMessage={noUploadedLinksLabel}
          isEmpty={links.length === 0}
          loaded={loaded || loadedRef.current}
          onLoadMore={handleLoadMoreLinks}
          loadMoreButtonShown={loadMoreLinksButtonShown}
        >
          <LinkGroup links={links} />
        </SectionPanel>
        {addLinkModalShown && (
          <AddLinkModal onHide={() => setAddLinkModalShown(false)} />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleLoadMoreByUserLinks() {
    const { results, loadMoreButton } = await loadByUserUploads({
      contentType: 'url',
      limit: 10,
      lastId: lastByUserId.current
    });
    onLoadMoreByUserLinks({ links: results, loadMoreButton });
  }

  async function handleLoadMoreRecommendeds() {
    const { results, loadMoreButton } = await loadRecommendedUploads({
      contentType: 'url',
      limit: 10,
      lastRecommendationId: lastRecommendedId.current,
      lastInteraction: lastRecommendedTime.current
    });
    onLoadMoreRecommendedLinks({ links: results, loadMoreButton });
  }

  async function handleLoadMoreLinks() {
    const { results: links, loadMoreButton } = await loadUploads({
      contentType: 'url',
      limit: 10,
      contentId: lastId.current
    });
    onLoadMoreLinks({ links, loadMoreButton });
  }
}
