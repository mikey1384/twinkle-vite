import React from 'react';
import { css } from '@emotion/css';
import {
  Color,
  liftedBoxShadow,
  liftedBoxShadowDarker,
  wideBorderRadius
} from '~/constants/css';
import Details from './Details';

export default function Container({
  username,
  data
}: {
  username: string;
  data: Record<string, any> | null;
}) {
  const { action, contentId, contentType, isRevoked } = data || {};
  return (
    <div
      className={css`
        border-radius: ${wideBorderRadius};
        box-shadow: ${liftedBoxShadow};
        background: ${Color.whiteGray()};
        &:hover {
          background: ${Color.highlightGray()};
          box-shadow: ${liftedBoxShadowDarker};
        }
      `}
      style={{
        width: '100%',
        padding: '2rem 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        marginTop: '1.5rem',
        marginBottom: '3rem'
      }}
    >
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 'bold'
        }}
      >
        <span style={{ color: Color.logoBlue() }}>{username}</span>{' '}
        {action ? (
          <span style={{ color: Color.darkerGray() }}>
            {action}
            {action === 'delete' ? 'd' : 'ed'} a{' '}
            {contentType === 'chat' ? 'chat message' : 'post'}:
          </span>
        ) : (
          ''
        )}
      </div>
      <Details
        action={action}
        contentId={contentId}
        contentType={contentType}
        isRevoked={isRevoked}
      />
    </div>
  );
}
