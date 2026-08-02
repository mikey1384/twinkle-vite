import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import { isCachedCardStateFresher } from '~/helpers/buildCardState';

type BuildThumbnailSuggestionStatus = 'open' | 'applied' | 'gone';

interface BuildThumbnailSuggestionPayload {
  rootBuildId?: number;
  branchBuildId?: number;
  contributorUserId?: number;
  ownerUserId?: number;
  title?: string;
  branchNumber?: number;
  suggestedThumbnailUrl?: string;
  currentThumbnailUrl?: string;
  hasNewerThumbnailSinceSuggestion?: boolean;
  status?: BuildThumbnailSuggestionStatus;
  createdAt?: number;
  // Stamped by the hydrator when this payload was read, so the card can tell
  // it apart from anything this tab cached afterwards.
  eventTimeMs?: number;
}

export default function BuildThumbnailSuggestion({
  content,
  messageId,
  suggestion,
  myId,
  sender
}: {
  content: string;
  messageId: number;
  suggestion?: BuildThumbnailSuggestionPayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const adoptBuildThumbnailSuggestion = useAppContext(
    (v) => v.requestHelpers.adoptBuildThumbnailSuggestion
  );
  const onUpdateBuildThumbnailSuggestionState = useChatContext(
    (v) => v.actions.onUpdateBuildThumbnailSuggestionState
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const rootBuildId = Number(suggestion?.rootBuildId || 0);
  const branchBuildId = Number(suggestion?.branchBuildId || 0);
  // Keyed by project, because that is what it describes. This card only claims
  // to be the applied one when the project says the image it adopted is this
  // card's own frozen suggestion — otherwise a second suggestion from the same
  // branch would light up every earlier card as applied while the project shows
  // a different picture. The "Now" pane still refreshes either way.
  const projectThumbnailState = useChatContext((v) =>
    rootBuildId > 0 ? v.state.buildThumbnailByRootBuildId?.[rootBuildId] : null
  );
  const payload = useMemo(() => {
    const base = { ...(suggestion || {}) };
    if (!isCachedCardStateFresher(projectThumbnailState, suggestion)) {
      return base;
    }
    const adoptedFrom = String(
      projectThumbnailState.adoptedFromThumbnailUrl || ''
    );
    const mySuggestion = String(base.suggestedThumbnailUrl || '');
    return {
      ...base,
      currentThumbnailUrl: String(
        projectThumbnailState.currentThumbnailUrl ??
          base.currentThumbnailUrl ??
          ''
      ),
      // Decided, not merely set. Once the project says which suggestion it
      // adopted, that answer settles this card either way: a card whose image
      // won says applied, and one that was applied earlier but has since been
      // replaced by a different suggestion has to stop claiming the project is
      // using it. Only setting the true case left the loser still boasting.
      ...(adoptedFrom
        ? {
            status:
              mySuggestion && adoptedFrom === mySuggestion
                ? ('applied' as const)
                : ('open' as const)
          }
        : {})
    };
  }, [suggestion, projectThumbnailState]);

  const title = String(payload?.title || 'their project');
  const branchNumber = Math.floor(Number(payload?.branchNumber) || 0);
  const suggestedThumbnailUrl = String(payload?.suggestedThumbnailUrl || '');
  const currentThumbnailUrl = String(payload?.currentThumbnailUrl || '');
  const status: BuildThumbnailSuggestionStatus =
    (payload?.status as BuildThumbnailSuggestionStatus) || 'open';
  const sentByMe = Number(sender.id) === Number(myId);
  const isOwner = Number(payload?.ownerUserId || 0) === Number(myId);
  const note = String(content || '').trim();

  if (!rootBuildId || !branchBuildId || !suggestedThumbnailUrl) {
    return <span>{content}</span>;
  }

  return (
    <BuildMessageCard
      bannerIcon="image"
      themeName={sender.profileTheme}
      bannerText={
        <>
          Suggested a thumbnail for{' '}
          {isOwner ? 'your project' : 'this project'}
        </>
      }
      title={title}
      chips={
        branchNumber > 0 ? (
          <BuildMessageCardChip
            icon="code-branch"
            themeName={sender.profileTheme}
          >
            Branch #{branchNumber}
          </BuildMessageCardChip>
        ) : null
      }
      actions={
        <>
          {isOwner && status === 'open' ? (
            <GameCTAButton
              variant="success"
              size="md"
              icon="check"
              shiny
              loading={actionLoading}
              onClick={handleUseThumbnail}
            >
              Use this thumbnail
            </GameCTAButton>
          ) : null}
          <GameCTAButton
            variant="neutral"
            size="md"
            icon="external-link-alt"
            onClick={handleOpenProject}
          >
            {isOwner ? 'Thumbnail settings' : 'Open project'}
          </GameCTAButton>
        </>
      }
    >
      {note ? <div className={noteClass}>{note}</div> : null}

      {/* The decision this card exists for, made without leaving the message:
          what the app shows now, and what it would show instead.
          
          Skipped once the branch is gone: the project's current thumbnail is
          read through the branch row, so with no branch there is no answer for
          the "Now" side — and an empty pane there reads as "the project has no
          thumbnail", which is a different and usually false claim. There is
          nothing left to decide on this card anyway. */}
      {status !== 'gone' ? (
        <div className={compareRowClass}>
          <figure className={compareItemClass}>
            <figcaption>Now</figcaption>
            {currentThumbnailUrl ? (
              <img
                src={currentThumbnailUrl}
                alt={`${title} thumbnail in use`}
              />
            ) : (
              <div className={emptyThumbClass}>
                <Icon icon="image" />
                <span>No thumbnail</span>
              </div>
            )}
          </figure>
          <div className={compareArrowClass}>
            <Icon icon="arrow-right" />
          </div>
          <figure className={compareItemClass}>
            <figcaption>Suggested</figcaption>
            <img
              src={suggestedThumbnailUrl}
              alt={`Thumbnail suggested by ${sender.username}`}
            />
          </figure>
        </div>
      ) : null}

      {status === 'applied' ? (
        <div className={settledClass}>
          <Icon icon="check" />
          <span>
            {isOwner
              ? "You're using this thumbnail now."
              : 'This is the project thumbnail now.'}
          </span>
        </div>
      ) : null}

      {status === 'gone' ? (
        <div className={mutedClass}>
          <Icon icon="times-circle" />
          <span>That branch is no longer available.</span>
        </div>
      ) : null}

      {status === 'open' && payload?.hasNewerThumbnailSinceSuggestion ? (
        <div className={mutedClass}>
          <Icon icon="info-circle" />
          <span>
            {sentByMe
              ? 'You have changed your branch thumbnail since sending this.'
              : `${sender.username} has a different thumbnail on their branch now. This card still offers the one above.`}
          </span>
        </div>
      ) : null}

      {actionError ? <div className={errorClass}>{actionError}</div> : null}
    </BuildMessageCard>
  );

  function handleOpenProject() {
    navigate(`/build/${rootBuildId}`);
  }

  async function handleUseThumbnail() {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError('');
    try {
      const result = await adoptBuildThumbnailSuggestion({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId,
        suggestionMessageId: messageId,
        // The image on this card, not whatever the branch holds now.
        thumbnailUrl: suggestedThumbnailUrl
      });
      if (!result?.success || !result?.build) {
        setActionError(result?.error || 'Failed to use this thumbnail');
        return;
      }
      // The project row the endpoint read back, not the URL this card was
      // holding: adopting copies the image, so what the project ends up
      // pointing at is the server's to say.
      onUpdateBuildThumbnailSuggestionState({
        rootBuildId,
        build: result.build,
        adoptedFromThumbnailUrl: String(
          result?.adoptedFromThumbnailUrl || suggestedThumbnailUrl
        ),
        eventTimeMs: Number(result?.eventTimeMs || Date.now())
      });
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to use this thumbnail'
      );
    } finally {
      setActionLoading(false);
    }
  }
}

const noteClass = css`
  color: ${Color.black()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
  white-space: pre-wrap;
`;

const compareRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
  }
`;

const compareItemClass = css`
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  figcaption {
    color: ${Color.darkerGray()};
    font-size: 1.1rem;
    font-weight: 800;
  }
  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid ${Color.borderGray()};
    background: ${Color.wellGray()};
  }
`;

const emptyThumbClass = css`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  border: 1px dashed ${Color.borderGray()};
  background: ${Color.wellGray()};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 700;
`;

const compareArrowClass = css`
  flex: 0 0 auto;
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
`;

const settledClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: ${Color.green()};
  font-size: 1.2rem;
  font-weight: 800;
`;

const mutedClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
`;
