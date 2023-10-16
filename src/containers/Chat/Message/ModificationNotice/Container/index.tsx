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
  content,
  type
}: {
  username: string;
  content: Record<string, any> | null;
  type: string;
}) {
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
          fontWeight: 'bold',
          fontSize: '2rem',
          color: Color.logoBlue()
        }}
      >
        {username}
      </div>
      <Details content={content} type={type} />
    </div>
  );
}
