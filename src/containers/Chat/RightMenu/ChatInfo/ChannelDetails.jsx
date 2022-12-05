import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts';
import { isMobile, textIsOverflown } from '~/helpers';

ChannelDetails.propTypes = {
  channelId: PropTypes.number,
  channelName: PropTypes.string,
  style: PropTypes.object
};

const deviceIsMobile = isMobile(navigator);

export default function ChannelDetails({ channelId, channelName, style }) {
  const customChannelNames = useChatContext((v) => v.state.customChannelNames);
  const [channelNameHovered, setChannelNameHovered] = useState(false);
  const ChannelNameRef = useRef(null);
  return (
    <div
      onClick={() => setChannelNameHovered((hovered) => !hovered)}
      style={style}
      className={css`
        width: 18vw;
        line-height: 1.5;
        padding: 0 1rem 0 1rem;
        font-size: 2.5rem;
        font-weight: bold;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          font-size: 1.7rem;
        }
      `}
    >
      <p
        ref={ChannelNameRef}
        style={{
          width: '100%',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          cursor: 'default'
        }}
        onMouseEnter={handleMouseOver}
        onMouseLeave={() => setChannelNameHovered(false)}
      >
        {customChannelNames[channelId] || channelName}
      </p>
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
