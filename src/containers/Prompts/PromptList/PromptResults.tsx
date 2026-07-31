import React from 'react';
import { css } from '@emotion/css';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import SharedPromptCard, {
  type SharedTopic
} from '~/containers/MissionPage/SystemPromptShared/SharedPromptCard';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';
import type { PromptBrowseMode, PromptListTab } from '../types';

const promptLeaderboardRankLimit = 30;

const gridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
  gap: 1rem;
  width: 100%;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const emptyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 2.2rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fafbff;
`;

const emptyTitleClass = css`
  margin: 0;
  color: var(--chat-text);
  font-size: 2rem;
  font-weight: 900;
`;

const emptyBodyClass = css`
  margin: 0;
  color: var(--chat-text);
  opacity: 0.82;
  font-size: 1.2rem;
  line-height: 1.5;
`;

const loadMoreClass = css`
  display: flex;
  justify-content: center;
  margin-top: 1.6rem;
`;

export default function PromptResults({
  anchorKey,
  browseMode,
  color,
  initialScrollTargetRef,
  initialScrollToList,
  hasMore,
  loading,
  loadingMore,
  prompts,
  tab,
  userId,
  onCloneSuccess,
  onLoadMore
}: {
  anchorKey: string;
  browseMode: PromptBrowseMode;
  color?: string;
  initialScrollTargetRef: React.RefObject<HTMLElement | null>;
  initialScrollToList: boolean;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  prompts: SharedTopic[];
  tab: PromptListTab;
  userId: number;
  onCloneSuccess: (data: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicId: number;
    channelId: number;
    title: string;
  }) => void;
  onLoadMore: () => void;
}) {
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  useScrollAnchorRestoration({
    anchorKey,
    containerRef: gridRef,
    initialScroll: initialScrollToList
      ? { type: 'element', targetRef: initialScrollTargetRef }
      : { type: 'top' },
    itemsReady: prompts.length > 0 && !loading
  });

  if (loading) {
    return <Loading text="Loading prompts..." />;
  }

  if (prompts.length === 0) {
    return (
      <div className={emptyClass}>
        <h2 className={emptyTitleClass}>No prompts here yet</h2>
        <p className={emptyBodyClass}>
          {tab === 'my'
            ? 'Share a prompt from the Prompt Workshop and it will appear here.'
            : browseMode === 'leaderboard'
              ? 'No shared prompts have been cloned yet.'
              : 'No community prompts have been shared yet.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={gridRef} className={gridClass}>
        {prompts.map((prompt, index) => {
          const rank =
            tab === 'community' &&
            browseMode === 'leaderboard' &&
            index < promptLeaderboardRankLimit
              ? index + 1
              : undefined;
          return (
            <div
              key={prompt.id}
              data-scroll-anchor-id={`prompt-studio:${tab}:${browseMode}:${prompt.id}`}
              data-scroll-anchor-secondary-id={String(prompt.id)}
              data-scroll-anchor-content-key={`sharedTopic:${prompt.id}`}
            >
              <SharedPromptCard
                topic={prompt}
                isOwnTopic={prompt.userId === userId}
                userId={userId}
                rank={rank}
                showCommentComposer={false}
                onCloneSuccess={onCloneSuccess}
              />
            </div>
          );
        })}
      </div>
      {hasMore ? (
        <PromptLoadMore
          color={color}
          loading={loadingMore}
          onLoadMore={onLoadMore}
        />
      ) : null}
    </>
  );
}

function PromptLoadMore({
  color,
  loading,
  onLoadMore
}: {
  color?: string;
  loading: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className={loadMoreClass} data-prompt-load-more>
      <LoadMoreButton loading={loading} onClick={onLoadMore} color={color} />
    </div>
  );
}
