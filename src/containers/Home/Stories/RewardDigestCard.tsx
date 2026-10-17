import React, { memo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import LinkPreviewImage from '~/components/LinkPreviewImage';
import ProfilePic from '~/components/ProfilePic';
import RewardChips from '~/components/RewardChips';
import UsernameText from '~/components/Texts/UsernameText';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  getDigestDayLabel,
  getDigestLatestLine,
  getNewcomerSummary
} from '~/helpers/rewardDigest';
import { trackEvent } from '~/helpers/analytics';
import { saveScrollAnchorForElement } from '~/helpers/hooks/useScrollAnchorRestoration';
import {
  isOwnerTraceActive,
  noteOwnerTraceTap,
  recordOwnerTrace,
  takeOwnerTraceTap
} from '~/helpers/ownerTrace';
import {
  popupDismissNavigationFeedCardTargetProps,
  shouldSuppressPopupDismissNavigation
} from '~/helpers/popupDismissNavigation';
import {
  shouldSkipFeedCardNavigation,
  shouldUseExplicitFeedCardNavigation
} from './FeedCard/helpers/navigation';

export interface RewardDigestPreview {
  id: number;
  buildId: number;
  dayKey: string;
  buildTitle?: string;
  buildThumbnailUrl?: string | null;
  appAvailable?: boolean;
  claims: number;
  players: number;
  xp: number;
  coins: number;
  latestAt?: number | null;
  earners: Array<{
    userId: number;
    username: string;
    profilePicUrl?: string | null;
  }>;
  latest?: {
    bountyId: number;
    title: string;
    username: string;
    // what it was for (API rewardDigests: the bounty's subject), or null
    subject?: unknown;
  } | null;
  // earners whose first reward in this app came today (the first two named)
  newcomers?: {
    count: number;
    users: Array<{ userId: number; username: string }>;
  } | null;
}

// An app's "earning today" card on Home: everyone who earned XP or Coins in
// one app on one reward day, as one card (the server sends it as a
// 'rewardDigest' feed row, bumped to the top at most every 3 hours). Each
// earner's own claims stay on their profile. Opens like every Home card:
// the whole card on desktop, only its button, art and title on touch, with
// the scroll anchor saved and the open tracked.
function RewardDigestCard({
  digest,
  index,
  homeFeedAnchorKey
}: {
  digest: RewardDigestPreview;
  index: number;
  homeFeedAnchorKey?: string;
}) {
  const navigate = useNavigate();
  const appTitle = digest.buildTitle || 'Lumine app';
  const appAvailable = !!(digest.appAvailable && digest.buildId);
  const players = Math.max(0, Number(digest.players) || 0);
  const shownEarners = (digest.earners || []).slice(0, 6);
  const moreEarners = Math.max(0, players - shownEarners.length);
  const when = getDigestDayLabel(digest.dayKey);
  const newcomers = getNewcomerSummary(digest.newcomers);
  const latestLine = digest.latest ? getDigestLatestLine(digest.latest) : null;

  return (
    <article
      {...popupDismissNavigationFeedCardTargetProps}
      className={`${cardClass} reward-digest-card${appAvailable ? ' reward-digest-card--open' : ''}`}
      aria-label={`${players} ${players === 1 ? 'player' : 'players'} earned in ${appTitle} ${when.toLowerCase()}`}
      tabIndex={appAvailable ? 0 : undefined}
      onClick={appAvailable ? handleCardClick : undefined}
      onKeyDown={appAvailable ? handleCardKeyDown : undefined}
    >
      <div className="reward-digest-card__head">
        <div
          className="reward-digest-card__art"
          role={appAvailable ? 'link' : undefined}
          aria-label={appAvailable ? `Open ${appTitle}` : undefined}
          onClick={appAvailable ? handleOpenClick : undefined}
        >
          {digest.buildThumbnailUrl ? (
            <LinkPreviewImage src={digest.buildThumbnailUrl} alt="" />
          ) : (
            <Icon icon="laptop-code" />
          )}
        </div>
        <div className="reward-digest-card__heading">
          <span className="reward-digest-card__kicker">
            <Icon icon="fire" /> {when}
            {digest.latestAt ? ` · ${timeSince(digest.latestAt)}` : ''}
          </span>
          <h3 className="reward-digest-card__title">
            {addCommasToNumber(players)} {players === 1 ? 'player' : 'players'}{' '}
            earned in{' '}
            <span
              className="reward-digest-card__app"
              onClick={appAvailable ? handleOpenClick : undefined}
            >
              {appTitle}
            </span>
          </h3>
          <div className="reward-digest-card__rewards" aria-label="Rewards earned">
            <RewardChips xp={Number(digest.xp)} coins={Number(digest.coins)} />
          </div>
        </div>
      </div>
      {shownEarners.length ? (
        <div className="reward-digest-card__earners">
          <div className="reward-digest-card__faces">
            {shownEarners.map((earner) => (
              <ProfilePic
                key={earner.userId}
                className="reward-digest-card__face"
                style={{ width: '3.8rem' }}
                userId={earner.userId}
                profilePicUrl={earner.profilePicUrl || undefined}
              />
            ))}
            {moreEarners ? (
              <span className="reward-digest-card__more">
                +{addCommasToNumber(moreEarners)}
              </span>
            ) : null}
          </div>
          {digest.latest ? (
            <div className="reward-digest-card__latest">
              <UsernameText
                user={{
                  id: shownEarners[0]?.userId,
                  username: digest.latest.username
                }}
                color={Color.darkerGray()}
              />{' '}
              {latestLine?.subjectTitle ? (
                <>
                  {latestLine.lead}{' '}
                  <span className="reward-digest-card__latest-title">
                    {latestLine.subjectTitle}
                  </span>
                  {latestLine.after}
                  {latestLine.tag ? (
                    <span className="reward-digest-card__latest-tag">
                      {' · '}
                      {latestLine.tag}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  just earned{' '}
                  <span className="reward-digest-card__latest-title">
                    {digest.latest.title}
                  </span>
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
      {newcomers ? (
        <div className="reward-digest-card__newcomers">
          <Icon icon="star" /> New today:{' '}
          {newcomers.users.map((user, i) => (
            <React.Fragment key={user.userId}>
              {i > 0 ? ', ' : ''}
              <UsernameText user={{ id: user.userId, username: user.username }} />
            </React.Fragment>
          ))}
          {newcomers.rest ? `, +${addCommasToNumber(newcomers.rest)}` : ''}
        </div>
      ) : null}
      {appAvailable ? (
        <Button
          className="reward-digest-card__try"
          color="logoBlue"
          variant="solid"
          tone="raised"
          size="sm"
          uppercase={false}
          onClick={handleOpenClick}
        >
          <span className="reward-digest-card__try-label">
            Join them in {appTitle}
          </span>
          <Icon icon="arrow-right" style={{ flexShrink: 0, marginLeft: '0.6rem' }} />
        </Button>
      ) : (
        <span className="reward-digest-card__unavailable">App unavailable</span>
      )}
    </article>
  );

  function handleCardClick(event: React.MouseEvent<HTMLElement>) {
    if (shouldSuppressPopupDismissNavigation(event.nativeEvent)) return;
    if (
      shouldSkipFeedCardNavigation({
        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
        target: event.target
      })
    ) {
      return;
    }
    if (shouldUseExplicitFeedCardNavigation()) return;
    noteOwnerTraceTap('click', event.target);
    openApp(event.currentTarget, 'open');
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' || event.target !== event.currentTarget) return;
    noteOwnerTraceTap('enter', event.target);
    openApp(event.currentTarget, 'open');
  }

  // the button, the art and the app's name: open the app on any device
  function handleOpenClick(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (shouldSuppressPopupDismissNavigation(event.nativeEvent)) return;
    noteOwnerTraceTap('open-button', event.target);
    openApp(event.currentTarget, 'open-button');
  }

  function openApp(sourceElement: HTMLElement | null, action: string) {
    saveScrollAnchorForElement(sourceElement, homeFeedAnchorKey);
    trackEvent('feed_item_open', {
      content_type: 'rewardDigest',
      position: index + 1,
      action,
      surface: 'home'
    });
    if (isOwnerTraceActive()) {
      recordOwnerTrace('feed-open', {
        ct: 'rewardDigest',
        id: digest.id,
        action,
        pos: index + 1,
        surface: 'home',
        ...takeOwnerTraceTap()
      });
    }
    navigate(`/app/${digest.buildId}`);
  }
}

export default memo(RewardDigestCard);

const cardClass = css`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: 1.2rem 1.4rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  transition: border-color 0.18s ease;
  &.reward-digest-card--open {
    cursor: pointer;
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        border-color: var(--ui-border-strong);
      }
    }
    @media (hover: none), (pointer: coarse), (max-width: ${mobileMaxWidth}) {
      cursor: default;
    }
    .reward-digest-card__art,
    .reward-digest-card__app {
      cursor: pointer;
    }
  }
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue(0.45)};
    outline-offset: 2px;
  }

  .reward-digest-card__head {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    min-width: 0;
  }

  .reward-digest-card__art {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 8.4rem;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-radius: 0.6rem;
    background: ${Color.whiteGray()};
    color: ${Color.darkGray()};
    font-size: 2.4rem;
  }

  .reward-digest-card__art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .reward-digest-card__heading {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
    min-width: 0;
  }

  .reward-digest-card__kicker {
    color: ${Color.orange()};
    font-size: max(1.2rem, 12px);
    font-weight: 700;
  }

  .reward-digest-card__title {
    margin: 0;
    color: ${Color.black()};
    font-size: max(1.7rem, 17px) !important;
    font-weight: 700;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .reward-digest-card__app {
    color: ${Color.logoBlue()};
  }

  .reward-digest-card__rewards {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .reward-amount-chip {
    font-size: max(1.2rem, 12px);
  }

  .reward-digest-card__earners {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem 1rem;
    min-width: 0;
  }

  .reward-digest-card__faces {
    display: flex;
    align-items: center;
  }

  .reward-digest-card__face {
    margin-right: -0.7rem;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  .reward-digest-card__more {
    margin-left: 1.3rem;
    color: ${Color.darkGray()};
    font-size: max(1.2rem, 12px);
    font-weight: 700;
  }

  .reward-digest-card__latest {
    min-width: 0;
    font-size: max(1.3rem, 13px);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .reward-digest-card__latest-title {
    font-weight: 700;
  }

  .reward-digest-card__latest-tag {
    color: ${Color.gray()};
    font-weight: 600;
  }

  .reward-digest-card__newcomers {
    color: ${Color.darkerGray()};
    font-size: max(1.3rem, 13px);
    font-weight: 700;
    overflow-wrap: anywhere;
    svg {
      color: ${Color.gold()};
    }
  }

  .reward-digest-card__try {
    align-self: flex-start;
    min-height: 40px;
    max-width: 100%;
    font-size: max(1.3rem, 13px);
    white-space: normal;
  }

  .reward-digest-card__try-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reward-digest-card__unavailable {
    color: ${Color.gray()};
    font-size: max(1.2rem, 12px);
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-left: 0;
    border-right: 0;
    border-radius: 0;
    padding: 1rem;
    .reward-digest-card__try {
      align-self: stretch;
    }
  }
`;
