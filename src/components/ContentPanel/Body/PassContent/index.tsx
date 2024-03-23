import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import MissionPass from './MissionPass';
import AchievementItem from '~/components/AchievementItem';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';
import { Content, User } from '~/types';

PassContent.propTypes = {
  uploader: PropTypes.object.isRequired,
  rootObj: PropTypes.object.isRequired,
  rootType: PropTypes.string.isRequired,
  theme: PropTypes.string
};
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
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor },
    xpNumber: { color: xpNumberColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);

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
