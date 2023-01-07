import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import ChatSearchBox from './ChatSearchBox';
import Channels from './Channels';
import Collect from './Collect';
import Icon from '~/components/Icon';
import Tabs from './Tabs';
import Subchannels from './Subchannels';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useChatContext, useKeyContext } from '~/contexts';
import { AI_CARD_CHAT_TYPE, VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { matchPath, useNavigate, useLocation } from 'react-router-dom';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const newChatLabel = localize('newChat');

LeftMenu.propTypes = {
  currentChannel: PropTypes.object,
  currentPathId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayedThemeColor: PropTypes.string,
  loadingVocabulary: PropTypes.bool,
  loadingAICardChat: PropTypes.bool,
  onNewButtonClick: PropTypes.func.isRequired,
  partner: PropTypes.object,
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
  loadingAICardChat,
  onNewButtonClick,
  partner,
  selectedChannelId,
  subchannelIds,
  subchannelObj,
  subchannelPath
}) {
  const { collectType } = useKeyContext((v) => v.myState);
  const navigate = useNavigate();
  const location = useLocation();
  const vocabMatch = useMemo(
    () =>
      matchPath(
        {
          path: `/chat/${VOCAB_CHAT_TYPE}`,
          exact: true
        },
        location.pathname
      ),
    [location.pathname]
  );
  const aiCardMatch = useMemo(
    () =>
      matchPath(
        {
          path: `/chat/${AI_CARD_CHAT_TYPE}`,
          exact: true
        },
        location.pathname
      ),
    [location.pathname]
  );
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
      !!subchannelIds?.length &&
      chatType === 'default' &&
      !(loadingVocabulary || loadingAICardChat)
    );
  }, [chatType, loadingVocabulary, loadingAICardChat, subchannelIds?.length]);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu">
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
        <Collect
          aiCardSelected={chatType === AI_CARD_CHAT_TYPE || loadingAICardChat}
          vocabSelected={chatType === VOCAB_CHAT_TYPE || loadingVocabulary}
          onClick={() => {
            if (vocabMatch && collectType === VOCAB_CHAT_TYPE) return null;
            if (aiCardMatch && collectType === AI_CARD_CHAT_TYPE) return null;
            navigate(`/chat/${collectType || VOCAB_CHAT_TYPE}`);
          }}
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
        <Channels partner={partner} currentPathId={currentPathId} />
      </div>
    </ErrorBoundary>
  );
}

export default memo(LeftMenu);
