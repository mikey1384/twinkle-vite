import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import MyTopicsManager from './MyTopicsManager';
import SharedPromptCard from './SharedPromptCard';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

interface CloneEntry {
  target: 'zero' | 'ciel';
  channelId: number;
  topicId: number;
}

interface SharedTopic {
  id: number;
  subjectId?: number;
  content: string;
  userId: number;
  username: string;
  timeStamp?: number;
  sharedAt?: number;
  customInstructions?: string;
  settings?: any;
  cloneCount?: number;
  messageCount?: number;
  numComments?: number;
  myClones?: CloneEntry[];
}

export default function SystemPromptShared({
  missionCleared
}: {
  missionCleared: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadOtherUserTopics
  );
  const loadMoreOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadMoreOtherUserTopics
  );
  const uploadComment = useAppContext((v) => v.requestHelpers.uploadComment);
  const navigate = useNavigate();

  const topics = useMissionContext(
    (v) => v.state.sharedPrompts
  ) as SharedTopic[];
  const sharedPromptsLoaded = useMissionContext(
    (v) => v.state.sharedPromptsLoaded
  );
  const loadMoreButton = useMissionContext(
    (v) => v.state.sharedPromptsLoadMoreButton
  );
  const sortBy = useMissionContext((v) => v.state.sharedPromptsSortBy) as
    | 'new'
    | 'cloned'
    | 'used';
  const onLoadSharedPrompts = useMissionContext(
    (v) => v.actions.onLoadSharedPrompts
  );
  const onLoadMoreSharedPrompts = useMissionContext(
    (v) => v.actions.onLoadMoreSharedPrompts
  );
  const onSetSharedPromptsSortBy = useMissionContext(
    (v) => v.actions.onSetSharedPromptsSortBy
  );
  const onUpdateSharedPromptClone = useMissionContext(
    (v) => v.actions.onUpdateSharedPromptClone
  );

  // Local state (doesn't need to persist)
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [newPromptsAvailable, setNewPromptsAvailable] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>(
    {}
  );
  const [commentSubmitting, setCommentSubmitting] = useState<{
    [key: number]: boolean;
  }>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Track the previous sortBy to detect actual sort changes
  const prevSortByRef = React.useRef(sortBy);

  useEffect(() => {
    let ignore = false;
    const sortByChanged = prevSortByRef.current !== sortBy;
    prevSortByRef.current = sortBy;

    async function init() {
      setError('');
      setLoading(true);
      try {
        const { subjects, loadMoreButton: hasMore } = await loadOtherUserTopics(
          { sortBy }
        );
        if (ignore) return;
        onLoadSharedPrompts({
          prompts: subjects || [],
          loadMoreButton: Boolean(hasMore),
          sortBy
        });
        setNewPromptsAvailable(false);
      } catch (err: any) {
        if (ignore) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Failed to load shared prompts'
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    async function checkForNewPrompts() {
      try {
        const { subjects } = await loadOtherUserTopics({ sortBy });
        if (ignore) return;
        // Check if the first item is different from what we have
        if (subjects?.length > 0 && topics?.length > 0) {
          const newestFetched = subjects[0].id;
          const newestCached = topics[0].id;
          if (newestFetched !== newestCached) {
            setNewPromptsAvailable(true);
          }
        } else if (subjects?.length > 0 && topics?.length === 0) {
          setNewPromptsAvailable(true);
        }
      } catch {
        // Silently fail background check
      }
    }

    // If no cached data or sort changed, do full load
    if (!sharedPromptsLoaded || sortByChanged) {
      init();
    } else {
      // Data exists and sort didn't change - delay background check to avoid blocking render
      const timeoutId = setTimeout(checkForNewPrompts, 1000);
      return () => {
        ignore = true;
        clearTimeout(timeoutId);
      };
    }

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  function handleRefresh() {
    setNewPromptsAvailable(false);
    setLoading(true);
    setError('');
    loadOtherUserTopics({ sortBy })
      .then(
        ({
          subjects,
          loadMoreButton: hasMore
        }: {
          subjects: SharedTopic[];
          loadMoreButton: boolean;
        }) => {
          onLoadSharedPrompts({
            prompts: subjects || [],
            loadMoreButton: Boolean(hasMore),
            sortBy
          });
        }
      )
      .catch((err: any) => {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Failed to load shared prompts'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const tabs = useMemo(
    () => [
      { key: 'new', label: 'New' },
      { key: 'cloned', label: 'Most Cloned' },
      { key: 'used', label: 'Most Used' }
    ],
    []
  );

  const handleLoadMore = async () => {
    if (!loadMoreButton || !topics.length) return;
    const last = topics[topics.length - 1];
    setLoadingMore(true);
    try {
      const { subjects, loadMoreButton: hasMore } =
        await loadMoreOtherUserTopics({
          lastSubject: {
            id: last.id,
            timeStamp: last.timeStamp || 0,
            sharedAt: last.sharedAt,
            cloneCount: last.cloneCount,
            messageCount: last.messageCount
          },
          sortBy
        });
      onLoadMoreSharedPrompts({
        prompts: subjects || [],
        loadMoreButton: Boolean(hasMore)
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to load more shared prompts'
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCloneSuccess = (data: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicId: number;
    channelId: number;
    title: string;
  }) => {
    onUpdateSharedPromptClone({
      promptId: data.sharedTopicId,
      target: data.target,
      channelId: data.channelId,
      topicId: data.topicId
    });
  };

  const handleCommentSubmit = async (topicId: number) => {
    const text = commentTexts[topicId]?.trim();
    if (!text || commentSubmitting[topicId]) return;

    setCommentSubmitting((prev) => ({ ...prev, [topicId]: true }));
    try {
      await uploadComment({
        content: text,
        parent: {
          contentType: 'sharedTopic',
          contentId: topicId
        }
      });
      navigate(`/shared-prompts/${topicId}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || err?.message || 'Failed to post comment'
      );
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [topicId]: false }));
    }
  };

  async function handleCopyEmbed(topicId: number) {
    const embedUrl = `![](https://www.twin-kle.com/shared-prompts/${topicId})`;
    try {
      await navigator.clipboard.writeText(embedUrl);
      setCopiedId(topicId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <ErrorBoundary componentPath="MissionPage/SystemPromptShared">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 1.4rem;
        `}
      >
        <header
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            padding: 1.2rem 1.8rem;
            background: #fff;
            border: 1px solid var(--ui-border);
            border-radius: ${borderRadius};
            @media (max-width: ${mobileMaxWidth}) {
              border-radius: 0;
              border-left: 0;
              border-right: 0;
              padding: 1.1rem 1.4rem;
            }
          `}
        >
          <h2
            className={css`
              margin: 0;
              font-size: 2.3rem;
              color: ${Color.black()};
              font-weight: 700;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
          >
            Shared System Prompts
          </h2>
          <p
            className={css`
              margin: 0;
              color: ${Color.darkerGray()};
              font-size: 1.3rem;
              line-height: 1.6;
            `}
          >
            Browse shared Zero/Ciel topics from other users and clone one into
            your AI chat to complete the mission checklist.
          </p>
        </header>
        <FilterBar>
          {tabs.map((tab) => (
            <nav
              key={tab.key}
              className={sortBy === tab.key ? 'active' : ''}
              onClick={() => onSetSharedPromptsSortBy(tab.key as typeof sortBy)}
            >
              {tab.label}
            </nav>
          ))}
        </FilterBar>
        {newPromptsAvailable && (
          <Button
            color="logoBlue"
            variant="soft"
            tone="raised"
            onClick={handleRefresh}
            style={{
              alignSelf: 'center',
              padding: '0.8rem 1.5rem',
              fontSize: '1.3rem'
            }}
          >
            <Icon icon="arrow-rotate-right" style={{ marginRight: '0.7rem' }} />
            New prompts available - tap to refresh
          </Button>
        )}
        {error && (
          <div
            className={css`
              color: ${Color.red()};
              font-size: 1.3rem;
            `}
          >
            {error}
          </div>
        )}
        {loading || !sharedPromptsLoaded ? (
          <Loading />
        ) : topics.length === 0 ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 4rem 2rem;
              text-align: center;
              background: #fff;
              border-radius: ${borderRadius};
              border: 1px solid var(--ui-border);
              @media (max-width: ${mobileMaxWidth}) {
                border-radius: 0;
                border-left: 0;
                border-right: 0;
              }
            `}
          >
            <Icon
              icon="inbox"
              style={{
                fontSize: '4rem',
                color: Color.gray(),
                marginBottom: '1rem'
              }}
            />
            <h3
              className={css`
                margin: 0 0 0.5rem;
                color: ${Color.darkerGray()};
                font-size: 1.6rem;
              `}
            >
              No shared prompts yet
            </h3>
            <p
              className={css`
                margin: 0;
                color: ${Color.gray()};
                max-width: 36rem;
              `}
            >
              {sortBy === 'new'
                ? 'Be the first to share your system prompt with the community!'
                : sortBy === 'cloned'
                ? 'No prompts have been cloned yet. Check back soon!'
                : 'No prompts have messages yet. Try the "New" tab!'}
            </p>
          </div>
        ) : (
          <section className={gridClass}>
            {topics.map((topic) => (
              <SharedPromptCard
                key={topic.id}
                topic={topic}
                isOwnTopic={topic.userId === userId}
                userId={userId}
                copiedId={copiedId}
                commentText={commentTexts[topic.id] || ''}
                commentSubmitting={commentSubmitting[topic.id] || false}
                onCommentTextChange={(text: string) =>
                  setCommentTexts((prev) => ({
                    ...prev,
                    [topic.id]: text
                  }))
                }
                onCommentSubmit={() => handleCommentSubmit(topic.id)}
                onCopyEmbed={() => handleCopyEmbed(topic.id)}
                onCloneSuccess={handleCloneSuccess}
              />
            ))}
          </section>
        )}
        {loadMoreButton && !loading && (
          <div
            className={css`
              display: flex;
              justify-content: center;
              margin-top: 1rem;
            `}
          >
            <Button
              variant="soft"
              color="logoBlue"
              tone="raised"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Icon
                    style={{ marginRight: '0.5rem' }}
                    icon="spinner"
                    pulse
                  />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </Button>
          </div>
        )}
        {!missionCleared && <MyTopicsManager />}
      </div>
    </ErrorBoundary>
  );
}

const gridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
  gap: 1rem;
  width: 100%;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
