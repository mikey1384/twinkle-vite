import { useEffect, useRef, useState } from 'react';
import { useSearch } from '~/helpers/hooks';

export default function useMessageSearch({
  appliedTopicId,
  onSeachChatMessages,
  searchChatMessages,
  selectedChannelId,
  selectedTab
}: {
  appliedTopicId: number;
  onSeachChatMessages: (payload: any) => void;
  searchChatMessages: (payload: any) => Promise<any>;
  selectedChannelId: number;
  selectedTab: string;
}) {
  const [searchText, setSearchText] = useState('');
  const searchContextRef = useRef({
    channelId: selectedChannelId,
    selectedTab,
    topicId: null as number | null,
    searchText: ''
  });

  useEffect(() => {
    searchContextRef.current = {
      channelId: selectedChannelId,
      selectedTab,
      topicId: selectedTab === 'topic' ? appliedTopicId : null,
      searchText
    };
  }, [appliedTopicId, searchText, selectedChannelId, selectedTab]);

  const { handleSearch, searching } = useSearch({
    onSearch: handleMessageSearch,
    onEmptyQuery: clearSearchResults,
    onClear: clearSearchResults,
    onSetSearchText: setSearchText
  });

  return {
    handleSearch,
    searchText,
    searching
  };

  function clearSearchResults() {
    onSeachChatMessages({
      channelId: selectedChannelId,
      topicId: selectedTab === 'topic' ? appliedTopicId : null,
      messageIds: [],
      messagesObj: {},
      loadMoreShown: false
    });
  }

  async function handleMessageSearch(text: string) {
    const requestedTopicId = selectedTab === 'topic' ? appliedTopicId : null;
    const requestContext = {
      channelId: selectedChannelId,
      selectedTab,
      topicId: requestedTopicId,
      searchText: text.trim()
    };
    try {
      const {
        searchText: returnedSearchText,
        messageIds,
        messagesObj,
        loadMoreButton
      } = await searchChatMessages({
        channelId: selectedChannelId,
        topicId: requestedTopicId,
        text
      });
      const currentContext = searchContextRef.current;
      if (
        currentContext.channelId !== requestContext.channelId ||
        currentContext.selectedTab !== requestContext.selectedTab ||
        currentContext.topicId !== requestContext.topicId ||
        currentContext.searchText.trim() !== requestContext.searchText
      ) {
        return;
      }
      if ((returnedSearchText || '').trim() !== requestContext.searchText) {
        return;
      }
      onSeachChatMessages({
        channelId: requestContext.channelId,
        topicId: requestedTopicId,
        messageIds,
        messagesObj,
        loadMoreShown: loadMoreButton
      });
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  }
}
