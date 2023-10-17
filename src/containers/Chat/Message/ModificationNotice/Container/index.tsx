import React from 'react';
import { css } from '@emotion/css';
import {
  Color,
  liftedBoxShadow,
  liftedBoxShadowDarker,
  wideBorderRadius
} from '~/constants/css';
import Details from './Details';
import Link from '~/components/Link';
import { useKeyContext } from '~/contexts';

export default function Container({
  username,
  data
}: {
  username: string;
  data: Record<string, any> | null;
}) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
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
        <span style={{ color: Color[linkColor]() }}>{username}</span>{' '}
        {action ? (
          <div style={{ color: Color.darkerGray(), display: 'inline' }}>
            {action}
            {action === 'delete' ? 'd' : 'ed'} a{' '}
            {contentType === 'chat' ? (
              'chat message'
            ) : (
              <Link
                to={`/${
                  contentType === 'url' ? 'link' : contentType
                }s/${contentId}`}
                style={{ color: Color[linkColor]() }}
              >
                post
              </Link>
            )}
            :
          </div>
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
