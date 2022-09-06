import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Channel from './Channel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

Channels.propTypes = {
  currentPathId: PropTypes.string
};
function Channels({ currentPathId }) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const loadMoreChannels = useAppContext(
    (v) => v.requestHelpers.loadMoreChannels
  );
  const chatType = useChatContext((v) => v.state.chatType);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const classChannelIds = useChatContext((v) => v.state.classChannelIds);
  const customChannelNames = useChatContext((v) => v.state.customChannelNames);
  const favoriteChannelIds = useChatContext((v) => v.state.favoriteChannelIds);
  const homeChannelIds = useChatContext((v) => v.state.homeChannelIds);
  const classLoadMoreButton = useChatContext(
    (v) => v.state.classLoadMoreButton
  );
  const favoriteLoadMoreButton = useChatContext(
    (v) => v.state.favoriteLoadMoreButton
  );
  const homeLoadMoreButton = useChatContext((v) => v.state.homeLoadMoreButton);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const selectedChatTab = useChatContext((v) => v.state.selectedChatTab);
  const onLoadMoreChannels = useChatContext(
    (v) => v.actions.onLoadMoreChannels
  );

  const [channelsLoading, setChannelsLoading] = useState(false);
  const [prevChannelIds, setPrevChannelIds] = useState(homeChannelIds);
  const ChannelListRef = useRef(null);
  const timeoutRef = useRef(null);
  const selectedChatTabRef = useRef('home');
  const loading = useRef(false);
  const channelIds = useMemo(() => {
    switch (selectedChatTab) {
      case 'home':
        return homeChannelIds;
      case 'favorite':
        return favoriteChannelIds;
      case 'class':
        return classChannelIds;
      default:
        return [];
    }
  }, [classChannelIds, favoriteChannelIds, homeChannelIds, selectedChatTab]);

  const loadMoreButtonShown = useMemo(() => {
    const hash = {
      home: homeLoadMoreButton,
      class: classLoadMoreButton,
      favorite: favoriteLoadMoreButton
    };
    return hash[selectedChatTab];
  }, [
    classLoadMoreButton,
    favoriteLoadMoreButton,
    homeLoadMoreButton,
    selectedChatTab
  ]);

  const handleLoadMoreChannels = useCallback(async () => {
    const chatTabHash = {
      home: homeChannelIds,
      favorite: favoriteChannelIds,
      class: classChannelIds
    };
    if (!loading.current) {
      loading.current = true;
      setChannelsLoading(true);
      const channelIds = chatTabHash[selectedChatTab];
      const lastId = channelIds[channelIds.length - 1];
      const { lastUpdated } = channelsObj[lastId];
      const channels = await loadMoreChannels({
        type: selectedChatTab,
        lastUpdated,
        lastId,
        currentChannelId: selectedChannelId
      });
      if (selectedChatTabRef.current === selectedChatTab) {
        setChannelsLoading(false);
        onLoadMoreChannels({ type: selectedChatTab, channels });
      }
      loading.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channelsObj,
    classChannelIds,
    favoriteChannelIds,
    homeChannelIds,
    selectedChannelId,
    selectedChatTab
  ]);

  useEffect(() => {
    const ChannelList = ChannelListRef.current;
    addEvent(ChannelList, 'scroll', onListScroll);

    function onListScroll() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (
          loadMoreButtonShown &&
          ChannelListRef.current.scrollTop >=
            (ChannelListRef.current.scrollHeight -
              ChannelListRef.current.offsetHeight) *
              0.7
        ) {
          handleLoadMoreChannels();
        }
      }, 250);
    }

    return function cleanUp() {
      removeEvent(ChannelList, 'scroll', onListScroll);
    };
  });

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    loading.current = false;
    setChannelsLoading(false);
    selectedChatTabRef.current = selectedChatTab;
    ChannelListRef.current.scrollTop = 0;
  }, [selectedChatTab]);

  useEffect(() => {
    if (
      selectedChannelId === homeChannelIds[0] &&
      homeChannelIds[0] !== prevChannelIds[0]
    ) {
      ChannelListRef.current.scrollTop = 0;
    }
    setPrevChannelIds(homeChannelIds);
  }, [homeChannelIds, selectedChannelId, prevChannelIds]);

  return (
    <ErrorBoundary componentPath="LeftMenu/Channels/index">
      <div
        ref={ChannelListRef}
        style={{
          overflow: 'scroll',
          width: '100%',
          height: '100%',
          marginTop: '1rem'
        }}
      >
        {channelIds
          ?.map((channelId) => channelsObj[channelId])
          .filter((channel) => !channel?.isHidden)
          .map((channel) => (
            <Channel
              key={selectedChatTab + channel.id}
              channel={channel}
              currentPathId={currentPathId}
              customChannelNames={customChannelNames}
              chatType={chatType}
              selectedChannelId={selectedChannelId}
            />
          ))}
        {loadMoreButtonShown && (
          <LoadMoreButton
            color={loadMoreButtonColor}
            filled
            loading={channelsLoading}
            onClick={handleLoadMoreChannels}
            style={{
              width: '100%',
              borderRadius: 0,
              border: 0
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Channels);
