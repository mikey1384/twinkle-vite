import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ChangePicture from './ChangePicture';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import StatusTag from './StatusTag';

const deviceIsMobile = isMobile(navigator);

ProfilePic.propTypes = {
  className: PropTypes.string,
  isAway: PropTypes.bool,
  isBusy: PropTypes.bool,
  isProfilePage: PropTypes.bool,
  large: PropTypes.bool,
  onClick: PropTypes.func,
  online: PropTypes.bool,
  profilePicUrl: PropTypes.string,
  statusShown: PropTypes.bool,
  style: PropTypes.object,
  userId: PropTypes.number
};

export default function ProfilePic({
  className,
  isAway,
  isBusy,
  isProfilePage,
  large,
  onClick,
  userId,
  online,
  profilePicUrl,
  statusShown,
  style
}) {
  const userObj = useAppContext((v) => v.user.state.userObj);
  const { userId: myId } = useKeyContext((v) => v.myState);
  const [changePictureShown, setChangePictureShown] = useState(false);
  const [src, setSrc] = useState(`${cloudFrontURL}${profilePicUrl}`);
  const displayedProfilePicUrl = useMemo(() => {
    if (userObj?.[userId]?.profilePicUrl) {
      return userObj?.[userId]?.profilePicUrl;
    }
    return profilePicUrl;
  }, [profilePicUrl, userId, userObj]);

  useEffect(() => {
    setSrc(`${cloudFrontURL}${displayedProfilePicUrl}`);
  }, [displayedProfilePicUrl, userId]);
  const statusTagShown = useMemo(
    () => (online || myId === userId) && statusShown,
    [myId, online, statusShown, userId]
  );

  return (
    <div
      className={className}
      style={{
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        borderRadius: '50%',
        paddingBottom: '100%',
        cursor:
          (myId === userId && isProfilePage) || onClick
            ? 'pointer'
            : style?.cursor || 'default',
        ...style
      }}
      onClick={onClick || (() => {})}
      onMouseEnter={() => setChangePictureShown(true)}
      onMouseLeave={() => setChangePictureShown(false)}
    >
      <img
        alt="Thumbnail"
        style={{
          display: 'block',
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%'
        }}
        src={displayedProfilePicUrl ? src : '/img/default.png'}
        onError={() => setSrc('/img/default.png')}
      />
      {!deviceIsMobile && (
        <ChangePicture
          shown={myId === userId && isProfilePage && changePictureShown}
        />
      )}
      {statusTagShown && (
        <StatusTag
          status={isAway ? 'away' : isBusy ? 'busy' : 'online'}
          large={large}
          isProfilePage={isProfilePage}
        />
      )}
    </div>
  );
}
