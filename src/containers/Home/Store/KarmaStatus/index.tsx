import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import {
  Color,
  getThemeStyles,
  mobileMaxWidth,
  wideBorderRadius
} from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import KarmaExplanationModal from './KarmaExplanationModal';
import { useKeyContext } from '~/contexts';

function blendWithWhite(color: string, weight: number) {
  const match = color
    .replace(/\s+/g, '')
    .match(/rgba?\(([-\d.]+),([-\d.]+),([-\d.]+)(?:,([-\d.]+))?\)/i);
  if (!match) return '#f7f9ff';
  const [, r, g, b, a] = match;
  const w = Math.max(0, Math.min(1, weight));
  const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
  const alpha = a ? Number(a) : 1;
  return `rgba(${mix(Number(r))}, ${mix(Number(g))}, ${mix(
    Number(b)
  )}, ${alpha.toFixed(3)})`;
}

export default function KarmaStatus({
  karmaPoints,
  level,
  loading,
  numApprovedRecommendations,
  numPostsRewarded,
  numRecommended,
  numTwinklesRewarded,
  title,
  userId,
  userType
}: {
  karmaPoints: number;
  level: number;
  loading: boolean;
  numApprovedRecommendations: number;
  numPostsRewarded: number;
  numRecommended: number;
  numTwinklesRewarded: number;
  title: string;
  userId: number;
  userType: string;
}) {
  const [karmaExplanationShown, setKarmaExplanationShown] = useState(false);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const homeMenuItemActive = useKeyContext(
    (v) => v.theme.homeMenuItemActive.color
  );
  const accentColorFn = Color[homeMenuItemActive as keyof typeof Color];
  const accentColor = useMemo(() => {
    if (typeof accentColorFn === 'function') {
      return accentColorFn();
    }
    return Color.logoBlue();
  }, [accentColorFn]);
  const panelBg = useMemo(() => {
    const themeName = (profileTheme || 'logoBlue') as string;
    const themeTint = getThemeStyles(themeName, 0.08).hoverBg;
    return blendWithWhite(themeTint || accentColor, 0.94);
  }, [accentColor, profileTheme]);

  const displayedKarmaPoints = useMemo(() => {
    if (karmaPoints) {
      return addCommasToNumber(karmaPoints);
    }
    return '0';
  }, [karmaPoints]);

  const youHaveKarmaPointsText = useMemo(() => {
    return SELECTED_LANGUAGE === 'kr'
      ? `회원님의 카마포인트는 ${displayedKarmaPoints}점입니다`
      : `You have ${displayedKarmaPoints} Karma Points`;
  }, [displayedKarmaPoints]);

  if (!userId) return null;

  return (
    <div
      className={css`
        border-radius: ${wideBorderRadius};
        border: 1px solid ${Color.borderGray(0.65)};
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.98) 0%,
          var(--karma-panel-bg, #f7f9ff) 100%
        );
        box-shadow: inset 0 1px 0 ${Color.white(0.85)},
          0 10px 24px rgba(15, 23, 42, 0.14);
        backdrop-filter: blur(6px);
        padding: 2.2rem 2.4rem;
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
          box-shadow: none;
          padding: 1.8rem 1.6rem;
        }
      `}
      style={{
        ['--karma-panel-bg' as any]: panelBg,
        ['--karma-accent' as any]: accentColor
      }}
    >
      {loading ? (
        <Loading style={{ height: '10rem' }} />
      ) : (
        <div>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
              align-items: flex-start;
              font-weight: 700;
              font-size: 2.2rem;
              color: ${Color.darkerGray()};
            `}
          >
            <span>{youHaveKarmaPointsText}</span>
            <button
              className={css`
                border: 1px solid ${Color.borderGray(0.5)};
                background: rgba(255, 255, 255, 0.92);
                border-radius: 9999px;
                padding: 0.6rem 1.2rem;
                font-size: 1.4rem;
                font-weight: 600;
                color: var(--karma-accent, ${accentColor});
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.6rem;
                transition: transform 0.2s ease, box-shadow 0.2s ease,
                  border-color 0.2s ease, background 0.2s ease;
                &:hover {
                  transform: translateY(-1px);
                  border-color: var(--karma-accent, ${accentColor});
                  box-shadow: 0 12px 20px -16px rgba(15, 23, 42, 0.2);
                  background: rgba(255, 255, 255, 0.98);
                }
              `}
              onClick={() => setKarmaExplanationShown(true)}
              type="button"
            >
              tap here to learn why
              <span style={{ fontSize: '1.2rem' }}>→</span>
            </button>
          </div>
          {karmaExplanationShown && (
            <div
              className={css`
                margin-top: 2rem;
              `}
            >
              <KarmaExplanationModal
                userLevel={level}
                displayedKarmaPoints={displayedKarmaPoints}
                numApprovedRecommendations={numApprovedRecommendations}
                numPostsRewarded={numPostsRewarded}
                numRecommended={numRecommended}
                numTwinklesRewarded={numTwinklesRewarded}
                onHide={() => setKarmaExplanationShown(false)}
                userType={userType}
                userTitle={title}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
