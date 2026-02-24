import React, { useMemo } from 'react';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useMissionContext,
  useNotiContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRoleColor } from '~/theme/useRoleColor';

const logInLabel = 'Log In';
const profileLabel = 'Profile';
const managementLabel = 'Management';
const logOutLabel = 'Log out';

export default function AccountMenu({
  className,
  onSetBalanceModalShown
}: {
  className?: string;
  onSetBalanceModalShown: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const username = useKeyContext((v) => v.myState.username);
  const userId = useKeyContext((v) => v.myState.userId);
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const isOnProfilePage = useMemo(
    () => location.pathname === `/users/${username}`,
    [location, username]
  );
  const loginRole = useRoleColor('login', { fallback: 'green' });
  const loginColorKey = loginRole.colorKey;
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onResetChat = useChatContext((v) => v.actions.onResetChat);
  const onResetTodayStats = useNotiContext((v) => v.actions.onResetTodayStats);
  const onResetSharedPrompts = useMissionContext(
    (v) => v.actions.onResetSharedPrompts
  );

  const menuProps = useMemo(() => {
    const result = [
      {
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem'
            }}
          >
            <Icon icon="user" />
            <span>{profileLabel}</span>
          </div>
        ),
        onClick: () => (isOnProfilePage ? null : navigate(`/users/${username}`))
      }
    ];
    if (managementLevel > 0) {
      result.push({
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem'
            }}
          >
            <Icon icon="user-group-crown" />
            <span>{managementLabel}</span>
          </div>
        ),
        onClick: () => navigate('/management')
      });
    }
    result.push({
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem'
          }}
        >
          <Icon icon="sign-out-alt" />
          <span>{logOutLabel}</span>
        </div>
      ),
      onClick: handleLogout
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnProfilePage, managementLevel, username]);

  return (
    <div className="desktop" style={{ display: 'flex', alignItems: 'center' }}>
      {userId &&
        (typeof twinkleCoins === 'number' ? (
          <div
            style={{ marginRight: '1rem', cursor: 'pointer' }}
            onClick={onSetBalanceModalShown}
          >
            <Icon icon="coins" style={{ marginRight: '0.5rem' }} />{' '}
            {addCommasToNumber(twinkleCoins)}
          </div>
        ) : (
          <Icon style={{ marginRight: '1rem' }} icon="spinner" pulse />
        ))}
      {userId ? (
        <DropdownButton
          className={className}
          variant="ghost"
          tone="flat"
          xAdjustment={-30}
          listStyle={{
            top: '4.5rem'
          }}
          text={
            <div
              style={{
                padding: 0,
                maxWidth: '12rem',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}
            >
              {username}
            </div>
          }
          icon="caret-down"
          iconSize="lg"
          menuProps={menuProps}
        />
      ) : (
        <Button
          className={className}
          onClick={onOpenSigninModal}
          style={{ marginLeft: '1rem', height: '3.5rem' }}
          color={loginColorKey}
          variant="soft"
          tone="raised"
        >
          {logInLabel}
        </Button>
      )}
    </div>
  );

  function handleLogout() {
    socket.emit('leave_my_notification_channel', userId);
    socket.disconnect();
    onLogout();
    onResetChat(userId);
    onResetSharedPrompts();
    onResetTodayStats();
    setTimeout(() => {
      socket.connect();
    }, 500);
  }
}
