import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';

type BuildTitleSuggestionStatus = 'open' | 'applied' | 'declined' | 'gone';

interface BuildTitleSuggestionPayload {
  rootBuildId?: number;
  branchBuildId?: number;
  contributorUserId?: number;
  ownerUserId?: number;
  title?: string;
  branchNumber?: number;
  suggestedTitle?: string;
  currentTitle?: string;
  status?: BuildTitleSuggestionStatus;
  createdAt?: number;
  eventTimeMs?: number;
}

// Adopting a name settles every name card for that project, not only the one
// pressed: the others must show the new "Now" instead of the name it replaced.
// The detail is the project row the adopt endpoint read back.
const TITLE_ADOPTED_EVENT = 'twinkle:build-title-adopted';

// A teammate's proposed name for the app. The name is frozen in the message;
// what the project is called now, and so whether this card is settled, comes
// from the server — on load through the hydrator, after "Use this name" from
// the project row the endpoint read back.
export default function BuildTitleSuggestion({
  content,
  messageId,
  suggestion,
  myId,
  sender
}: {
  content: string;
  messageId: number;
  suggestion?: BuildTitleSuggestionPayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const adoptBuildTitleSuggestion = useAppContext(
    (v) => v.requestHelpers.adoptBuildTitleSuggestion
  );
  const declineBuildOwnerSuggestion = useAppContext(
    (v) => v.requestHelpers.declineBuildOwnerSuggestion
  );
  const [adoptedTitle, setAdoptedTitle] = useState('');
  const [declined, setDeclined] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const rootBuildId = Number(suggestion?.rootBuildId || 0);
  const branchBuildId = Number(suggestion?.branchBuildId || 0);

  useEffect(() => {
    if (!rootBuildId) return;
    function handleAdopted(event: Event) {
      const detail = (event as CustomEvent).detail || {};
      if (Number(detail.rootBuildId) !== rootBuildId) return;
      setAdoptedTitle(String(detail.title || ''));
    }
    window.addEventListener(TITLE_ADOPTED_EVENT, handleAdopted);
    return () => window.removeEventListener(TITLE_ADOPTED_EVENT, handleAdopted);
  }, [rootBuildId]);
  const suggestedTitle = String(suggestion?.suggestedTitle || '').trim();
  const currentTitle = adoptedTitle || String(suggestion?.currentTitle || '');
  const storedStatus =
    (suggestion?.status as BuildTitleSuggestionStatus) || 'open';
  const status: BuildTitleSuggestionStatus =
    adoptedTitle && adoptedTitle.trim() === suggestedTitle
      ? 'applied'
      : declined || storedStatus === 'declined'
        ? 'declined'
        : adoptedTitle
          ? 'open'
          : storedStatus;
  const branchNumber = Math.floor(Number(suggestion?.branchNumber) || 0);
  const isOwner = Number(suggestion?.ownerUserId || 0) === Number(myId);
  const note = String(content || '').trim();

  if (!rootBuildId || !branchBuildId || !suggestedTitle) {
    return <span>{content}</span>;
  }

  return (
    <BuildMessageCard
      bannerIcon="pencil-alt"
      themeName={sender.profileTheme}
      bannerText={
        <>Suggested a new name for {isOwner ? 'your project' : 'this project'}</>
      }
      title={String(adoptedTitle || suggestion?.title || 'their project')}
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
            <>
              <GameCTAButton
                variant="success"
                size="md"
                icon="check"
                shiny
                loading={actionLoading}
                disabled={declining}
                onClick={handleUseName}
              >
                Use this name
              </GameCTAButton>
              <GameCTAButton
                variant="neutral"
                size="md"
                loading={declining}
                disabled={actionLoading}
                onClick={handleDecline}
              >
                Decline
              </GameCTAButton>
            </>
          ) : null}
          <GameCTAButton
            variant="neutral"
            size="md"
            icon="external-link-alt"
            onClick={() => navigate(`/build/${rootBuildId}`)}
          >
            Open project
          </GameCTAButton>
        </>
      }
    >
      {note ? <div className={noteClass}>{note}</div> : null}

      {status !== 'gone' ? (
        <div className={compareClass}>
          <div className={nameRowClass}>
            <span className={labelClass}>Now</span>
            <span className={currentNameClass}>{currentTitle || '—'}</span>
          </div>
          <div className={nameRowClass}>
            <span className={labelClass}>Suggested</span>
            <span className={suggestedNameClass}>{suggestedTitle}</span>
          </div>
        </div>
      ) : null}

      {status === 'applied' ? (
        <div className={settledClass}>
          <Icon icon="check" />
          <span>
            {isOwner
              ? "You're using this name now."
              : 'This is the project name now.'}
          </span>
        </div>
      ) : null}

      {status === 'declined' ? (
        <div className={mutedClass}>
          <Icon icon="times" />
          <span>
            {isOwner
              ? 'You declined this name.'
              : 'The owner declined this name.'}
          </span>
        </div>
      ) : null}

      {status === 'gone' ? (
        <div className={mutedClass}>
          <Icon icon="times-circle" />
          <span>That branch is no longer available.</span>
        </div>
      ) : null}

      {actionError ? <div className={errorClass}>{actionError}</div> : null}
    </BuildMessageCard>
  );

  async function handleDecline() {
    if (declining || actionLoading) return;
    setDeclining(true);
    setActionError('');
    try {
      const result = await declineBuildOwnerSuggestion({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId,
        suggestionMessageId: messageId
      });
      if (!result?.success) {
        setActionError(result?.error || 'Failed to decline');
        return;
      }
      setDeclined(true);
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error || error?.message || 'Failed to decline'
      );
    } finally {
      setDeclining(false);
    }
  }

  async function handleUseName() {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError('');
    try {
      const result = await adoptBuildTitleSuggestion({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId,
        suggestionMessageId: messageId
      });
      if (!result?.success || !result?.build) {
        setActionError(result?.error || 'Failed to use this name');
        return;
      }
      const title = String(result.build.title || '');
      setAdoptedTitle(title);
      window.dispatchEvent(
        new CustomEvent(TITLE_ADOPTED_EVENT, {
          detail: { rootBuildId, title }
        })
      );
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to use this name'
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

const compareClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: 1px solid ${Color.borderGray()};
  background: ${Color.wellGray()};
`;

const nameRowClass = css`
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  min-width: 0;
`;

const labelClass = css`
  flex: 0 0 6.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 800;
`;

const currentNameClass = css`
  min-width: 0;
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

const suggestedNameClass = css`
  min-width: 0;
  color: ${Color.black()};
  font-size: 1.5rem;
  font-weight: 800;
  overflow-wrap: anywhere;
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
