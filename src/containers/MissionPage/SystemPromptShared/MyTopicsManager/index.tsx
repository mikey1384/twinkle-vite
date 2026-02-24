import React, { useEffect, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Button from '~/components/Button';
import SearchInput from '~/components/Texts/SearchInput';
import { useAppContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';

import ManagePromptRow from './ManagePromptRow';
import SharedPromptRow from './SharedPromptRow';
import type { MyTopic } from './types';

const INITIAL_DISPLAY_COUNT = 1;
const LOAD_LIMIT = 10;
const INITIAL_SHARED_PROMPTS_DISPLAY_COUNT = 2;
const SHARED_PROMPT_SEARCH_THRESHOLD = 6;
const SHARED_PROMPTS_SEARCH_LIMIT = 50;
const SHARED_PROMPT_SEARCH_DEBOUNCE_MS = 250;
const SYSTEM_PROMPT_TOPIC_UPDATED_EVENT = 'twinkle:system-prompt-topic-updated';

export default function MyTopicsManager() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [sharedSearchText, setSharedSearchText] = useState('');
  const [sharedSearchResults, setSharedSearchResults] = useState<MyTopic[]>([]);
  const [sharedSearchLoadMoreButton, setSharedSearchLoadMoreButton] =
    useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSharedPrompts, setLoadingSharedPrompts] = useState(true);
  const [loadingSharedSearch, setLoadingSharedSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreSharedPrompts, setLoadingMoreSharedPrompts] =
    useState(false);
  const [loadingMoreSharedSearch, setLoadingMoreSharedSearch] = useState(false);
  const [topics, setTopics] = useState<MyTopic[]>([]);
  const [sharedPrompts, setSharedPrompts] = useState<MyTopic[]>([]);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [updatingTopicId, setUpdatingTopicId] = useState<number | null>(null);
  const [sharedTotals, setSharedTotals] = useState({
    totalCount: 0,
    totalClones: 0,
    totalMessages: 0
  });

  const sharedSearchTextRef = useRef('');
  sharedSearchTextRef.current = sharedSearchText;
  const autoLoadSharedPromptsAttemptedRef = useRef(false);
  const latestLoadTopicsRequestIdRef = useRef(0);

  const loadMyCustomInstructionTopics = useAppContext(
    (v) => v.requestHelpers.loadMyCustomInstructionTopics
  );
  const loadMySharedPrompts = useAppContext(
    (v) => v.requestHelpers.loadMySharedPrompts
  );
  const updateTopicShareState = useAppContext(
    (v) => v.requestHelpers.updateTopicShareState
  );

  useEffect(() => {
    handleLoadTopics();
    if (typeof window === 'undefined') return;
    function handleSystemPromptTopicUpdated() {
      handleLoadTopics();
    }
    window.addEventListener(
      SYSTEM_PROMPT_TOPIC_UPDATED_EVENT,
      handleSystemPromptTopicUpdated
    );
    return () => {
      window.removeEventListener(
        SYSTEM_PROMPT_TOPIC_UPDATED_EVENT,
        handleSystemPromptTopicUpdated
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const query = sharedSearchText.trim();
    if (!query) {
      setSharedSearchResults([]);
      setSharedSearchLoadMoreButton(false);
      setLoadingSharedSearch(false);
      return;
    }

    let canceled = false;
    setSharedSearchResults([]);
    setSharedSearchLoadMoreButton(false);
    setLoadingSharedSearch(true);
    const timer = setTimeout(() => {
      handleSearch();
      async function handleSearch() {
        try {
          const { prompts, loadMoreButton: hasMore } =
            await loadMySharedPrompts({
              limit: SHARED_PROMPTS_SEARCH_LIMIT,
              searchText: query
            });
          if (canceled) return;
          setSharedSearchResults(prompts || []);
          setSharedSearchLoadMoreButton(Boolean(hasMore));
        } catch (error) {
          if (canceled) return;
          console.error('Failed to search shared prompts:', error);
          setSharedSearchResults([]);
          setSharedSearchLoadMoreButton(false);
        } finally {
          if (!canceled) {
            setLoadingSharedSearch(false);
          }
        }
      }
    }, SHARED_PROMPT_SEARCH_DEBOUNCE_MS);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedSearchText]);

  useEffect(() => {
    const shouldAutoLoad =
      !sharedSearchText.trim() &&
      sharedTotals.totalCount > 0 &&
      sharedPrompts.length === 0;

    if (!shouldAutoLoad) {
      autoLoadSharedPromptsAttemptedRef.current = false;
      return;
    }

    if (loadingSharedPrompts || loadingMoreSharedPrompts) return;
    if (autoLoadSharedPromptsAttemptedRef.current) return;
    autoLoadSharedPromptsAttemptedRef.current = true;
    handleLoadMoreSharedPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sharedSearchText,
    sharedTotals.totalCount,
    sharedPrompts.length,
    loadingSharedPrompts,
    loadingMoreSharedPrompts
  ]);

  const sharedCount = sharedTotals.totalCount;
  const totalClones = sharedTotals.totalClones;
  const totalMessages = sharedTotals.totalMessages;
  const sharedSearchActive = sharedSearchText.trim().length > 0;

  const displayedSharedPrompts = sharedSearchActive
    ? sharedSearchResults
    : sharedPrompts;
  const sharedHasMoreToLoad = sharedPrompts.length < sharedCount;

  const displayedTopics = expanded
    ? topics
    : topics.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreToShow = !expanded && topics.length > INITIAL_DISPLAY_COUNT;
  const hiddenCount = topics.length - INITIAL_DISPLAY_COUNT;
  const handleOpenSharedPrompt = (topicId: number) => {
    navigate(`/shared-prompts/${topicId}`);
  };

  return (
    <div
      className={css`
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        margin-bottom: 1.4rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      <div
        className={css`
          padding: 1.2rem 1.8rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.1rem 1.4rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 1rem;
          `}
        >
          <Icon
            icon="cog"
            style={{
              fontSize: '1.8rem',
              color: Color.darkerGray()
            }}
          />
          <div>
            <h3
              className={css`
                margin: 0;
                font-size: 1.8rem;
                color: ${Color.black()};
                font-weight: 700;
              `}
            >
              Your Shared Prompts
            </h3>
            <p
              className={css`
                margin: 0.3rem 0 0;
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
              `}
            >
              {sharedCount > 0 ? (
                <>
                  {sharedCount} {sharedCount === 1 ? 'prompt' : 'prompts'} •{' '}
                  {totalClones} {totalClones === 1 ? 'clone' : 'clones'} •{' '}
                  {totalMessages}{' '}
                  {totalMessages === 1 ? 'message' : 'messages'}
                </>
              ) : (
                'Share a prompt to see clones and messages here'
              )}
            </p>
          </div>
        </div>
      </div>

      <div
        className={css`
          padding: 0 1.8rem 1.8rem;
          border-top: 1px solid var(--ui-border);
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0 1.4rem 1.4rem;
          }
        `}
      >
        {loading || loadingSharedPrompts ? (
          <div
            className={css`
              padding: 3rem;
            `}
          >
            <Loading />
          </div>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
              margin-top: 1.5rem;
            `}
          >
            {sharedCount === 0 ? (
              <div
                className={css`
                  padding: 2rem 1.2rem;
                  text-align: center;
                  color: ${Color.gray()};
                  border: 1px dashed var(--ui-border);
                  border-radius: ${borderRadius};
                `}
              >
                <Icon
                  icon="users"
                  style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    opacity: 0.5
                  }}
                />
                <p
                  className={css`
                    margin: 0;
                    font-size: 1.3rem;
                  `}
                >
                  No shared prompts yet.
                  <br />
                  Turn on <b>Share</b> for a topic below to publish it.
                </p>
              </div>
            ) : (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                `}
              >
                {sharedCount > SHARED_PROMPT_SEARCH_THRESHOLD && (
                  <div
                    className={css`
                      display: flex;
                      width: 100%;
                      align-items: center;
                      gap: 0.75rem;
                    `}
                  >
                    <SearchInput
                      placeholder="Search your shared prompts..."
                      onChange={setSharedSearchText}
                      value={sharedSearchText}
                      inputHeight="3.8rem"
                      style={{ flex: 1, width: 'auto' }}
                    />
                    {sharedSearchActive && (
                      <Button
                        variant="soft"
                        color="logoBlue"
                        tone="raised"
                        onClick={() => setSharedSearchText('')}
                        style={{
                          padding: '0.7rem 1rem',
                          fontSize: '1.2rem'
                        }}
                      >
                        <Icon icon="xmark" />
                      </Button>
                    )}
                  </div>
                )}

                {loadingSharedSearch && sharedSearchActive ? (
                  <div
                    className={css`
                      padding: 2rem;
                    `}
                  >
                    <Loading />
                  </div>
                ) : displayedSharedPrompts.length === 0 ? (
                  <div
                    className={css`
                      padding: 1.6rem 1.2rem;
                      text-align: center;
                      color: ${Color.gray()};
                      border: 1px dashed var(--ui-border);
                      border-radius: ${borderRadius};
                    `}
                  >
                    {sharedSearchActive ? (
                      <>
                        <Icon
                          icon="magnifying-glass"
                          style={{
                            fontSize: '2.6rem',
                            marginBottom: '0.8rem',
                            opacity: 0.5
                          }}
                        />
                        <p
                          className={css`
                            margin: 0;
                            font-size: 1.3rem;
                          `}
                        >
                          No shared prompts match “{sharedSearchText.trim()}”.
                        </p>
                      </>
                    ) : (
                      <Loading />
                    )}
                  </div>
                ) : (
                  displayedSharedPrompts.map((topic) => (
                    <SharedPromptRow
                      key={topic.id}
                      topic={topic}
                      copiedId={copiedId}
                      updatingTopicId={updatingTopicId}
                      onCopyEmbed={handleCopyEmbed}
                      onToggleShare={handleToggleShare}
                      onOpen={handleOpenSharedPrompt}
                    />
                  ))
                )}

                {!sharedSearchActive && sharedHasMoreToLoad && (
                  <LoadMoreButton
                    loading={loadingMoreSharedPrompts}
                    onClick={handleLoadMoreSharedPrompts}
                    style={{ marginTop: '0.5rem' }}
                  />
                )}

                {sharedSearchActive &&
                  !loadingSharedSearch &&
                  sharedSearchLoadMoreButton && (
                  <LoadMoreButton
                    loading={loadingMoreSharedSearch}
                    onClick={handleLoadMoreSharedSearch}
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>
            )}

            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding-top: 0.25rem;
              `}
            >
              <h4
                className={css`
                  margin: 0;
                  font-size: 1.4rem;
                  font-weight: 800;
                  color: ${Color.darkerGray()};
                `}
              >
                Manage prompts
              </h4>
            </div>

            {topics.length === 0 ? (
              <div
                className={css`
                  padding: 2rem 1.2rem;
                  text-align: center;
                  color: ${Color.gray()};
                  border: 1px dashed var(--ui-border);
                  border-radius: ${borderRadius};
                `}
              >
                <Icon
                  icon="comment-slash"
                  style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    opacity: 0.5
                  }}
                />
                <p
                  className={css`
                    margin: 0;
                    font-size: 1.3rem;
                  `}
                >
                  You don&apos;t have any topics with custom instructions yet.
                  <br />
                  Create a custom prompt in the Mission tab first!
                </p>
              </div>
            ) : (
              <>
                {displayedTopics.map((topic) => (
                  <ManagePromptRow
                    key={topic.id}
                    topic={topic}
                    copiedId={copiedId}
                    updatingTopicId={updatingTopicId}
                    onCopyEmbed={handleCopyEmbed}
                    onToggleShare={handleToggleShare}
                    onOpen={handleOpenSharedPrompt}
                  />
                ))}
              </>
            )}

            {hasMoreToShow && (
              <button
                onClick={() => setExpanded(true)}
                className={css`
                  width: 100%;
                  padding: 1rem;
                  background: ${Color.highlightGray(0.1)};
                  border: 1px solid var(--ui-border);
                  border-radius: ${borderRadius};
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.6rem;
                  font-size: 1.3rem;
                  font-weight: 600;
                  color: ${Color.darkerGray()};
                  transition: all 0.2s ease;
                  &:hover {
                    background: ${Color.highlightGray(0.2)};
                  }
                `}
              >
                <Icon icon="chevron-down" />
                Show {hiddenCount} more{' '}
                {hiddenCount === 1 ? 'prompt' : 'prompts'}
              </button>
            )}

            {expanded && loadMoreButton && (
              <LoadMoreButton
                loading={loadingMore}
                onClick={handleLoadMore}
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  async function handleLoadTopics() {
    const requestId = latestLoadTopicsRequestIdRef.current + 1;
    latestLoadTopicsRequestIdRef.current = requestId;
    setLoading(true);
    setLoadingSharedPrompts(true);
    try {
      const [topicsResult, sharedPromptsResult] = await Promise.allSettled([
        loadMyCustomInstructionTopics({ limit: LOAD_LIMIT }),
        loadMySharedPrompts({ limit: INITIAL_SHARED_PROMPTS_DISPLAY_COUNT })
      ]);

      if (latestLoadTopicsRequestIdRef.current !== requestId) {
        return;
      }

      if (topicsResult.status === 'fulfilled') {
        const { topics: loadedTopics, loadMoreButton: hasMore } =
          topicsResult.value || {};
        setTopics(loadedTopics || []);
        setLoadMoreButton(Boolean(hasMore));
      } else {
        console.error('Failed to load topics:', topicsResult.reason);
      }

      if (sharedPromptsResult.status === 'fulfilled') {
        const { prompts, totalCount, totalClones, totalMessages } =
          sharedPromptsResult.value || {};
        setSharedPrompts(prompts || []);
        setSharedTotals({
          totalCount: Number(totalCount) || 0,
          totalClones: Number(totalClones) || 0,
          totalMessages: Number(totalMessages) || 0
        });
      } else {
        console.error(
          'Failed to load shared prompt stats:',
          sharedPromptsResult.reason
        );
      }
    } finally {
      if (latestLoadTopicsRequestIdRef.current === requestId) {
        setLoading(false);
        setLoadingSharedPrompts(false);
      }
    }
  }

  async function handleLoadMore() {
    if (!loadMoreButton || loadingMore || topics.length === 0) return;
    const lastTopic = topics[topics.length - 1];
    setLoadingMore(true);
    try {
      const { topics: moreTopics, loadMoreButton: hasMore } =
        await loadMyCustomInstructionTopics({
          limit: LOAD_LIMIT,
          lastId: lastTopic.id
        });
      setTopics((prev) => prev.concat(moreTopics || []));
      setLoadMoreButton(Boolean(hasMore));
    } catch (error) {
      console.error('Failed to load more topics:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleLoadMoreSharedPrompts() {
    if (loadingMoreSharedPrompts) return;
    const hasMore = sharedPrompts.length < sharedTotals.totalCount;
    if (!hasMore) return;
    const lastPrompt = sharedPrompts[sharedPrompts.length - 1];
    const canUseCursor = Boolean(lastPrompt?.sharedAt);

    setLoadingMoreSharedPrompts(true);
    try {
      const {
        prompts: morePrompts,
        totalCount,
        totalClones,
        totalMessages
      } = await loadMySharedPrompts({
        limit: LOAD_LIMIT,
        ...(canUseCursor
          ? {
              lastId: lastPrompt.id,
              lastSharedAt: lastPrompt.sharedAt as number
            }
          : {})
      });
      setSharedPrompts((prev) =>
        prev.length > 0 ? prev.concat(morePrompts || []) : morePrompts || []
      );
      setSharedTotals({
        totalCount: Number(totalCount) || 0,
        totalClones: Number(totalClones) || 0,
        totalMessages: Number(totalMessages) || 0
      });
    } catch (error) {
      console.error('Failed to load more shared prompts:', error);
    } finally {
      setLoadingMoreSharedPrompts(false);
    }
  }

  async function handleLoadMoreSharedSearch() {
    if (
      loadingSharedSearch ||
      loadingMoreSharedSearch ||
      !sharedSearchLoadMoreButton ||
      sharedSearchResults.length === 0
    ) {
      return;
    }
    const lastResult = sharedSearchResults[sharedSearchResults.length - 1];
    if (!lastResult?.sharedAt) return;

    setLoadingMoreSharedSearch(true);
    try {
      const query = sharedSearchText.trim();
      if (!query) return;
      const queryAtRequest = query;
      const { prompts: morePrompts, loadMoreButton: hasMore } =
        await loadMySharedPrompts({
          limit: SHARED_PROMPTS_SEARCH_LIMIT,
          searchText: query,
          lastId: lastResult.id,
          lastSharedAt: lastResult.sharedAt
        });
      if (sharedSearchTextRef.current.trim() !== queryAtRequest) {
        return;
      }
      setSharedSearchResults((prev) => prev.concat(morePrompts || []));
      setSharedSearchLoadMoreButton(Boolean(hasMore));
    } catch (error) {
      console.error('Failed to load more search results:', error);
    } finally {
      setLoadingMoreSharedSearch(false);
    }
  }

  async function handleToggleShare(topic: MyTopic) {
    setUpdatingTopicId(topic.id);
    try {
      const topicFromTopics = topics.find((t) => t.id === topic.id);
      const topicFromSharedPrompts = sharedPrompts.find((p) => p.id === topic.id);
      const topicFromSearchResults = sharedSearchResults.find(
        (p) => p.id === topic.id
      );
      const currentIsShared =
        topicFromTopics?.isSharedWithOtherUsers ??
        topicFromSharedPrompts?.isSharedWithOtherUsers ??
        topicFromSearchResults?.isSharedWithOtherUsers ??
        topic.isSharedWithOtherUsers;
      const nextIsShared = !currentIsShared;
      const effectiveTopic =
        topicFromTopics || topicFromSharedPrompts || topicFromSearchResults || topic;
      const cloneDelta = Number(effectiveTopic.cloneCount) || 0;
      const messageDelta = Number(effectiveTopic.messageCount) || 0;
      const nowSec = Math.floor(Date.now() / 1000);

      await updateTopicShareState({
        channelId: topic.channelId,
        topicId: topic.id,
        shareWithOtherUsers: nextIsShared
      });
      setSharedTotals((prev) => ({
        totalCount: Math.max(0, prev.totalCount + (nextIsShared ? 1 : -1)),
        totalClones: Math.max(
          0,
          prev.totalClones + (nextIsShared ? cloneDelta : -cloneDelta)
        ),
        totalMessages: Math.max(
          0,
          prev.totalMessages + (nextIsShared ? messageDelta : -messageDelta)
        )
      }));
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id
            ? {
                ...t,
                isSharedWithOtherUsers: nextIsShared,
                sharedAt: nextIsShared ? nowSec : null
              }
            : t
        )
      );
      setSharedPrompts((prev) => {
        if (nextIsShared) {
          const alreadyIncluded = prev.some((p) => p.id === topic.id);
          if (alreadyIncluded) {
            return prev.map((p) =>
              p.id === topic.id
                ? {
                    ...p,
                    isSharedWithOtherUsers: true,
                    sharedAt: nowSec
                  }
                : p
            );
          }
          return [
            {
              ...topic,
              isSharedWithOtherUsers: true,
              sharedAt: nowSec,
              cloneCount: cloneDelta,
              messageCount: messageDelta,
              numComments: Number(effectiveTopic.numComments) || 0
            },
            ...prev
          ];
        }
        return prev.filter((p) => p.id !== topic.id);
      });
      setSharedSearchResults((prev) => {
        const query = sharedSearchTextRef.current.trim().toLowerCase();
        if (!query) return prev;

        const matchesQuery = (topic.content || '')
          .toLowerCase()
          .includes(query);

        if (nextIsShared) {
          if (!matchesQuery) return prev;
          const alreadyIncluded = prev.some((p) => p.id === topic.id);
          if (alreadyIncluded) {
            return prev.map((p) =>
              p.id === topic.id
                ? {
                    ...p,
                    isSharedWithOtherUsers: true,
                    sharedAt: nowSec
                  }
                : p
            );
          }
          return [
            {
              ...topic,
              isSharedWithOtherUsers: true,
              sharedAt: nowSec,
              cloneCount: cloneDelta,
              messageCount: messageDelta,
              numComments: Number(effectiveTopic.numComments) || 0
            },
            ...prev
          ];
        }

        return prev.filter((p) => p.id !== topic.id);
      });
    } catch (error) {
      console.error('Failed to update share state:', error);
    } finally {
      setUpdatingTopicId(null);
    }
  }

  async function handleCopyEmbed(topicId: number) {
    const embedUrl = `![](https://www.twin-kle.com/shared-prompts/${topicId})`;
    try {
      await navigator.clipboard.writeText(embedUrl);
      setCopiedId(topicId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }
}
