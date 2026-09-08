import React, { useEffect, useMemo, useState } from 'react';
import Loading from '~/components/Loading';
import InvalidContent from '../../InvalidContent';
import EmbedLoadError from '../../EmbedLoadError';
import ErrorBoundary from '~/components/ErrorBoundary';
import CloneButtons from '~/components/Buttons/CloneButtons';
import SharedPromptBlock from '~/components/SharedPromptBlock';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import DefaultComponent from '../DefaultComponent';
import { useAppContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { css, cx } from '@emotion/css';
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
  isPreview,
  isChat = false
}: {
  src: string;
  isPreview?: boolean;
  isChat?: boolean;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadSharedPrompt = useAppContext(
    (v) => v.requestHelpers.loadSharedPrompt
  );

  const promptId = useMemo(() => {
    try {
      const url = new URL(src, 'https://twinkle.local');
      const pathParts = url.pathname.split('/').filter(Boolean);
      const candidate = url.searchParams.get('promptId') ||
        (pathParts[0] === 'shared-prompts' ? pathParts[1] : undefined);
      return candidate ? Number(candidate) : null;
    } catch {
      return NaN;
    }
  }, [src]);
  const validPromptId = Number.isSafeInteger(promptId) && Number(promptId) > 0;
  const requestKey = `${userId}:${promptId}`;

  const [loadedPrompt, setLoadedPrompt] = useState<{
    key: string;
    data: SharedPrompt;
  } | null>(null);
  const [requestState, setRequestState] = useState<{
    key: string;
    status: 'loading' | 'ready' | 'error' | 'notFound';
  } | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const prompt = loadedPrompt?.key === requestKey ? loadedPrompt.data : null;
  const status = requestState?.key === requestKey ? requestState.status : 'loading';

  useEffect(() => {
    if (!validPromptId) return;
    let cancelled = false;
    setRequestState({ key: requestKey, status: 'loading' });
    loadPrompt();
    async function loadPrompt() {
      try {
        const data = await loadSharedPrompt(Number(promptId));
        if (cancelled) return;
        if (data?.prompt) {
          setLoadedPrompt({ key: requestKey, data: data.prompt });
        }
        setRequestState({ key: requestKey, status: data?.prompt ? 'ready' : 'notFound' });
      } catch {
        if (!cancelled) setRequestState({ key: requestKey, status: 'error' });
      }
    }
    return () => { cancelled = true; };
  }, [promptId, validPromptId, requestKey, retryAttempt, loadSharedPrompt]);

  if (promptId === null) {
    return (
      <DefaultComponent
        linkType="shared-prompts"
        src={src}
        isPreview={isPreview}
      />
    );
  }
  if (!validPromptId) return <InvalidContent />;

  return (
    <ErrorBoundary componentPath="RichText/EmbeddedComponent/InternalComponent/SharedPromptComponent">
      {status === 'error' ? (
        <EmbedLoadError onRetry={() => setRetryAttempt(value => value + 1)} />
      ) : status === 'notFound' ? (
        <InvalidContent style={{ marginTop: '2rem' }} />
      ) : status === 'loading' || !prompt ? (
        <Loading text="Loading shared prompt" innerStyle={{ fontSize: '14px' }} />
      ) : prompt && isPreview ? (
        <button
          type="button"
          className={cx(compactSharedPromptClass, isChat && chatPromptTargetClass)}
          onClick={handlePreviewClick}
        >
          <SharedPromptBlock
            className={isChat ? chatPromptClass : undefined}
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
          className={cx(cardClass, isChat && chatPromptClass)}
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

// The chat copy scale is independent of the older feed's fixed preview slots.
const chatPromptClass = css`
  &.shared-prompt-block {
    --shared-prompt-chip-font-size: 12px;
    --shared-prompt-chip-badge-size: 20px;
    --shared-prompt-stat-font-size: 13px;
    --shared-prompt-title-font-size: 17px;
    --shared-prompt-meta-font-size: 13px;
    --shared-prompt-instructions-font-size: 14px;
    --shared-prompt-instructions-padding: 10px;
    --shared-prompt-instructions-radius: 8px;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
    .shared-prompt__chip, .shared-prompt__stat { color: #465167; }
    .shared-prompt__chip { line-height: 1.4; }
    .shared-prompt__stat { line-height: 1.5; }
    .shared-prompt__meta {
      color: #526176;
      small { font-size: 12px; line-height: 1.5; color: #64748b; }
    }
    > button {
      min-height: 44px;
      line-height: 1.4;
      &:hover { color: #273449; }
      &:focus-visible {
        outline: 2px solid #334155;
        outline-offset: 2px;
        border-radius: 4px;
      }
    }
  }
`;

const chatPromptTargetClass = css`
  border-radius: 14px;
  &:focus-visible {
    outline: 2px solid #334155;
    outline-offset: 3px;
    box-shadow: 0 0 0 3px #fff;
  }
`;



