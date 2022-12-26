import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/io';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';
import localize from '~/constants/localize';

const logInLabel = localize('logIn');
const profileLabel = localize('Profile');
const managementLabel = localize('management');
const logOutLabel = localize('logOut');

AccountMenu.propTypes = {
  className: PropTypes.string
};

function AccountMenu({ className }) {
  const navigate = useNavigate();
  const { loggedIn, username, userId, managementLevel, twinkleCoins } =
    useKeyContext((v) => v.myState);
  const {
    login: { color: loginColor }
  } = useKeyContext((v) => v.theme);
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onResetChat = useChatContext((v) => v.actions.onResetChat);

  const menuProps = useMemo(() => {
    const result = [
      {
        label: (
          <>
            <Icon icon="user" />
            <span style={{ marginLeft: '1rem' }}>{profileLabel}</span>
          </>
        ),
        onClick: () => navigate(`/users/${username}`)
      }
    ];
    if (managementLevel > 0) {
      result.push({
        label: (
          <div style={{ width: '12rem' }}>
            <Icon icon="sliders-h" />
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
  }, [managementLevel, username]);

  return (
    <div className="desktop" style={{ display: 'flex', alignItems: 'center' }}>
      {loggedIn && (
        <div style={{ marginRight: '1rem' }}>
          <Icon icon={['far', 'badge-dollar']} />{' '}
          {addCommasToNumber(twinkleCoins)}
        </div>
      )}
      {loggedIn ? (
        <DropdownButton
          className={className}
          transparent
          xAdjustment={-30}
          listStyle={{
            top: '4.5rem'
          }}
          text={
            <div
              style={{
                maxWidth: '12rem',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}
            >
              {username}
            </div>
          }
          shape="button"
          icon="caret-down"
          iconSize="lg"
          menuProps={menuProps}
        />
      ) : (
        <Button
          className={className}
          onClick={onOpenSigninModal}
          style={{ marginLeft: '1rem' }}
          color={loginColor}
          filled
        >
          <div
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis'
            }}
          >
            {logInLabel}
          </div>
        </Button>
      )}
    </div>
  );

  function handleLogout() {
    socket.emit('leave_my_notification_channel', userId);
    socket.disconnect();
    socket.connect();
    onLogout();
    onResetChat();
  }
}

export default memo(AccountMenu);
