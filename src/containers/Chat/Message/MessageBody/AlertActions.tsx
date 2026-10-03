import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import FriendButton from '~/components/FriendButton';
import { Color } from '~/constants/css';
import { parseMessageSettings } from './messageSettings';

// Buttons under a server alert (Zero's notices to the owner): the server
// writes message.settings.alertActions = [{ label, path }] for in-site jumps;
// an action with friendUserId is the friend button itself ("Add back").
export default function AlertActions({ settings }: { settings: unknown }) {
  const actions = parseMessageSettings(settings).alertActions;
  if (!Array.isArray(actions) || !actions.length) return null;
  const valid = actions.filter(
    (action: any) =>
      typeof action?.label === 'string' &&
      typeof action?.path === 'string' &&
      action.path.startsWith('/') &&
      !action.path.startsWith('//')
  );
  if (!valid.length) return null;
  return (
    <div
      className={css`
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-top: 0.8rem;
      `}
    >
      {valid.map((action: any) =>
        Number(action.friendUserId) > 0 ? (
          <span key={`friend-${action.friendUserId}`} style={{ flex: '0 0 auto' }}>
            <FriendButton
              userId={Number(action.friendUserId)}
              variant="panel"
              buttonProps={{ size: 'sm', shape: 'pill', uppercase: false }}
            />
          </span>
        ) : (
        <Link
          key={action.path + action.label}
          to={action.path}
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.6rem 1.4rem;
            border-radius: 999px;
            background: ${Color.logoBlue()};
            color: #fff;
            font-size: 1.3rem;
            font-weight: bold;
            text-decoration: none;
            &:hover {
              background: ${Color.logoBlue(0.88)};
              color: #fff;
            }
          `}
        >
          {action.label}
          <Icon icon="arrow-right" />
        </Link>
        )
      )}
    </div>
  );
}
