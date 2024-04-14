import React, { useRef } from 'react';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import WelcomeMessage from './WelcomeMessage';
import { container } from './Styles';
import { borderRadius } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const viewProfileLabel = localize('viewProfile');
const changePictureLabel = localize('changePicture');

export default function ProfileWidget({
  onLoadImage,
  onShowAlert
}: {
  onLoadImage: any;
  onShowAlert: () => void;
}) {
  const navigate = useNavigate();
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const { profilePicUrl, realName, userId, username } = useKeyContext(
    (v) => v.myState
  );
  const FileInputRef: React.RefObject<any> = useRef(null);

  return (
    <ErrorBoundary componentPath="ProfileWidget/index">
      <div className={container} style={{ cursor: 'pointer' }}>
        {username ? (
          <div
            className="heading"
            onClick={() => (username ? navigate(`/users/${username}`) : null)}
          >
            <div>
              <ProfilePic
                className="widget__profile-pic"
                style={{
                  cursor: userId ? 'pointer' : 'default'
                }}
                userId={userId}
                profilePicUrl={profilePicUrl}
              />
            </div>
            <div className="names">
              <a>{username}</a>
              {realName && (
                <div>
                  <span>({realName})</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
        <div
          className={`details ${css`
            border-top-right-radius: ${username ? '' : borderRadius};
            border-top-left-radius: ${username ? '' : borderRadius};
          `}`}
        >
          {userId ? (
            <div>
              <Button
                style={{ width: '100%' }}
                transparent
                onClick={() => navigate(`/users/${username}`)}
              >
                {viewProfileLabel}
              </Button>
              <Button
                style={{ width: '100%' }}
                transparent
                onClick={() => FileInputRef.current.click()}
              >
                {changePictureLabel}
              </Button>
              <Button
                style={{ width: '100%' }}
                transparent
                onClick={() => navigate(`/ai-cards/?search[owner]=${username}`)}
              >
                MY AI Cards
              </Button>
            </div>
          ) : null}
          <WelcomeMessage userId={userId} openSigninModal={onOpenSigninModal} />
          <input
            ref={FileInputRef}
            style={{ display: 'none' }}
            type="file"
            onChange={handlePicture}
            accept="image/*"
          />
        </div>
      </div>
    </ErrorBoundary>
  );

  function handlePicture(event: any) {
    const reader = new FileReader();
    const file = event.target.files[0];
    if (file.size / 1000 > MAX_PROFILE_PIC_SIZE) {
      return onShowAlert();
    }
    reader.onload = onLoadImage;
    reader.readAsDataURL(file);
    event.target.value = null;
  }
}
