import React, { CSSProperties, memo, useCallback, useState } from 'react';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import { useSearch } from '~/helpers/hooks';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';

function ChatSearchBox({ style }: { style?: CSSProperties }) {
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const navigate = useNavigate();
  const searchChat = useAppContext((v) => v.requestHelpers.searchChat);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const {
    generalChat: { color: generalChatColor },
    chatGroup: { color: chatGroupColor }
  } = useKeyContext((v) => v.theme);
  const chatSearchResults = useChatContext((v) => v.state.chatSearchResults);
  const onClearChatSearchResults = useChatContext(
    (v) => v.actions.onClearChatSearchResults
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onSearchChat = useChatContext((v) => v.actions.onSearchChat);

  const [searchText, setSearchText] = useState('');
  const handleSearchChat = useCallback(async (text: string) => {
    const data = await searchChat(text);
    onSearchChat(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { handleSearch, searching } = useSearch({
    onSearch: handleSearchChat,
    onClear: onClearChatSearchResults,
    onSetSearchText: setSearchText
  });
  const handleSelect = useCallback(
    async (item: {
      id?: number;
      primary?: boolean;
      pathId?: number;
      label?: string;
      profilePicUrl?: string;
    }) => {
      if (item.primary || !!item.pathId) {
        navigate(`/chat/${item.pathId}`);
      } else {
        if (!item?.id) {
          return reportError({
            componentPath: 'Chat/LeftMenu/ChatSearchBox',
            message: `handleSelect: recipient userId is null. recipient: ${JSON.stringify(
              item
            )}`
          });
        }
        onOpenNewChatTab({
          user: { username, id: userId, profilePicUrl },
          recipient: {
            username: item.label,
            id: item.id,
            profilePicUrl: item.profilePicUrl
          }
        });
        setTimeout(() => navigate(`/chat/new`), 0);
      }
      setSearchText('');
      onClearChatSearchResults();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, profilePicUrl, userId, username]
  );

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/ChatSearchBox">
      <div style={style}>
        <SearchInput
          placeholder="Search..."
          onChange={handleSearch}
          value={searchText}
          searchResults={chatSearchResults}
          renderItemLabel={(item) =>
            !item.primary || (item.primary && item.twoPeople) ? (
              <span>
                {item.label}{' '}
                {item.subLabel && <small>{`(${item.subLabel})`}</small>}
              </span>
            ) : (
              <span
                style={{
                  color:
                    Color[
                      item.channelId === 2 ? generalChatColor : chatGroupColor
                    ](),
                  fontWeight: 'bold'
                }}
              >
                {item.label}
              </span>
            )
          }
          onClickOutSide={() => {
            setSearchText('');
            onClearChatSearchResults();
          }}
          onSelect={handleSelect}
        />
        {searching && (
          <Loading style={{ height: '7rem', position: 'absolute' }} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(ChatSearchBox);
