import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionPanel from '~/components/SectionPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import localize from '~/constants/localize';
import ContentPreview from '~/components/ContentPreview';
import SecretComment from '~/components/SecretComment';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  useAppContext,
  useKeyContext,
  useProfileContext,
  useContentContext
} from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useContentState } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';

const notableActivitiesLabel = localize('notableActivities');
const showMoreLabel = localize('showMore');

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
      {posts.map((post: any, index: number) => (
        <NotablePreview
          key={post.feedId}
          post={post}
          profile={profile}
          username={username}
          style={{ marginBottom: index !== posts.length - 1 ? '1rem' : 0 }}
        />
      ))}
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

function NotablePreview({
  post,
  profile,
  username,
  style
}: {
  post: any;
  profile: any;
  username: string;
  style?: React.CSSProperties;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );
  const navigate = useNavigate();

  const {
    timeStamp,
    secretAnswer,
    secretAttachment,
    subjectId,
    subjectUploaderId
  } = post;

  const subjectState = useContentState({
    contentType: 'subject',
    contentId: subjectId
  });

  useEffect(() => {
    if (
      userId &&
      (secretAnswer || secretAttachment) &&
      subjectId &&
      subjectState.prevSecretViewerId !== userId
    ) {
      handleCheckSecretShown();
    }
    if (!userId) {
      onChangeSpoilerStatus({
        shown: false,
        subjectId
      });
    }

    async function handleCheckSecretShown() {
      const { responded } = await checkIfUserResponded(subjectId);
      onChangeSpoilerStatus({
        shown: responded,
        subjectId,
        prevSecretViewerId: userId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, subjectState?.prevSecretViewerId, userId]);

  const isHidden = useMemo(() => {
    const secretShown =
      subjectState.secretShown || subjectUploaderId === userId;
    return (secretAnswer || secretAttachment) && !secretShown;
  }, [
    secretAnswer,
    secretAttachment,
    subjectState.secretShown,
    subjectUploaderId,
    userId
  ]);

  const contentType = useMemo(
    () => (post.type === 'url' ? 'link' : post.type || post.contentType),
    [post.contentType, post.type]
  );

  const uploader = useMemo(() => {
    const derived = post.uploader || {
      id: post.uploaderId || post.userId || post.subjectUploaderId,
      username: post.uploaderName || post.username || post.subjectUploaderName,
      profilePicUrl:
        post.uploaderProfilePicUrl ||
        post.profilePicUrl ||
        post.subjectUploaderProfilePicUrl
    };
    return {
      id: derived?.id ?? profile?.id ?? 0,
      username: derived?.username ?? username ?? '',
      profilePicUrl: derived?.profilePicUrl ?? profile?.profilePicUrl ?? ''
    };
  }, [post, profile?.id, profile?.profilePicUrl, username]);

  const contentObj = useMemo(
    () => ({
      id: post.contentId || post.id,
      contentType,
      uploader,
      content: isHidden ? '' : post.content,
      story: isHidden ? '' : post.story,
      fileName: isHidden ? undefined : post.fileName,
      filePath: isHidden ? undefined : post.filePath,
      fileSize: isHidden ? undefined : post.fileSize,
      topic: post.subjectTitle || post.topic,
      thumbUrl: isHidden ? undefined : post.thumbUrl,
      title: post.title,
      difficulty: post.difficulty,
      isListening: post.isListening
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      contentType,
      isHidden,
      post.content,
      post.contentId,
      post.difficulty,
      post.fileName,
      post.filePath,
      post.fileSize,
      post.id,
      post.isListening,
      post.story,
      post.subjectTitle,
      post.thumbUrl,
      post.title,
      post.topic
    ]
  );

  const containerClass = css`
    border: 1px solid var(--ui-border);
    border-radius: ${borderRadius};
    background: #fff;
    transition: background 0.5s, border 0.5s;
    &:hover {
      border-color: var(--ui-border-strong);
      background: ${Color.highlightGray()};
    }
    @media (max-width: ${mobileMaxWidth}) {
      margin-top: -0.5rem;
      border-left: 0;
      border-right: 0;
      border-radius: 0;
    }
  `;

  const timeSincePost = useMemo(() => timeSince(timeStamp), [timeStamp]);

  if (isHidden) {
    return (
      <div
        style={{ cursor: 'pointer', borderRadius, ...style }}
        className={containerClass}
        onClick={() =>
          navigate(
            `/${post.type === 'url' ? 'link' : post.type}s/${post.contentId}`
          )
        }
      >
        <div style={{ padding: '1rem' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
            {post.subjectTitle}
          </p>
          <span
            className={css`
              font-size: 1rem;
              color: ${Color.gray()};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.8rem;
              }
            `}
          >
            {timeSincePost}
          </span>
          <SecretComment style={{ marginTop: '1.7rem' }} />
        </div>
      </div>
    );
  }

  return <ContentPreview contentObj={contentObj} style={style} hideUploader />;
}
