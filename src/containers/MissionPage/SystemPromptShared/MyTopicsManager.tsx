import React, { useEffect, useState } from 'react';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Loading from '~/components/Loading';
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

export default function MyTopicsManager() {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<MyTopic[]>([]);
  const [updatingTopicId, setUpdatingTopicId] = useState<number | null>(null);

  const loadMyCustomInstructionTopics = useAppContext(
    (v) => v.requestHelpers.loadMyCustomInstructionTopics
  );
  const updateTopicShareState = useAppContext(
    (v) => v.requestHelpers.updateTopicShareState
  );

  useEffect(() => {
    if (expanded && topics.length === 0) {
      handleLoadTopics();
    }
    async function handleLoadTopics() {
      setLoading(true);
      try {
        const loadedTopics = await loadMyCustomInstructionTopics();
        setTopics(loadedTopics || []);
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const handleToggleShare = async (topic: MyTopic) => {
    setUpdatingTopicId(topic.id);
    try {
      await updateTopicShareState({
        channelId: topic.channelId,
        topicId: topic.id,
        shareWithOtherUsers: !topic.isSharedWithOtherUsers
      });
      // Update local state
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
      <button
        onClick={() => setExpanded(!expanded)}
        className={css`
          width: 100%;
          padding: 1.2rem 1.8rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease;
          &:hover {
            background: ${Color.highlightGray(0.1)};
          }
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
          <div
            className={css`
              text-align: left;
            `}
          >
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
        <Icon
          icon={expanded ? 'chevron-up' : 'chevron-down'}
          style={{
            fontSize: '1.5rem',
            color: Color.darkerGray(),
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {expanded && (
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
              {topics.map((topic) => (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
