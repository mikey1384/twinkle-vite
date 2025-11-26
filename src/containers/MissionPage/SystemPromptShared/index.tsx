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
import { useNavigate } from 'react-router-dom';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { CHAT_ID_BASE_NUMBER } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import moment from 'moment';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

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
  const cloneSharedSystemPrompt = useAppContext(
    (v) => v.requestHelpers.cloneSharedSystemPrompt
  );
  const onSetThinkHardForTopic = useChatContext(
    (v) => v.actions.onSetThinkHardForTopic
  );
  const navigate = useNavigate();
  const [topics, setTopics] = useState<SharedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [error, setError] = useState('');
  const [clonedTopic, setClonedTopic] = useState<{
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicId: number;
    channelId: number;
    title: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'new' | 'cloned' | 'used'>('new');

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setError('');
      setClonedTopic(null);
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
            sharedAt: last.sharedAt,
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
    target,
    topicTitle
  }: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicTitle: string;
  }) => {
    if (!sharedTopicId || submitting[`${sharedTopicId}-${target}`]) return;
    setError('');
    setClonedTopic(null);
    setSubmitting((prev) => ({
      ...prev,
      [`${sharedTopicId}-${target}`]: true
    }));
    try {
      const data = await cloneSharedSystemPrompt({ sharedTopicId, target });
      // Store cloned topic info for navigation button
      if (
        typeof data?.subjectId === 'number' &&
        typeof data?.channelId === 'number'
      ) {
        setClonedTopic({
          sharedTopicId,
          target,
          topicId: data.subjectId,
          channelId: data.channelId,
          title: topicTitle
        });
      }
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
        </header>
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
                  {clonedTopic?.sharedTopicId ===
                    (topic.subjectId || topic.id) && (
                    <div
                      className={css`
                        padding: 1rem;
                        background: ${clonedTopic.target === 'zero'
                          ? Color.logoBlue(0.05)
                          : Color.pink(0.05)};
                        border: 1px solid
                          ${clonedTopic.target === 'zero'
                            ? Color.logoBlue(0.3)
                            : Color.pink(0.3)};
                        border-radius: ${borderRadius};
                        display: flex;
                        flex-direction: column;
                        gap: 0.8rem;
                      `}
                    >
                      <div
                        className={css`
                          display: flex;
                          align-items: center;
                          gap: 0.5rem;
                        `}
                      >
                        <Icon
                          icon="check-circle"
                          style={{
                            color: Color.limeGreen(),
                            fontSize: '1.4rem'
                          }}
                        />
                        <span
                          className={css`
                            font-weight: 700;
                            font-size: 1.3rem;
                            color: ${Color.darkerGray()};
                          `}
                        >
                          Cloned to{' '}
                          {clonedTopic.target === 'ciel' ? 'Ciel' : 'Zero'}!
                        </span>
                      </div>
                      <Button
                        color={
                          clonedTopic.target === 'zero' ? 'logoBlue' : 'purple'
                        }
                        variant="solid"
                        tone="raised"
                        style={{
                          padding: '0.8rem 1.2rem',
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                        onClick={() => {
                          const pathId =
                            Number(clonedTopic.channelId) +
                            Number(CHAT_ID_BASE_NUMBER);
                          navigate(
                            `/chat/${pathId}/topic/${clonedTopic.topicId}`
                          );
                        }}
                      >
                        <img
                          src={clonedTopic.target === 'zero' ? zero : ciel}
                          alt={clonedTopic.target === 'zero' ? 'Zero' : 'Ciel'}
                          className={css`
                            width: 2rem;
                            height: 2rem;
                            border-radius: 50%;
                            object-fit: contain;
                            background: #fff;
                          `}
                        />
                        Start chatting
                        <Icon icon="chevron-right" />
                      </Button>
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
                        variant="solid"
                        tone="raised"
                        onClick={() =>
                          handleClone({
                            sharedTopicId: topic.subjectId || topic.id,
                            target: 'zero',
                            topicTitle: topic.content
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
                            <img
                              src={zero}
                              alt="Zero"
                              className={css`
                                width: 2rem;
                                height: 2rem;
                                border-radius: 50%;
                                margin-right: 0.5rem;
                                object-fit: contain;
                                background: #fff;
                              `}
                            />
                            Clone to Zero
                          </>
                        )}
                      </Button>
                      <Button
                        color="purple"
                        variant="solid"
                        tone="raised"
                        onClick={() =>
                          handleClone({
                            sharedTopicId: topic.subjectId || topic.id,
                            target: 'ciel',
                            topicTitle: topic.content
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
                            <img
                              src={ciel}
                              alt="Ciel"
                              className={css`
                                width: 2rem;
                                height: 2rem;
                                border-radius: 50%;
                                margin-right: 0.5rem;
                                object-fit: contain;
                                background: #fff;
                              `}
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
