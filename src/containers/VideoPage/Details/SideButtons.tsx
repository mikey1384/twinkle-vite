import React, { useState } from 'react';
import UserListModal from '~/components/Modals/UserListModal';
import Likers from '~/components/Likers';
import LikeButton from '~/components/Buttons/LikeButton';
import StarButton from '~/components/Buttons/StarButton';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import localize from '~/constants/localize';

const beFirstToLikeThisVideoLabel = localize('beFirstToLikeThisVideo');
const peopleWhoLikeThisVideoLabel = localize('peopleWhoLikeThisVideo');

export default function SideButtons({
  byUser,
  changeByUserStatus,
  className,
  rewardLevel,
  likes = [],
  onLikeVideo,
  onSetRewardLevel,
  style,
  uploader,
  userId,
  videoId
}: {
  byUser: boolean;
  changeByUserStatus: (v: any) => void;
  className?: string;
  rewardLevel: number;
  likes: any[];
  onLikeVideo: (v: any) => void;
  onSetRewardLevel: (v: any) => void;
  style?: React.CSSProperties;
  uploader: any;
  userId: number;
  videoId: number;
}) {
  const [userListModalShown, setUserListModalShown] = useState(false);
  return (
    <div className={className} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '4rem',
            height: '4rem',
            marginRight: '1rem'
          }}
        >
          <StarButton
            skeuomorphic
            byUser={!!byUser}
            contentId={Number(videoId)}
            style={{ position: 'absolute', top: 0, left: 0 }}
            contentType="video"
            rewardLevel={rewardLevel}
            onSetRewardLevel={onSetRewardLevel}
            onToggleByUser={handleToggleByUser}
            uploader={uploader}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: '50%',
            maxWidth: '16vw'
          }}
        >
          <LikeButton
            contentType="video"
            contentId={Number(videoId)}
            likes={likes}
            filled
            style={{
              fontSize: '2.5vw'
            }}
            onClick={onLikeVideo}
          />
          <Likers
            className={css`
              text-align: center;
              line-height: 1.7rem;
              margin-top: 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
            userId={userId}
            likes={likes}
            onLinkClick={() => setUserListModalShown(true)}
            target="video"
            defaultText={beFirstToLikeThisVideoLabel}
            wordBreakEnabled
          />
        </div>
      </div>
      {userListModalShown && (
        <UserListModal
          onHide={() => setUserListModalShown(false)}
          title={peopleWhoLikeThisVideoLabel}
          users={likes}
        />
      )}
    </div>
  );

  function handleToggleByUser(byUser: boolean) {
    changeByUserStatus({ byUser, contentId: videoId, contentType: 'video' });
  }
}
