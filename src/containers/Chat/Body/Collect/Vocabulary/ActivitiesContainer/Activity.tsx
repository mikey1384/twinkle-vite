import React, { useEffect, useMemo, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import WordModal from '../WordModal';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { wordLevelHash } from '~/constants/defaultValues';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
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

  // Format the time
  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  // For the grid background color, lightly tint it based on wordLevel
  const backgroundColor =
    Color[wordLevelHash[wordLevel]?.color || 'logoBlue'](0.08);
  const borderColor = Color[wordLevelHash[wordLevel]?.color || 'logoBlue'](0.8);

  // We'll show total points = xpReward + coinReward
  const totalPoints = xpReward + coinReward;

  const containerClass = css`
    display: grid;
    grid-template-columns: 60px 1fr;
    grid-template-rows: auto auto; /* header row + content row */
    grid-gap: 1rem;
    padding: 1rem;
    background-color: ${backgroundColor};
    border-left: 8px solid ${borderColor};
    border-radius: ${wideBorderRadius};
    margin-bottom: 1.5rem;
    @media (max-width: ${mobileMaxWidth}) {
      grid-template-columns: 50px 1fr;
      padding: 0.5rem;
      margin-bottom: 1rem;
    }
  `;

  const avatarClass = css`
    grid-row: 1 / 3; /* span both rows: header + content */
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  `;

  const headerClass = css`
    grid-column: 2 / 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    @media (max-width: ${mobileMaxWidth}) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.3rem;
    }
  `;

  const usernameTimeClass = css`
    display: flex;
    flex-direction: column;
    > span {
      font-size: 1.2rem;
      color: ${Color.gray()};
    }
  `;

  const totalPointsClass = css`
    display: flex;
    align-items: center;
    color: ${Color[xpNumberColor]()};
    font-weight: bold;
    font-size: 1.3rem;
    @media (max-width: ${mobileMaxWidth}) {
      margin-top: 0.5rem;
    }
    > span {
      margin-left: 0.5rem;
    }
  `;

  const contentClass = css`
    grid-column: 2 / 3;
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.2rem;
      margin-top: 0.3rem;
    }
  `;

  const wordSpanClass = css`
    font-weight: bold;
    color: ${Color[linkColor]()};
    cursor: pointer;
    margin: 0 0.5rem;
  `;

  const rewardClass = css`
    display: inline-flex;
    align-items: center;
    margin-left: 0.5rem;
    b {
      display: flex;
      align-items: center;
      margin-left: 0.5rem;
    }
    .xp {
      margin-left: 0.3rem;
      color: ${Color[xpNumberColor]()};
      font-weight: bold;
    }
    .coin {
      margin-left: 0.3rem;
      color: ${Color.brownOrange()};
      display: inline-flex;
      align-items: center;
      font-weight: bold;
      svg {
        margin-right: 0.2rem;
      }
    }
  `;

  return (
    <div className={containerClass}>
      {/* Avatar */}
      <div className={avatarClass}>
        <ProfilePic
          style={{ width: '100%' }}
          userId={userId}
          profilePicUrl={profilePicUrl}
        />
      </div>

      {/* Header: Username + Time + Total Points */}
      <div className={headerClass}>
        <div className={usernameTimeClass}>
          <UsernameText
            className={css`
              font-size: 1.4rem;
              line-height: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
            user={{ id: userId, username }}
          />
          <span>{displayedTime}</span>
        </div>
        <div className={totalPointsClass}>
          Total Points: <span>{addCommasToNumber(totalPoints)}</span>
        </div>
      </div>

      {/* Content: "discovered <word>" + xp + coin */}
      <div className={contentClass}>
        <div>
          <span>
            <b>{wordLevelHash[wordLevel]?.label}</b>
          </span>
          <span>
            {' '}
            {/** example action label, if you want to show e.g. "discovered" or "answered" here **/}
            {/* feed.action could be displayed too, e.g. "discovered" */}
            {/* or a custom label: `actionLabel[feed.action] || feed.action` */}
          </span>
          <span
            className={wordSpanClass}
            onClick={() => setWordModalShown(true)}
          >
            {content}
          </span>
        </div>
        <div className={rewardClass}>
          {/* XP */}
          {xpReward > 0 && (
            <b className="xp">+{addCommasToNumber(xpReward)}XP</b>
          )}
          {/* Coin */}
          {coinReward > 0 && (
            <b className="coin">
              <Icon
                icon={['far', 'badge-dollar']}
                style={{ color: Color.brownOrange() }}
              />
              {addCommasToNumber(coinReward)}
            </b>
          )}
        </div>
      </div>

      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
