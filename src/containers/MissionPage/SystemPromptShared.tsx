import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import { useAppContext, useKeyContext } from '~/contexts';
import { borderRadius, Color, liftedBoxShadow, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import moment from 'moment';

type SharedTopic = {
  id: number;
  subjectId?: number;
  content: string;
  userId: number;
  username: string;
  timeStamp?: number;
  customInstructions?: string;
  settings?: any;
};

export default function SystemPromptShared() {
  const loadOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadOtherUserTopics
  );
  const loadMoreOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadMoreOtherUserTopics
  );
  const cloneSharedSystemPrompt = useAppContext(
    (v) => v.requestHelpers.cloneSharedSystemPrompt
  );
  const theme = useKeyContext((v) => v.theme);
  const [topics, setTopics] = useState<SharedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setError('');
      try {
        const { subjects, loadMoreButton: hasMore } = await loadOtherUserTopics();
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
  }, [loadOtherUserTopics]);

  const titleColor = useMemo(
    () => theme?.content?.color || Color.darkerGray(),
    [theme?.content?.color]
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
            timeStamp: last.timeStamp || 0
          }
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
      await cloneSharedSystemPrompt({ sharedTopicId, target });
      setStatus(
        `Cloned to ${target === 'ciel' ? 'Ciel' : 'Zero'} chat. Open chat to start talking.`
      );
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
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
          `}
        >
          <div>
            <h2
              className={css`
                margin: 0;
                font-size: 2.2rem;
                color: ${titleColor};
              `}
            >
              Shared System Prompts
            </h2>
            <p
              className={css`
                margin: 0.5rem 0 0;
                color: ${Color.darkerGray()};
                max-width: 52rem;
                line-height: 1.5;
              `}
            >
              Browse shared Zero/Ciel topics from other users and clone one into your AI chat to complete the mission checklist.
            </p>
          </div>
          {status && (
            <div
              className={css`
                color: ${Color.green()};
                font-weight: 700;
                max-width: 28rem;
              `}
            >
              {status}
            </div>
          )}
        </header>
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
                          font-size: 1.6rem;
                          color: ${Color.logoBlue()};
                        `}
                      >
                        {topic.content}
                      </h3>
                      <div
                        className={css`
                          color: ${Color.darkerGray()};
                          font-size: 1.2rem;
                          margin-top: 0.2rem;
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
                      </div>
                    </div>
                  </div>
                  {instructions && (
                    <div
                      className={css`
                        margin: 0.8rem 0;
                        padding: 0.8rem;
                        border-radius: ${borderRadius};
                        border: 1px solid ${Color.borderGray()};
                        background: ${Color.highlightGray(0.25)};
                      `}
                    >
                      <RichText
                        contentType="sharedTopic"
                        contentId={topic.id}
                        maxLines={4}
                        isShowMoreButtonCentered
                      >
                        {instructions}
                      </RichText>
                    </div>
                  )}
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
              filled
              color="logoBlue"
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
  background: ${Color.white()};
  border-radius: ${borderRadius};
  padding: 1rem 1rem 1.3rem;
  box-shadow: ${liftedBoxShadow};
  border: 1px solid ${Color.borderGray(0.6)};
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;
