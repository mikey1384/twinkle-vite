import React, { useEffect, useMemo, useState } from 'react';
import Loading from '~/components/Loading';
import InvalidContent from '../../InvalidContent';
import ErrorBoundary from '~/components/ErrorBoundary';
import CloneButtons from '~/components/Buttons/CloneButtons';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import DefaultComponent from '../DefaultComponent';
import { useAppContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

interface SharedPrompt {
  id: number;
  content: string;
  customInstructions?: string;
  userId: number;
  username: string;
  timeStamp?: number;
  cloneCount?: number;
  messageCount?: number;
  myClones?: Array<{
    target: 'zero' | 'ciel';
    channelId: number;
    topicId: number;
  }>;
}

export default function SharedPromptComponent({
  src,
  isPreview
}: {
  src: string;
  isPreview?: boolean;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadSharedPrompt = useAppContext(
    (v) => v.requestHelpers.loadSharedPrompt
  );

  const promptId = useMemo(() => {
    try {
      // src is like "/shared-prompts/443" or "/shared-prompts/?promptId=443"
      const parts = src.split('?');
      const pathname = parts[0];
      const search = parts[1] || '';

      // Check for query param first: /shared-prompts/?promptId=123
      if (search) {
        const params = new URLSearchParams(search);
        const queryId = params.get('promptId');
        if (queryId) return queryId;
      }

      // Fallback to path param: /shared-prompts/123
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'shared-prompts' && pathParts[1]) {
        return pathParts[1];
      }
      return null;
    } catch {
      return null;
    }
  }, [src]);

  const [prompt, setPrompt] = useState<SharedPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!promptId) return;
    loadPrompt();
    async function loadPrompt() {
      setLoading(true);
      try {
        const data = await loadSharedPrompt(Number(promptId));
        if (data?.prompt) {
          setPrompt(data.prompt);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  if (!promptId) {
    return (
      <DefaultComponent
        linkType="shared-prompts"
        src={src}
        isPreview={isPreview}
      />
    );
  }

  return (
    <ErrorBoundary componentPath="RichText/EmbeddedComponent/InternalComponent/SharedPromptComponent">
      {loading ? (
        <Loading />
      ) : notFound ? (
        <InvalidContent style={{ marginTop: '2rem' }} />
      ) : prompt && isPreview ? (
        <button
          type="button"
          className={compactSharedPromptClass}
          onClick={handlePreviewClick}
        >
          <span>Shared Prompt</span>
          <strong>{prompt.content}</strong>
          {prompt.customInstructions ? (
            <p>{getPlainPreviewText(prompt.customInstructions)}</p>
          ) : null}
          <div className="compact-shared-prompt__stats">
            <span>{prompt.cloneCount || 0} clones</span>
            <span>{prompt.messageCount || 0} messages</span>
          </div>
        </button>
      ) : prompt ? (
        <article className={cardClass}>
          <header className={headerClass}>
            <h3
              className={titleClass}
              onClick={() => navigate(`/shared-prompts/${prompt.id}`)}
            >
              {prompt.content}
            </h3>
            <div className={metaClass}>
              <UsernameText
                user={{ id: prompt.userId, username: prompt.username }}
              />
              {prompt.timeStamp && (
                <small className={timeClass}>
                  {timeSince(prompt.timeStamp)}
                </small>
              )}
            </div>
            <div className={statsClass}>
              <span className={statPillClass}>
                <strong>{prompt.cloneCount || 0}</strong>{' '}
                {prompt.cloneCount === 1 ? 'clone' : 'clones'}
              </span>
              <span className={statPillClass}>
                <strong>{prompt.messageCount || 0}</strong>{' '}
                {prompt.messageCount === 1 ? 'message' : 'messages'}
              </span>
            </div>
          </header>
          {prompt.customInstructions && (
            <div className={instructionsClass}>
              <RichText
                contentType="sharedTopic"
                contentId={prompt.id}
                maxLines={6}
                isShowMoreButtonCentered
              >
                {prompt.customInstructions}
              </RichText>
            </div>
          )}
          {userId && prompt.userId !== userId && (
            <CloneButtons
              sharedTopicId={prompt.id}
              sharedTopicTitle={prompt.content}
              uploaderId={prompt.userId}
              myClones={prompt.myClones}
            />
          )}
        </article>
      ) : null}
    </ErrorBoundary>
  );

  function handlePreviewClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (prompt) {
      navigate(`/shared-prompts/${prompt.id}`);
    }
  }
}

function getPlainPreviewText(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const compactSharedPromptClass = css`
  appearance: none;
  display: flex;
  width: 100%;
  min-height: 8.2rem;
  flex-direction: column;
  gap: 0.3rem;
  overflow: hidden;
  padding: 0.8rem 0.9rem;
  border: 1px solid ${Color.logoBlue(0.5)};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: left;
  cursor: pointer;
  > span {
    color: ${Color.logoBlue()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
  }
  strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.25rem;
    font-weight: 900;
    line-height: 1.15;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  p {
    margin: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .compact-shared-prompt__stats {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.1rem;
  }
  .compact-shared-prompt__stats span {
    padding: 0.22rem 0.5rem;
    border-radius: 999px;
    background: ${Color.logoBlue(0.1)};
    color: ${Color.logoBlue()};
    font-size: 1rem;
    font-weight: 850;
    line-height: 1.1;
  }
`;

const cardClass = css`
  width: 100%;
  max-width: 500px;
  margin: 1rem auto;
  background: #fff;
  border-radius: ${borderRadius};
  padding: 1rem 1.2rem 1.3rem;
  border: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  /* Reset styles inherited from RichText */
  button img {
    width: auto;
    max-height: none;
    display: inline;
    object-fit: cover;
  }
  h3 {
    margin: 0;
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    max-width: 100%;
  }
`;

const headerClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const titleClass = css`
  margin: 0 !important;
  font-size: 1.7rem;
  color: ${Color.logoBlue()};
  font-weight: 700;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const metaClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
`;

const timeClass = css`
  color: ${Color.gray()};
`;

const statsClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.3rem;
`;

const statPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: ${Color.highlightGray(0.2)};
  border: 1px solid var(--ui-border);
  font-size: 1.1rem;
  font-weight: 500;
`;

const instructionsClass = css`
  padding: 0.8rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: ${Color.wellGray()};
  font-size: 1.3rem;
  line-height: 1.5;
`;
