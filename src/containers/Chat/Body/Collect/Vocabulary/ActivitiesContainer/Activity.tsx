import React, { useEffect, useMemo, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import WordModal from '../WordModal';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { wordLevelHash } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import moment from 'moment';

export default function Activity({
  activity,
  activity: {
    content,
    isNewActivity,
    userId,
    username,
    profilePicUrl,
    timeStamp,
    wordLevel = 1,
    xpReward = 0,
    coinReward = 0
  },
  setScrollToBottom,
  isLastActivity,
  myId,
  onReceiveNewActivity
}: {
  activity: any;
  setScrollToBottom: () => void;
  isLastActivity: boolean;
  myId: number;
  onReceiveNewActivity: () => void;
}) {
  const {
    link: { color: linkColor },
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const onRemoveNewActivityStatus = useChatContext(
    (v) => v.actions.onRemoveNewActivityStatus
  );
  const [wordModalShown, setWordModalShown] = useState(false);
  const userIsUploader = myId === userId;
  useEffect(() => {
    if (isLastActivity && userIsUploader) {
      setScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNewActivity && isLastActivity && userIsUploader) {
      handleSendActivity();
    }
    async function handleSendActivity() {
      socket.emit('new_vocab_feed', activity);
      onRemoveNewActivityStatus(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLastActivity && isNewActivity && !userIsUploader) {
      onRemoveNewActivityStatus(content);
      onReceiveNewActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const wordLabel = useMemo(() => {
    return /\s/.test(content) ? 'term' : 'word';
  }, [content]);

  const activityLabel = useMemo(() => {
    return (
      <div>
        collected {wordLevel === 1 ? 'a' : 'an'}{' '}
        <b>{wordLevelHash[wordLevel].label}</b> {wordLabel},{' '}
        <span
          style={{
            fontWeight: 'bold',
            color: Color[linkColor](),
            cursor: 'pointer'
          }}
          onClick={() => setWordModalShown(true)}
        >
          {content}
        </span>{' '}
        and earned{' '}
        <b>
          <span style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(xpReward)}
          </span>{' '}
          <span style={{ color: Color.gold() }}>XP</span>
        </b>{' '}
        <span>and</span>{' '}
        <b
          className={css`
            margin-left: 0.3rem;
          `}
        >
          <Icon
            icon={['far', 'badge-dollar']}
            style={{
              color: Color.brownOrange()
            }}
          />
          <span style={{ color: Color.brownOrange(), marginLeft: '0.3rem' }}>
            {addCommasToNumber(coinReward)}
          </span>
        </b>
      </div>
    );
  }, [
    wordLevel,
    wordLabel,
    linkColor,
    content,
    xpNumberColor,
    xpReward,
    coinReward
  ]);

  return (
    <div>
      <div style={{ width: '3.5vw' }}>
        <ProfilePic
          style={{ width: '100%' }}
          userId={userId}
          profilePicUrl={profilePicUrl}
        />
      </div>
      <div
        className={css`
          width: CALC(100% - 5vw - 3rem);
          display: flex;
          flex-direction: column;
          margin-left: 2rem;
          margin-right: 1rem;
          position: relative;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
            margin-left: 1rem;
          }
        `}
      >
        <div>
          <UsernameText
            className={css`
              font-size: 1.7rem;
              line-height: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.6rem;
              }
            `}
            user={{
              id: userId,
              username: username
            }}
          />{' '}
          <span>{displayedTime}</span>
        </div>
        {activityLabel}
      </div>
      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
