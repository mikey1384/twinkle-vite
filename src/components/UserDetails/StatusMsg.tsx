import React from 'react';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function StatusMsg({
  statusColor = 'logoBlue',
  statusMsg,
  contrastSafe = false,
  style,
  userId
}: {
  statusColor?: string;
  statusMsg: string;
  contrastSafe?: boolean;
  style?: React.CSSProperties;
  userId: number;
}) {
  const background = Color[statusColor]?.() || Color.logoBlue();
  const textColor = contrastSafe
    ? readableStatusText(background)
    : statusColor === 'ivory' ? Color.black() : '#fff';
  return (
    <div
      className={css`
        background: ${background};
        color: ${textColor};
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
        readMoreColor={contrastSafe ? textColor : statusColor === 'ivory' ? 'black' : '#fff'}
        contentType="user"
        contentId={userId}
      >
        {statusMsg}
      </RichText>
    </div>
  );
}

function readableStatusText(background: string) {
  const channels = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) return '#000';
  const linear = channels.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return 1.05 / (luminance + 0.05) >= 4.5 ? '#fff' : '#000';
}
