import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext, useKeyContext } from '~/contexts';
import { trackEvent } from '~/helpers/analytics';
import { useWalkUp } from '~/helpers/hooks/useSocialWalkups';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  FIRST_CHAT_NOTE,
  socialCardChipsShown,
  socialCardCount,
  socialCardHeadline,
  type SocialTogetherCardData
} from '~/helpers/socialTogetherCard';
import { useChatQuickSend } from './ChatQuickSend';

// The shared-moment card (twinkle-api controllers/build/services/
// socialMoments.ts): two members did something together in an app, and
// Twinkle put this in their chat. It is nobody's message. For many kids it
// opens their first DM ever, so it reads as an introduction, not a receipt,
// and the hardest part (the first word) is one tap.
const cardCls = css`
  box-sizing: border-box;
  width: min(44rem, calc(100% - 2rem));
  margin: 1.2rem auto;
  padding: 1.6rem 1.6rem 1.4rem;
  border-radius: 1.8rem;
  border: 1px solid rgba(65, 140, 235, 0.28);
  background: #f5f9ff;
  text-align: center;
  color: #1c2b44;
  .together-faces {
    display: flex;
    justify-content: center;
  }
  .together-face {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    box-shadow: 0 0 0 3px #f5f9ff;
    background: #fff;
  }
  .together-face + .together-face {
    margin-left: -1.2rem;
  }
  .together-headline {
    margin: 1rem 0 0;
    font-size: 1.7rem;
    line-height: 1.3;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .together-result {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin: 0.9rem 0 0;
  }
  .together-thumb {
    flex: 0 0 auto;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 1rem;
    object-fit: cover;
    background: #e3ecfa;
  }
  .together-text {
    min-width: 0;
    font-size: 1.4rem;
    line-height: 1.4;
    color: #33435d;
    overflow-wrap: anywhere;
    text-align: left;
  }
  .together-meta {
    display: block;
    margin-top: 0.2rem;
    font-size: 1.15rem;
    color: #62718a;
  }
  .together-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.7rem;
    margin-top: 1.3rem;
  }
  .together-chip {
    /* a thumb-sized target at every root font size (phones use a smaller rem) */
    min-height: max(4.4rem, 38px);
    max-width: 100%;
    padding: 0.5rem 1.6rem;
    border: 1px solid rgba(65, 140, 235, 0.45);
    border-radius: 999px;
    background: #fff;
    color: #1f5fae;
    font: inherit;
    font-size: 1.35rem;
    font-weight: 700;
    cursor: pointer;
    overflow-wrap: anywhere;
    transition:
      background-color 0.15s ease,
      transform 0.1s ease;
  }
  .together-chip:hover:not(:disabled) {
    background: #e8f1fe;
  }
  .together-chip:active:not(:disabled) {
    transform: scale(0.97);
  }
  .together-chip:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .together-hint {
    margin: 0.7rem 0 0;
    font-size: 1.1rem;
    color: #62718a;
  }
  .together-actions {
    display: flex;
    justify-content: center;
    margin-top: 1.3rem;
  }
  .together-actions > button {
    min-height: max(4.4rem, 38px);
    padding-left: 2rem;
    padding-right: 2rem;
  }
  .together-note {
    margin: 1.3rem 0 0;
    padding-top: 1rem;
    border-top: 1px solid rgba(65, 140, 235, 0.2);
    font-size: 1.15rem;
    line-height: 1.4;
    color: #4b5d78;
  }
`;

export default function SocialTogetherCard({
  card,
  canReply
}: {
  card: SocialTogetherCardData;
  // false when the viewer cannot post here right now
  canReply: boolean;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const buttonColor = useRoleColor('button', { fallback: 'logoBlue' }).colorKey;
  const markSocialMomentSeen = useAppContext(
    (v) => v.requestHelpers.markSocialMomentSeen
  );
  const markSocialMomentChip = useAppContext(
    (v) => v.requestHelpers.markSocialMomentChip
  );
  const quickSend = useChatQuickSend();
  const walkUp = useWalkUp();
  const [firstChatNote, setFirstChatNote] = useState(false);
  const [sendingChip, setSendingChip] = useState('');
  const [chipUsed, setChipUsed] = useState(false);
  const [opening, setOpening] = useState(false);

  const me = card.users.find((user) => user.id === myId);
  const other = card.users.find((user) => user.id !== myId);
  const alreadySeen = card.seenBy.includes(myId);

  // "Card shown": once per member per card, recorded by the server. Its
  // answer says whether this is the card that opened the member's first DM
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

  if (!me || !other) return null;

  const countLabel = socialCardCount(card);
  const dateLabel = new Date(card.createdAt * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  const picture = card.thumbnailUrl || card.appThumbnailUrl;
  const chipsShown = socialCardChipsShown({
    card,
    myId,
    canReply: canReply && !!quickSend,
    chipUsed,
    nowSeconds: Date.now() / 1000
  });

  return (
    <div className={cardCls} data-social-together>
      <div className="together-faces" aria-hidden>
        {[me, other].map((user) => (
          <span key={user.id} className="together-face">
            <ProfilePic
              userId={user.id}
              profilePicUrl={user.profilePicUrl}
              activityBadgeShown={false}
              style={{ width: '100%', height: '100%' }}
            />
          </span>
        ))}
      </div>
      <p className="together-headline">
        {socialCardHeadline({ card, otherName: other.username })}
      </p>
      <div className="together-result">
        {picture ? <img className="together-thumb" src={picture} alt="" loading="lazy" /> : null}
        <span className="together-text">
          {card.text}
          <span className="together-meta">
            {[countLabel, dateLabel].filter(Boolean).join(' · ')}
          </span>
        </span>
      </div>
      {chipsShown ? (
        <>
          <div className="together-chips">
            {card.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className="together-chip"
                disabled={!!sendingChip}
                onClick={() => handleChip(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <p className="together-hint">Tap one to say it</p>
        </>
      ) : null}
      {card.appAvailable ? (
        <div className="together-actions">
          <Button
            color={buttonColor}
            variant="soft"
            tone="raised"
            size="md"
            uppercase={false}
            loading={opening}
            onClick={handlePlayAgain}
          >
            <Icon icon="play" />
            <span style={{ marginLeft: '0.7rem' }}>
              {card.isGame ? 'Rematch' : `Open ${card.appTitle}`}
            </span>
          </Button>
        </div>
      ) : null}
      {firstChatNote ? <p className="together-note">{FIRST_CHAT_NOTE}</p> : null}
    </div>
  );

  async function handleChip(chip: string) {
    if (sendingChip || !quickSend) return;
    setSendingChip(chip);
    try {
      // The viewer's own ordinary message, through the normal send path.
      await quickSend(chip);
      setChipUsed(true);
      trackEvent('social_card_chip', {
        app_id: card.buildId,
        platform_chip: card.chips.indexOf(chip) < 3
      });
      void markSocialMomentChip({ momentId: card.id, chip });
    } catch {
      // the chips stay, so it can be tapped again
    } finally {
      setSendingChip('');
    }
  }

  async function handlePlayAgain() {
    if (opening || !other) return;
    setOpening(true);
    trackEvent('social_card_rematch', { app_id: card.buildId });
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
        joinable: null,
        intent: 'play',
        source: 'card'
      });
    } finally {
      setOpening(false);
    }
  }
}
