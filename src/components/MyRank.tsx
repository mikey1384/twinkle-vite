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
import { getRankDigitCount, getRankFontScale } from '~/helpers/rankHelpers';

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
  const rankDigitCount = useMemo(() => getRankDigitCount(rank), [rank]);
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
                (rank > 0 && rank <= 10 ? Color.pink() : Color.darkGray())
            }}
          >
            {rank && twinkleXP ? (
              <>
                <div className="rank-prefix">
                  <span style={{ fontSize: `${rankFontScale}em` }}>
                    {rankLabel}
                  </span>
                </div>
                <RankBadge rank={rank} />
                {isKorean ? (
                  <span className="rank-suffix">
                    <span style={{ fontSize: `${rankFontScale}em` }}>위</span>
                  </span>
                ) : null}
              </>
            ) : (
              unrankedLabel
            )}
          </div>
        )}
      </div>
    </div>
  );
}
