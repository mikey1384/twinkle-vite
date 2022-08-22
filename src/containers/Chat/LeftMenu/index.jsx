import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import ChatSearchBox from './ChatSearchBox';
import Channels from './Channels';
import Vocabulary from './Vocabulary';
import Icon from '~/components/Icon';
import Tabs from './Tabs';
import Subchannels from './Subchannels';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { GENERAL_CHAT_ID } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const newChatLabel = localize('newChat');

LeftMenu.propTypes = {
  onNewButtonClick: PropTypes.func.isRequired,
  selectedChannelId: PropTypes.number
};

function LeftMenu({ onNewButtonClick, selectedChannelId }) {
  const navigate = useNavigate();
  const {
    chatFlatButton: {
      color: chatFlatButtonColor,
      opacity: chatFlatButtonOpacity
    },
    chatFlatButtonHovered: { color: chatFlatButtonHoveredColor },
    chatFlatButtonText: {
      color: chatFlatButtonTextColor,
      shadow: chatFlatButtonTextShadowColor
    }
  } = useKeyContext((v) => v.theme);
  const chatType = useChatContext((v) => v.state.chatType);
  const loadingVocabulary = useChatContext((v) => v.state.loadingVocabulary);
  const leftMenuTopButtonColor = useMemo(
    () => Color[chatFlatButtonColor](chatFlatButtonOpacity),
    [chatFlatButtonColor, chatFlatButtonOpacity]
  );
  const leftMenuTopButtonHoverColor = useMemo(
    () => Color[chatFlatButtonHoveredColor](),
    [chatFlatButtonHoveredColor]
  );
  const generalChatSelected = useMemo(
    () => selectedChannelId === GENERAL_CHAT_ID,
    [selectedChannelId]
  );

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 16vw;
        position: relative;
        background: #fff;
        -webkit-overflow-scrolling: touch;
        @media (max-width: ${mobileMaxWidth}) {
          width: 32vw;
        }
      `}
    >
      <div
        className={`unselectable ${css`
          padding: 1rem;
          background: ${leftMenuTopButtonColor};
          color: ${Color[chatFlatButtonTextColor]()};
          ${chatFlatButtonTextShadowColor
            ? `text-shadow: 0 0 1px ${Color[chatFlatButtonTextShadowColor]()}`
            : ''};
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
          @media (max-width: ${mobileMaxWidth}) {
            background: ${leftMenuTopButtonHoverColor};
          }
          @media (min-width: ${desktopMinWidth}) {
            &:hover {
              background: ${leftMenuTopButtonHoverColor};
            }
          }
        `}`}
        onClick={onNewButtonClick}
      >
        <Icon icon="plus" />
        <div
          style={{
            marginLeft: '0.7rem'
          }}
        >
          {newChatLabel}
        </div>
      </div>
      <Vocabulary
        selected={chatType === 'vocabulary' || loadingVocabulary}
        onClick={() => navigate('/chat/vocabulary')}
      />
      <ChatSearchBox
        style={{
          marginTop: '1rem',
          padding: '0 1rem',
          zIndex: 5,
          width: '100%'
        }}
      />
      <Tabs />
      {generalChatSelected && <Subchannels />}
      <Channels />
    </div>
  );
}

export default memo(LeftMenu);
