import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import { Color, mobileMaxWidth } from '~/constants/css';
import { returnCardBurnXP } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Card, User } from '~/types';

export function BurnValue({
  burnXP,
  xpNumberColor,
  showExplanation = false,
  isBurned = false
}: {
  burnXP: number | string;
  xpNumberColor: string;
  showExplanation?: boolean;
  isBurned?: boolean;
}) {
  return (
    <div
      className="compact-ai-card-preview__stat compact-ai-card-preview__stat--burn"
      style={{ textAlign: 'center' }}
    >
      <div>
        {isBurned ? (
          'XP earned'
        ) : (
          <>
            <b style={{ color: Color.redOrange() }}>Burn</b> value
          </>
        )}
      </div>
      <div style={{ marginTop: 'var(--ai-card-value-gap, 0.5rem)' }}>
        <b style={{ color: Color[xpNumberColor]() }}>
          {addCommasToNumber(burnXP)}
        </b>{' '}
        <b style={{ color: Color.gold() }}>XP</b>
      </div>
      {showExplanation && (
        <p
          className={css`
            margin-top: 0.5rem;
            font-size: 1.1rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 0.3rem;
            }
          `}
        >
          (Burning this card yields{' '}
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>)
        </p>
      )}
    </div>
  );
}

export function CardOwner({
  owner,
  onMenuShownChange,
  label = 'Owned by'
}: {
  owner?: User | null;
  onMenuShownChange?: (shown: boolean) => void;
  label?: string;
}) {
  const { colorKey } = useRoleColor('userLink', { fallback: 'logoBlue' });
  const userLinkColor = colorKey && colorKey in Color ? colorKey : 'logoBlue';
  return (
    <div
      className="compact-ai-card-preview__stat compact-ai-card-preview__stat--owner"
      style={{ textAlign: 'center' }}
      onClickCapture={handleOwnerClickCapture}
    >
      <div>{label}</div>
      <UsernameText
        user={owner ?? undefined}
        color={Color[userLinkColor]()}
        onMenuShownChange={onMenuShownChange}
        wordBreakEnabled
      />
    </div>
  );

  function handleOwnerClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    // Some targets are links. Opening a username popup must not also follow
    // that link; its portaled profile links must retain their own navigation.
    const target = event.target;
    if (
      target instanceof Element &&
      event.currentTarget.contains(target) &&
      target.closest('[data-feed-card-interactive]') &&
      event.currentTarget.closest('a[href]')
    ) {
      event.preventDefault();
    }
  }
}

export default function AICardMarketDetails({
  card,
  summoner
}: {
  card: Partial<Card>;
  summoner?: User;
}) {
  const { colorKey } = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const xpNumberColor = colorKey && colorKey in Color ? colorKey : 'logoGreen';
  const burnXP =
    card.quality === '???'
      ? '???'
      : returnCardBurnXP({
          cardLevel: Number(card.level || 1),
          cardQuality: card.quality || 'common'
        });
  return (
    <div
      className={`compact-ai-card-preview__market ${css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ai-card-market-gap, 1.4rem);
        min-width: 0;
        font-family: 'Lato', 'Arial', sans-serif;
        font-size: 1.2rem;
        font-weight: 400;
        line-height: 1.4;
        overflow-wrap: anywhere;
        .compact-ai-card-preview__stat--listed b {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .compact-ai-card-preview__coin-price {
          color: ${Color.darkerGray()};
        }
        @media (max-width: ${mobileMaxWidth}) {
          gap: var(--ai-card-market-gap, 0.7rem);
          font-size: 1.1rem;
        }
      `}`}
    >
      <BurnValue
        burnXP={burnXP}
        xpNumberColor={xpNumberColor}
        isBurned={!!card.isBurned}
      />
      {card.owner && (
        <CardOwner
          owner={card.owner}
          label={card.isBurned ? 'Burned by' : 'Owned by'}
        />
      )}
      {summoner && <CardOwner owner={summoner} label="Summoned by" />}
      {!card.isBurned && !!card.askPrice && (
        <div
          className="compact-ai-card-preview__stat compact-ai-card-preview__stat--listed"
          style={{ textAlign: 'center' }}
        >
          <div>Listed for</div>
          <b>
            <Icon style={{ color: Color.brownOrange() }} icon="coins" />
            <span className="compact-ai-card-preview__coin-price">
              {addCommasToNumber(card.askPrice)}
            </span>
          </b>
        </div>
      )}
    </div>
  );
}
