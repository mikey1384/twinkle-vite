import React, { useMemo } from 'react';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useLocation, useNavigate } from 'react-router-dom';
import localize from '~/constants/localize';
import { useRoleColor } from '~/theme/useRoleColor';

const logInLabel = localize('logIn');
const profileLabel = localize('Profile');
const managementLabel = localize('management');
const logOutLabel = localize('logOut');

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

  const menuProps = useMemo(() => {
    const result = [
      {
        label: (
          <>
            <Icon icon="user" />
            <span style={{ marginLeft: '1rem' }}>{profileLabel}</span>
          </>
        ),
        onClick: () => (isOnProfilePage ? null : navigate(`/users/${username}`))
      }
    ];
    if (managementLevel > 0) {
      result.push({
        label: (
          <div style={{ width: '13rem' }}>
            <Icon icon="user-group-crown" />
            <span style={{ marginLeft: '1rem' }}>{managementLabel}</span>
          </div>
        ),
        onClick: () => navigate('/management')
      });
    }
    result.push({
      label: (
        <>
          <Icon icon="sign-out-alt" />
          <span style={{ marginLeft: '1rem' }}>{logOutLabel}</span>
        </>
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
            <Icon icon={['far', 'badge-dollar']} />{' '}
            {addCommasToNumber(twinkleCoins)}
          </div>
        ) : (
          <Icon style={{ marginRight: '1rem' }} icon="spinner" pulse />
        ))}
      {userId ? (
        <DropdownButton
          className={className}
          transparent
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
          filled
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
    onResetTodayStats();
    setTimeout(() => {
      socket.connect();
    }, 500);
  }
}
