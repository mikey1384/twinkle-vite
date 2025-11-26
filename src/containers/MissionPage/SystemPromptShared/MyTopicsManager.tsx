import React, { useEffect, useState } from 'react';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import RichText from '~/components/Texts/RichText';
import { useAppContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import moment from 'moment';

interface MyTopic {
  id: number;
  channelId: number;
  content: string;
  customInstructions: string;
  isSharedWithOtherUsers: boolean;
  sharedAt: number | null;
  timeStamp: number;
}

const INITIAL_DISPLAY_COUNT = 1;
const LOAD_LIMIT = 10;

export default function MyTopicsManager() {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [topics, setTopics] = useState<MyTopic[]>([]);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [updatingTopicId, setUpdatingTopicId] = useState<number | null>(null);

  const loadMyCustomInstructionTopics = useAppContext(
    (v) => v.requestHelpers.loadMyCustomInstructionTopics
  );
  const updateTopicShareState = useAppContext(
    (v) => v.requestHelpers.updateTopicShareState
  );

  useEffect(() => {
    handleLoadTopics();
    async function handleLoadTopics() {
      setLoading(true);
      try {
        const { topics: loadedTopics, loadMoreButton: hasMore } =
          await loadMyCustomInstructionTopics({ limit: LOAD_LIMIT });
        setTopics(loadedTopics || []);
        setLoadMoreButton(Boolean(hasMore));
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = async () => {
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
  };

  const handleToggleShare = async (topic: MyTopic) => {
    setUpdatingTopicId(topic.id);
    try {
      await updateTopicShareState({
        channelId: topic.channelId,
        topicId: topic.id,
        shareWithOtherUsers: !topic.isSharedWithOtherUsers
      });
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id
            ? {
                ...t,
                isSharedWithOtherUsers: !t.isSharedWithOtherUsers,
                sharedAt: !t.isSharedWithOtherUsers ? Date.now() / 1000 : null
              }
            : t
        )
      );
    } catch (error) {
      console.error('Failed to update share state:', error);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const sharedCount = topics.filter((t) => t.isSharedWithOtherUsers).length;
  const displayedTopics = expanded ? topics : topics.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreToShow = !expanded && topics.length > INITIAL_DISPLAY_COUNT;
  const hiddenCount = topics.length - INITIAL_DISPLAY_COUNT;

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
              Manage Your Shared Prompts
            </h3>
            <p
              className={css`
                margin: 0.3rem 0 0;
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
              `}
            >
              {sharedCount > 0
                ? `${sharedCount} ${
                    sharedCount === 1 ? 'prompt' : 'prompts'
                  } shared`
                : 'Share your custom prompts with others'}
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
        {loading ? (
          <div
            className={css`
              padding: 3rem;
            `}
          >
            <Loading />
          </div>
        ) : topics.length === 0 ? (
          <div
            className={css`
              padding: 3rem 2rem;
              text-align: center;
              color: ${Color.gray()};
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
              You don't have any topics with custom instructions yet.
              <br />
              Create a custom prompt in the Mission tab first!
            </p>
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
            {displayedTopics.map((topic) => (
              <div
                key={topic.id}
                className={css`
                  padding: 1.2rem;
                  border: 1px solid var(--ui-border);
                  border-radius: ${borderRadius};
                  background: ${topic.isSharedWithOtherUsers
                    ? Color.logoBlue(0.03)
                    : '#fff'};
                  transition: all 0.2s ease;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 1rem;
                    margin-bottom: 0.8rem;
                  `}
                >
                  <div
                    className={css`
                      flex: 1;
                    `}
                  >
                    <h4
                      className={css`
                        margin: 0 0 0.3rem;
                        font-size: 1.6rem;
                        color: ${Color.black()};
                        font-weight: 700;
                      `}
                    >
                      {topic.content}
                    </h4>
                    {topic.isSharedWithOtherUsers && topic.sharedAt && (
                      <div
                        className={css`
                          display: flex;
                          align-items: center;
                          gap: 0.5rem;
                          font-size: 1.1rem;
                          color: ${Color.gray()};
                        `}
                      >
                        <Icon icon="users" style={{ fontSize: '1rem' }} />
                        <span>
                          Shared {moment.unix(topic.sharedAt).fromNow()}
                        </span>
                      </div>
                    )}
                  </div>
                  <SwitchButton
                    checked={topic.isSharedWithOtherUsers}
                    onChange={() => handleToggleShare(topic)}
                    disabled={updatingTopicId === topic.id}
                    label="Share"
                    labelStyle={{
                      fontSize: '1.2rem',
                      color: Color.darkerGray(),
                      fontWeight: '500'
                    }}
                  />
                </div>
                <div
                  className={css`
                    padding: 0.8rem;
                    border-radius: ${borderRadius};
                    border: 1px solid var(--ui-border);
                    background: #fff;
                  `}
                >
                  <RichText
                    contentType="customInstructions"
                    contentId={topic.id}
                    maxLines={5}
                    style={{
                      fontSize: '1.2rem',
                      color: Color.darkerGray()
                    }}
                  >
                    {topic.customInstructions}
                  </RichText>
                </div>
              </div>
            ))}

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
}
