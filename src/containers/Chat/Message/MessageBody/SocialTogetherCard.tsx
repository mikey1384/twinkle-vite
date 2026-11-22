import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ProfilePic from '~/components/ProfilePic';
import ReportMessageModal from '~/components/ChatSafety/ReportMessageModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { trackEvent } from '~/helpers/analytics';
import { useWalkUp } from '~/helpers/hooks/useSocialWalkups';
import {
  FIRST_CHAT_NOTE,
  socialCardActionLabel,
  socialCardBanner,
  socialCardLines,
  type SocialTogetherCardData
} from '~/helpers/socialTogetherCard';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';

// The shared-moment notice (twinkle-api controllers/build/services/
// socialMoments.ts): two members did something together in an app, and
// Twinkle put this in their chat. It is nobody's message, and every word on
// it is Twinkle's (the server's fixed templates); no app text reaches it.
// It shares the Build message card's frame (the branch-suggestion card),
// in Twinkle's own blue rather than either member's color, because neither
// of them sent it.
export default function SocialTogetherCard({
  card
}: {
  card: SocialTogetherCardData;
}) {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const markSocialMomentSeen = useAppContext(
    (v) => v.requestHelpers.markSocialMomentSeen
  );
  const walkUp = useWalkUp();
  const [firstChatNote, setFirstChatNote] = useState(false);
  const [opening, setOpening] = useState(false);
  const [reporting, setReporting] = useState<number | null>(null);

  const me = card.users.find((user) => user.id === myId);
  const other = card.users.find((user) => user.id !== myId);
  const alreadySeen = card.seenBy.includes(myId);

  // "Notice shown": once per member per notice, recorded by the server. Its
  // answer says whether this is the notice that opened the member's first DM
  // thread ever; only then, and only this once, the one-line note shows.
  useEffect(() => {
    if (!me || alreadySeen) return;
    let cancelled = false;
    void markSocialMomentSeen({ momentId: card.id }).then((result: any) => {
      if (cancelled || !result?.firstView) return;
      trackEvent('social_card_shown', {
        app_id: card.buildId,
        new_thread: card.isNewThread,
        first_chat: result.firstChat === true
      });
      if (result.firstChat) setFirstChatNote(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadySeen, card.id, me?.id]);

  const lines = socialCardLines(card, myId);
  if (!me || !other || !lines) return null;

  const dateLabel = new Date(card.createdAt * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  // The app's published cover and title as this revision showed them (app
  // metadata stored with the revision, never chosen by the app's report),
  // and the title opens the app itself.
  const picture = card.appThumbnailUrl;
  const actionLabel = socialCardActionLabel(card);
  const appPath = card.appAvailable ? `/app/${card.buildId}` : null;
  const appTitle = (
    <span className={appTitleClass}>
      {picture ? (
        <img className={thumbClass} src={picture} alt="" loading="lazy" />
      ) : null}
      <span className={appNameClass}>{card.appTitle}</span>
    </span>
  );

  return (
    <div className={wrapClass} data-social-together>
      <BuildMessageCard
        themeName="logoBlue"
        bannerIcon="user-group"
        bannerText={socialCardBanner(card.activity)}
        title={
          appPath ? (
            <Link className={appLinkClass} to={appPath}>
              {appTitle}
            </Link>
          ) : (
            appTitle
          )
        }
        chips={
          <>
            <BuildMessageCardChip muted>{dateLabel}</BuildMessageCardChip>
            {card.count > 1 ? (
              <BuildMessageCardChip themeName="logoBlue">
                {card.count} today
              </BuildMessageCardChip>
            ) : null}
          </>
        }
        actions={
          <>
            {actionLabel ? (
              <GameCTAButton
                variant="logoBlue"
                size="md"
                icon={card.action === 'play' ? 'play' : 'user-group'}
                loading={opening}
                onClick={handleAgain}
              >
                {actionLabel}
              </GameCTAButton>
            ) : null}
            <GameCTAButton
              variant="neutral"
              size="md"
              icon="flag"
              onClick={() => setReporting(card.revision)}
            >
              Report
            </GameCTAButton>
          </>
        }
      >
        <div className={peopleClass}>
          <span className={facesClass} aria-hidden>
            {[me, other].map((user) => (
              <span key={user.id} className={faceClass}>
                <ProfilePic
                  userId={user.id}
                  profilePicUrl={user.profilePicUrl}
                  activityBadgeShown={false}
                  style={{ width: '100%', height: '100%' }}
                />
              </span>
            ))}
          </span>
          <span className={sentenceClass}>
            <span className={headlineClass}>{lines.headline}</span>
            {lines.detail ? (
              <span className={detailClass}>{lines.detail}</span>
            ) : null}
          </span>
        </div>
        {firstChatNote ? <div className={noteClass}>{FIRST_CHAT_NOTE}</div> : null}
      </BuildMessageCard>
      {reporting ? (
        <ReportMessageModal
          subject="notice"
          momentId={card.id}
          revision={reporting}
          reportedUser={{ id: other.id, username: other.username }}
          onHide={() => setReporting(null)}
        />
      ) : null}
    </div>
  );

  async function handleAgain() {
    if (opening || !other) return;
    setOpening(true);
    trackEvent('social_card_again', {
      app_id: card.buildId,
      action: card.action
    });
    try {
      // Walks up to them if they are in the app right now; otherwise this
      // simply opens the app ("<name> isn't here right now").
      await walkUp({
        buildId: card.buildId,
        host: {
          id: other.id,
          username: other.username,
          profilePicUrl: other.profilePicUrl || null
        },
        intent: 'play',
        source: 'card'
      });
    } finally {
      setOpening(false);
    }
  }
}

// A notice in the middle of the thread, like the other system cards, at the
// Build card's width (it narrows on its own on phones).
const wrapClass = css`
  display: flex;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 1rem;
  > div {
    width: 56rem;
  }
  /* thumb-sized at every root font size (phones use a smaller rem) */
  button {
    min-height: max(3.8rem, 38px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem 0.8rem;
  }
`;

const appLinkClass = css`
  color: inherit;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const appTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
`;

const thumbClass = css`
  flex: 0 0 auto;
  width: 4.4rem;
  height: 4.4rem;
  border-radius: 0.9rem;
  object-fit: cover;
  background: ${Color.highlightGray()};
`;

const appNameClass = css`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const peopleClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const facesClass = css`
  display: flex;
  flex: 0 0 auto;
`;

const faceClass = css`
  width: 3.8rem;
  height: 3.8rem;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fff;
  background: #fff;
  & + & {
    margin-left: -1rem;
  }
`;

const sentenceClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

const headlineClass = css`
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.35;
  color: ${Color.black()};
  overflow-wrap: anywhere;
`;

const detailClass = css`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;

const noteClass = css`
  border-left: 4px solid ${Color.logoBlue(0.55)};
  padding: 0.1rem 0 0.1rem 0.75rem;
  color: ${Color.darkerGray()};
  line-height: 1.45;
  font-size: 1.2rem;
`;
