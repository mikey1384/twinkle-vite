import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const unrankedLabel = localize('unranked');

MyRank.propTypes = {
  myId: PropTypes.number,
  noBorderRadius: PropTypes.bool,
  rank: PropTypes.number,
  style: PropTypes.object,
  twinkleXP: PropTypes.number
};

export default function MyRank({
  myId,
  noBorderRadius,
  rank,
  style,
  twinkleXP
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
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
          : null,
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
        <p
          className="rank"
          style={{
            color:
              rankedColor ||
              (rank > 0 && rank <= 10 ? Color.pink() : Color.darkGray())
          }}
        >
          {rank ? rankLabel : unrankedLabel}
        </p>
      </div>
    </div>
  );
}
