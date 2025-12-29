import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionPanel from '~/components/SectionPanel';
import Comments from '~/components/Comments';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Intro from './Intro';
import Activities from './Activities';
import Pictures from './Pictures';
import PinnedAICards from './PinnedAICards';
import ReorderSectionsModal from './ReorderSectionsModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
const messageBoardLabel = 'Message Board';
const reorderSectionsLabel = 'Reorder Sections';
const profileSectionKeys = [
  'intro',
  'pictures',
  'pinnedAICards',
  'activities'
];
const profileSectionLabels: Record<string, string> = {
  intro: 'Intro',
  pictures: 'Pictures',
  pinnedAICards: 'Pinned AI Cards',
  activities: 'Activities'
};

function normalizeSectionOrder(sectionOrder: any) {
  const allowed = new Set(profileSectionKeys);
  const seen = new Set<string>();
  const normalized: string[] = [];
  if (Array.isArray(sectionOrder)) {
    for (const rawKey of sectionOrder) {
      const key = String(rawKey);
      if (!allowed.has(key) || seen.has(key)) continue;
      seen.add(key);
      normalized.push(key);
    }
  }
  for (const key of profileSectionKeys) {
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(key);
    }
  }
  return normalized;
}

export default function Home({
  profile,
  selectedTheme
}: {
  profile: any;
  selectedTheme: string;
}) {
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const updateProfileSectionOrder = useAppContext(
    (v) => v.requestHelpers.updateProfileSectionOrder
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const isOwnProfile = userId === profile.id;
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onDeleteComment = useContentContext((v) => v.actions.onDeleteComment);
  const onEditComment = useContentContext((v) => v.actions.onEditComment);
  const onEditRewardComment = useContentContext(
    (v) => v.actions.onEditRewardComment
  );
  const onLikeComment = useContentContext((v) => v.actions.onLikeComment);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);
  const onLoadMoreComments = useContentContext(
    (v) => v.actions.onLoadMoreComments
  );
  const onLoadMoreReplies = useContentContext(
    (v) => v.actions.onLoadMoreReplies
  );
  const onLoadRepliesOfReply = useContentContext(
    (v) => v.actions.onLoadRepliesOfReply
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);

  const { id, numPics, username, pictures } = profile;
  const { comments, commentsLoaded, commentsLoadMoreButton, pinnedCommentId } =
    useContentState({
      contentType: 'user',
      contentId: profile.id
    });
  const [loadingComments, setLoadingComments] = useState(false);
  const [reorderModalShown, setReorderModalShown] = useState(false);
  const CommentInputAreaRef = useRef(null);
  const sectionOrder = useMemo(
    () => normalizeSectionOrder(profile?.state?.profile?.sectionOrder),
    [profile?.state?.profile?.sectionOrder]
  );
  const sectionContentByKey: Record<string, React.ReactNode> = {
    intro: <Intro profile={profile} selectedTheme={selectedTheme} />,
    pictures: userId ? (
      <Pictures
        profileId={profile.id}
        numPics={numPics}
        pictures={pictures || []}
        selectedTheme={selectedTheme}
      />
    ) : null,
    pinnedAICards: (
      <PinnedAICards profile={profile} selectedTheme={selectedTheme} />
    ),
    activities: <Activities selectedTheme={selectedTheme} profile={profile} />
  };

  useEffect(() => {
    if (!commentsLoaded) {
      initComments();
    }
    async function initComments() {
      try {
        setLoadingComments(true);
        const { comments, loadMoreButton } = await loadComments({
          contentId: id,
          contentType: 'user',
          limit: 5
        });
        onLoadComments({
          contentId: profile.id,
          contentType: 'user',
          comments,
          loadMoreButton
        });
        setLoadingComments(false);
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <ErrorBoundary
      componentPath="Profile/Body/Home/index"
      className={css`
        width: 70vw;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      {isOwnProfile && (
        <div
          className={css`
            display: flex;
            justify-content: flex-end;
            width: 100%;
            margin-bottom: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0 1.4rem;
            }
          `}
        >
          <Button
            color="darkerGray"
            variant="solid"
            tone="raised"
            onClick={() => setReorderModalShown(true)}
          >
            <Icon icon="sort" />
            <span style={{ marginLeft: '0.7rem' }}>{reorderSectionsLabel}</span>
          </Button>
        </div>
      )}
      {sectionOrder.map((sectionKey) => {
        const sectionContent = sectionContentByKey[sectionKey];
        if (!sectionContent) return null;
        return (
          <React.Fragment key={sectionKey}>{sectionContent}</React.Fragment>
        );
      })}
      <SectionPanel
        elevated
        customColorTheme={selectedTheme}
        loaded
        title={messageBoardLabel}
      >
        <Comments
          theme={selectedTheme}
          comments={comments}
          commentsLoadLimit={5}
          commentsShown={true}
          inputAreaInnerRef={CommentInputAreaRef}
          inputTypeLabel={`message${
            profile.id === userId ? '' : ` to ${username}`
          }`}
          isLoading={loadingComments}
          loadMoreButton={commentsLoadMoreButton}
          numPreviews={1}
          onCommentSubmit={onUploadComment}
          onDelete={onDeleteComment}
          onEditDone={onEditComment}
          onLikeClick={onLikeComment}
          onLoadMoreComments={onLoadMoreComments}
          onLoadMoreReplies={onLoadMoreReplies}
          onLoadRepliesOfReply={onLoadRepliesOfReply}
          onPreviewClick={onLoadComments}
          onReplySubmit={onUploadReply}
          onRewardCommentEdit={onEditRewardComment}
          parent={{
            ...profile,
            pinnedCommentId,
            contentType: 'user'
          }}
          userId={userId}
        />
      </SectionPanel>
      <div
        className={css`
          display: block;
          height: 7rem;
        `}
      />
      {reorderModalShown && (
        <ReorderSectionsModal
          initialSectionOrder={sectionOrder}
          sectionLabels={profileSectionLabels}
          onHide={() => setReorderModalShown(false)}
          onSubmit={handleUpdateSectionOrder}
        />
      )}
    </ErrorBoundary>
  );

  async function handleUpdateSectionOrder(nextOrder: string[]) {
    try {
      const data = await updateProfileSectionOrder(nextOrder);
      const savedOrder = Array.isArray(data?.sectionOrder)
        ? data.sectionOrder
        : nextOrder;
      const nextState = {
        ...(profile.state || {}),
        profile: {
          ...(profile.state?.profile || {}),
          sectionOrder: savedOrder
        }
      };
      onSetUserState({
        userId: profile.id,
        newState: { state: nextState }
      });
      setReorderModalShown(false);
    } catch (error) {
      console.error(error);
    }
  }
}
