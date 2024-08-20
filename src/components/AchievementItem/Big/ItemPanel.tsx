import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback
} from 'react';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import ProfilePic from '~/components/ProfilePic';
import UserPopup from '~/components/UserPopup';
import UserListModal from '~/components/Modals/UserListModal';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useKeyContext, useAppContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

interface Achiever {
  id: number;
  profilePicUrl: string;
}

interface DropdownContext {
  x: number;
  y: number;
  width: number;
  height: number;
  userId: number;
}

interface User extends Achiever {
  loaded?: boolean;
  username: string;
}

export default function ItemPanel({
  ap,
  itemId,
  itemName,
  isThumb,
  isNotification,
  isUnlocked,
  description,
  unlockMessage,
  requirements = [],
  badgeSrc,
  milestones,
  progressObj,
  style
}: {
  ap: number;
  itemId: number;
  itemName: string;
  isThumb?: boolean;
  isNotification?: boolean;
  isUnlocked?: boolean;
  description?: string;
  unlockMessage?: string;
  requirements?: React.ReactNode[];
  badgeSrc?: string;
  milestones?: { name: string; completed: boolean }[];
  progressObj?: { label: string; currentValue: number; targetValue: number };
  style?: React.CSSProperties;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const loadUsersByAchievementId = useAppContext(
    (v) => v.requestHelpers.loadUsersByAchievementId
  );
  const achieverObj = useAppContext((v) => v.user.state.achieverObj);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const achievers = useMemo(
    () => achieverObj[itemId] || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [achieverObj?.[itemId]?.length]
  );
  const onSetAchievers = useAppContext((v) => v.user.actions.onSetAchievers);

  const [userListModalShown, setUserListModalShown] = useState(false);
  const [dropdownContext, setDropdownContext] =
    useState<DropdownContext | null>(null);
  const [loading, setLoading] = useState(false);
  const ProfilePicRef = useRef(null);
  const showTimerRef: React.MutableRefObject<any> = useRef(0);
  const hideTimerRef: React.MutableRefObject<any> = useRef(0);
  const mouseEntered = useRef(false);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const milestonesShown = milestones && milestones.length > 0 && !isUnlocked;

  const displayedAP = useMemo(
    () => (typeof ap === 'number' ? addCommasToNumber(ap) : null),
    [ap]
  );

  const progress = useMemo(() => {
    if (progressObj) {
      const { currentValue, targetValue } = progressObj;
      return Math.ceil(100 * (currentValue / targetValue));
    } else {
      return 0;
    }
  }, [progressObj]);

  const displayedAccomplishers = useMemo(
    () => achievers.slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [achievers?.length]
  );

  const handleProfileInteraction = useCallback(
    async (user: any, event: React.MouseEvent | React.TouchEvent) => {
      if (!user?.id) return;

      const target = event.currentTarget;
      mouseEntered.current = true;
      const elementContext = {
        x: target.getBoundingClientRect().left,
        y: target.getBoundingClientRect().top,
        width: target.getBoundingClientRect().width,
        height: target.getBoundingClientRect().height,
        userId: user.id
      };

      clearTimeout(hideTimerRef.current);
      clearTimeout(showTimerRef.current);

      if (deviceIsMobile) {
        setLoading(true);
        setDropdownContext(elementContext);
        const data = await loadProfile(user.id);
        onSetUserState({
          userId: user.id,
          newState: { ...data, loaded: true }
        });
        setLoading(false);
      } else {
        showTimerRef.current = setTimeout(async () => {
          if (mouseEntered.current) {
            setLoading(true);
            setDropdownContext(elementContext);
            const data = await loadProfile(user.id);
            onSetUserState({
              userId: user.id,
              newState: { ...data, loaded: true }
            });
            setLoading(false);
          }
        }, 500);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleProfilePicMouseLeave = useCallback(() => {
    mouseEntered.current = false;
    clearTimeout(showTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setDropdownContext(null);
    }, 500);
  }, []);

  const handleHideMenu = useCallback(() => {
    setDropdownContext(null);
  }, []);

  const fetchAccomplishers = useCallback(async () => {
    try {
      const { users } = await loadUsersByAchievementId(itemId);
      onSetAchievers({
        achievementId: itemId,
        achievers: users
      });
    } catch (error) {
      console.error('Error fetching accomplishers:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  useEffect(() => {
    fetchAccomplishers();
  }, [fetchAccomplishers]);

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        grid-template-areas:
          'badge title title'
          'badge description description'
          'badge requirements ${milestonesShown
            ? 'milestones'
            : 'requirements'}'
          'accomplishers accomplishers accomplishers';
        gap: 2rem;
        align-items: start;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        padding: 1rem;
        background: #fff;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
          grid-template-areas:
            'title'
            'badge'
            'description'
            'requirements'
            ${milestonesShown ? "'milestones'" : ''}
            'accomplishers';
          border-radius: 0;
          border-right: 0;
          border-left: 0;
        }
      `}
      style={style}
    >
      {badgeSrc && (
        <img
          src={badgeSrc}
          alt="Badge"
          className={css`
            grid-area: badge;
            width: 13rem;
            height: 13rem;
            justify-self: center;
          `}
        />
      )}
      {!isThumb && (
        <h2
          className={css`
            grid-area: title;
            font-weight: bold;
            color: ${Color.black()};
            font-size: 2rem;
          `}
        >
          {itemName}
          {displayedAP && (
            <span
              className={css`
                margin-left: 0.5rem;
                font-size: 1.6rem;
                color: ${Color.darkGray()};
                font-weight: normal;
              `}
            >
              ({displayedAP} AP)
            </span>
          )}
          {!isNotification &&
            (isUnlocked ? (
              <Icon
                color={Color.green()}
                className={css`
                  margin-left: 1rem;
                `}
                icon="check"
              />
            ) : (
              <Icon
                className={css`
                  margin-left: 1rem;
                `}
                icon="lock"
              />
            ))}
        </h2>
      )}
      {!isThumb && (
        <div
          className={css`
            grid-area: description;
          `}
        >
          <p
            className={css`
              color: ${Color.darkerGray()};
              font-size: 1.5rem;
            `}
          >
            {description}
            {!isNotification && isUnlocked && unlockMessage
              ? ` ${unlockMessage}`
              : ''}
          </p>
        </div>
      )}
      {!isThumb && (
        <div
          className={css`
            grid-area: requirements;
          `}
        >
          <h3
            className={css`
              margin-top: 1.5rem;
              font-weight: bold;
              font-size: 1.7rem;
              color: ${Color.black()};
            `}
          >
            Requirement{requirements.length > 1 ? 's' : ''}
          </h3>
          {requirements.map((requirement, index) => (
            <div
              key={index}
              className={css`
                margin-top: 0.3rem;
                color: ${Color.darkerGray()};
                font-size: 1.3rem;
              `}
            >
              {!isNotification && isUnlocked && (
                <div
                  className={css`
                    display: inline-block;
                    font-size: 1.6rem;
                    width: 2rem;
                  `}
                >
                  <Icon color={Color.green()} icon="check" />
                </div>
              )}
              {!isUnlocked && requirements.length > 1 ? (
                <span
                  className={css`
                    font-weight: bold;
                    margin-right: 0.5rem;
                  `}
                >
                  {`${index + 1}.`}
                </span>
              ) : (
                ''
              )}
              {requirement}
            </div>
          ))}
          {progressObj && !isUnlocked && (
            <div style={{ width: '100%', marginTop: '1.5rem' }}>
              <h3
                className={css`
                  margin-top: 1.7rem;
                  margin-bottom: -0.5rem;
                  font-weight: bold;
                  font-size: 1.5rem;
                  color: ${Color.black()};
                `}
              >
                {progressObj.label}:{' '}
                {addCommasToNumber(progressObj.currentValue)}
              </h3>
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>
      )}
      {milestonesShown && !isNotification && !isThumb && (
        <div
          className={css`
            grid-area: milestones;
            margin-top: 1.5rem;
          `}
        >
          <h3
            className={css`
              font-weight: bold;
              font-size: 1.7rem;
              color: ${Color.black()};
            `}
          >
            Check List
          </h3>
          <ul
            className={css`
              list-style: none;
              padding-left: 0;
            `}
          >
            {milestones.map((milestone, index) => (
              <li
                key={index}
                className={css`
                  justify-content: flex-start;
                  display: flex;
                  align-items: center;
                  color: ${Color.darkerGray()};
                  font-size: 1.3rem;
                  border-bottom: 1px solid ${Color.borderGray()};
                  @media (max-width: ${mobileMaxWidth}) {
                    justify-content: center;
                  }
                `}
              >
                <div
                  className={css`
                    display: inline-block;
                    font-size: 1.6rem;
                    width: 2rem;
                  `}
                >
                  {milestone.completed ? (
                    <Icon color={Color.green()} icon="check" />
                  ) : !isNotification ? (
                    <Icon icon="times" />
                  ) : (
                    ' '
                  )}
                </div>
                {milestone.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {achievers.length > 0 && (
        <div
          className={css`
            grid-area: accomplishers;
            border-radius: ${borderRadius};
            padding: 0 1rem 1rem 1rem;
            transition: all 0.3s ease-in-out;
          `}
        >
          <h3
            className={css`
              font-weight: bold;
              font-size: 1.5rem;
              color: ${Color.black()};
              margin-bottom: 1rem;
              text-align: center;
            `}
          >
            Achieved by
          </h3>
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              align-items: center;
              justify-content: center;
            `}
          >
            {displayedAccomplishers.map((achiever: Achiever) => (
              <div
                key={achiever.id}
                className={css`
                  width: 4rem;
                  height: 4rem;
                  border-radius: 50%;
                  overflow: hidden;
                  transition: all 0.2s ease-in-out;
                  &:hover {
                    transform: scale(1.1);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  }
                  @media (max-width: ${mobileMaxWidth}) {
                    width: 3rem;
                    height: 3rem;
                  }
                `}
                onMouseEnter={
                  deviceIsMobile
                    ? undefined
                    : (e) => handleProfileInteraction(achiever, e)
                }
                onMouseLeave={
                  deviceIsMobile ? undefined : handleProfilePicMouseLeave
                }
                onClick={
                  deviceIsMobile
                    ? (e) => handleProfileInteraction(achiever, e)
                    : undefined
                }
                ref={ProfilePicRef}
              >
                <ProfilePic
                  style={{
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                  userId={achiever?.id}
                  profilePicUrl={achiever?.profilePicUrl}
                />
              </div>
            ))}
          </div>
          {achievers.length > 10 && (
            <div
              className={css`
                width: 100%;
                display: flex;
                justify-content: center;
              `}
            >
              <a
                onClick={() => setUserListModalShown(true)}
                className={css`
                  cursor: pointer;
                  font-weight: bold;
                  color: ${Color.blue()};
                  cursor: pointer;
                  font-size: 1.3rem;
                  padding: 0.5rem 1rem;
                  margin-top: 1rem;
                  transition: background-color 0.2s ease-in-out;
                  &:hover {
                    text-decoration: underline;
                  }
                `}
              >
                Show all ({achievers.length})
              </a>
            </div>
          )}
        </div>
      )}
      {dropdownContext && (
        <UserPopup
          isLoading={loading}
          popupContext={dropdownContext}
          onHide={handleHideMenu}
          myId={myId}
          user={
            achievers.find(
              (user: Achiever) => user.id === dropdownContext.userId
            ) as User
          }
          onMouseEnter={() => {
            clearTimeout(hideTimerRef.current!);
          }}
          onMouseLeave={() => {
            hideTimerRef.current = window.setTimeout(() => {
              setDropdownContext(null);
            }, 500);
          }}
          onSetPopupContext={setDropdownContext}
        />
      )}
      {userListModalShown && (
        <UserListModal
          onHide={() => setUserListModalShown(false)}
          title={`Users who achieved "${itemName}"`}
          users={achievers as User[]}
        />
      )}
    </div>
  );
}
