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
import localize from '~/constants/localize';

const newChatLabel = localize('newChat');

LeftMenu.propTypes = {
  currentChannel: PropTypes.object,
  currentPathId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayedThemeColor: PropTypes.string,
  loadingVocabulary: PropTypes.bool,
  onNewButtonClick: PropTypes.func.isRequired,
  selectedChannelId: PropTypes.number,
  subchannelIds: PropTypes.arrayOf(PropTypes.number),
  subchannelObj: PropTypes.object,
  subchannelPath: PropTypes.string
};

function LeftMenu({
  currentChannel,
  currentPathId,
  displayedThemeColor,
  loadingVocabulary,
  onNewButtonClick,
  selectedChannelId,
  subchannelIds,
  subchannelObj,
  subchannelPath
}) {
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
  const leftMenuTopButtonColor = useMemo(
    () => Color[chatFlatButtonColor](chatFlatButtonOpacity),
    [chatFlatButtonColor, chatFlatButtonOpacity]
  );
  const leftMenuTopButtonHoverColor = useMemo(
    () => Color[chatFlatButtonHoveredColor](),
    [chatFlatButtonHoveredColor]
  );
  const subchannelsShown = useMemo(() => {
    return (
      !!subchannelIds?.length && chatType === 'default' && !loadingVocabulary
    );
  }, [chatType, loadingVocabulary, subchannelIds?.length]);

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
          width: 40vw;
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
      {subchannelsShown ? (
        <Subchannels
          currentChannel={currentChannel}
          currentPathId={currentPathId}
          displayedThemeColor={displayedThemeColor}
          subchannelIds={subchannelIds}
          subchannelObj={subchannelObj}
          selectedChannelId={selectedChannelId}
          subchannelPath={subchannelPath}
        />
      ) : null}
      <Channels currentPathId={currentPathId} />
    </div>
  );
}

export default memo(LeftMenu);
