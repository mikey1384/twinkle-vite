import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import UsernameText from '~/components/Texts/UsernameText';
import DailyGoalsPreview from '~/containers/Home/Stories/FeedCard/Body/DailyGoalsPreview';
import { Color, borderRadius } from '~/constants/css';

// A daily goals bonus inside a comment, post or chat message: the Home feed
// card's own preview (card, multiplier, XP and coins, the word, the bonus
// question and its choices) in the feed's compact "target" form. That form
// lives in the feed card's stylesheet (FeedCard/Body/styles), which does not
// reach a RichText embed, so the rules it needs are repeated here, scoped to
// this embed. Keep them in step with mainPreviewStyles.ts (the base look,
// reward multiplier tiers) and targetPreviewStyles.ts (the compact sizes).
const embedClass = css`
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 36rem;
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  text-align: left;
  cursor: pointer;
  &:hover {
    border-color: ${Color.logoBlue(0.5)};
  }
  &:focus-within {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
  .daily-goals-embed__label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    padding: 0.5rem 0.85rem 0;
    color: ${Color.gray()};
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .daily-goals-embed__author {
    position: relative;
    z-index: 2;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .daily-goals-embed__link {
    flex-shrink: 0;
    color: inherit;
    text-decoration: none;
    outline: none;
    /* Stretch the real link over the card; the member control stays above it. */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
    }
  }
  .home-feed-card__daily-goals-preview {
    position: relative;
    z-index: 0;
    --home-feed-daily-goals-thumb-height: max(10.5rem, 105px);
    --home-feed-daily-goals-thumb-width: max(7.5rem, 75px);
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    min-height: 0;
    overflow: hidden;
    padding: 0.5rem 0.85rem 0.7rem;
  }
  .home-feed-card__daily-goals-preview.has-media {
    grid-template-columns: max(7.5rem, 75px) minmax(0, 1fr);
  }
  .home-feed-card__daily-goals-card {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }
  .home-feed-card__daily-goals-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 0.28rem;
    overflow: hidden;
  }
  .home-feed-card__reward-chips,
  .home-feed-card__choice-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    min-width: 0;
  }
  .home-feed-card__reward-chips {
    gap: 0.35rem;
  }
  .home-feed-card__reward-chip {
    min-height: 1.65rem;
    padding: 0.26rem 0.52rem;
    font-size: 1.05rem;
  }
  .home-feed-card__reward-chip.multiplier {
    border: 1px solid var(--reward-multiplier-border, transparent);
    background: var(--reward-multiplier-bg, ${Color.black(0.05)});
    color: var(--reward-multiplier-color, ${Color.darkGray()});
    box-shadow: var(--reward-multiplier-shadow, none);
  }
  .home-feed-card__reward-chip.multiplier svg {
    color: currentColor;
    font-size: 1rem;
  }
  .home-feed-card__reward-chip.multiplier--active {
    --reward-multiplier-bg: ${Color.logoBlue(0.12)};
    --reward-multiplier-border: ${Color.logoBlue(0.2)};
    --reward-multiplier-color: ${Color.logoBlue()};
  }
  .home-feed-card__reward-chip.multiplier--strong {
    --reward-multiplier-bg: ${Color.logoGreen(0.14)};
    --reward-multiplier-border: ${Color.logoGreen(0.3)};
    --reward-multiplier-color: ${Color.green()};
  }
  .home-feed-card__reward-chip.multiplier--major {
    --reward-multiplier-bg: ${Color.gold(0.17)};
    --reward-multiplier-border: ${Color.gold(0.38)};
    --reward-multiplier-color: ${Color.orange()};
    --reward-multiplier-shadow: 0 0.08rem 0.32rem ${Color.gold(0.2)};
  }
  .home-feed-card__reward-chip.multiplier--epic {
    --reward-multiplier-bg: ${Color.pink(0.13)};
    --reward-multiplier-border: ${Color.strongPink(0.28)};
    --reward-multiplier-color: ${Color.rose()};
    --reward-multiplier-shadow: 0 0.08rem 0.42rem ${Color.pink(0.17)};
  }
  .home-feed-card__reward-chip.multiplier--legendary {
    --reward-multiplier-bg: linear-gradient(
      135deg,
      ${Color.black()},
      rgba(98, 73, 18, 1)
    );
    --reward-multiplier-border: ${Color.gold(0.55)};
    --reward-multiplier-color: ${Color.brightGold()};
    --reward-multiplier-shadow: 0 0.1rem 0.55rem ${Color.gold(0.22)};
  }
  .home-feed-card__daily-goals-preview h3 {
    margin: 0;
    padding-bottom: 0.02em;
    display: block;
    font-size: max(1.72rem, 17.2px);
    font-weight: 900;
    line-height: 1.08;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .home-feed-card__bonus-question {
    color: ${Color.darkerGray()};
    font-size: max(1.28rem, 12.8px);
    line-height: 1.18;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  .home-feed-card__choice-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.3rem;
  }
  .home-feed-card__choice-list span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.3rem 0.45rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.45rem;
    background: ${Color.whiteGray()};
    color: ${Color.darkGray()};
    font-size: max(1.08rem, 10.8px);
    font-weight: 700;
    line-height: 1.1;
  }
`;

export default function DailyGoalsEmbed({
  contentId,
  dailyGoals
}: {
  contentId: number;
  dailyGoals: any;
}) {
  const uploader = dailyGoals?.uploader;
  return (
    <div className={embedClass}>
      <div className="daily-goals-embed__label">
        {uploader?.username ? (
          <span
            className="daily-goals-embed__author"
            onClick={(event) => event.stopPropagation()}
          >
            <UsernameText
              user={uploader}
              color="inherit"
              textStyle={{ fontSize: 'inherit', fontWeight: 'inherit' }}
            />
          </span>
        ) : null}
        <Link
          className="daily-goals-embed__link"
          to={`/daily-rewards/${contentId}`}
          aria-label="Open daily goals bonus"
          onClick={(event) => event.stopPropagation()}
          onAuxClick={(event) => event.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {uploader?.username ? '· ' : ''}Daily goals bonus
        </Link>
      </div>
      <DailyGoalsPreview dailyGoals={dailyGoals} variant="target" />
    </div>
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === 'Enter') event.stopPropagation();
    if (event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.click();
    }
  }
}
