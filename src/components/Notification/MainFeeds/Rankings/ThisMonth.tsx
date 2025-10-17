import React, { useMemo, useState } from 'react';
import RoundList from '~/components/RoundList';
import RankingsListItem from '~/components/RankingsListItem';
import localize from '~/constants/localize';
import FilterBar from '~/components/FilterBar';
import MyRank from '~/components/MyRank';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { Color, getThemeStyles } from '~/constants/css';
import { notiFilterBar } from '../../Styles';
import { useKeyContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';
import { themedCardBase } from '~/theme/themedCard';

function blendWithWhite(color: string, weight: number) {
  const match = color
    .replace(/\s+/g, '')
    .match(/rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/i);
  if (!match) return '#f8f9ff';
  const [, r, g, b, a] = match;
  const w = Math.max(0, Math.min(1, weight));
  const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
  const alpha = a ? Number(a) : 1;
  return `rgba(${mix(Number(r))}, ${mix(Number(g))}, ${mix(
    Number(b)
  )}, ${alpha.toFixed(3)})`;
}

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

export default function ThisMonth({
  allMonthly,
  loading,
  top30sMonthly,
  myId,
  myMonthlyRank,
  myMonthlyXP
}: {
  allMonthly: any[];
  loading: boolean;
  top30sMonthly: any[];
  myId: number;
  myMonthlyRank: number;
  myMonthlyXP: number;
}) {
  const [allSelected, setAllSelected] = useState(!!myId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => (profileTheme || 'logoBlue') as ThemeName,
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, 0.12),
    [themeName]
  );
  const accentColorKey = themeRoles.sectionPanel?.color as
    | keyof typeof Color
    | undefined;
  const accentColorFn =
    accentColorKey &&
    (Color[accentColorKey] as ((opacity?: number) => string) | undefined);
  const accentColor = accentColorFn ? accentColorFn() : Color.logoBlue();
  const accentTint = accentColorFn ? accentColorFn(0.14) : Color.logoBlue(0.14);
  const emptyStateBg = useMemo(() => {
    const baseTint =
      themeStyles.hoverBg || accentTint || Color.logoBlue(0.12);
    return blendWithWhite(baseTint, 0.9);
  }, [accentTint, themeStyles.hoverBg]);
  const emptyStateVars = useMemo(
    () =>
      ({
        ['--themed-card-bg' as const]: emptyStateBg,
        ['--rankings-empty-accent' as const]: accentColor
      } as React.CSSProperties),
    [accentColor, emptyStateBg]
  );
  const emptyStateClass = useMemo(
    () =>
      css`
        ${themedCardBase};
        padding: 1.6rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: ${Color.darkerGray()};
        font-size: 1.5rem;
        line-height: 1.6;
        text-align: center;
        gap: 0.8rem;
        strong {
          color: var(--rankings-empty-accent, ${accentColor});
        }
      `,
    [accentColor]
  );
  const users = useMemo(() => {
    if (allSelected) {
      return allMonthly || [];
    }
    return top30sMonthly || [];
  }, [allMonthly, allSelected, top30sMonthly]);
  const loggedIn = !!myId;
  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/Rankings/ThisMonth">
      {loggedIn && (
        <FilterBar
          className={notiFilterBar}
          bordered
          style={{
            height: '4.5rem',
            fontSize: '1.6rem'
          }}
        >
          <nav
            className={allSelected ? 'active' : ''}
            onClick={() => {
              setAllSelected(true);
            }}
          >
            {myRankingLabel}
          </nav>
          <nav
            className={allSelected ? '' : 'active'}
            onClick={() => {
              setAllSelected(false);
            }}
          >
            {top30Label}
          </nav>
        </FilterBar>
      )}
      {loggedIn && allSelected && !!myMonthlyXP && (
        <MyRank myId={myId} rank={myMonthlyRank} twinkleXP={myMonthlyXP} />
      )}
      {!myId ? (
        loading ? (
          <Loading />
        ) : null
      ) : users?.length === 0 || (allSelected && myMonthlyXP === 0) ? (
        <ScopedTheme
          theme={themeName}
          roles={['sectionPanel', 'sectionPanelText']}
          style={emptyStateVars}
        >
          <div className={emptyStateClass}>
            {myMonthlyXP === 0 ? (
              <>
                Earn XP by completing missions, watching XP videos, or leaving
                comments to join this month's leaderboard.
              </>
            ) : (
              <>Be the first to join this month's leaderboard by earning XP.</>
            )}
          </div>
        </ScopedTheme>
      ) : (
        <RoundList style={{ marginTop: 0 }}>
          {users?.map((user) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={myId}
              activityContext="monthlyXP"
            />
          ))}
        </RoundList>
      )}
    </ErrorBoundary>
  );
}
