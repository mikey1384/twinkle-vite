import React, { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import SectionPanel from '~/components/SectionPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import localize from '~/constants/localize';
import ActivityItem from './ActivityItem';
import { useAppContext, useProfileContext } from '~/contexts';
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
  posts,
  profile,
  selectedTheme,
  loading,
  loadMoreButtonShown,
  username
}: {
  posts: any[];
  loading: boolean;
  loadMoreButtonShown: boolean;
  profile: any;
  selectedTheme: string;
  username: string;
}) {
  const loadingMoreRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreNotableContents = useAppContext(
    (v) => v.requestHelpers.loadMoreNotableContents
  );
  const onLoadMoreNotables = useProfileContext(
    (v) => v.actions.onLoadMoreNotables
  );
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
      {posts.length === 0 && (
        <div style={{ fontSize: '2rem', textAlign: 'center' }}>
          {hasntEngagedLabel}
        </div>
      )}
      {posts.map((post: any, index: number) => {
        return (
          <ActivityItem
            key={post.feedId}
            post={post}
            style={{ marginBottom: index !== posts.length - 1 ? '1rem' : 0 }}
          />
        );
      })}
      {loadMoreButtonShown && (
        <LoadMoreButton
          style={{ fontSize: '1.7rem', marginTop: '1rem' }}
          loading={loadingMore}
          label={showMoreLabel}
          transparent
          theme={selectedTheme}
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
      lastFeedId: posts[posts.length - 1].feedId
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
