import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import RichText from '~/components/Texts/RichText';
import UserTitle from '~/components/Texts/UserTitle';
import StatusMsg from '~/components/UserDetails/StatusMsg';
import RankBadge from '~/components/RankBadge';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, Color } from '~/constants/css';
import { css } from '@emotion/css';

// Shared, container-responsive profile embed card. Renders the full 3-column
// polished layout wherever there is room (feed-card target, standalone comment
// embeds, desktop) and collapses to a compact vertical chip when squeezed into
// a narrow slot (e.g. the 34% side column of a comment embed). Consumed by both
// the home feed-card profile target (ProfilePanelPreview) and the inline
// RichText user embed (UserComponent/DefaultComponent), so there is a single
// source of truth for the profile-card presentation.
export default function ProfileEmbedCard({
  profile,
  theme,
  heading,
  online,
  selfBordered = true,
  fillHeight = false,
  showRankStrip = true,
  onActivate
}: {
  profile: any;
  theme?: string;
  heading?: string;
  online?: boolean;
  selfBordered?: boolean;
  fillHeight?: boolean;
  showRankStrip?: boolean;
  onActivate?: () => void;
}) {
  const username = profile?.username || 'Profile';
  const realName = profile?.realName || '';
  const statusColor =
    profile?.statusColor || profile?.profileTheme || 'logoBlue';
  const bioRows = getProfileBioRows(profile);
  const rank = Number(profile?.rank || 0);
  const isTopRank = rank > 0 && rank <= 3;
  const interactive = typeof onActivate === 'function';

  return (
    <div
      className={[
        profileEmbedCardClass,
        'profile-embed-card',
        selfBordered ? 'profile-embed-card--bordered' : '',
        fillHeight ? 'profile-embed-card--fill' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {heading ? (
        <div className="profile-embed-card__heading">{heading}</div>
      ) : null}
      <div className="profile-embed-card__header">
        <div className="profile-embed-card__avatar-wrap">
          <ProfilePic
            className="profile-embed-card__avatar"
            size="100%"
            userId={profile?.id}
            profilePicUrl={profile?.profilePicUrl || ''}
            online={online ?? profile?.online}
            statusShown
          />
        </div>
        <div className="profile-embed-card__details">
          <strong className="profile-embed-card__username">{username}</strong>
          <div className="profile-embed-card__title-row">
            <UserTitle user={profile} className="profile-embed-card__title" />
            {realName ? (
              <span className="profile-embed-card__real-name">{realName}</span>
            ) : null}
          </div>
          {profile?.statusMsg ? (
            <div className="profile-embed-card__status">
              <StatusMsg
                statusColor={statusColor}
                statusMsg={profile.statusMsg}
                userId={profile.id}
                style={{
                  marginTop: '0.4rem',
                  padding: '0.55rem 0.7rem',
                  fontSize: '1.12rem',
                  lineHeight: 1.28,
                  maxHeight: '5rem',
                  overflow: 'hidden',
                  boxShadow: 'none'
                }}
              />
            </div>
          ) : null}
        </div>
        <div className="profile-embed-card__bio-panel">
          {bioRows.length > 0 ? (
            <div className="profile-embed-card__bio">
              {bioRows.slice(0, 2).map((row) => (
                <div key={row.section}>
                  <span className="profile-embed-card__bio-dot">•</span>
                  <RichText
                    contentId={profile.id}
                    contentType="user"
                    isPreview
                    isProfileComponent
                    maxLines={2}
                    section={row.section}
                    style={{
                      fontSize: 'inherit',
                      lineHeight: 1.28,
                      minHeight: '1.28em'
                    }}
                    theme={theme}
                  >
                    {row.text}
                  </RichText>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile-embed-card__empty-bio">
              {username} does not have a bio, yet
            </p>
          )}
        </div>
      </div>
      {showRankStrip && rank > 0 ? (
        <div
          className={`profile-embed-card__rank-strip${
            isTopRank ? ' top-rank' : ''
          }`}
        >
          <div className="profile-embed-card__rank-left">
            <Icon icon={isTopRank ? 'trophy' : 'award'} />
            <RankBadge rank={rank} />
          </div>
          <span className="profile-embed-card__rank-xp">
            {addCommasToNumber(Number(profile?.twinkleXP || 0))}
            <span> XP</span>
          </span>
        </div>
      ) : null}
    </div>
  );

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    onActivate?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    onActivate?.();
  }
}

function getProfileBioRows(profile: any) {
  return [
    { section: 'bio1', text: profile?.profileFirstRow },
    { section: 'bio2', text: profile?.profileSecondRow },
    { section: 'bio3', text: profile?.profileThirdRow }
  ].filter((row) => Boolean(row.text));
}

const profileEmbedCardClass = css`
  container: profileEmbedCard / inline-size;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  padding: 0.9rem 1rem;
  background: #fff;
  color: ${Color.darkerGray()};
  text-align: left;
  border-radius: ${borderRadius};
  overflow: hidden;

  &.profile-embed-card--bordered {
    border: 1px solid ${Color.borderGray()};
  }
  &.profile-embed-card--fill {
    height: 100%;
  }
  &[role='button'] {
    cursor: pointer;
  }

  .profile-embed-card__heading {
    max-width: 100%;
    overflow: hidden;
    color: ${Color.logoBlue()};
    font-size: 1.1rem;
    font-weight: 900;
    line-height: 1.12;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Base (narrow, < 19rem): compact vertical chip. */
  .profile-embed-card__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-width: 0;
    flex: 1 1 auto;
    text-align: center;
  }
  .profile-embed-card__avatar-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    min-width: 0;
  }
  .profile-embed-card__avatar {
    width: 100%;
    max-width: 100%;
    --profile-status-dot-top: 78%;
    --profile-status-dot-left: 78%;
  }
  .profile-embed-card__details {
    display: flex;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
  }
  .profile-embed-card__username {
    max-width: 100%;
    overflow: hidden;
    color: ${Color.darkerGray()};
    font-size: 1.4rem;
    font-weight: 900;
    line-height: 1.12;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .profile-embed-card__title-row {
    display: flex;
    min-width: 0;
    max-width: 100%;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 0.35rem;
    color: ${Color.gray()};
    line-height: 1.15;
  }
  .profile-embed-card__title {
    display: inline-flex;
    flex: 0 0 auto;
    min-width: 0;
    color: ${Color.darkGray()};
    font-size: 1.12rem;
    font-weight: 850;
    white-space: nowrap;
  }
  .profile-embed-card__real-name {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    color: ${Color.gray()};
    font-size: 1.12rem;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Bio needs its own column, so it stays hidden in the narrow chip — but the
     status message still reads fine as a full-width row below the name. */
  .profile-embed-card__bio-panel {
    display: none;
  }
  .profile-embed-card__status {
    width: 100%;
  }

  .profile-embed-card__bio {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.4rem;
    color: ${Color.darkerGray()};
    line-height: 1.28;
  }
  .profile-embed-card__bio > div {
    display: grid;
    grid-template-columns: 0.75rem minmax(0, 1fr);
    align-items: start;
    gap: 0.45rem;
    min-width: 0;
    overflow: hidden;
    text-align: left;
  }
  .profile-embed-card__bio-dot {
    color: ${Color.darkGray()};
    font-family: Arial, sans-serif;
    font-size: 1rem;
    line-height: 1.45;
  }
  .profile-embed-card__bio .rich-text {
    min-width: 0;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
  }
  .profile-embed-card__empty-bio {
    margin: 0.2rem 0 0;
    overflow: hidden;
    color: ${Color.darkerGray()};
    font-weight: 750;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .profile-embed-card__rank-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 0.85rem;
    min-height: 3rem;
    padding: 0.45rem 0.75rem;
    overflow: hidden;
    border: 1px solid ${Color.logoBlue(0.38)};
    border-radius: 0.75rem;
    background: #fff;
    color: ${Color.darkerGray()};
  }
  .profile-embed-card__rank-strip.top-rank {
    border-color: ${Color.gold(0.7)};
    background: #000;
    color: #fff;
  }
  .profile-embed-card__rank-left {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
    color: ${Color.darkGray()};
    font-size: 1.5rem;
  }
  .profile-embed-card__rank-strip.top-rank .profile-embed-card__rank-left {
    color: ${Color.gold()};
  }
  .profile-embed-card__rank-left > span {
    font-size: 1.5rem;
  }
  .profile-embed-card__rank-xp {
    display: none;
    min-width: 0;
    overflow: hidden;
    color: ${Color.logoGreen()};
    font-size: 1.16rem;
    font-weight: 900;
    line-height: 1;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .profile-embed-card__rank-xp span {
    color: ${Color.gold()};
  }

  /* Thumb (>= 15rem): two columns. LEFT column stacks avatar (top row) over
     username+status (second row); RIGHT column is the bio. This keeps the
     details out of a cramped middle lane at ~20rem widths (e.g. a ContentPanel
     profile-message target). Note: root font-size is 10px, so 20rem = 200px. */
  @container profileEmbedCard (min-width: 20rem) {
    .profile-embed-card__header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-areas:
        'avatar bio'
        'details bio';
      align-items: start;
      column-gap: 0.9rem;
      row-gap: 0.4rem;
      text-align: left;
    }
    .profile-embed-card__avatar-wrap {
      grid-area: avatar;
      justify-content: flex-start;
      width: 5.6rem;
    }
    .profile-embed-card__details {
      grid-area: details;
      align-items: flex-start;
      text-align: left;
    }
    .profile-embed-card__username {
      font-size: 1.5rem;
    }
    .profile-embed-card__title-row {
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .profile-embed-card__status {
      display: block;
      width: 100%;
    }
    .profile-embed-card__bio-panel {
      grid-area: bio;
      display: flex;
      min-width: 0;
      height: 100%;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      padding-left: 0.85rem;
      border-left: 1px solid ${Color.borderGray()};
    }
    .profile-embed-card__rank-xp {
      display: block;
    }
    .profile-embed-card__bio {
      font-size: max(1.18rem, 11.8px);
    }
    .profile-embed-card__bio > div {
      grid-template-columns: 0.6rem minmax(0, 1fr);
      gap: 0.35rem;
    }
    .profile-embed-card__empty-bio {
      font-size: max(1.18rem, 11.8px);
    }
  }

  /* Wide (>= 42rem = 420px): full desktop 3-column layout — avatar BESIDE
     details, then the bio side-panel. Only genuinely spacious cards (full-width
     standalone embeds, desktop feed-card target) get this; medium targets stay
     in the thumb layout above. */
  @container profileEmbedCard (min-width: 42rem) {
    .profile-embed-card__header {
      grid-template-columns: 10.5rem minmax(0, 1fr) minmax(0, 0.72fr);
      grid-template-areas: 'avatar details bio';
      align-items: center;
      column-gap: 1.1rem;
    }
    .profile-embed-card__avatar-wrap {
      width: 10rem;
    }
    .profile-embed-card__username {
      font-size: 2.2rem;
      line-height: 1.08;
    }
    .profile-embed-card__title,
    .profile-embed-card__real-name {
      font-size: 1.12rem;
    }
    .profile-embed-card__bio-panel {
      padding-left: 1rem;
    }
    .profile-embed-card__bio {
      font-size: max(1.35rem, 13.5px);
    }
    .profile-embed-card__empty-bio {
      font-size: max(1.35rem, 13.5px);
    }
  }
`;
