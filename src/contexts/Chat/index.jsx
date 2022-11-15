import { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import ChatActions from './actions';
import ChatReducer from './reducer';

export const ChatContext = createContext();

export const initialChatState = {
  aiImages: [],
  allFavoriteChannelIds: {},
  classLoadMoreButton: false,
  chatStatus: {},
  channelPathIdHash: {},
  favoriteLoadMoreButton: false,
  homeLoadMoreButton: false,
  classChannelIds: [],
  favoriteChannelIds: [],
  homeChannelIds: [],
  channelLoading: false,
  channelsObj: {},
  channelOnCall: {},
  chatSearchResults: [],
  chatType: null,
  chessModalShown: false,
  chessTarget: null,
  creatingNewDMChannel: false,
  currentChannelName: '',
  customChannelNames: {},
  filesBeingUploaded: {},
  lastSubchannelPaths: {},
  loadingAIImageChat: false,
  loadingVocabulary: false,
  loaded: false,
  messages: [],
  numUnreads: 0,
  peerStreams: {},
  recepientId: null,
  replyTarget: null,
  myStream: null,
  selectedChannelId: null,
  selectedChatTab: 'home',
  subjectSearchResults: [],
  vocabErrorMessage: '',
  wordCollectors: {},
  wordRegisterStatus: undefined,
  wordleModalShown: false,
  wordsObj: {},
  userSearchResults: [],
  vocabActivities: [],
  aiDrawingsLoadMoreButton: false,
  vocabActivitiesLoadMoreButton: false
};

ChatContextProvider.propTypes = {
  children: PropTypes.node
};

export function ChatContextProvider({ children }) {
  const [chatState, chatDispatch] = useReducer(ChatReducer, initialChatState);
  return (
    <ChatContext.Provider
      value={{
        state: chatState,
        actions: ChatActions(chatDispatch)
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
