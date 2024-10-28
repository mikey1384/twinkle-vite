import React from 'react';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function StatusMsg({
  statusColor = 'logoBlue',
  statusMsg,
  style,
  userId
}: {
  statusColor?: string;
  statusMsg: string;
  style?: React.CSSProperties;
  userId: number;
}) {
  return (
    <div
      className={css`
        background: ${Color[statusColor]?.() || Color.logoBlue()};
        color: ${statusColor === 'ivory' ? Color.black() : '#fff'};
        font-size: 1.7rem;
        padding: 1rem;
        margin-top: 1rem;
        box-shadow: 0 5px 5px ${Color.lighterGray()};
        overflow-wrap: break-word;
        word-break: break-word;
      `}
      style={style}
    >
      <RichText
        isStatusMsg
        isProfileComponent
        theme={statusColor}
        readMoreColor={statusColor === 'ivory' ? 'black' : '#fff'}
        contentType="user"
        contentId={userId}
      >
        {statusMsg}
      </RichText>
    </div>
  );
}
