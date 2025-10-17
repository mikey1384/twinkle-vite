import React, { useEffect, useMemo } from 'react';
import CurrentMonth from './CurrentMonth';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import MonthItem from './MonthItem';
import localize from '~/constants/localize';
import moment from 'moment';
import Loading from '~/components/Loading';
import { homePanelClass } from '~/theme/homePanels';
import {
  useAppContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { SELECTED_LANGUAGE, months } from '~/constants/defaultValues';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';
import { Color, getThemeStyles } from '~/constants/css';

const leaderboardLabel = localize('leaderboard');

export default function YearItem({
  style,
  year,
  currentYear
}: {
  style?: React.CSSProperties;
  year: number;
  currentYear: number;
}) {
  const { standardTimeStamp } = useNotiContext((v) => v.state.todayStats);
  const loadMonthlyLeaderboards = useAppContext(
    (v) => v.requestHelpers.loadMonthlyLeaderboards
  );
  const onLoadMonthlyLeaderboards = useHomeContext(
    (v) => v.actions.onLoadMonthlyLeaderboards
  );
  const leaderboardsObj = useHomeContext((v) => v.state.leaderboardsObj);
  const onSetLeaderboardsExpanded = useHomeContext(
    (v) => v.actions.onSetLeaderboardsExpanded
  );
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
  const headingColorKey = themeRoles.sectionPanelText?.color as
    | keyof typeof Color
    | undefined;
  const headingColorFn =
    headingColorKey &&
    (Color[headingColorKey] as ((opacity?: number) => string) | undefined);
  const headingColor = headingColorFn ? headingColorFn() : Color.darkerGray();
  const accentColorKey = themeRoles.sectionPanel?.color as
    | keyof typeof Color
    | undefined;
  const accentColorFn =
    accentColorKey &&
    (Color[accentColorKey] as ((opacity?: number) => string) | undefined);
  const accentColor = accentColorFn ? accentColorFn() : Color.logoBlue();
  const accentTint = accentColorFn ? accentColorFn(0.14) : Color.logoBlue(0.14);
  const panelVars = useMemo(
    () =>
      ({
        ['--home-panel-bg' as const]: '#ffffff',
        ['--home-panel-tint' as const]:
          themeStyles.hoverBg || accentTint || Color.logoBlue(0.12),
        ['--home-panel-border' as const]: themeStyles.border,
        ['--home-panel-heading' as const]: headingColor,
        ['--home-panel-accent' as const]: accentColor,
        ['--home-panel-card-border' as const]: themeStyles.border
      } as React.CSSProperties),
    [
      accentColor,
      accentTint,
      headingColor,
      themeStyles.border,
      themeStyles.hoverBg
    ]
  );
  const combinedStyle = useMemo(() => {
    if (!style) return panelVars;
    return { ...panelVars, ...style };
  }, [panelVars, style]);

  const currentMonth = useMemo(
    () => Number(moment.utc(standardTimeStamp || Date.now()).format('M')),
    [standardTimeStamp]
  );

  useEffect(() => {
    if (!leaderboardsObj?.[year]?.loaded) {
      handleLoadMonthlyLeaderboards();
    }
    async function handleLoadMonthlyLeaderboards() {
      const leaderboards = await loadMonthlyLeaderboards(year);
      onLoadMonthlyLeaderboards({ leaderboards, year });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardsObj?.[year]?.loaded]);

  const { expanded, leaderboards } = useMemo(() => {
    return leaderboardsObj?.[year] || {};
  }, [leaderboardsObj, year]);

  const displayedLeaderBoards = useMemo(() => {
    if (!leaderboards) return [];
    if (year === currentYear) {
      return expanded
        ? leaderboards.filter(
            (leaderboard: { month: any }) => leaderboard.month !== currentMonth
          )
        : [];
    }
    return expanded ? leaderboards : [leaderboards[0]];
  }, [currentMonth, currentYear, expanded, leaderboards, year]);

  const showAllButtonShown = useMemo(() => {
    return (
      leaderboardsObj?.[year]?.loaded &&
      !leaderboardsObj?.[year]?.expanded &&
      leaderboards?.length > 1
    );
  }, [leaderboards?.length, leaderboardsObj, year]);

  return (
    <ScopedTheme
      theme={themeName}
      roles={['sectionPanel', 'sectionPanelText']}
      className={homePanelClass}
      style={combinedStyle}
    >
      <p>
        {year}
        {SELECTED_LANGUAGE === 'kr' ? '년' : ''} {leaderboardLabel}
      </p>
      {year === currentYear || leaderboardsObj?.[year]?.loaded ? (
        <div style={{ marginTop: '2rem', position: 'relative' }}>
          {year === currentYear ? <CurrentMonth /> : null}
          {displayedLeaderBoards.map((leaderboard: any) => (
            <MonthItem
              key={leaderboard.id}
              style={{ marginTop: '1rem' }}
              monthLabel={months?.[leaderboard.month - 1]}
              yearLabel={String(leaderboard.year)}
              top30={leaderboard.rankings}
            />
          ))}
          {!leaderboardsObj?.[year]?.loaded && (
            <Loading style={{ position: 'absolute', height: '3rem' }} />
          )}
          {showAllButtonShown && (
            <LoadMoreButton
              style={{ fontSize: '2rem', marginTop: '1rem' }}
              label="Show All"
              transparent
              onClick={() =>
                onSetLeaderboardsExpanded({ expanded: true, year })
              }
            />
          )}
        </div>
      ) : (
        <Loading />
      )}
    </ScopedTheme>
  );
}
