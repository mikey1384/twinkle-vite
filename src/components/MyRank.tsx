import React, { useMemo } from 'react';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, wideBorderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';
import RankBadge from '~/components/RankBadge';

const unrankedLabel = localize('unranked');

export default function MyRank({
  myId,
  noBorderRadius,
  rank,
  style,
  twinkleXP,
  isNotification
}: {
  myId: number;
  noBorderRadius?: boolean;
  rank: number;
  style?: React.CSSProperties;
  twinkleXP: number;
  isNotification?: boolean;
}) {
  const { getColor: getXpNumberColor } = useRoleColor('xpNumber', {
    fallback: 'logoGreen'
  });
  const loadingRankings = useKeyContext((v) => v.myState.loadingRankings);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const rankedColor = useMemo(
    () =>
      rank === 1
        ? Color.gold()
        : rank === 2
        ? '#fff'
        : rank === 3
        ? Color.bronze()
        : null,
    [rank]
  );
  const isKorean = SELECTED_LANGUAGE === 'kr';
  const rankLabel = localize('rank');
  const baseBadgeFontSize = twinkleXP > 1_000_000 ? '1.3rem' : '1.5rem';
  const mobileBadgeFontSize = twinkleXP > 1_000_000 ? '1rem' : '1.2rem';
  const badgeScale = 1.12;
  const badgeMinWidth = '3.4rem';
  const badgeHeight = '2.6rem';
  const badgeMinWidthMobile = '3.1rem';
  const badgeHeightMobile = '2.5rem';
  const rankBadgeClass = useMemo(
    () =>
      css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 0.5rem;
        font-size: calc(${baseBadgeFontSize} * ${badgeScale});
        min-width: ${badgeMinWidth};
        height: ${badgeHeight};
        @media (max-width: ${mobileMaxWidth}) {
          margin-left: 0.4rem;
          font-size: calc(${mobileBadgeFontSize} * ${badgeScale});
          min-width: ${badgeMinWidthMobile};
          height: ${badgeHeightMobile};
        }
      `,
    [baseBadgeFontSize, badgeScale, badgeMinWidth, badgeHeight, mobileBadgeFontSize, badgeMinWidthMobile, badgeHeightMobile]
  );

  return (
    <div
      style={{
        marginTop: '1rem',
        marginBottom: myId ? '1rem' : 0,
        background: myId
          ? rank > 0
            ? rank < 4
              ? Color.black()
              : '#fff'
            : '#fff'
          : '',
        ...style
      }}
      className={css`
        width: 100%;
        margin-bottom: 0px;
        text-align: center;
        padding: 1rem;
        border: none;
        border-radius: ${!noBorderRadius ? wideBorderRadius : 0};
        p {
          font-weight: bold;
        }
        a {
          font-size: 1.5rem;
          font-weight: bold;
        }
        span {
          font-size: ${twinkleXP > 1_000_000 ? '2.8rem' : '3rem'};
        }
        span.rank {
          font-size: ${twinkleXP > 1_000_000 ? '1.7rem' : '2rem'};
        }
        .rank-prefix,
        .rank-suffix {
          display: inline-flex;
          align-items: center;
        }
        ${isNotification
          ? css`
              .rank-prefix {
                font-size: 2.1rem;
              }
              @media (max-width: ${mobileMaxWidth}) {
                .rank-prefix {
                  font-size: 1.8rem;
                }
              }
            `
          : ''}
        .rank {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .rank-suffix {
          margin-left: 0.5rem;
        }
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          span {
            font-size: 2rem;
          }
          span.rank {
            font-size: ${twinkleXP > 1_000_000 ? '1.3rem' : '1.6rem'};
          }
          .rank {
            gap: 0.4rem;
          }
          .rank-suffix {
            margin-left: 0.4rem;
          }
        }
      `}
    >
      <div>
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            opacity:
              rank > 3 && (loadingRankings || typeof twinkleCoins !== 'number')
                ? 0.5
                : 1
          }}
        >
          <span
            style={{
              fontWeight: 'bold',
              color: rankedColor || getXpNumberColor()
            }}
          >
            {twinkleXP ? addCommasToNumber(twinkleXP) : 0}
          </span>{' '}
          <span
            style={{
              fontWeight: 'bold',
              color: rankedColor || Color.gold()
            }}
          >
            XP
          </span>
          {loadingRankings || typeof twinkleCoins !== 'number' ? (
            <div
              style={{
                color:
                  rankedColor ||
                  (rank > 0 && rank <= 10 ? Color.pink() : Color.darkGray()),
                position: 'absolute',
                top: '50%',
                right: '-3rem',
                transform: 'translateY(-50%)'
              }}
            >
              <Icon icon="spinner" pulse />
            </div>
          ) : null}
        </div>
        {typeof twinkleCoins === 'number' && (
          <p
            className="rank"
            style={{
              color:
                rankedColor ||
                (rank > 0 && rank <= 10 ? Color.pink() : Color.darkGray())
            }}
          >
            {rank && twinkleXP ? (
              <>
                <span className="rank-prefix">{rankLabel}</span>
                <RankBadge rank={rank} className={rankBadgeClass} />
                {isKorean ? <span className="rank-suffix">위</span> : null}
              </>
            ) : (
              unrankedLabel
            )}
          </p>
        )}
      </div>
    </div>
  );
}
