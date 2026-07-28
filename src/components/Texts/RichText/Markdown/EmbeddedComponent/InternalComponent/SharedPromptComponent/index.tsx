import React, { useEffect, useMemo, useState } from 'react';
import Loading from '~/components/Loading';
import InvalidContent from '../../InvalidContent';
import ErrorBoundary from '~/components/ErrorBoundary';
import CloneButtons from '~/components/Buttons/CloneButtons';
import SharedPromptBlock from '~/components/SharedPromptBlock';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import DefaultComponent from '../DefaultComponent';
import { useAppContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { getPlainPreviewText } from '~/helpers/stringHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';

interface SharedPrompt {
  id: number;
  content: string;
  customInstructions?: string;
  userId: number;
  username: string;
  profileTheme?: string;
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
          <SharedPromptBlock
            density="compact"
            stats={[
              {
                label: prompt.cloneCount === 1 ? 'clone' : 'clones',
                value: prompt.cloneCount || 0
              },
              {
                label: prompt.messageCount === 1 ? 'message' : 'messages',
                value: prompt.messageCount || 0
              }
            ]}
            themeName={prompt.profileTheme}
            title={prompt.content}
          >
            {prompt.customInstructions ? (
              <p className="compact-shared-prompt__instructions">
                {getPlainPreviewText(prompt.customInstructions)}
              </p>
            ) : null}
          </SharedPromptBlock>
        </button>
      ) : prompt ? (
        <SharedPromptBlock
          className={cardClass}
          footer={
            userId && prompt.userId !== userId ? (
              <CloneButtons
                sharedTopicId={prompt.id}
                sharedTopicTitle={prompt.content}
                uploaderId={prompt.userId}
                myClones={prompt.myClones}
              />
            ) : null
          }
          meta={
            <>
              <UsernameText
                user={{ id: prompt.userId, username: prompt.username }}
              />
              {prompt.timeStamp ? (
                <small className={timeClass}>
                  {timeSince(prompt.timeStamp)}
                </small>
              ) : null}
            </>
          }
          stats={[
            {
              label: prompt.cloneCount === 1 ? 'clone' : 'clones',
              value: prompt.cloneCount || 0
            },
            {
              label: prompt.messageCount === 1 ? 'message' : 'messages',
              value: prompt.messageCount || 0
            }
          ]}
          themeName={prompt.profileTheme}
          title={prompt.content}
          onTitleClick={() => navigate(`/shared-prompts/${prompt.id}`)}
        >
          {prompt.customInstructions ? (
            <RichText
              contentType="sharedTopic"
              contentId={prompt.id}
              maxLines={6}
              isShowMoreButtonCentered
              theme={prompt.profileTheme}
            >
              {prompt.customInstructions}
            </RichText>
          ) : null}
        </SharedPromptBlock>
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

// The tile is only a click target and a fit — SharedPromptBlock inside it
// carries the design, at compact density.
const compactSharedPromptClass = css`
  appearance: none;
  display: flex;
  width: 100%;
  min-height: 8.2rem;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;

  .compact-shared-prompt__instructions {
    margin: 0;
    overflow: hidden;
    color: ${Color.darkerGray()};
    /* The well sets the prompt type scale; feed styles must not shrink it. */
    font-size: inherit;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
`;

// Placement only — the frame, tint and typography belong to SharedPromptBlock
// so this embed and the feed's prompt card stay one design.
const cardClass = css`
  max-width: 500px;
  margin: 1rem auto;

  /* Reset styles inherited from RichText */
  button img {
    width: auto;
    max-height: none;
    display: inline;
    object-fit: cover;
  }

  @media (max-width: ${mobileMaxWidth}) {
    max-width: 100%;
  }
`;

const timeClass = css`
  color: ${Color.gray()};
`;



