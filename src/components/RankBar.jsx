import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, mobileMaxWidth, Color } from '~/constants/css';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const rankLabel = localize('rank');

RankBar.propTypes = {
  className: PropTypes.string,
  profile: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function RankBar({ className, profile, style }) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const rankColor = useMemo(
    () =>
      profile.rank === 1
        ? Color.gold()
        : profile.rank === 2
        ? '#fff'
        : profile.rank === 3
        ? Color.bronze()
        : undefined,
    [profile.rank]
  );
  const rankNumberLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${profile.rank}위`;
    }
    return `#${profile.rank}`;
  }, [profile.rank]);
  const xpNumberLabel = useMemo(() => {
    const innerComponent = (
      <>
        <span
          style={{
            color:
              rankColor ||
              (profile.rank <= 10 ? Color[xpNumberColor]() : Color.darkGray())
          }}
        >
          {addCommasToNumber(profile.twinkleXP)}
        </span>{' '}
        <span
          style={{
            color:
              rankColor ||
              (profile.rank <= 10 ? Color.gold() : Color.darkGray())
          }}
        >
          XP
        </span>
      </>
    );
    return SELECTED_LANGUAGE === 'kr' ? (
      <>
        <span style={{ color: profile.rank > 3 ? Color.darkGray() : null }}>
          (
        </span>
        {innerComponent}
        <span style={{ color: profile.rank > 3 ? Color.darkGray() : null }}>
          )
        </span>
      </>
    ) : (
      innerComponent
    );
  }, [profile.rank, profile.twinkleXP, rankColor, xpNumberColor]);

  return (
    <div
      style={style}
      className={`${css`
        padding: 1.5rem 0;
        font-size: 2rem;
        color: ${rankColor};
        font-weight: bold;
        text-align: center;
        border-bottom-left-radius: ${borderRadius};
        border-bottom-right-radius: ${borderRadius};
        ${profile.rank > 3 ? `border: 1px solid ${Color.borderGray()};` : ''}
        background: ${profile.rank < 4 ? Color.black() : '#fff'};
        @media (max-width: ${mobileMaxWidth}) {
          margin-left: 0;
          margin-right: 0;
          border-radius: 0;
          border-left: none;
          border-right: none;
        }
      `} ${className}`}
    >
      <span>
        <span
          style={{
            color:
              rankColor ||
              (profile.rank <= 10 ? Color.logoBlue() : Color.darkGray())
          }}
        >
          {rankLabel}
        </span>{' '}
        <span
          style={{
            color:
              rankColor ||
              (profile.rank <= 10 ? Color.logoBlue() : Color.darkGray())
          }}
        >
          {rankNumberLabel}
        </span>{' '}
        {SELECTED_LANGUAGE === 'en' ? (
          <span
            style={{
              color:
                rankColor ||
                (profile.rank <= 10 ? Color.logoBlue() : Color.darkGray())
            }}
          >
            with
          </span>
        ) : null}
      </span>{' '}
      <span>
        {xpNumberLabel}
        {!!profile.xpThisMonth && (
          <span
            style={{
              fontSize: '1.7rem',
              color:
                rankColor ||
                (profile.xpThisMonth >= 1000 ? Color.pink() : Color.darkGray())
            }}
          >
            {' '}
            (↑
            {addCommasToNumber(profile.xpThisMonth)} this month)
          </span>
        )}
      </span>
    </div>
  );
}
