import React, { useEffect, useMemo, useState } from 'react';
import ChangePicture from './ChangePicture';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import { isPhone } from '~/helpers';
import StatusTag from './StatusTag';

const deviceIsPhone = isPhone(navigator);

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
}: {
  className?: string;
  isAway?: boolean;
  isBusy?: boolean;
  isProfilePage?: boolean;
  large?: boolean;
  onClick?: () => void;
  userId: number;
  online?: boolean;
  profilePicUrl?: string;
  statusShown?: boolean;
  style?: React.CSSProperties;
}) {
  const userObj = useAppContext((v) => v.user.state.userObj);
  const myId = useKeyContext((v) => v.myState.userId);
  const [hasError, setHasError] = useState(false);
  const [changePictureShown, setChangePictureShown] = useState(false);
  const displayedProfilePicUrl = useMemo(() => {
    if (userObj?.[userId]?.profilePicUrl) {
      return userObj?.[userId]?.profilePicUrl;
    }
    return profilePicUrl;
  }, [profilePicUrl, userId, userObj]);

  const statusTagShown = useMemo(
    () => (online || myId === userId) && statusShown,
    [myId, online, statusShown, userId]
  );

  useEffect(() => {
    setHasError(false);
  }, [userId]);

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
      onClick={onClick || (() => null)}
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
        loading="lazy"
        src={
          displayedProfilePicUrl && !hasError
            ? `${cloudFrontURL}${displayedProfilePicUrl}`
            : '/img/default.png'
        }
        onError={() => setHasError(true)}
      />
      {!deviceIsPhone && (
        <ChangePicture
          shown={
            myId === userId && isProfilePage && changePictureShown
              ? true
              : false
          }
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
