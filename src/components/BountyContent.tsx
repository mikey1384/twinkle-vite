import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import LinkPreviewImage from '~/components/LinkPreviewImage';
import RewardChips from '~/components/RewardChips';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

// The feed pairs artwork with a compact summary. The full panel follows the
// daily-bonus reading order: artwork, accomplishment, earned rewards, app action.
export default function BountyContent({
  bounty,
  compact = false,
  theme
}: {
  bounty: {
    id?: number;
    title?: string;
    buildId?: number;
    buildTitle?: string;
    buildThumbnailUrl?: string;
    appAvailable?: boolean | number;
    xpEarned?: number;
    coinEarned?: number;
  };
  compact?: boolean;
  theme?: string;
}) {
  const navigate = useNavigate();
  const { colorKey: buttonColor } = useRoleColor('button', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const appTitle = bounty.buildTitle || 'Lumine app';
  const appAvailable = !!(bounty.appAvailable && bounty.buildId);
  const artworkClass = `bounty-content__art${bounty.buildThumbnailUrl ? '' : ' bounty-content__art--placeholder'}`;
  const Heading = compact ? 'h3' : 'h2';
  const artwork = bounty.buildThumbnailUrl ? (
    <LinkPreviewImage src={bounty.buildThumbnailUrl} alt="" />
  ) : (
    <Icon icon="laptop-code" />
  );

  return (
    <div
      className={`bounty-content ${bountyContentClass}${compact ? ' bounty-content--compact' : ''}`}
    >
      <div className="bounty-content__layout">
        {appAvailable ? (
          <Link
            className={artworkClass}
            to={`/app/${bounty.buildId}`}
            aria-label={`Try ${appTitle}`}
          >
            {artwork}
          </Link>
        ) : (
          <div className={artworkClass} aria-hidden="true">
            {artwork}
          </div>
        )}
        <div className="bounty-content__details">
          {!appAvailable && (
            <div className="bounty-content__app">
              <span>{appTitle}</span>
              <span className="bounty-content__unavailable">App unavailable</span>
            </div>
          )}
          <Heading className="bounty-content__title">
            {bounty.title || 'Bounty earned'}
          </Heading>
          <div className="bounty-content__rewards" aria-label="Rewards earned">
            {!compact && <span className="bounty-content__earned">Earned</span>}
            <RewardChips
              xp={Number(bounty.xpEarned)}
              coins={Number(bounty.coinEarned)}
            />
          </div>
          {appAvailable && (
            <Button
              className="bounty-content__try"
              color={theme === 'gold' ? 'logoBlue' : buttonColor}
              variant="solid"
              tone="raised"
              size={compact ? 'sm' : 'lg'}
              uppercase={false}
              onClick={handleTryApp}
            >
              <span className="bounty-content__try-label" title={appTitle}>
                Try {appTitle}
              </span>
              <Icon
                icon="arrow-right"
                style={{ flexShrink: 0, marginLeft: '0.7rem' }}
              />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  function handleTryApp(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();
    navigate(`/app/${bounty.buildId}`);
  }
}

const bountyContentClass = css`
  container: bounty-content / inline-size;
  width: 100%;
  min-width: 0;
  color: ${Color.darkerGray()};

  .bounty-content__layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    padding: 0.5rem 0;
  }

  .bounty-content__art {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: min(100%, 32rem);
    overflow: hidden;
    border-radius: 0.7rem;
    color: ${Color.darkGray()};
    font-size: 3rem;
  }

  .bounty-content__art--placeholder {
    aspect-ratio: 16 / 10;
    background: ${Color.whiteGray()};
  }

  .bounty-content__art img {
    display: block;
    width: 100%;
    height: auto;
  }

  a.bounty-content__art:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 3px;
  }

  .bounty-content__details {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    max-width: 100%;
    gap: 0.8rem;
    text-align: center;
  }

  .bounty-content__title {
    margin: 0;
    max-width: 60rem;
    color: ${Color.black()};
    font-size: max(2.2rem, 22px) !important;
    font-weight: 700;
    line-height: 1.35;
    text-wrap: balance;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }

  .bounty-content__app {
    font-size: max(1.3rem, 13px);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .bounty-content__unavailable {
    display: block;
    margin-top: 0.25rem;
    color: ${Color.gray()};
    font-size: max(1.1rem, 11px);
  }

  .bounty-content__rewards {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    min-width: 0;
  }

  .bounty-content__earned {
    margin-right: 0.2rem;
    font-size: max(1.3rem, 13px);
  }

  .reward-amount-chip {
    font-size: max(1.2rem, 12px);
  }

  .bounty-content__try {
    order: 2;
    width: min(100%, 32rem);
    min-height: 44px;
    margin-top: 0.4rem;
    font-size: max(1.5rem, 15px);
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .bounty-content__try-label {
    display: -webkit-box;
    min-width: 0;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  &.bounty-content--compact {
    .bounty-content__layout {
      display: grid;
      grid-template-columns: minmax(12rem, 32%) minmax(0, 1fr);
      align-items: center;
      gap: 2rem;
      padding: 1rem;
    }

    .bounty-content__art {
      width: 100%;
      max-width: 22rem;
      justify-self: center;
    }

    .bounty-content__details {
      align-items: flex-start;
      gap: 0.7rem;
      text-align: left;
    }

    .bounty-content__rewards {
      order: -1;
      justify-content: flex-start;
    }

    .bounty-content__title {
      font-size: max(1.8rem, 18px) !important;
      text-wrap: pretty;
    }

    .bounty-content__app {
      order: 1;
    }

    .bounty-content__try {
      width: 100%;
      font-size: max(1.3rem, 13px);
    }
  }

  @container bounty-content (max-width: 440px) {
    &.bounty-content--compact .bounty-content__layout {
      grid-template-columns: minmax(8.5rem, 30%) minmax(0, 1fr);
      gap: 1.25rem;
      padding: 0.8rem;
    }

    &.bounty-content--compact .bounty-content__title {
      font-size: max(1.6rem, 16px) !important;
    }
  }
`;
