import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import Tooltip from './Tooltip';
import UserListModal from '~/components/Modals/UserListModal';
import LocalContext from '../../../Context';
import { useAppContext, useKeyContext } from '~/contexts';
import { reactionsObj } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Color, borderRadius, innerBorderRadius } from '~/constants/css';
import { isMobile, returnTheme } from '~/helpers';
import { isEqual } from 'lodash';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const youLabel = localize('You');

Reaction.propTypes = {
  reaction: PropTypes.string.isRequired,
  reactionCount: PropTypes.number.isRequired,
  reactedUserIds: PropTypes.array.isRequired,
  onRemoveReaction: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  reactionsMenuShown: PropTypes.bool.isRequired,
  theme: PropTypes.string
};
function Reaction({
  reaction,
  reactionCount,
  reactedUserIds,
  onRemoveReaction,
  onAddReaction,
  reactionsMenuShown,
  theme
}: {
  reaction: string;
  reactionCount: number;
  reactedUserIds: number[];
  onRemoveReaction: () => void;
  onAddReaction: () => void;
  reactionsMenuShown: boolean;
  theme: string;
}) {
  const {
    actions: { onSetUserState },
    state: { userObj }
  } = useContext(LocalContext);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const ReactionRef: React.MutableRefObject<any> = useRef(null);
  const hideTimerRef: React.MutableRefObject<any> = useRef(null);
  const hideTimerRef2: React.MutableRefObject<any> = useRef(null);
  const prevReactedUserIdsExcludingMine: React.MutableRefObject<any> = useRef(
    []
  );
  const [loadingOtherUsers, setLoadingOtherUsers] = useState(false);
  const [tooltipContext, setTooltipContext] = useState(null);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const { userId, profilePicUrl } = useKeyContext((v) => v.myState);
  const {
    reactionButton: {
      color: reactionButtonColor,
      opacity: reactionButtonOpacity
    }
  } = useMemo(() => returnTheme(theme), [theme]);
  const userReacted = useMemo(
    () => reactedUserIds.includes(userId),
    [reactedUserIds, userId]
  );

  const reactedUserIdsExcludingMine = useMemo(
    () => reactedUserIds.filter((id) => id !== userId),
    [reactedUserIds, userId]
  );

  useEffect(() => {
    if (
      !isEqual(
        prevReactedUserIdsExcludingMine.current,
        reactedUserIdsExcludingMine
      )
    ) {
      const indexLength = Math.min(reactedUserIdsExcludingMine.length, 2);
      for (let i = 0; i < indexLength; i++) {
        handleLoadProfile(reactedUserIdsExcludingMine[i]);
      }
      prevReactedUserIdsExcludingMine.current = reactedUserIdsExcludingMine;
    }

    async function handleLoadProfile(userId: number) {
      if (!userObj[userId]?.username) {
        const data = await loadProfile(userId);
        onSetUserState({
          userId: userId,
          newState: { ...data, loaded: true }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactedUserIdsExcludingMine]);

  const reactedUsersExcludingMe = useMemo(() => {
    const users = [];
    for (const reactedUserId of reactedUserIdsExcludingMine) {
      if (userObj[reactedUserId]) {
        users.push(userObj[reactedUserId]);
      }
    }
    return users;
  }, [reactedUserIdsExcludingMine, userObj]);

  const reactedUsers = useMemo(() => {
    const users = [];
    if (userReacted) {
      users.push({
        id: userId,
        username: youLabel,
        profilePicUrl: profilePicUrl
      });
    }
    users.push(...reactedUsersExcludingMe);
    return users;
  }, [userReacted, reactedUsersExcludingMe, userId, profilePicUrl]);

  const truncatedReactedUsers = useMemo(() => {
    return reactedUsers.slice(0, 2);
  }, [reactedUsers]);

  useEffect(() => {
    if (deviceIsMobile) {
      if (reactionsMenuShown) {
        const parentElementDimensions =
          ReactionRef.current?.getBoundingClientRect?.() || {
            x: 0,
            y: 0,
            width: 0,
            height: 0
          };
        setTooltipContext(parentElementDimensions);
        setTimeout(() => setTooltipContext(null), 2000);
      } else {
        hideTimerRef.current = setTimeout(() => {
          setTooltipContext(null);
        }, 50);
      }
    }
  }, [reactionsMenuShown]);

  const handleShowAllReactedUsers = useCallback(async () => {
    setTooltipContext(null);
    setLoadingOtherUsers(true);
    setUserListModalShown(true);
    for (const reactedUserId of reactedUserIdsExcludingMine) {
      if (!userObj[reactedUserId]?.username) {
        const data = await loadProfile(reactedUserId);
        onSetUserState({
          userId: reactedUserId,
          newState: { ...data, loaded: true }
        });
      }
    }
    setLoadingOtherUsers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactedUserIdsExcludingMine, userObj]);

  const handleClick = useCallback(() => {
    if (userReacted) {
      return onRemoveReaction();
    }
    onAddReaction();
  }, [onAddReaction, onRemoveReaction, userReacted]);

  return (
    <div
      ref={ReactionRef}
      style={{
        borderRadius,
        height: '2.3rem',
        border: `1px solid ${
          userReacted ? Color[reactionButtonColor]() : Color.borderGray()
        }`,
        background: Color.targetGray(),
        marginRight: '0.5rem',
        zIndex: 5000
      }}
    >
      <div
        style={{
          ...(userReacted
            ? { background: Color[reactionButtonColor](reactionButtonOpacity) }
            : {}),
          borderRadius: innerBorderRadius,
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          padding: '0 0.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onMouseEnter={handleSetTooltipContext}
        onMouseLeave={handleRemoveTooltipContext}
        onClick={handleClick}
      >
        <div
          className={css`
            width: 1.7rem;
            height: 1.7rem;
            background: url('/img/emojis.png')
              ${reactionsObj[reaction].position} / 5100%;
          `}
        />
        <span
          className="unselectable"
          style={{
            marginLeft: '0.3rem',
            fontSize: '1.3rem'
          }}
        >
          {reactionCount}
        </span>
      </div>
      {tooltipContext && reactedUsers.length > 0 && (
        <Tooltip
          myId={userId}
          onMouseEnter={() => {
            clearTimeout(hideTimerRef.current);
            clearTimeout(hideTimerRef2.current);
          }}
          onMouseLeave={() => {
            hideTimerRef2.current = setTimeout(() => {
              setTooltipContext(null);
            }, 300);
          }}
          parentContext={tooltipContext}
          reactedUserIds={reactedUserIds}
          displayedReactedUsers={truncatedReactedUsers}
          onShowAllReactedUsers={handleShowAllReactedUsers}
        />
      )}
      {userListModalShown && (
        <UserListModal
          loading={loadingOtherUsers}
          title={
            <div>
              People who reacted to this with{' '}
              <span
                style={{ display: 'inline-block' }}
                className={css`
                  width: 2rem;
                  height: 2rem;
                  background: url('/img/emojis.png')
                    ${reactionsObj[reaction].position} / 5100%;
                `}
              />
            </div>
          }
          users={reactedUsers}
          onHide={() => setUserListModalShown(false)}
        />
      )}
    </div>
  );

  function handleSetTooltipContext() {
    if (deviceIsMobile) return;
    clearTimeout(hideTimerRef.current);
    clearTimeout(hideTimerRef2.current);
    const parentElementDimensions =
      ReactionRef.current?.getBoundingClientRect?.() || {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    setTooltipContext(parentElementDimensions);
  }

  function handleRemoveTooltipContext() {
    if (deviceIsMobile) return;
    hideTimerRef.current = setTimeout(() => {
      setTooltipContext(null);
    }, 200);
  }
}

export default memo(Reaction);
