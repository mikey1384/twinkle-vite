import React, { useMemo } from 'react';
import MissionPass from './MissionPass';
import AchievementItem from '~/components/AchievementItem';
import { useKeyContext } from '~/contexts';
import { Content, User } from '~/types';
import { getThemeRoles, ThemeName } from '~/theme/themes';

export default function PassContent({
  uploader,
  rootObj,
  rootType,
  theme
}: {
  uploader: User;
  rootObj: Content;
  rootType: string;
  theme?: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((theme || profileTheme || 'logoBlue') as ThemeName),
    [profileTheme, theme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const linkColor = useMemo(
    () => themeRoles.link?.color || 'logoBlue',
    [themeRoles]
  );
  const xpNumberColor = useMemo(
    () => themeRoles.xpNumber?.color || 'logoGreen',
    [themeRoles]
  );

  if (rootType === 'mission') {
    return (
      <MissionPass
        linkColor={linkColor}
        mission={rootObj}
        uploader={uploader}
        xpNumberColor={xpNumberColor}
        style={{
          marginTop: '2.5rem'
        }}
      />
    );
  }
  return (
    <AchievementItem
      isNotification
      achievement={rootObj}
      style={{
        marginTop: '2.5rem',
        marginBottom: '-4rem'
      }}
    />
  );
}
