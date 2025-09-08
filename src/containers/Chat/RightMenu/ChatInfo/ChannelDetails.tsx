import React, { useMemo, useRef, useState } from 'react';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts';
import { isMobile, textIsOverflown } from '~/helpers';
import { cloudFrontURL } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

export default function ChannelDetails({
  channelId,
  channelName,
  style,
  thumbPath,
  subLabel
}: {
  channelId: number;
  channelName: string;
  style?: React.CSSProperties;
  thumbPath?: string | null;
  subLabel?: React.ReactNode;
}) {
  const customChannelNames = useChatContext((v) => v.state.customChannelNames);
  const [channelNameHovered, setChannelNameHovered] = useState(false);
  const ChannelNameRef: React.RefObject<any> = useRef(null);
  const thumbUrl = useMemo(
    () => (thumbPath ? `${cloudFrontURL}/thumbs/${thumbPath}/thumb.png` : null),
    [thumbPath]
  );
  return (
    <div
      style={{
        ...style,
        marginTop: thumbUrl ? 0 : '1rem'
      }}
    >
      <div
        onClick={() => setChannelNameHovered((hovered) => !hovered)}
        className={css`
          width: 100%;
          line-height: 1.5;
          ${thumbUrl
            ? `
          position: relative;
          min-height: 9rem;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          color: #fff;
          background: linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.55),
              rgba(0, 0, 0, 0.25)
            ),
            url(${thumbUrl}) center / cover no-repeat;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9);
          `
            : `
          padding: 0 1rem 0 1rem;
          `}
          font-size: 2.5rem;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
            font-size: 1.7rem;
            ${thumbUrl ? 'min-height: 6.5rem;' : ''}
          }
        `}
      >
        <p
          ref={ChannelNameRef}
          style={{
            width: '100%',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            cursor: 'default',
            margin: 0
          }}
          onMouseEnter={handleMouseOver}
          onMouseLeave={() => setChannelNameHovered(false)}
        >
          {customChannelNames[channelId] || channelName}
        </p>
        {thumbUrl && subLabel ? (
          <div
            className={css`
              font-size: 1.4rem;
              opacity: 0.95;
              color: #fff;
              text-shadow: 0 1px 1px rgba(0, 0, 0, 0.7);
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            {subLabel}
          </div>
        ) : null}
      </div>
      <FullTextReveal
        style={{ width: '100%', fontSize: '1.5rem' }}
        show={channelNameHovered}
        direction="left"
        text={customChannelNames[channelId] || channelName || ''}
      />
    </div>
  );

  function handleMouseOver() {
    if (textIsOverflown(ChannelNameRef.current) && !deviceIsMobile) {
      setChannelNameHovered(true);
    }
  }
}
