import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import CloneButtons from '~/components/Buttons/CloneButtons';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import MyTopicsManager from './MyTopicsManager';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import moment from 'moment';

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
  const onUpdateSharedPromptCloneCount = useMissionContext(
    (v) => v.actions.onUpdateSharedPromptCloneCount
  );

  // Local state (doesn't need to persist)
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>(
    {}
  );
  const [commentSubmitting, setCommentSubmitting] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    let ignore = false;
    async function init() {
      // Only show loading spinner if we don't have cached data
      if (!sharedPromptsLoaded) {
        setLoading(true);
      }
      setError('');
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
      } catch (err: any) {
        if (ignore) return;
        // Only show error if we don't have cached data to fall back on
        if (!sharedPromptsLoaded) {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              'Failed to load shared prompts'
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

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
    onUpdateSharedPromptCloneCount(data.sharedTopicId);
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
          <section
            className={css`
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
              gap: 1rem;
              width: 100%;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr;
              }
            `}
          >
            {topics.map((topic) => {
              const instructions =
                topic.customInstructions ||
                topic.settings?.customInstructions ||
                '';
              const isOwnTopic = topic.userId === userId;
              return (
                <article key={topic.id} className={cardClass}>
                  <div>
                    <h3
                      className={css`
                        margin: 0;
                        font-size: 1.8rem;
                        color: ${Color.logoBlue()};
                        font-weight: 700;
                        cursor: pointer;
                        &:hover {
                          text-decoration: underline;
                        }
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/shared-prompts/${topic.id}`);
                      }}
                    >
                      {topic.content}
                    </h3>
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                        color: ${Color.darkerGray()};
                        font-size: 1.3rem;
                        margin-top: 0.3rem;
                      `}
                    >
                      <UsernameText
                        user={{ id: topic.userId, username: topic.username }}
                      />
                      {topic.timeStamp && (
                        <small>{moment.unix(topic.timeStamp).fromNow()}</small>
                      )}
                      {isOwnTopic && (
                        <span
                          className={css`
                            padding: 0.2rem 0.5rem;
                            background: ${Color.logoBlue(0.1)};
                            border: 1px solid ${Color.logoBlue(0.3)};
                            border-radius: 4px;
                            color: ${Color.logoBlue()};
                            font-size: 1.1rem;
                            font-weight: 700;
                          `}
                        >
                          Your prompt
                        </span>
                      )}
                      <div className={statsRowClass}>
                        <div className={statPillClass}>
                          <span
                            className={css`
                              font-weight: 700;
                            `}
                          >
                            {topic.cloneCount || 0}
                          </span>
                          {Number(topic.cloneCount) === 1 ? 'clone' : 'clones'}
                        </div>
                        <div className={statPillClass}>
                          <span
                            className={css`
                              font-weight: 700;
                            `}
                          >
                            {topic.messageCount || 0}
                          </span>
                          {Number(topic.messageCount) === 1
                            ? 'message'
                            : 'messages'}
                        </div>
                        <div
                          className={statPillClass}
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/shared-prompts/${topic.id}`);
                          }}
                        >
                          <Icon icon="comment" />
                          <span
                            className={css`
                              font-weight: 700;
                            `}
                          >
                            {topic.numComments || 0}
                          </span>
                          {Number(topic.numComments) === 1
                            ? 'comment'
                            : 'comments'}
                        </div>
                      </div>
                    </div>
                  </div>
                  {instructions && (
                    <div
                      className={css`
                        margin: 0.8rem 0;
                        padding: 1rem;
                        border-radius: ${borderRadius};
                        border: 1px solid var(--ui-border);
                        background: #fff;
                        font-size: 1.3rem;
                        line-height: 1.6;
                      `}
                    >
                      <RichText
                        contentType="sharedTopic"
                        contentId={topic.id}
                        maxLines={8}
                        isShowMoreButtonCentered
                      >
                        {instructions}
                      </RichText>
                    </div>
                  )}
                  <CloneButtons
                    sharedTopicId={topic.subjectId || topic.id}
                    sharedTopicTitle={topic.content}
                    uploaderId={topic.userId}
                    myClones={topic.myClones}
                    onCloneSuccess={handleCloneSuccess}
                  />
                  {userId && (
                    <div
                      className={css`
                        display: flex;
                        gap: 0.5rem;
                        margin-top: 0.5rem;
                      `}
                    >
                      <Input
                        placeholder="Write a comment..."
                        value={commentTexts[topic.id] || ''}
                        onChange={(text: string) =>
                          setCommentTexts((prev) => ({
                            ...prev,
                            [topic.id]: text
                          }))
                        }
                        onKeyDown={(event: React.KeyboardEvent) => {
                          if (event.key === 'Enter') {
                            handleCommentSubmit(topic.id);
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        color="logoBlue"
                        variant="soft"
                        tone="raised"
                        disabled={
                          stringIsEmpty(commentTexts[topic.id]) ||
                          commentSubmitting[topic.id]
                        }
                        onClick={() => handleCommentSubmit(topic.id)}
                      >
                        {commentSubmitting[topic.id] ? (
                          <Icon icon="spinner" pulse />
                        ) : (
                          <Icon icon="paper-plane" />
                        )}
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
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

const cardClass = css`
  width: 100%;
  background: #fff;
  border-radius: ${borderRadius};
  padding: 1rem 1rem 1.3rem;
  border: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  transition: border-color 0.18s ease;
  &:hover {
    border-color: var(--ui-border-strong);
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    border-top: 0;
    &:last-child {
      border-bottom: 0;
    }
  }
`;

const statsRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.1rem;
  color: ${Color.darkerGray()};
`;

const statPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: ${Color.highlightGray(0.2)};
  border: 1px solid var(--ui-border);
  font-size: 1.1rem;
  font-weight: 500;
`;
