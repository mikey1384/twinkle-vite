import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import SectionPanel from '~/components/SectionPanel';
import ContentPanel from '~/components/ContentPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import localize from '~/constants/localize';
import { useAppContext, useProfileContext } from '~/contexts';
import { useProfileState } from '~/helpers/hooks';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

const notableActivitiesLabel = localize('notableActivities');
const showMoreLabel = localize('showMore');

NotableActivities.propTypes = {
  profile: PropTypes.object.isRequired,
  selectedTheme: PropTypes.string,
  userId: PropTypes.number,
  username: PropTypes.string.isRequired
};
export default function NotableActivities({
  profile,
  selectedTheme,
  userId,
  username
}) {
  const loadingMoreRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const {
    notables: { feeds, loaded, loadMoreButton: loadMoreButtonShown }
  } = useProfileState(username);
  const loadMoreNotableContents = useAppContext(
    (v) => v.requestHelpers.loadMoreNotableContents
  );
  const loadNotableContent = useAppContext(
    (v) => v.requestHelpers.loadNotableContent
  );
  const onLoadNotables = useProfileContext((v) => v.actions.onLoadNotables);
  const onLoadMoreNotables = useProfileContext(
    (v) => v.actions.onLoadMoreNotables
  );
  useEffect(() => {
    if (!loaded) {
      initNotables();
    }
    async function initNotables() {
      setLoading(true);
      const { results, loadMoreButton } = await loadNotableContent({
        userId
      });
      onLoadNotables({ username, feeds: results, loadMoreButton });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loaded, profile.id, username]);
  const hasntEngagedLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${username}님은 아직 여기에 보일 만한 활동기록이 없습니다`;
    }
    return `${username} hasn't engaged in an activity worth showing here, yet`;
  }, [username]);

  return (
    <SectionPanel
      customColorTheme={selectedTheme}
      title={notableActivitiesLabel}
      loaded={!loading}
    >
      {feeds.length === 0 && (
        <div style={{ fontSize: '2rem', textAlign: 'center' }}>
          {hasntEngagedLabel}
        </div>
      )}
      {feeds.map((notable, index) => {
        const { contentId, contentType } = notable;
        return (
          <ContentPanel
            key={contentType + contentId}
            theme={selectedTheme}
            alwaysShow={feeds.length <= 3}
            zIndex={feeds.length - index}
            style={{ marginBottom: '1rem' }}
            contentId={contentId}
            contentType={contentType}
            commentsLoadLimit={5}
            numPreviewComments={1}
          />
        );
      })}
      {loadMoreButtonShown && (
        <LoadMoreButton
          style={{ fontSize: '1.7rem' }}
          loading={loadingMore}
          label={showMoreLabel}
          transparent
          onClick={handleLoadMoreNotables}
        />
      )}
    </SectionPanel>
  );

  async function handleLoadMoreNotables() {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const { results, loadMoreButton } = await loadMoreNotableContents({
      userId: profile.id,
      notables: feeds
    });
    onLoadMoreNotables({
      feeds: results,
      loadMoreButton,
      username
    });
    setLoadingMore(false);
    loadingMoreRef.current = false;
  }
}
