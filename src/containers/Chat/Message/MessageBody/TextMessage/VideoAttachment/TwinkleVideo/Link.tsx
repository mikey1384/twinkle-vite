import React, { useState } from 'react';
import YouTubeIcon from '~/assets/YoutubeIcon.svg';
import RewardAmountInfo from '../../../RewardAmountInfo';
import RewardLevelInfo from '../../../RewardLevelInfo';
import TwinkleVideoModal from '../../../TwinkleVideoModal';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import XPBar from '~/components/XPVideoPlayer/XPBar';

export default function TwinkleVideoLink({
  title,
  rewardLevel,
  videoCode,
  videoId,
  messageId
}: {
  title: string;
  rewardLevel: number;
  videoCode: string;
  videoId: number;
  messageId: number;
}) {
  const [modalShown, setModalShown] = useState(false);
  const userId = useKeyContext((v) => v.myState.userId);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0
      }}
    >
      <button
        type="button"
        aria-label={title ? `Watch video: ${title}` : 'Watch video'}
        className={css`
          position: relative;
          display: block;
          flex-shrink: 0;
          padding: 0;
          border: 0;
          border-radius: 10px;
          cursor: pointer;
          background: #0b1220
            url(https://img.youtube.com/vi/${videoCode}/mqdefault.jpg);
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          width: 100%;
          aspect-ratio: 16 / 9;
          &:focus-visible {
            outline: 2px solid var(--chat-focus-ring, #365b91);
            outline-offset: 3px;
          }
        `}
        onClick={() => setModalShown(true)}
      >
        <img
          alt=""
          loading="lazy"
          style={{
            width: '8rem',
            height: '6rem',
            position: 'absolute',
            top: 'CALC(50% - 3rem)',
            left: 'CALC(50% - 4rem)'
          }}
          src={YouTubeIcon}
        />
      </button>
      <div
        className={css`
          width: 100%;
          text-align: center;
          margin-top: 1rem;
        `}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 'max(14px, 1.4rem)',
            lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {title}
        </h3>
      </div>
      {rewardLevel ? (
        userId ? (
          <div>
            <XPBar
              isChat
              rewardLevel={rewardLevel}
              started={false}
              startingPosition={0}
              userId={userId}
              reachedDailyLimit={false}
              reachedMaxWatchDuration={false}
              videoId={videoId}
            />
          </div>
        ) : (
          <div
            style={{
              marginTop: '1rem',
              height: '3rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RewardAmountInfo rewardLevel={rewardLevel} />
            <RewardLevelInfo rewardLevel={rewardLevel} videoId={videoId} />
          </div>
        )
      ) : null}
      {modalShown && (
        <TwinkleVideoModal
          messageId={messageId}
          videoId={Number(videoId)}
          onHide={() => setModalShown(false)}
        />
      )}
    </div>
  );
}
