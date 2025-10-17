import React, { useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import { Color, getThemeStyles } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import KarmaExplanationModal from './KarmaExplanationModal';
import { useKeyContext } from '~/contexts';
import { homePanelClass } from '~/theme/homePanels';
import { getThemeRoles, ThemeName } from '~/theme/themes';

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
  const themeName = useMemo<ThemeName>(
    () => ((profileTheme || 'logoBlue') as ThemeName),
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
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
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, 0.12),
    [themeName]
  );
  const panelBg = useMemo(() => {
    return blendWithWhite(themeStyles.hoverBg || accentColor, 0.94);
  }, [accentColor, themeStyles.hoverBg]);
  const headingColor = useMemo(() => {
    const headingKey = themeRoles.sectionPanelText?.color as
      | keyof typeof Color
      | undefined;
    const headingFn =
      headingKey && (Color[headingKey] as ((opacity?: number) => string) | undefined);
    return headingFn ? headingFn() : Color.darkerGray();
  }, [themeRoles.sectionPanelText?.color]);

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
      className={cx(
        homePanelClass,
        css`
          gap: 1.6rem;
        `
      )}
      style={{
        ['--home-panel-bg' as const]: panelBg,
        ['--home-panel-tint' as const]:
          themeStyles.hoverBg ||
          (accentColorFn ? accentColorFn(0.14) : Color.logoBlue(0.14)),
        ['--home-panel-border' as const]: themeStyles.border || Color.borderGray(0.65),
        ['--home-panel-heading' as const]: headingColor,
        ['--home-panel-accent' as const]: accentColor,
        ['--home-panel-color' as const]: Color.darkerGray(),
        ['--home-panel-gap' as const]: '1.6rem',
        ['--home-panel-padding' as const]: '2.2rem 2.4rem',
        ['--home-panel-mobile-padding' as const]: '1.8rem 1.6rem'
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
                color: var(--home-panel-accent, ${accentColor});
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.6rem;
                transition: transform 0.2s ease, box-shadow 0.2s ease,
                  border-color 0.2s ease, background 0.2s ease;
                &:hover {
                  transform: translateY(-1px);
                  border-color: var(--home-panel-accent, ${accentColor});
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
