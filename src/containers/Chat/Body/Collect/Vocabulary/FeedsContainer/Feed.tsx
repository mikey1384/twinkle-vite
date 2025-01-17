import React, { useEffect, useMemo, useState, useRef } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import WordModal from '../VocabularyWidget/WordModal';
import Icon from '~/components/Icon';
import moment from 'moment';
import { css } from '@emotion/css';
import { wordLevelHash } from '~/constants/defaultValues';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { socket } from '~/constants/sockets/api';
import { vocabFeedHeight } from '~/constants/state';
import { useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';

function getRGBA(colorName: string, opacity = 1) {
  switch (colorName) {
    case 'logoBlue':
      return `rgba(62, 138, 230, ${opacity})`;
    case 'pink':
      return `rgba(255, 179, 230, ${opacity})`;
    case 'orange':
      return `rgba(255, 183, 90, ${opacity})`;
    case 'red':
      return `rgba(255, 87, 87, ${opacity})`;
    case 'gold':
      return `rgba(255, 207, 102, ${opacity})`;
    case 'limeGreen':
      return `rgba(128, 227, 105, ${opacity})`;
    case 'passionFruit':
      return `rgba(255, 134, 174, ${opacity})`;
    case 'premiumRegister':
      return `linear-gradient(135deg, rgba(174,0,255,1) 0%, rgba(255,0,223,1) 100%)`;
    case 'premiumSpell':
      return `linear-gradient(135deg, rgba(0,196,255,1) 0%, rgba(62,138,230,1) 100%)`;
    default:
      return `rgba(153, 153, 153, ${opacity})`;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'register':
      return 'premiumRegister';
    case 'spell':
      return 'premiumSpell';
    case 'hit':
      return 'orange';
    case 'apply':
      return 'pink';
    case 'answer':
      return 'red';
    default:
      return 'passionFruit'; // fallback
  }
}

function getWordFontSize(wordLevel: number) {
  switch (wordLevel) {
    case 5:
      return '1.9rem';
    case 4:
      return '1.8rem';
    case 3:
      return '1.7rem';
    case 2:
      return '1.6rem';
    default:
      return '1.5rem';
  }
}

function badgeStyle(colorName: string, bgOpacity = 0.85) {
  const isGradient =
    colorName === 'premiumRegister' || colorName === 'premiumSpell';
  const background = isGradient
    ? getRGBA(colorName)
    : getRGBA(colorName, bgOpacity);

  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
    padding: 0.4rem 0.8rem;
    border-radius: 1rem;
    min-width: 80px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);

    ${isGradient
      ? `
        color: #fff;
        background: ${background};
      `
      : `
        background-color: ${background};
        color: #fff;
      `}

    .label {
      margin-left: 0.4rem;
    }
    svg {
      margin-right: 0.3rem;
    }
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  `;
}

export default function Feed({
  feed,
  feed: {
    action,
    content,
    isNewFeed,
    userId,
    username,
    profilePicUrl,
    timeStamp,
    wordLevel = 1,
    xpReward = 0,
    coinReward = 0,
    totalPoints = 0
  },
  setScrollToBottom,
  isLastFeed,
  myId,
  onReceiveNewFeed
}: {
  feed: any;
  setScrollToBottom: () => void;
  isLastFeed: boolean;
  myId: number;
  onReceiveNewFeed: () => void;
}) {
  const feedRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    rootMargin: '200px 0px',
    triggerOnce: true
  });

  useEffect(() => {
    if (feedRef.current) {
      ref(feedRef.current);
    }
  }, [ref]);

  const previousPlaceholderHeight = useMemo(
    () => vocabFeedHeight[`${feed.id}`],
    [feed.id]
  );
  const [isVisible, setIsVisible] = useState(false);
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  useLazyLoad({
    inView,
    PanelRef: feedRef,
    onSetIsVisible: setIsVisible,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    }
  });
  const [wordModalShown, setWordModalShown] = useState(false);
  const userIsUploader = myId === userId;

  useEffect(() => {
    if (isLastFeed && userIsUploader) {
      setScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastFeed, userIsUploader]);

  useEffect(() => {
    if (isNewFeed && isLastFeed && userIsUploader) {
      handleSendActivity();
    }
    async function handleSendActivity() {
      socket.emit('new_vocab_feed', feed);
    }
  }, [isNewFeed, isLastFeed, userIsUploader, feed, content]);

  useEffect(() => {
    if (isLastFeed && isNewFeed && !userIsUploader) {
      onReceiveNewFeed();
    }
  }, [isLastFeed, isNewFeed, userIsUploader, content, onReceiveNewFeed]);

  const displayedTime = useMemo(() => {
    return moment.unix(timeStamp).format('lll');
  }, [timeStamp]);

  const actionLabel = useMemo(() => {
    switch (action) {
      case 'register':
        return 'Discovery';
      case 'hit':
        return 'Hit';
      case 'apply':
        return 'Application';
      case 'spell':
        return 'Spelling';
      case 'answer':
        return 'Multiple Choice';
      default:
        return 'Performed an Action';
    }
  }, [action]);

  const actionDetails = useMemo(() => {
    switch (action) {
      case 'apply':
        return (
          <div
            className={css`
              margin-top: 0.8rem;
              border-radius: 0.5rem;
              background: #f5f5f5;
              padding: 0.8rem;
              font-style: italic;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            `}
          >
            <strong>Example sentence:</strong>
            <br />
            &ldquo;I can <b>{content}</b> my skills in everyday life by
            practicing regularly.&rdquo;
          </div>
        );
      case 'answer':
        return (
          <div
            className={css`
              margin-top: 0.8rem;
              border-radius: 0.5rem;
              background: #f5f5f5;
              padding: 0.8rem;
              font-style: italic;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            `}
          >
            <strong>Multiple choice question:</strong>
            <br />
            &ldquo;What does <b>{content}</b> mean?&rdquo;
            <ul
              className={css`
                list-style-type: none;
                margin-top: 0.5rem;
                padding-left: 0;
                li {
                  margin-bottom: 0.3rem;
                }
              `}
            >
              <li>A) [Placeholder definition 1]</li>
              <li>B) [Placeholder definition 2]</li>
              <li>C) [Placeholder definition 3]</li>
              <li>D) [Placeholder definition 4]</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  }, [action, content]);

  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';
  const backgroundColor = useMemo(() => getRGBA(colorName, 0.08), [colorName]);
  const borderColor = useMemo(() => getRGBA(colorName, 0.7), [colorName]);
  const actionColor = useMemo(() => getActionColor(action), [action]);
  const spelledWordFontSize = useMemo(
    () => getWordFontSize(wordLevel),
    [wordLevel]
  );
  const feedShown = useMemo(() => inView || isVisible, [inView, isVisible]);
  const componentHeight = useMemo(() => {
    return placeholderHeight || '60px';
  }, [placeholderHeight]);

  useEffect(() => {
    return function cleanUp() {
      vocabFeedHeight[`${feed.id}`] = placeholderHeightRef.current;
    };
  }, [feed.id]);

  return (
    <div ref={feedRef}>
      {feedShown ? (
        action === 'spell' ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background-color: ${backgroundColor};
              border-left: 8px solid ${borderColor};
              border-radius: ${wideBorderRadius};
              box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
              padding: 1.2rem 1rem;
              margin-bottom: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                padding: 1rem;
              }
            `}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 1rem;
              `}
            >
              <div
                className={css`
                  width: 60px;
                  height: 60px;
                  margin-bottom: 0.4rem;

                  @media (max-width: ${mobileMaxWidth}) {
                    width: 50px;
                    height: 50px;
                  }
                `}
              >
                <ProfilePic userId={userId} profilePicUrl={profilePicUrl} />
              </div>
              <UsernameText
                className={css`
                  font-weight: 600;
                  color: #444;
                  font-size: 1.2rem;
                `}
                user={{ id: userId, username }}
              />
            </div>
            <div
              className={css`
                ${badgeStyle(actionColor, 0.85)}
                color: #fff;
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 1rem;
                width: fit-content;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.2rem;
                }
              `}
            >
              {actionLabel}
            </div>
            <div
              className={css`
                font-weight: 800;
                font-size: ${spelledWordFontSize};
                color: ${getRGBA('logoBlue', 1)};
                margin-bottom: 0.5rem;
                cursor: pointer;

                &:hover {
                  text-decoration: underline;
                }
              `}
              onClick={() => setWordModalShown(true)}
              title={content}
            >
              {content}
            </div>
            <div
              className={css`
                margin-bottom: 1rem;
                display: flex;
                justify-content: center;
                width: 100%;
              `}
            >
              <span
                className={css`
                  display: inline-block;
                  padding: 0.4rem 0.8rem;
                  border-radius: 1rem;
                  font-size: 1rem;
                  font-weight: 600;
                  color: #fff;
                  background: ${getRGBA(colorName, 1)};
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
                `}
              >
                {wordLevelHash[wordLevel]?.label || '???'}
              </span>
            </div>
            {actionDetails}
            <div
              className={css`
                margin-bottom: 1rem;
                font-size: 0.9rem;
                color: #666;
              `}
            >
              <span>{displayedTime}</span>
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: 0.5rem;
                justify-content: center;
                margin-top: auto;
              `}
            >
              <div className={badgeStyle('passionFruit')}>
                <span className="label">
                  {addCommasToNumber(totalPoints)}{' '}
                  {`${Number(totalPoints) === 1 ? 'pt' : 'pts'}`}
                </span>
              </div>

              {xpReward > 0 && (
                <div className={badgeStyle('limeGreen')}>
                  <Icon icon={['far', 'star']} />
                  <span className="label">
                    {addCommasToNumber(xpReward)} XP
                  </span>
                </div>
              )}

              {coinReward > 0 && (
                <div className={badgeStyle('gold')}>
                  <Icon icon={['far', 'badge-dollar']} />
                  <span className="label">{addCommasToNumber(coinReward)}</span>
                </div>
              )}
            </div>

            {wordModalShown && (
              <WordModal
                word={content}
                onHide={() => setWordModalShown(false)}
              />
            )}
          </div>
        ) : (
          <div
            className={css`
              display: grid;
              grid-template-columns: 60px 1fr 140px;
              grid-template-areas: 'avatar content stats';
              gap: 1rem;
              padding: 1.2rem 1rem;
              background-color: ${backgroundColor};
              border-left: 8px solid ${borderColor};
              border-radius: ${wideBorderRadius};
              box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
              margin-bottom: 1.5rem;

              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 60px 1fr;
                grid-template-rows: auto auto;
                grid-template-areas:
                  'avatar content'
                  'stats stats';
              }
            `}
          >
            <div
              className={css`
                grid-area: avatar;
                display: flex;
                flex-direction: column;
                align-items: flex-start;

                @media (max-width: ${mobileMaxWidth}) {
                  align-items: center;
                }

                .profilePicContainer {
                  width: 60px;
                  min-width: 60px;
                  @media (max-width: ${mobileMaxWidth}) {
                    width: 50px;
                    min-width: 50px;
                  }
                }
              `}
            >
              <div className="profilePicContainer">
                <ProfilePic userId={userId} profilePicUrl={profilePicUrl} />
              </div>
              <div
                className={css`
                  width: 100%;
                  max-width: 100%;
                  margin-top: 0.4rem;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  text-align: center;
                `}
              >
                <UsernameText
                  className={css`
                    font-weight: 600;
                    color: #444;
                    font-size: 1.2rem;
                  `}
                  user={{ id: userId, username }}
                />
              </div>
            </div>

            <div
              className={css`
                grid-area: content;
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
              `}
            >
              <div
                className={css`
                  ${badgeStyle(actionColor, 0.85)}
                  color: #fff;
                  font-size: 1.1rem;
                  font-weight: 700;
                  text-align: center;
                  width: fit-content;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1rem;
                  }
                `}
              >
                {actionLabel}
              </div>

              <div>
                <span
                  className={css`
                    display: inline-block;
                    padding: 0.4rem 0.8rem;
                    border-radius: 1rem;
                    margin-right: 0.6rem;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #fff;
                    background: ${getRGBA(colorName, 1)};
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
                  `}
                >
                  {wordLevelHash[wordLevel]?.label || '???'}
                </span>

                <span
                  className={css`
                    font-weight: bold;
                    cursor: pointer;
                    margin-left: 0.5rem;
                    color: ${getRGBA('logoBlue', 1)};
                    font-size: ${getWordFontSize(wordLevel)};
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 90vw;

                    &:hover {
                      text-decoration: underline;
                      transition: all 0.15s ease-in;
                    }

                    @media (max-width: ${mobileMaxWidth}) {
                      max-width: 55vw;
                    }
                  `}
                  onClick={() => setWordModalShown(true)}
                  title={content}
                >
                  {content}
                </span>
              </div>

              {actionDetails}

              <div
                className={css`
                  margin-top: 0.4rem;
                  font-size: 0.9rem;
                  color: #666;
                `}
              >
                <span>{displayedTime}</span>
              </div>
            </div>

            <div
              className={css`
                grid-area: stats;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.5rem;

                @media (max-width: ${mobileMaxWidth}) {
                  flex-direction: row;
                  flex-wrap: wrap;
                  justify-content: center;
                  align-items: center;
                }
              `}
            >
              <div className={badgeStyle('passionFruit')}>
                <span className="label">
                  {addCommasToNumber(totalPoints)}{' '}
                  {`${Number(totalPoints) === 1 ? 'pt' : 'pts'}`}
                </span>
              </div>

              {xpReward > 0 && (
                <div className={badgeStyle('limeGreen')}>
                  <Icon icon={['far', 'star']} />
                  <span className="label">
                    {addCommasToNumber(xpReward)} XP
                  </span>
                </div>
              )}

              {coinReward > 0 && (
                <div className={badgeStyle('gold')}>
                  <Icon icon={['far', 'badge-dollar']} />
                  <span className="label">{addCommasToNumber(coinReward)}</span>
                </div>
              )}
            </div>

            {wordModalShown && (
              <WordModal
                word={content}
                onHide={() => setWordModalShown(false)}
              />
            )}
          </div>
        )
      ) : (
        <div
          style={{
            width: '100%',
            height: componentHeight
          }}
        />
      )}
    </div>
  );
}
