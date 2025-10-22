import React, { useMemo } from 'react';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, mobileMaxWidth, Color } from '~/constants/css';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';
import { useRoleColor } from '~/theme/useRoleColor';

const rankLabel = localize('rank');

function blendWithWhite(color: string, weight: number) {
  const hexMatch = color?.trim().match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) {
    const [, value] = hexMatch;
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const w = Math.max(0, Math.min(1, weight));
    const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
    return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, 1)`;
  }
  const match = color
    ?.replace(/\s+/g, '')
    .match(/rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/i);
  if (!match) return '#f3f6ff';
  const [, r, g, b, a] = match;
  const w = Math.max(0, Math.min(1, weight));
  const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
  const alpha = a ? Number(a) : 1;
  return `rgba(${mix(Number(r))}, ${mix(Number(g))}, ${mix(
    Number(b)
  )}, ${alpha.toFixed(3)})`;
}

export default function RankBar({
  className,
  profile,
  style
}: {
  className?: string;
  profile: any;
  style?: any;
}) {
  // Non-themed: use static colors
  const { getColor: _unused } = useRoleColor('xpNumber', {
    themeName: 'logoBlue',
    fallback: 'logoGreen'
  });
  const rankValue = Number(profile?.rank ?? 0);
  const rankColor = useMemo(() => {
    if (rankValue === 1) return Color.gold();
    if (rankValue === 2) return Color.lighterGray();
    if (rankValue === 3) return Color.orange();
    return undefined;
  }, [rankValue]);
  const rankTextColor = useMemo(() => {
    if (rankValue === 1) return Color.gold();
    if (rankValue === 2) return Color.lighterGray();
    if (rankValue === 3) return Color.orange();
    return rankValue <= 10 ? Color.logoBlue() : Color.darkGray();
  }, [rankValue]);
  const borderCss = '1px solid var(--ui-border)';
  const isTopThree = rankValue <= 3;
  const baseTextColor = isTopThree ? '#ffffff' : Color.darkerGray();
  const xpValueColor = Color.logoGreen();
  const trophyColor = rankTextColor;
  const xpUnitColor = useMemo(() => Color.gold(), []);
  const xpMonthColor = useMemo(
    () => (rankColor ? rankColor : Color.pink()),
    [rankColor]
  );
  const rankCardClass = useMemo(
    () =>
      css`
        margin-top: 0.8rem;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 1.2rem;
        padding: 1.4rem 1.9rem;
        border: ${borderCss};
        border-image: none;
        border-top: none;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        border-bottom-left-radius: ${borderRadius};
        border-bottom-right-radius: ${borderRadius};
        background: ${isTopThree ? '#000' : '#fff'};
        box-shadow: none;
        color: ${baseTextColor};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: none;
          border-right: none;
          padding: 1.3rem 1.4rem;
        }
      `,
    [baseTextColor, borderCss, isTopThree]
  );
  const badgeClass = useMemo(
    () =>
      css`
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.45rem 1.1rem;
        border-radius: 999px;
        font-size: 1.6rem;
        font-weight: 700;
        color: ${rankTextColor};
        background: ${isTopThree
          ? 'rgba(255, 255, 255, 0.14)'
          : 'rgba(255, 255, 255, 0.45)'};
        box-shadow: ${isTopThree
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.28)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)'};
      `,
    [rankTextColor, isTopThree]
  );
  const xpInfoClass = useMemo(
    () =>
      css`
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.35rem;
        text-align: right;
        @media (max-width: ${mobileMaxWidth}) {
          align-items: flex-start;
          text-align: left;
          width: 100%;
        }
        .xp-amount {
          font-size: 1.65rem;
          font-weight: 700;
          color: ${xpValueColor};
          text-shadow: none;
          display: inline-flex;
          align-items: baseline;
        }
        .xp-value {
          color: ${xpValueColor};
        }
        .xp-unit {
          margin-left: 0.35rem;
          color: ${xpUnitColor};
          font-size: 1.45rem;
          font-weight: 600;
        }
        .xp-paren {
          color: ${rankColor ? rankColor : Color.darkerGray(0.8)};
        }
        .xp-month {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${xpMonthColor};
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
      `,
    [rankColor, xpMonthColor, xpUnitColor, xpValueColor]
  );
  const rankLabelText =
    SELECTED_LANGUAGE === 'kr' ? `${rankValue}위` : `#${rankValue}`;
  const xpAmount = addCommasToNumber(profile.twinkleXP || 0);
  const monthGainLabel =
    profile.xpThisMonth && SELECTED_LANGUAGE === 'kr'
      ? `+${addCommasToNumber(profile.xpThisMonth)} 이번 달`
      : profile.xpThisMonth
      ? `+${addCommasToNumber(profile.xpThisMonth)} this month`
      : null;
  if (!rankValue) {
    return null;
  }

  return (
    <div style={style} className={`${rankCardClass} ${className || ''}`}>
        <div className={badgeClass}>
          <Icon
            icon={rankValue <= 3 ? 'trophy' : 'award'}
            color={trophyColor}
          />
          <span>
            {rankLabel} {rankLabelText}
          </span>
        </div>
        <div className={xpInfoClass}>
          <span className="xp-amount">
            {SELECTED_LANGUAGE === 'kr' ? (
              <span className="xp-paren">(</span>
            ) : null}
            <span className="xp-value">{xpAmount}</span>
            <span className="xp-unit">XP</span>
            {SELECTED_LANGUAGE === 'kr' ? (
              <span className="xp-paren">)</span>
            ) : null}
          </span>
          {monthGainLabel ? (
            <span className="xp-month">
              <Icon icon="arrow-up" color={trophyColor} />
              {monthGainLabel}
            </span>
          ) : null}
        </div>
      </div>
  );
}
