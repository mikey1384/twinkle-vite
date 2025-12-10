import React, { useEffect, useMemo, useState } from 'react';
import ChangePicture from './ChangePicture';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import StatusTag from './StatusTag';
import { css, cx } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);

function toCssSize(value?: number | string) {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

const containerBaseClass = css`
  position: relative;
  display: inline-block;
  width: var(--profile-pic-size, 7rem);
  max-width: 100%;
  aspect-ratio: 1 / 1;
  user-select: none;

  @supports not (aspect-ratio: 1 / 1) {
    /* Safari ≤14 / legacy fallback */
    display: inline-block;
    width: var(--profile-pic-size, 7rem);
    &::before {
      content: '';
      display: block;
      padding-bottom: 100%;
    }
  }
`;

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
  style,
  statusSize = 'auto',
  size
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
  statusSize?: 'auto' | 'medium' | 'large' | 'dot';
  size?: number | string;
}) {
  const userProfile = useAppContext(
    (v) => v.user?.state?.userObj?.[userId] || {}
  );
  const myId = useKeyContext((v) => v.myState.userId);
  const [hasError, setHasError] = useState(false);
  const [changePictureShown, setChangePictureShown] = useState(false);
  const displayedProfilePicUrl = useMemo(() => {
    if (userProfile?.profilePicUrl) {
      return userProfile.profilePicUrl;
    }
    return profilePicUrl;
  }, [profilePicUrl, userProfile?.profilePicUrl]);

  const statusTagShown = useMemo(
    () => statusShown && (myId === userId || online),
    [myId, online, statusShown, userId]
  );

  // always show "online" status when user is looking at their own profile. Show "busy" or "away" status too if not.
  const resolvedStatus = useMemo(() => {
    if (myId === userId) return 'online';
    return isBusy ? 'busy' : isAway ? 'away' : 'online';
  }, [isAway, isBusy, myId, userId]);

  useEffect(() => {
    setHasError(false);
  }, [userId]);

  const {
    width: styleWidth,
    height: styleHeight,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    cursor: styleCursor,
    position: stylePosition,
    ...restStyle
  } = style || {};

  const explicitSize = toCssSize(styleWidth ?? styleHeight ?? size);

  const containerStyle: React.CSSProperties = {
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    position: stylePosition ?? 'relative',
    cursor:
      (myId === userId && isProfilePage) || onClick
        ? 'pointer'
        : styleCursor || 'default',
    ...(explicitSize ? { ['--profile-pic-size' as const]: explicitSize } : {})
  };

  return (
    <div
      className={cx(containerBaseClass, className)}
      style={{
        ...containerStyle,
        ...restStyle
      }}
      onClick={onClick || (() => null)}
      onMouseEnter={() => setChangePictureShown(true)}
      onMouseLeave={() => setChangePictureShown(false)}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden'
        }}
      >
        <img
          alt="Thumbnail"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          loading="lazy"
          src={
            displayedProfilePicUrl && !hasError
              ? `${cloudFrontURL}${displayedProfilePicUrl}`
              : '/img/default.png'
          }
          onError={() => setHasError(true)}
        />
        {!deviceIsMobile && (
          <ChangePicture
            shown={
              myId === userId && isProfilePage && changePictureShown
                ? true
                : false
            }
          />
        )}
      </div>
      {statusTagShown && (
        <StatusTag
          status={resolvedStatus}
          large={large}
          isProfilePage={isProfilePage}
          size={statusSize}
        />
      )}
    </div>
  );
}
