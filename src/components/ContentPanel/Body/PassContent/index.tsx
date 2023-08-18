import React from 'react';
import PropTypes from 'prop-types';
import MissionPass from './MissionPass';
import AchievementPass from './AchievementPass';
import { useTheme } from '~/helpers/hooks';
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
  theme: string;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor },
    xpNumber: { color: xpNumberColor }
  } = useTheme(theme || profileTheme);

  if (rootType === 'mission') {
    return (
      <MissionPass
        linkColor={linkColor}
        mission={rootObj}
        uploader={uploader}
        xpNumberColor={xpNumberColor}
      />
    );
  }
  return <AchievementPass achievement={rootObj} />;
}
