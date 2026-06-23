import React, { useMemo, useRef, useState } from 'react';
import SectionPanel from '~/components/SectionPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import HomeFeedCard from '~/containers/Home/Stories/FeedCard';
import { useAppContext, useProfileContext } from '~/contexts';

const notableActivitiesLabel = 'Notable Activities';
const showMoreLabel = 'Show More';

export default function NotableActivities({
  posts = [],
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
    return `${username} hasn't engaged in an activity worth showing here, yet`;
  }, [username]);

  return (
    <SectionPanel
      elevated
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
        const feed = getNotableFeed(post);
        return (
          <div
            key={post.feedId}
            data-scroll-anchor-id={`profile-notable:${post.feedId}`}
            data-scroll-anchor-secondary-id={String(post.feedId)}
            data-scroll-anchor-content-key={`${feed.contentType}:${feed.contentId}`}
            style={{ marginBottom: index !== posts.length - 1 ? '1rem' : 0 }}
          >
            <HomeFeedCard
              feed={feed}
              index={index}
              showcase
              theme={selectedTheme}
              totalCount={posts.length}
            />
          </div>
        );
      })}
      {loadMoreButtonShown && (
        <LoadMoreButton
          style={{ fontSize: '1.7rem', marginTop: '1rem' }}
          loading={loadingMore}
          label={showMoreLabel}
          variant="ghost"
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

// `/content/noteworthy` returns recommended comments (each on a subject) as flat
// rows. Map each into the home-feed `feed` shape so HomeFeedCard can render the
// rich preview and hydrate canonical content (secrets resolve from the server's
// `secretShown`, the same source of truth the home feed already trusts).
function getNotableFeed(post: any) {
  const contentType =
    post.contentType || (post.type === 'url' ? 'url' : post.type) || 'comment';
  const contentId = post.contentId || post.id;
  const subjectId = post.subjectId;
  const previewContent: any = {
    contentType,
    contentId,
    id: contentId,
    content: post.content,
    filePath: post.filePath,
    fileName: post.fileName,
    fileSize: post.fileSize,
    thumbUrl: post.thumbUrl
  };
  if (subjectId) {
    previewContent.rootType = 'subject';
    previewContent.rootId = subjectId;
    previewContent.rootObj = {
      id: subjectId,
      contentId: subjectId,
      contentType: 'subject',
      title: post.subjectTitle,
      secretAnswer: post.secretAnswer,
      secretAttachment: post.secretAttachment,
      hasSecretAnswer: post.hasSecretAnswer,
      hasSecretAttachment: post.hasSecretAttachment,
      secretShown: post.secretShown,
      uploader: { id: post.subjectUploaderId }
    };
  }
  return {
    feedId: post.feedId,
    contentId,
    contentType,
    rootType: subjectId ? 'subject' : undefined,
    rootId: subjectId,
    subjectId,
    timeStamp: post.timeStamp,
    previewContent
  };
}
