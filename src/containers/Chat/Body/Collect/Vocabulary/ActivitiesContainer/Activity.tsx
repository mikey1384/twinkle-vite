import React, { useEffect, useMemo, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import WordModal from '../WordModal';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import {
  wordLevelHash,
  returnWordLevel,
  SELECTED_LANGUAGE
} from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import moment from 'moment';
import { socket } from '~/constants/sockets/api';
import { useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { MessageStyle } from '../../../../Styles';

export default function Activity({
  activity,
  activity: {
    content,
    frequency,
    isNewActivity,
    userId,
    username,
    profilePicUrl,
    timeStamp
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
      socket.emit('new_vocab_activity', activity);
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

  const wordLevel = useMemo(
    () =>
      returnWordLevel({
        frequency,
        word: content
      }),
    [content, frequency]
  );

  const wordLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return /\s/.test(content) ? '숙어' : '단어';
    }
    return /\s/.test(content) ? 'term' : 'word';
  }, [content]);

  const activityLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <div>
          <b
            style={{
              color: Color[wordLevelHash[wordLevel].color]()
            }}
            className={css`
              font-size: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
          >
            {localize(wordLevelHash[wordLevel].label)}
            {wordLabel}
          </b>
          를 수집하고{' '}
          <b
            className={css`
              font-size: ${wordLevel === 5
                ? '2.5rem'
                : wordLevel === 4
                ? '2.3rem'
                : '1.7rem'};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: ${wordLevel === 5
                  ? '1.7rem'
                  : wordLevel === 4
                  ? '1.5rem'
                  : '1.3rem'};
              }
            `}
          >
            <span style={{ color: Color[xpNumberColor]() }}>
              {addCommasToNumber(wordLevelHash[wordLevel].rewardAmount)}
            </span>{' '}
            <span style={{ color: Color.gold() }}>XP</span>
          </b>
          <span>와</span>{' '}
          <b
            className={css`
              margin-left: 0.3rem;
              font-size: ${wordLevel === 5 ? '2.5rem' : '2.3rem'};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: ${wordLevel === 5 ? '1.7rem' : '1.5rem'};
              }
            `}
          >
            <Icon
              icon={['far', 'badge-dollar']}
              style={{
                color: Color.brownOrange()
              }}
            />
            <span style={{ color: Color.brownOrange(), marginLeft: '0.3rem' }}>
              {addCommasToNumber(wordLevelHash[wordLevel].coinAmount)}
            </span>
          </b>
          를 지급 받았습니다:{' '}
          <span
            className={css`
              font-size: 2.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
            style={{
              fontWeight: 'bold',
              color: Color[linkColor](),
              cursor: 'pointer'
            }}
            onClick={() => setWordModalShown(true)}
          >
            {content}
          </span>
        </div>
      );
    }
    return (
      <div>
        collected {wordLevel === 1 ? 'a' : 'an'}{' '}
        <b
          style={{
            color: Color[wordLevelHash[wordLevel].color]()
          }}
          className={css`
            font-size: 1.7rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
        >
          {wordLevelHash[wordLevel].label}
        </b>{' '}
        {wordLabel},{' '}
        <span
          className={css`
            font-size: 3rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.7rem;
            }
          `}
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
        <b
          className={css`
            font-size: ${wordLevel === 5
              ? '2.5rem'
              : wordLevel === 4
              ? '2.3rem'
              : '1.7rem'};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${wordLevel === 5
                ? '1.7rem'
                : wordLevel === 4
                ? '1.5rem'
                : '1.3rem'};
            }
          `}
        >
          <span style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(wordLevelHash[wordLevel].rewardAmount)}
          </span>{' '}
          <span style={{ color: Color.gold() }}>XP</span>
        </b>{' '}
        <span>and</span>{' '}
        <b
          className={css`
            margin-left: 0.3rem;
            font-size: ${wordLevel === 5
              ? '2.5rem'
              : wordLevel === 4
              ? '2.3rem'
              : '2rem'};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${wordLevel === 5
                ? '1.7rem'
                : wordLevel === 4
                ? '1.5rem'
                : '1.3rem'};
            }
          `}
        >
          <Icon
            icon={['far', 'badge-dollar']}
            style={{
              color: Color.brownOrange()
            }}
          />
          <span style={{ color: Color.brownOrange(), marginLeft: '0.3rem' }}>
            {addCommasToNumber(wordLevelHash[wordLevel].coinAmount)}
          </span>
        </b>
      </div>
    );
  }, [content, linkColor, wordLabel, wordLevel, xpNumberColor]);

  return (
    <div className={MessageStyle.container}>
      <div className={MessageStyle.profilePic}>
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
          <span className={MessageStyle.timeStamp}>{displayedTime}</span>
        </div>
        {activityLabel}
      </div>
      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
