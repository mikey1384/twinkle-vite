import React from 'react';
import MissionPass from './MissionPass';
import AchievementItem from '~/components/AchievementItem';
import { Content, User } from '~/types';
import { useRoleColor } from '~/theme/useRoleColor';

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
  const linkRole = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const xpNumberRole = useRoleColor('xpNumber', {
    themeName: theme,
    fallback: 'logoGreen'
  });
  const linkColor = linkRole.getColor();
  const xpNumberColor = xpNumberRole.getColor();

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
