import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import MyTopicsManager from './MyTopicsManager';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import moment from 'moment';

interface SharedTopic {
  id: number;
  subjectId?: number;
  content: string;
  userId: number;
  username: string;
  timeStamp?: number;
  customInstructions?: string;
  settings?: any;
  cloneCount?: number;
  messageCount?: number;
}

export default function SystemPromptShared() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadOtherUserTopics
  );
  const loadMoreOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadMoreOtherUserTopics
  );
  const cloneSharedSystemPrompt = useAppContext(
    (v) => v.requestHelpers.cloneSharedSystemPrompt
  );
  const onSetThinkHardForTopic = useChatContext(
    (v) => v.actions.onSetThinkHardForTopic
  );
  const [topics, setTopics] = useState<SharedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'new' | 'cloned' | 'used'>('new');

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setError('');
      setStatus('');
      setTopics([]);
      setLoadMoreButton(false);
      try {
        const { subjects, loadMoreButton: hasMore } = await loadOtherUserTopics(
          { sortBy }
        );
        if (ignore) return;
        setTopics(subjects || []);
        setLoadMoreButton(Boolean(hasMore));
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
    init();
    return () => {
      ignore = true;
    };
  }, [loadOtherUserTopics, sortBy]);

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
            cloneCount: last.cloneCount,
            messageCount: last.messageCount
          },
          sortBy
        });
      setTopics((prev) => prev.concat(subjects || []));
      setLoadMoreButton(Boolean(hasMore));
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

  const handleClone = async ({
    sharedTopicId,
    target
  }: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
  }) => {
    if (!sharedTopicId || submitting[`${sharedTopicId}-${target}`]) return;
    setError('');
    setStatus('');
    setSubmitting((prev) => ({
      ...prev,
      [`${sharedTopicId}-${target}`]: true
    }));
    try {
      const data = await cloneSharedSystemPrompt({ sharedTopicId, target });
      setStatus(
        `Cloned to ${
          target === 'ciel' ? 'Ciel' : 'Zero'
        } chat. Open chat to start talking.`
      );
      // Set thinkHard to false for the new topic
      if (typeof data?.subjectId === 'number') {
        onSetThinkHardForTopic({
          aiType: target,
          topicId: data.subjectId,
          thinkHard: false
        });
        // Also persist to localStorage
        try {
          const stored = localStorage.getItem('thinkHard') || '{}';
          const parsed = JSON.parse(stored);
          const updated = {
            ...parsed,
            [target]: {
              ...(parsed[target] || {}),
              [data.subjectId]: false
            }
          };
          localStorage.setItem('thinkHard', JSON.stringify(updated));
        } catch {
          // Ignore localStorage errors
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to clone shared prompt'
      );
    } finally {
      setSubmitting((prev) => ({
        ...prev,
        [`${sharedTopicId}-${target}`]: false
      }));
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
          {status && (
            <div
              className={css`
                margin-top: 0.4rem;
                padding: 0.8rem 1rem;
                background: ${Color.green(0.1)};
                border: 1px solid ${Color.green(0.3)};
                border-radius: ${borderRadius};
                color: ${Color.green()};
                font-weight: 700;
                font-size: 1.3rem;
              `}
            >
              {status}
            </div>
          )}
        </header>
        <MyTopicsManager />
        <FilterBar>
          {tabs.map((tab) => (
            <nav
              key={tab.key}
              className={sortBy === tab.key ? 'active' : ''}
              onClick={() => setSortBy(tab.key as typeof sortBy)}
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
        {loading ? (
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
                  <div
                    className={css`
                      display: flex;
                      justify-content: space-between;
                      gap: 0.6rem;
                      align-items: flex-start;
                    `}
                  >
                    <div>
                      <h3
                        className={css`
                          margin: 0;
                          font-size: 1.8rem;
                          color: ${Color.logoBlue()};
                          font-weight: 700;
                        `}
                      >
                        {topic.content}
                      </h3>
                      <div
                        className={css`
                          color: ${Color.darkerGray()};
                          font-size: 1.3rem;
                          margin-top: 0.3rem;
                        `}
                      >
                        <UsernameText
                          user={{ id: topic.userId, username: topic.username }}
                        />
                        {topic.timeStamp && (
                          <small style={{ marginLeft: '0.5rem' }}>
                            {moment.unix(topic.timeStamp).fromNow()}
                          </small>
                        )}
                        {isOwnTopic && (
                          <span
                            className={css`
                              margin-left: 0.5rem;
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
                      </div>
                    </div>
                    <div className={statsRowClass}>
                      <div className={statPillClass}>
                        <span
                          className={css`
                            font-weight: 700;
                          `}
                        >
                          {topic.cloneCount ?? 0}
                        </span>
                        clones
                      </div>
                      <div className={statPillClass}>
                        <span
                          className={css`
                            font-weight: 700;
                          `}
                        >
                          {topic.messageCount ?? 0}
                        </span>
                        messages
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
                  {!isOwnTopic && (
                    <div
                      className={css`
                        display: flex;
                        gap: 0.6rem;
                        flex-wrap: wrap;
                      `}
                    >
                      <Button
                        color="logoBlue"
                        variant="soft"
                        tone="raised"
                        onClick={() =>
                          handleClone({
                            sharedTopicId: topic.subjectId || topic.id,
                            target: 'zero'
                          })
                        }
                        disabled={
                          submitting[`${topic.id}-zero`] ||
                          submitting[`${topic.id}-ciel`]
                        }
                      >
                        {submitting[`${topic.id}-zero`] ? (
                          <>
                            <Icon
                              style={{ marginRight: '0.5rem' }}
                              icon="spinner"
                              pulse
                            />
                            Cloning to Zero...
                          </>
                        ) : (
                          <>
                            <Icon
                              style={{ marginRight: '0.5rem' }}
                              icon="robot"
                            />
                            Clone to Zero
                          </>
                        )}
                      </Button>
                      <Button
                        color="purple"
                        variant="soft"
                        tone="raised"
                        onClick={() =>
                          handleClone({
                            sharedTopicId: topic.subjectId || topic.id,
                            target: 'ciel'
                          })
                        }
                        disabled={
                          submitting[`${topic.id}-zero`] ||
                          submitting[`${topic.id}-ciel`]
                        }
                      >
                        {submitting[`${topic.id}-ciel`] ? (
                          <>
                            <Icon
                              style={{ marginRight: '0.5rem' }}
                              icon="spinner"
                              pulse
                            />
                            Cloning to Ciel...
                          </>
                        ) : (
                          <>
                            <Icon
                              style={{ marginRight: '0.5rem' }}
                              icon="robot"
                            />
                            Clone to Ciel
                          </>
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
  cursor: pointer;
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
