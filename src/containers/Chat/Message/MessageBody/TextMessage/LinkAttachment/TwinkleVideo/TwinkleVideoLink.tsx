import React, { useState } from 'react';
import YouTubeIcon from '~/assets/YoutubeIcon.svg';
import RewardAmountInfo from '../../../RewardAmountInfo';
import RewardLevelInfo from '../../../RewardLevelInfo';
import TwinkleVideoModal from '../../../TwinkleVideoModal';
import { css } from '@emotion/css';

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
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      }}
    >
      <div
        style={{ position: 'relative', cursor: 'pointer' }}
        className={css`
          background: url(https://img.youtube.com/vi/${videoCode}/mqdefault.jpg);
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          width: 100%;
          height: CALC(100% - 5rem);
        `}
        onClick={() => setModalShown(true)}
      >
        <img
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
      </div>
      <div
        className={css`
          width: 100%;
          text-align: center;
          margin-top: 1rem;
          height: 2rem;
        `}
      >
        <h3
          style={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {title}
        </h3>
      </div>
      {rewardLevel ? (
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
