import React, { useMemo } from 'react';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';

const unrankedLabel = localize('unranked');

export default function MyRank({
  myId,
  noBorderRadius,
  rank,
  style,
  twinkleXP
}: {
  myId: number;
  noBorderRadius?: boolean;
  rank: number;
  style?: React.CSSProperties;
  twinkleXP: number;
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
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
  const rankLabel = useMemo(() => {
    return SELECTED_LANGUAGE === 'kr' ? `랭킹 ${rank}위` : `Rank #${rank}`;
  }, [rank]);

  return (
    <div
      style={{
        marginTop: '1rem',
        marginBottom: myId ? '1rem' : 0,
        borderBottom:
          !(rank > 0 && rank < 4) && noBorderRadius
            ? `1px solid ${Color.borderGray()}`
            : '',
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
        border: ${(rank > 0 && rank < 4) || noBorderRadius
          ? ''
          : `1px solid ${Color.borderGray()}`};
        border-radius: ${!noBorderRadius ? borderRadius : ''};
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
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          span {
            font-size: 2rem;
          }
          span.rank {
            font-size: ${twinkleXP > 1_000_000 ? '1.3rem' : '1.6rem'};
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
              color: rankedColor || Color[xpNumberColor]()
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
            {rank && twinkleXP ? rankLabel : unrankedLabel}
          </p>
        )}
      </div>
    </div>
  );
}
