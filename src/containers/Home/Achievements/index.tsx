import React, { useEffect, useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import { Color } from '~/constants/css';
import AchievementItem from '~/components/AchievementItem';
import UserLevelStatus from './UserLevelStatus';
import Loading from '~/components/Loading';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';
import { homePanelClass } from '~/theme/homePanels';
import { getThemeRoles, ThemeName } from '~/theme/themes';

export default function Achievements() {
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [myAchievementsObj, setMyAchievementsObj] = useState<{
    [key: string]: {
      milestones?: { name: string; completed: boolean }[];
      progressObj?: {
        label: string;
        currentValue: number;
        targetValue: number;
      };
    };
  }>({});
  const userId = useKeyContext((v) => v.myState.userId);
  const isAchievementsLoaded = useKeyContext(
    (v) => v.myState.isAchievementsLoaded
  );
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const onSetIsAchievementsLoaded = useAppContext(
    (v) => v.user.actions.onSetIsAchievementsLoaded
  );
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const achievementKeys = useMemo(() => {
    const result = [];
    for (const key in achievementsObj) {
      result.push(key);
    }
    return result;
  }, [achievementsObj]);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((profileTheme || 'logoBlue') as ThemeName),
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const headingColor = useMemo(() => {
    const colorKey = themeRoles.sectionPanelText?.color as
      | keyof typeof Color
      | undefined;
    const fn =
      colorKey && (Color[colorKey] as ((opacity?: number) => string) | undefined);
    return fn ? fn() : Color.darkerGray();
  }, [themeRoles.sectionPanelText?.color]);

  useEffect(() => {
    if (userId) init();
    async function init() {
      const maxRetries = 3;
      const cooldown = 1000;
      let attempt = 0;
      let data;

      while (attempt < maxRetries) {
        try {
          data = await loadMyAchievements();
          const unlockedAchievementIds = [];
          for (const key in data) {
            if (data[key].isUnlocked) {
              unlockedAchievementIds.push(data[key].id);
            }
          }
          onSetUserState({ userId, newState: { unlockedAchievementIds } });
          onSetIsAchievementsLoaded(true);
          setMyAchievementsObj(data);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error);
          attempt++;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, cooldown));
          }
        } finally {
          if (attempt >= maxRetries) {
            console.error('All retry attempts failed.');
            onSetIsAchievementsLoaded(false);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, myAttempts]);

  return (
    <div style={{ paddingBottom: userId ? '15rem' : 0 }}>
      <div
        className={cx(
          homePanelClass,
          css`
            margin-bottom: 2rem;
            padding: 1.6rem 2rem;
          `
        )}
        style={{
          ['--home-panel-bg' as const]: '#ffffff',
          ['--home-panel-tint' as const]: Color.logoBlue(0.08),
          ['--home-panel-border' as const]: Color.borderGray(0.65),
          ['--home-panel-heading' as const]: headingColor,
          ['--home-panel-padding' as const]: '1.6rem 2rem',
          ['--home-panel-mobile-padding' as const]: '1.4rem 1.6rem'
        }}
      >
        <p
          className={css`
            font-size: 2rem;
            font-weight: bold;
            line-height: 1.5;
          `}
          style={{ fontWeight: 'bold', fontSize: '2.5rem' }}
        >
          Achievements
        </p>
      </div>
      {!userId ? (
        <div
          className={css`
            text-align: center;
            font-size: 2.3rem;
            font-weight: bold;
            color: ${Color.black()};
            margin-top: 17vh;
          `}
        >
          Please log in to view this page
        </div>
      ) : !isAchievementsLoaded ? (
        <Loading />
      ) : (
        <>
          {userId && (
            <UserLevelStatus
              style={{
                marginBottom: '4rem'
              }}
            />
          )}
          {achievementKeys.map((key) => (
            <AchievementItem
              key={key}
              achievement={{
                ...achievementsObj[key],
                milestones: myAchievementsObj[key]?.milestones,
                progressObj: myAchievementsObj[key]?.progressObj
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
