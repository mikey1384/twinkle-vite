import React, { useMemo } from 'react';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import Icon from '~/components/Icon';
import RankBadge from '~/components/RankBadge';
import { getRankDigitCount, getRankFontScale } from '~/helpers/rankHelpers';

const unrankedLabel = 'Unranked';

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
  rank: number | null;
  style?: React.CSSProperties;
  twinkleXP: number;
  isNotification?: boolean;
}) {
  const { getColor: getXpNumberColor } = useRoleColor('xpNumber', {
    fallback: 'logoGreen'
  });
  // `rank` stays null until the leaderboard response lands. Not knowing the
  // rank is not the same as being unranked, so keep the loading placeholder
  // until the server-loaded rank arrives instead of claiming "Unranked".
  const rankKnown = typeof rank === 'number' && Number.isFinite(rank);
  const knownRank = rankKnown ? (rank as number) : 0;
  const rankedColor = useMemo(
    () =>
      knownRank === 1
        ? Color.gold()
        : knownRank === 2
        ? '#fff'
        : knownRank === 3
        ? Color.bronze()
        : null,
    [knownRank]
  );
  const rankLabel = 'Rank';
  const rankDigitCount = useMemo(() => getRankDigitCount(knownRank), [
    knownRank
  ]);
  const rankFontScale = useMemo(
    () => getRankFontScale(rankDigitCount),
    [rankDigitCount]
  );

  return (
    <div
      style={{
        marginTop: '1rem',
        marginBottom: myId ? '1rem' : 0,
        background: myId
          ? knownRank > 0 && knownRank < 4
            ? Color.black()
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
        border-radius: ${!noBorderRadius ? borderRadius : 0};
        p {
          font-weight: bold;
        }
        a {
          font-size: 1.5rem;
          font-weight: bold;
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
          span.rank {
            font-size: 1.6rem;
          }
        }
      `}
    >
      <div style={{ opacity: rankKnown ? 1 : 0.5 }}>
        <div
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <span
            className={css`
              font-size: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
            style={{
              fontWeight: 'bold',
              color: rankedColor || getXpNumberColor()
            }}
          >
            {twinkleXP ? addCommasToNumber(twinkleXP) : 0}
          </span>{' '}
          <span
            className={css`
              font-size: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
            style={{
              fontWeight: 'bold',
              color: rankedColor || Color.gold()
            }}
          >
            XP
          </span>
          {rankKnown ? null : (
            <div
              style={{
                color: Color.darkGray(),
                position: 'absolute',
                top: '50%',
                right: '-3rem',
                transform: 'translateY(-50%)'
              }}
            >
              <Icon icon="spinner" pulse />
            </div>
          )}
        </div>
        <div
          className={css`
            font-size: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-weight: bold;
          `}
          style={{
            color:
              rankedColor ||
              (knownRank > 0 && knownRank <= 10
                ? Color.pink()
                : Color.darkGray())
          }}
        >
          {!rankKnown || (knownRank && twinkleXP) ? (
            <>
              <div className="rank-prefix">
                <span style={{ fontSize: `${rankFontScale}em` }}>
                  {rankLabel}
                </span>
              </div>
              <RankBadge rank={knownRank} />
            </>
          ) : (
            unrankedLabel
          )}
        </div>
      </div>
    </div>
  );
}
