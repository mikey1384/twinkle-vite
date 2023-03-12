import { initialChatState } from '.';
import {
  defaultChatSubject,
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE
} from '~/constants/defaultValues';
import { determineSelectedChatTab } from './helpers';
import { objectify } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';

const chatTabHash = {
  home: 'homeChannelIds',
  favorite: 'favoriteChannelIds',
  class: 'classChannelIds'
};

export default function ChatReducer(state, action) {
  switch (action.type) {
    case 'AI_CARD_OFFER_WITHDRAWAL': {
      return {
        ...state,
        aiCardFeeds: state.aiCardFeeds.map((feed) => {
          if (feed.id === action.feedId) {
            return {
              ...feed,
              offer: {
                ...feed.offer,
                isCancelled: true
              }
            };
          }
          return feed;
        })
      };
    }
    case 'ADD_ID_TO_NEW_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const messageIds = prevChannelObj?.messageIds?.map((messageId) =>
        messageId === action.tempMessageId ? action.messageId : messageId
      );
      const messagesObj = {
        ...prevChannelObj?.messagesObj,
        [action.messageId]: {
          ...prevChannelObj?.messagesObj?.[action.tempMessageId],
          id: action.messageId,
          timeStamp: action.timeStamp
        }
      };
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj[
                action.subchannelId
              ]?.messageIds.map((messageId) =>
                messageId === action.tempMessageId
                  ? action.messageId
                  : messageId
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.tempMessageId],
                  id: action.messageId,
                  timeStamp: action.timeStamp
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(prevChannelObj
            ? {
                [action.channelId]: {
                  ...prevChannelObj,
                  messageIds,
                  messagesObj,
                  ...(subchannelObj ? { subchannelObj } : {})
                }
              }
            : {})
        }
      };
    }
    case 'ADD_LISTED_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: action.card
        },
        listedCardIds: [action.card.id].concat(state.listedCardIds)
      };
    }
    case 'ADD_MY_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: {
            ...action.card,
            isListed: false,
            askPrice: null
          }
        },
        myCardIds: [action.card.id].concat(state.myCardIds)
      };
    }
    case 'REMOVE_MY_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.cardId]: {
            ...state.cardObj[action.cardId],
            isListed: false,
            askPrice: null
          }
        },
        myCardIds: state.myCardIds.filter((cardId) => cardId !== action.cardId)
      };
    }
    case 'REMOVE_LISTED_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.cardId]: {
            ...state.cardObj[action.cardId],
            isListed: false,
            askPrice: 0
          }
        },
        listedCardIds: state.listedCardIds.filter(
          (cardId) => cardId !== action.cardId
        )
      };
    }
    case 'ADD_REACTION_TO_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const message =
        (action.subchannelId
          ? prevChannelObj?.subchannelObj?.[action.subchannelId]?.messagesObj?.[
              action.messageId
            ]
          : prevChannelObj?.messagesObj?.[action.messageId]) || {};
      const reactions = (message.reactions || [])
        .filter((reaction) => {
          return (
            reaction.userId !== action.userId ||
            reaction.type !== action.reaction
          );
        })
        .concat({
          userId: action.userId,
          type: action.reaction
        });
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...message,
                  reactions
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messagesObj: {
              ...prevChannelObj?.messagesObj,
              [action.messageId]: {
                ...message,
                reactions
              }
            },
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'CLEAR_SUBCHANNEL_UNREADS': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = {
        ...prevChannelObj?.subchannelObj,
        [action.subchannelId]: {
          ...prevChannelObj?.subchannelObj?.[action.subchannelId],
          numUnreads: 0
        }
      };
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            subchannelObj
          }
        }
      };
    }
    case 'REMOVE_REACTION_FROM_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const message =
        (action.subchannelId
          ? prevChannelObj?.subchannelObj[action.subchannelId]?.messagesObj?.[
              action.messageId
            ]
          : prevChannelObj?.messagesObj?.[action.messageId]) || {};
      const reactions = (message.reactions || []).filter((reaction) => {
        return (
          reaction.userId !== action.userId || reaction.type !== action.reaction
        );
      });
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj[action.subchannelId],
              messagesObj: {
                ...prevChannelObj?.subchannelObj[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...message,
                  reactions
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId]?.messagesObj,
              [action.messageId]: {
                ...message,
                reactions
              }
            },
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'EDIT_CHANNEL_SETTINGS':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            isClosed: action.isClosed,
            canChangeSubject: action.canChangeSubject,
            theme: action.theme
          }
        },
        customChannelNames: {
          ...state.customChannelNames,
          [action.channelId]: action.channelName
        }
      };
    case 'CHANGE_ONLINE_STATUS': {
      return {
        ...state,
        chatStatus: {
          ...state.chatStatus,
          [action.userId]: state.chatStatus[action.userId]
            ? {
                ...state.chatStatus[action.userId],
                isOnline: action.isOnline,
                isAway: action.isOnline
                  ? false
                  : state.chatStatus[action.userId].isAway,
                isBusy: action.isOnline
                  ? false
                  : state.chatStatus[action.userId].isBusy
              }
            : {
                ...action.member,
                isOnline: action.isOnline
              }
        }
      };
    }
    case 'CHANGE_AWAY_STATUS': {
      return {
        ...state,
        chatStatus: {
          ...state.chatStatus,
          [action.userId]: state.chatStatus[action.userId]
            ? {
                ...state.chatStatus[action.userId],
                isAway: action.isAway
              }
            : undefined
        }
      };
    }
    case 'CHANGE_BUSY_STATUS': {
      return {
        ...state,
        chatStatus: {
          ...state.chatStatus,
          [action.userId]: state.chatStatus[action.userId]
            ? {
                ...state.chatStatus[action.userId],
                isBusy: action.isBusy
              }
            : undefined
        }
      };
    }
    case 'CHANGE_CHANNEL_OWNER': {
      const notificationId = uuidv1();
      if (!state.channelsObj[action.channelId]) return state;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messageIds:
              state.selectedChannelId === action.channelId
                ? [notificationId].concat(
                    state.channelsObj[action.channelId].messageIds
                  )
                : state.channelsObj[action.channelId].messageIds,
            messagesObj: {
              ...state.channelsObj[action.channelId].messagesObj,
              [notificationId]: action.message
            },
            creatorId: action.newOwner.id,
            numUnreads: state.selectedChannelId === action.channelId ? 0 : 1
          }
        }
      };
    }
    case 'CHANGE_CHANNEL_SETTINGS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            channelName: action.channelName,
            isClosed: action.isClosed,
            canChangeSubject: action.canChangeSubject
          }
        }
      };
    }
    case 'CHANGE_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              subjectObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                subjectObj: action.subject
              }
        }
      };
    }
    case 'CLEAR_CHAT_SEARCH_RESULTS':
      return {
        ...state,
        chatSearchResults: []
      };
    case 'CLEAR_NUM_UNREADS': {
      return {
        ...state,
        numUnreads: 0
      };
    }
    case 'CLEAR_RECENT_CHESS_MESSAGE': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            recentChessMessage: null
          }
        }
      };
    }
    case 'CLEAR_SUBJECT_SEARCH_RESULTS':
      return {
        ...state,
        subjectSearchResults: []
      };
    case 'CLEAR_USER_SEARCH_RESULTS':
      return {
        ...state,
        userSearchResults: []
      };
    case 'CONFIRM_CALL_RECEPTION':
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          callReceived: true
        }
      };
    case 'CREATE_NEW_CHANNEL': {
      const { channelId } = action.data.message;
      const startMessageId = uuidv1();
      return {
        ...state,
        chatType: 'default',
        subject: {},
        homeChannelIds: [channelId].concat(state.homeChannelIds),
        favoriteChannelIds: [channelId].concat(state.favoriteChannelIds),
        allFavoriteChannelIds: {
          ...state.allFavoriteChannelIds,
          [channelId]: true
        },
        classChannelIds: action.data.isClass
          ? [channelId].concat(state.classChannelIds)
          : state.classChannelIds,
        channelsObj: {
          ...state.channelsObj,
          [channelId]: {
            id: channelId,
            channelName: action.data.message.channelName,
            messageIds: [startMessageId],
            messagesObj: {
              [startMessageId]: action.data.message
            },
            messagesLoadMoreButton: false,
            isClass: action.data.isClass,
            isClosed: action.data.isClosed,
            numUnreads: 0,
            twoPeople: false,
            creatorId: action.data.message.userId,
            members: action.data.members,
            unlockedThemes: [],
            pathId: action.data.pathId,
            loaded: true
          }
        },
        selectedChannelId: channelId
      };
    }
    case 'CREATE_NEW_DM_CHANNEL': {
      const messageId = action.message.id || uuidv1();
      return {
        ...state,
        subject: {},
        homeChannelIds: [
          action.channel.id,
          ...state.homeChannelIds.filter((channelId) => channelId !== 0)
        ],
        channelsObj: {
          ...state.channelsObj,
          0: {},
          [action.channel.id]: {
            ...action.channel,
            messageIds: [messageId],
            messagesObj: {
              [messageId]: action.message
            },
            numUnreads: 0,
            loaded: true
          }
        },
        selectedChannelId: action.channel.id
      };
    }
    case 'DELETE_MESSAGE':
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.subchannelId
              ]?.messageIds?.filter(
                (messageId) => messageId !== action.messageId
              )
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messageIds: prevChannelObj?.messageIds?.filter(
              (messageId) => messageId !== action.messageId
            ),
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    case 'DISPLAY_ATTACHED_FILE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.messageId],
                  ...action.fileInfo,
                  id: action.messageId,
                  fileToUpload: null
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messagesObj: {
              ...prevChannelObj?.messagesObj,
              [action.messageId]: {
                ...prevChannelObj?.messagesObj?.[action.messageId],
                ...action.fileInfo,
                id: action.messageId,
                fileToUpload: null
              }
            },
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'EDIT_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              subjectObj:
                action.isSubject && action.subjectChanged
                  ? {
                      ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                        ?.subjectObj,
                      content: action.editedMessage
                    }
                  : prevChannelObj?.subchannelObj?.[action.subchannelId]
                      ?.subjectObj,
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.messageId],
                  content: action.editedMessage
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(prevChannelObj?.messagesObj
            ? {
                [action.channelId]: action.subchannelId
                  ? {
                      ...prevChannelObj,
                      subchannelObj
                    }
                  : {
                      ...prevChannelObj,
                      subjectObj:
                        action.isSubject && action.subjectChanged
                          ? {
                              ...prevChannelObj.subjectObj,
                              content: action.editedMessage
                            }
                          : prevChannelObj.subjectObj,
                      messagesObj: {
                        ...prevChannelObj?.messagesObj,
                        [action.messageId]: {
                          ...prevChannelObj?.messagesObj[action.messageId],
                          content: action.editedMessage
                        }
                      }
                    }
              }
            : {})
        }
      };
    }
    case 'EDIT_WORD':
      return {
        ...state,
        wordsObj: {
          ...state.wordsObj,
          [action.word]: {
            ...state.wordsObj[action.word],
            deletedDefIds: action.deletedDefIds,
            partOfSpeechOrder: action.partOfSpeeches,
            definitionOrder: action.editedDefinitionOrder
          }
        }
      };
    case 'ENABLE_CHAT_SUBJECT': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            canChangeSubject: 'owner'
          }
        }
      };
    }
    case 'ENABLE_THEME': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            unlockedThemes: [
              ...state.channelsObj[action.channelId].unlockedThemes,
              action.theme
            ]
          }
        }
      };
    }
    case 'ENTER_CHANNEL': {
      let messagesLoadMoreButton = false;
      const loadedChannel = action.data.channel;
      if (action.data.messageIds.length === 21) {
        action.data.messageIds.pop();
        messagesLoadMoreButton = true;
      }
      let newSubchannelObj = {};
      if (
        action.data.currentSubchannelId &&
        action.data.channel?.subchannelObj
      ) {
        newSubchannelObj = {
          ...state.channelsObj[loadedChannel.id]?.subchannelObj,
          [action.data.currentSubchannelId]: {
            ...state.channelsObj[loadedChannel.id]?.subchannelObj?.[
              action.data.currentSubchannelId
            ],
            ...action.data.channel?.subchannelObj?.[
              action.data.currentSubchannelId
            ],
            messageIds:
              action.data.channel?.subchannelObj[
                action.data.currentSubchannelId
              ]?.messageIds,
            messagesObj:
              action.data.channel?.subchannelObj[
                action.data.currentSubchannelId
              ]?.messagesObj,
            loaded: true
          }
        };
      }

      return {
        ...state,
        chatType: 'default',
        selectedChatTab: determineSelectedChatTab({
          currentSelectedChatTab: state.selectedChatTab,
          selectedChannel: loadedChannel
        }),
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  numUnreads: 0
                }
              }
            : {}),
          [loadedChannel.id]: {
            ...loadedChannel,
            messagesLoadMoreButton,
            subchannelIds: action.data.channel?.subchannelIds,
            subchannelObj: action.data.channel?.subchannelObj,
            messageIds: action.data.messageIds,
            messagesObj: action.data.messagesObj,
            numUnreads: 0,
            loaded: true,
            ...(action.data.currentSubchannelId
              ? { subchannelObj: newSubchannelObj }
              : {})
          }
        },
        selectedChannelId: state.selectedChannelId || loadedChannel.id
      };
    }
    case 'ENTER_EMPTY_CHAT':
      return {
        ...state,
        chatType: 'default',
        subject: {},
        selectedChannelId: 0,
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  numUnreads: 0
                }
              }
            : {}),
          0: {
            ...state.channelsObj[0],
            recentChessMessage: null,
            messageIds: [],
            messagesLoadMoreButton: false,
            loaded: true
          }
        }
      };
    case 'GET_NUM_UNREAD_MSGS':
      return {
        ...state,
        numUnreads: action.numUnreads
      };
    case 'HANG_UP': {
      const newChannelOnCallMembers = { ...state.channelOnCall?.members };
      delete newChannelOnCallMembers[action.memberId];
      const newPeerStreams = { ...state.peerStreams };
      if (!action.iHungUp) {
        delete newPeerStreams[action.peerId];
      }
      return {
        ...state,
        myStream: action.iHungUp ? null : state.myStream,
        peerStreams: action.iHungUp ? {} : newPeerStreams,
        channelOnCall: {
          ...state.channelOnCall,
          callReceived: action.iHungUp
            ? false
            : state.channelOnCall?.callReceived,
          outgoingShown: action.iHungUp
            ? false
            : state.channelOnCall?.outgoingShown,
          imCalling: action.iHungUp ? false : state.channelOnCall?.imCalling,
          incomingShown: action.iHungUp
            ? false
            : state.channelOnCall?.incomingShown,
          members: newChannelOnCallMembers
        }
      };
    }
    case 'HIDE_ATTACHMENT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]: {
                  ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.messageId],
                  attachmentHidden: true
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(prevChannelObj?.messagesObj
            ? {
                [action.channelId]: {
                  ...prevChannelObj,
                  messagesObj: {
                    ...prevChannelObj.messagesObj,
                    [action.messageId]: {
                      ...prevChannelObj.messagesObj[action.messageId],
                      attachmentHidden: true
                    }
                  },
                  ...(subchannelObj ? { subchannelObj } : {})
                }
              }
            : {})
        }
      };
    }
    case 'HIDE_CHAT':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            isHidden: true
          }
        }
      };
    case 'INIT_CHAT': {
      const alreadyUsingChat =
        (!!state.selectedChannelId || state.selectedChannelId === 0) &&
        state.selectedChannelId !== action.data.currentChannelId;
      let messagesLoadMoreButton = false;
      let classLoadMoreButton = false;
      let homeLoadMoreButton = false;
      let favoriteLoadMoreButton = false;
      let vocabActivitiesLoadMoreButton = false;
      const newMessageIds = [...action.data.messageIds];
      const newMessagesObj = {
        ...state.channelsObj[action.data.currentChannelId]?.messagesObj,
        ...action.data.messagesObj
      };
      if (newMessageIds && newMessageIds.length === 21) {
        newMessageIds.pop();
        messagesLoadMoreButton = true;
      }
      if (action.data.homeChannelIds?.length > 20) {
        action.data.homeChannelIds.pop();
        homeLoadMoreButton = true;
      }
      if (action.data.classChannelIds?.length > 20) {
        action.data.classChannelIds.pop();
        classLoadMoreButton = true;
      }
      if (action.data.favoriteChannelIds?.length > 20) {
        action.data.favoriteChannelIds.pop();
        favoriteLoadMoreButton = true;
      }
      if (action.data.vocabActivities.length > 20) {
        action.data.vocabActivities.pop();
        vocabActivitiesLoadMoreButton = true;
      }
      action.data.vocabActivities.reverse();
      let newChannelsObj = {
        ...state.channelsObj,
        ...action.data.channelsObj
      };
      const newSubchannelObj = {};
      if (action.data.currentSubchannelId && action.data.channelsObj) {
        for (let subchannel of Object.values(
          action.data.channelsObj?.[action.data.currentChannelId]?.subchannelObj
        )) {
          newSubchannelObj[subchannel.id] = {
            ...(state.channelsObj[action.data.currentChannelId]
              ?.subchannelObj?.[subchannel.id] || {}),
            ...subchannel
          };
        }
      }
      newChannelsObj[action.data.currentChannelId] = {
        ...action.data.channelsObj[action.data.currentChannelId],
        messagesLoadMoreButton,
        messageIds: newMessageIds,
        messagesObj: newMessagesObj,
        recentChessMessage: null,
        loaded: true,
        ...(action.data.currentSubchannelId
          ? { subchannelObj: newSubchannelObj }
          : {})
      };
      if (alreadyUsingChat) {
        newChannelsObj[state.selectedChannelId] =
          state.channelsObj[state.selectedChannelId];
      }
      for (let channelId in newChannelsObj) {
        if (
          state.channelsObj[channelId]?.loaded &&
          Number(channelId) !== Number(state.selectedChannelId)
        ) {
          newChannelsObj[channelId].loaded = false;
        }
      }

      return {
        ...state,
        ...initialChatState,
        aiCardFeeds:
          action.data.cardFeeds && !!action.data.cardFeeds.length
            ? action.data.cardFeeds
            : state.aiCardFeeds,
        aiCardLoadMoreButton:
          state.chatType === AI_CARD_CHAT_TYPE
            ? state.aiCardLoadMoreButton
            : action.data.aiCardLoadMoreButton,
        allFavoriteChannelIds: action.data.allFavoriteChannelIds,
        cardObj: action.data.cardObj
          ? {
              ...state.cardObj,
              ...action.data.cardObj
            }
          : state.cardObj,
        channelsObj: newChannelsObj,
        chatStatus: state.chatStatus,
        chatType: state.chatType ? state.chatType : action.data.chatType,
        classChannelIds: action.data.classChannelIds,
        classLoadMoreButton,
        customChannelNames: action.data.customChannelNames,
        favoriteChannelIds: action.data.favoriteChannelIds,
        favoriteLoadMoreButton,
        homeChannelIds: action.data.homeChannelIds,
        homeLoadMoreButton: alreadyUsingChat
          ? state.homeLoadMoreButton
          : homeLoadMoreButton,
        incomingOffers: state.incomingOffers,
        incomingOffersLoadMoreButton: state.incomingOffersLoadMoreButton,
        lastSubchannelPaths:
          action.data.currentSubchannelId &&
          action.data.currentChannelId === state.selectedChannelId
            ? {
                ...state.lastSubchannelPaths,
                [action.data.currentChannelId]:
                  newSubchannelObj[action.data.currentSubchannelId].path
              }
            : state.lastSubchannelPaths,
        loaded: true,
        listedCardIds: state.listedCardIds,
        listedCardsLoadMoreButton: state.listedCardsLoadMoreButton,
        myCardIds: state.myCardIds,
        myCardsLoadMoreButton: state.myCardsLoadMoreButton,
        myListedCardIds: state.myListedCardIds,
        myListedCardsLoadMoreButton: state.myListedCardsLoadMoreButton,
        numCardSummonedToday: action.data.numCardSummonedToday,
        numUnreads: state.numUnreads,
        outgoingOffers: state.outgoingOffers,
        outgoingOffersLoadMoreButton: state.outgoingOffersLoadMoreButton,
        reconnecting: false,
        recipientId: state.recipientId,
        selectedChannelId:
          state.selectedChannelId || state.selectedChannelId === 0
            ? state.selectedChannelId
            : action.data.currentChannelId,
        vocabActivities:
          state.chatType === VOCAB_CHAT_TYPE
            ? state.vocabActivities
            : action.data.vocabActivities,
        vocabActivitiesLoadMoreButton:
          state.chatType === VOCAB_CHAT_TYPE
            ? state.vocabActivitiesLoadMoreButton
            : vocabActivitiesLoadMoreButton,
        wordCollectors: action.data.wordCollectors,
        wordsObj: {
          ...state.wordsObj,
          ...action.data.wordsObj
        }
      };
    }

    case 'INVITE_USERS_TO_CHANNEL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [state.selectedChannelId]: {
            ...state.channelsObj[state.selectedChannelId],
            messageIds: [action.data.message.id].concat(
              state.channelsObj[state.selectedChannelId].messageIds
            ),
            messagesObj: {
              ...state.channelsObj[state.selectedChannelId].messagesObj,
              [action.data.message.id]: action.data.message
            },
            members: state.channelsObj[state.selectedChannelId].members.concat(
              action.data.selectedUsers.map((user) => ({
                id: user.id,
                username: user.username,
                profilePicUrl: user.profilePicUrl,
                authLevel: user.authLevel
              }))
            )
          }
        }
      };
    case 'LEAVE_CHANNEL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            loaded: false,
            members: (
              state.channelsObj[action.channelId]?.members || []
            )?.filter((member) => member.id !== action.userId)
          }
        },
        allFavoriteChannelIds: {
          ...state.allFavoriteChannelIds,
          [action.channelId]: false
        },
        favoriteChannelIds: state.favoriteChannelIds.filter(
          (channelId) => channelId !== action.channelId
        ),
        homeChannelIds: state.homeChannelIds.filter(
          (channelId) => channelId !== action.channelId
        ),
        classChannelIds: state.classChannelIds.filter(
          (channelId) => channelId !== action.channelId
        )
      };
    case 'LIST_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: {
            ...state.cardObj[action.card.id],
            ...action.card,
            isListed: true,
            askPrice: action.price || 0
          }
        },
        myListedCardIds: [action.card.id].concat(state.myListedCardIds)
      };
    }
    case 'DELIST_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.cardId]: {
            ...state.cardObj[action.cardId],
            isListed: false,
            askPrice: 0
          }
        },
        myListedCardIds: state.myListedCardIds.filter(
          (cardId) => cardId !== action.cardId
        )
      };
    }
    case 'LOAD_MORE_CHANNELS': {
      let loadMoreButton = false;
      if (action.channelType === 'home') {
        if (action.channels.length > 20) {
          action.channels.pop();
          loadMoreButton = true;
        }
      }
      if (action.channelType === 'class') {
        if (action.channels.length > 20) {
          action.channels.pop();
          loadMoreButton = true;
        }
      }
      if (action.channelType === 'favorite') {
        if (action.channels.length > 20) {
          action.channels.pop();
          loadMoreButton = true;
        }
      }
      const newChannels = { ...state.channelsObj };
      for (let channel of action.channels) {
        newChannels[channel.id] = {
          ...state.channelsObj[channel.id],
          ...(state.channelsObj[channel.id]?.loaded ? {} : channel)
        };
      }
      return {
        ...state,
        ...{ [`${action.channelType}LoadMoreButton`]: loadMoreButton },
        [chatTabHash[action.channelType]]: state[
          chatTabHash[action.channelType]
        ].concat(action.channels.map((channel) => channel.id)),
        channelsObj: {
          ...state.channelsObj,
          ...newChannels
        }
      };
    }
    case 'LOAD_MORE_MESSAGES': {
      if (state.selectedChannelId !== action.loadedChannelId) return state;
      let loadMoreButton = false;
      if (action.messageIds.length === 21) {
        action.messageIds.pop();
        loadMoreButton = true;
      }
      const prevChannelObj = state.channelsObj[action.loadedChannelId];
      const messageIds = action.loadedSubchannelId
        ? prevChannelObj.messageIds
        : prevChannelObj.messageIds.concat(action.messageIds);
      const messagesObj = action.loadedSubchannelId
        ? prevChannelObj.messagesObj
        : {
            ...prevChannelObj.messagesObj,
            ...action.messagesObj
          };
      const messagesLoadMoreButton = action.loadedSubchannelId
        ? prevChannelObj.messagesLoadMoreButton
        : loadMoreButton;
      const subchannelObj = action.loadedSubchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.loadedSubchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.loadedSubchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.loadedSubchannelId
              ]?.messageIds.concat(action.messageIds),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.loadedSubchannelId]
                  ?.messagesObj,
                ...action.messagesObj
              },
              loadMoreButtonShown: loadMoreButton
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.loadedChannelId]: {
            ...prevChannelObj,
            messageIds,
            messagesObj,
            messagesLoadMoreButton,
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'LOAD_LISTED_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        listedCardIds: action.cards.map((card) => card.id),
        listedCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MORE_LISTED_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        listedCardIds: state.listedCardIds.concat(
          action.cards.map((card) => card.id)
        ),
        listedCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MY_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myCardIds: action.cards.map((card) => card.id),
        myCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MORE_MY_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myCardIds: state.myCardIds.concat(action.cards.map((card) => card.id)),
        myCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MY_LISTED_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myListedCardIds: action.cards.map((card) => card.id),
        myListedCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MORE_MY_LISTED_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myListedCardIds: state.myListedCardIds.concat(
          action.cards.map((card) => card.id)
        ),
        myListedCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_INCOMING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.offers.map((offer) => offer.card))
        },
        incomingOffers: action.offers,
        incomingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_OUTGOING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.offers.map((offer) => offer.card))
        },
        outgoingOffers: action.offers,
        outgoingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_INCOMING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.offers.map((offer) => offer.card))
        },
        incomingOffers: state.incomingOffers.concat(action.offers),
        incomingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_OUTGOING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.offers.map((offer) => offer.card))
        },
        outgoingOffers: state.outgoingOffers.concat(action.offers),
        outgoingOffersLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.data.channelId];
      const subchannelObj = action.data.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.data.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.data.subchannelId],
              subjectObj: {
                ...action.data,
                loaded: true
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.data.channelId]: action.data.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                subjectObj: {
                  ...action.data,
                  loaded: true
                }
              }
        }
      };
    }
    case 'LOAD_AI_CARD_CHAT': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  numUnreads: 0
                }
              }
            : {})
        },
        numCardSummonedToday: action.numCardSummonedToday,
        selectedChannelId: null,
        selectedSubchannelId: null,
        chatType: AI_CARD_CHAT_TYPE,
        cardObj: {
          ...state.cardObj,
          ...action.cardObj
        },
        aiCardFeeds: action.cardFeeds,
        aiCardLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_AI_CARDS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...action.cardObj
        },
        aiCardFeeds: action.cardFeeds.concat(state.aiCardFeeds),
        aiCardLoadMoreButton: action.loadMoreShown
      };
    }
    case 'POST_AI_CARD_FEED': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: action.card
        },
        aiCardFeeds: state.aiCardFeeds.concat(action.feed),
        myCardIds: action.isSummon
          ? [action.card.id].concat(state.myCardIds)
          : state.myCardIds
      };
    }
    case 'UPDATE_AI_CARD': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...(action.isInit && state.cardObj[action.cardId]
            ? {}
            : {
                [action.cardId]: {
                  ...state.cardObj[action.cardId],
                  ...action.newState
                }
              })
        }
      };
    }
    case 'LOAD_VOCABULARY': {
      let vocabActivitiesLoadMoreButton = false;
      if (action.vocabActivities.length > 20) {
        action.vocabActivities.pop();
        vocabActivitiesLoadMoreButton = true;
      }
      action.vocabActivities?.reverse?.();
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  recentChessMessage: null,
                  numUnreads: 0
                }
              }
            : {})
        },
        selectedChannelId: null,
        selectedSubchannelId: null,
        chatType: VOCAB_CHAT_TYPE,
        vocabActivities: action.vocabActivities,
        vocabActivitiesLoadMoreButton,
        wordsObj: action.wordsObj,
        wordCollectors: action.wordCollectors
      };
    }
    case 'LOAD_MORE_VOCABULARY': {
      let vocabActivitiesLoadMoreButton = false;
      if (action.vocabActivities.length > 20) {
        action.vocabActivities.pop();
        vocabActivitiesLoadMoreButton = true;
      }
      action.vocabActivities?.reverse?.();
      return {
        ...state,
        selectedChannelId: null,
        chatType: VOCAB_CHAT_TYPE,
        vocabActivities: action.vocabActivities.concat(state.vocabActivities),
        vocabActivitiesLoadMoreButton,
        wordsObj: {
          ...state.wordsObj,
          ...action.wordsObj
        }
      };
    }
    case 'LOAD_WORD_COLLECTORS':
      return {
        ...state,
        wordCollectors: action.wordCollectors
      };
    case 'NEW_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: [action.subject.id].concat(
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.subject.id]: {
                  id: action.subject.id,
                  channelId: action.channelId,
                  subchannelId: action.subchannelId,
                  ...action.subject
                }
              },
              subjectObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        homeChannelIds: [
          action.channelId,
          ...state.homeChannelIds.filter(
            (channelId) => channelId !== action.channelId
          )
        ],
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                messageIds: [action.subject.id].concat(
                  prevChannelObj.messageIds
                ),
                messagesObj: {
                  ...prevChannelObj.messagesObj,
                  [action.subject.id]: {
                    id: action.subject.id,
                    channelId: action.channelId,
                    ...action.subject
                  }
                },
                subjectObj: action.subject
              }
        }
      };
    }
    case 'MAKE_OUTGOING_OFFER': {
      return {
        ...state,
        outgoingOffers: [action.offer].concat(state.outgoingOffers)
      };
    }
    case 'NOTIFY_MEMBER_LEFT': {
      const messageId = uuidv1();
      const leaveMessage = 'left the chat group';
      const timeStamp = Math.floor(Date.now() / 1000);
      return state.channelsObj[action.data.channelId]
        ? {
            ...state,
            channelsObj: {
              ...state.channelsObj,
              [action.data.channelId]: {
                ...state.channelsObj[action.data.channelId],
                messageIds: [messageId].concat(
                  state.channelsObj[action.data.channelId].messageIds
                ),
                messagesObj: {
                  ...state.channelsObj[action.data.channelId].messagesObj,
                  [messageId]: {
                    id: messageId,
                    channelId: action.data.channelId,
                    content: leaveMessage,
                    timeStamp: timeStamp,
                    isNotification: true,
                    username: action.data.username,
                    userId: action.data.userId,
                    profilePicUrl: action.data.profilePicUrl
                  }
                },
                numUnreads: 0,
                members: (
                  state.channelsObj[action.data.channelId]?.members || []
                ).filter((member) => member.id !== action.data.userId)
              }
            }
          }
        : state;
      // this will mean that if the channel where the user has left is not loaded in the left channel list initially, it will not appear in the list when user scrolls down and triggers "load more" event (because load more event only loads channels with older update time than the bottom item) and because this is new update. but is that really that bad? this channel will surface when user reloads the website anyway and user wasn't really interested in this channel to keep it bumped up in the first place.
    }
    case 'OPEN_NEW_TAB':
      return {
        ...state,
        chatType: 'default',
        subject: {},
        homeChannelIds: [
          0,
          ...state.homeChannelIds.filter((channelId) => channelId !== 0)
        ],
        selectedChannelId: 0,
        channelsObj: {
          ...state.channelsObj,
          messagesLoadMoreButton: false,
          messageIds: [],
          0: {
            id: 0,
            pathId: '',
            channelName: action.recipient.username,
            members: [action.user, action.recipient],
            numUnreads: 0,
            twoPeople: true,
            loaded: true
          }
        },
        recipientId: action.recipient.id
      };
    case 'POST_FILE_UPLOAD_STATUS': {
      const targetId =
        action.channelId +
        (action.subchannelId ? `/${action.subchannelId}` : '');
      return {
        ...state,
        filesBeingUploaded: {
          ...state.filesBeingUploaded,
          [targetId]: state.filesBeingUploaded[targetId]?.concat(
            action.file
          ) || [action.file]
        }
      };
    }
    case 'POST_UPLOAD_COMPLETE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj[
                action.subchannelId
              ]?.messageIds.map((messageId) =>
                messageId === action.tempMessageId
                  ? action.messageId
                  : messageId
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj[action.subchannelId]
                  ?.messagesObj,
                [action.messageId]:
                  prevChannelObj?.subchannelObj?.[action.subchannelId]
                    ?.messagesObj?.[action.tempMessageId]
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messageIds: prevChannelObj?.messageIds?.map((messageId) =>
              messageId === action.tempMessageId ? action.messageId : messageId
            ),
            messagesObj: {
              ...prevChannelObj?.messagesObj,
              [action.messageId]:
                prevChannelObj?.messagesObj?.[action.tempMessageId]
            },
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'RECEIVE_MESSAGE': {
      const messageId = action.message.id || uuidv1();
      const subchannelId = action.message.subchannelId;
      const numUnreads =
        action.pageVisible && action.usingChat
          ? state.numUnreads
          : state.numUnreads + 1;
      const prevChannelObj = state.channelsObj[action.message.channelId];
      const lastChessMoveViewerId =
        action.message.isChessMsg &&
        action.message.userId &&
        !action.message.isDrawOffer
          ? action.message.userId
          : prevChannelObj.lastChessMoveViewerId;
      const messageIds = subchannelId
        ? prevChannelObj.messageIds
        : [messageId].concat(prevChannelObj.messageIds);
      const messagesObj = subchannelId
        ? prevChannelObj.messagesObj
        : {
            ...prevChannelObj.messagesObj,
            [messageId]: { ...action.message, id: messageId }
          };
      const members = action.newMembers
        ? [
            ...(prevChannelObj?.members || []),
            ...action.newMembers.filter(
              (newMember) =>
                !(prevChannelObj?.members || [])
                  .map((member) => member.id)
                  .includes(newMember.id)
            )
          ]
        : prevChannelObj.members;
      const gameState = {
        ...prevChannelObj.gameState,
        ...(action.message.isChessMsg
          ? {
              chess: {
                ...prevChannelObj.gameState?.chess,
                drawOfferedBy: null
              }
            }
          : action.message.isDrawOffer
          ? {
              chess: {
                ...prevChannelObj.gameState?.chess,
                drawOfferedBy: action.message.userId
              }
            }
          : {})
      };
      const subchannelObj = subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[subchannelId],
              numUnreads:
                subchannelId === action.currentSubchannelId && action.usingChat
                  ? 0
                  : Number(
                      prevChannelObj?.subchannelObj?.[subchannelId]
                        ?.numUnreads || 0
                    ) + 1,
              messageIds: [messageId].concat(
                prevChannelObj?.subchannelObj?.[subchannelId]?.messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[subchannelId]?.messagesObj,
                [messageId]: { ...action.message, id: messageId }
              }
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        numUnreads,
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            ...prevChannelObj,
            messageIds,
            messagesObj,
            lastChessMoveViewerId,
            members,
            numUnreads:
              subchannelId || (action.usingChat && !action.currentSubchannelId)
                ? Number(prevChannelObj.numUnreads)
                : Number(prevChannelObj.numUnreads) + 1,
            gameState,
            isHidden: false,
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'RECEIVE_FIRST_MSG': {
      const messageId = uuidv1();
      return {
        ...state,
        numUnreads:
          action.duplicate && action.pageVisible
            ? state.numUnreads
            : Number(state.numUnreads) + 1,
        selectedChannelId: action.duplicate
          ? action.message.channelId
          : state.selectedChannelId,
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            id: action.message.channelId,
            messagesObj: {
              [messageId]: {
                id: messageId,
                ...action.message
              }
            },
            twoPeople: action.isTwoPeople,
            pathId: action.pathId,
            messageIds: [messageId],
            isClass: action.isClass,
            members: action.message.members,
            channelName: action.message.channelName || action.message.username,
            numUnreads: action.duplicate ? 0 : 1
          }
        },
        homeChannelIds: [action.message.channelId].concat(
          state.homeChannelIds.filter((channelId, index) =>
            action.duplicate ? index !== 0 : true
          )
        )
      };
    }
    case 'RECEIVE_MSG_ON_DIFF_CHANNEL': {
      const messageId = action.message.id || uuidv1();
      const prevChannelObj = state.channelsObj[action.channel.id];
      const subchannelId = action.message.subchannelId;
      const subchannelObj = subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.message.subchannelId]: {
              ...prevChannelObj?.subchannelObj[subchannelId],
              numUnreads:
                Number(
                  prevChannelObj?.subchannelObj?.[subchannelId]?.numUnreads || 0
                ) + 1,
              messageIds: [messageId].concat(
                prevChannelObj?.subchannelObj[subchannelId]?.messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj[subchannelId]?.messagesObj,
                [messageId]: { ...action.message, id: messageId }
              }
            }
          }
        : prevChannelObj?.subchannelObj;

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channel.id]: subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                ...action.channel,
                ...(prevChannelObj?.members && action.newMembers.length > 0
                  ? {
                      members: [
                        ...prevChannelObj?.members,
                        ...action.newMembers.filter(
                          (newMember) =>
                            !(prevChannelObj?.members || [])
                              .map((member) => member.id)
                              .includes(newMember.id)
                        )
                      ]
                    }
                  : {}),
                messageIds: [messageId].concat(
                  prevChannelObj?.messageIds || []
                ),
                messagesObj: {
                  ...prevChannelObj?.messagesObj,
                  [messageId]: { ...action.message, id: messageId }
                },
                lastChessMoveViewerId:
                  action.message.isChessMsg &&
                  action.message.userId &&
                  !action.message.isDrawOffer
                    ? action.message.userId
                    : prevChannelObj?.lastChessMoveViewerId,
                numUnreads: action.isMyMessage
                  ? Number(prevChannelObj?.numUnreads || 0)
                  : Number(prevChannelObj?.numUnreads || 0) + 1
              }
        },
        numUnreads:
          action.pageVisible && action.usingChat
            ? state.numUnreads
            : Number(state.numUnreads) + 1,
        favoriteChannelIds: state.allFavoriteChannelIds[action.channel.id]
          ? [action.channel.id].concat(
              state.favoriteChannelIds.filter(
                (channelId) => channelId !== action.channel.id
              )
            )
          : state.favoriteChannelIds,
        homeChannelIds: [action.channel.id].concat(
          state.homeChannelIds.filter(
            (channelId) => channelId !== action.channel.id
          )
        )
      };
    }
    case 'RECEIVE_AI_CARD_SUMMON':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: action.card
        },
        aiCardFeeds: state.aiCardFeeds.concat(action.feed)
      };
    case 'RECEIVE_VOCAB_ACTIVITY':
      return {
        ...state,
        vocabActivities: state.vocabActivities.concat(action.activity.content),
        wordsObj: {
          ...state.wordsObj,
          [action.activity.content]: action.activity
        }
      };
    case 'REGISTER_WORD':
      return {
        ...state,
        vocabActivities: state.vocabActivities.concat(action.word.content),
        wordsObj: {
          ...state.wordsObj,
          [action.word.content]: {
            ...state.wordsObj[action.word.content],
            ...action.word,
            isNewActivity: true
          }
        }
      };
    case 'RELOAD_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: [action.message.id].concat(
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  ?.messagesObj,
                [action.message.id]: action.message
              },
              subjectObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        homeChannelIds: [
          action.channelId,
          ...state.homeChannelIds.filter(
            (channelId) => channelId !== action.channelId
          )
        ],
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                messageIds: [action.message.id].concat(
                  prevChannelObj.messageIds
                ),
                messagesObj: {
                  ...prevChannelObj.messagesObj,
                  [action.message.id]: action.message
                },
                subjectObj: action.subject
              }
        }
      };
    }
    case 'REMOVE_NEW_ACTIVITY_STATUS':
      return {
        ...state,
        wordsObj: {
          ...state.wordsObj,
          [action.word]: {
            ...state.wordsObj[action.word],
            isNewActivity: false
          }
        }
      };
    case 'RESET_CHAT':
      return { ...initialChatState, cardObj: state.cardObj };
    case 'SEARCH':
      return {
        ...state,
        chatSearchResults: action.data
      };
    case 'SEARCH_SUBJECT':
      return {
        ...state,
        subjectSearchResults: action.data
      };
    case 'SEARCH_USERS_FOR_CHANNEL':
      return {
        ...state,
        userSearchResults: action.data
      };
    case 'SELECT_CHAT_TAB':
      return {
        ...state,
        selectedChatTab: determineSelectedChatTab({
          currentSelectedChatTab: state.selectedChatTab,
          selectedChatTab: action.selectedChatTab
        })
      };
    case 'SET_CALL': {
      return {
        ...state,
        channelOnCall: action.channelId
          ? {
              imCalling: action.imCalling,
              id: action.channelId,
              members: {}
            }
          : {}
      };
    }
    case 'SET_CHESS_GAME_STATE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            gameState: {
              ...prevChannelObj?.gameState,
              chess: {
                ...prevChannelObj?.gameState?.chess,
                ...action.newState
              }
            }
          }
        }
      };
    }
    case 'SET_CHESS_TARGET': {
      const prevChannelObj = state.channelsObj[action.channelId];
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            chessTarget: action.target
              ? {
                  ...action.target,
                  messageId: action.messageId,
                  isDiscussion: true
                }
              : null
          }
        }
      };
    }
    case 'SET_CHANNEL_STATE':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            ...action.newState
          }
        }
      };
    case 'SET_CHAT_INVITATION_DETAIL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          ...(state.channelsObj[action.channelId]?.messagesObj
            ? {
                [action.channelId]: {
                  ...state.channelsObj[action.channelId],
                  messagesObj: {
                    ...state.channelsObj[action.channelId].messagesObj,
                    [action.messageId]: {
                      ...state.channelsObj[action.channelId].messagesObj[
                        action.messageId
                      ],
                      invitationChannelId: action.channel.id
                    }
                  }
                }
              }
            : {}),
          [action.channel.id]: {
            ...state.channelsObj[action.channel.id],
            ...action.channel,
            loaded: state.channelsObj[action.channel.id]?.loaded || false
          }
        }
      };
    case 'SET_CHESS_MODAL_SHOWN':
      return {
        ...state,
        chessModalShown: action.shown
      };
    case 'SET_CREATING_NEW_DM_CHANNEL':
      return {
        ...state,
        creatingNewDMChannel: action.creating
      };
    case 'SET_CURRENT_CHANNEL_NAME':
      return {
        ...state,
        currentChannelName: action.channelName
      };
    case 'SET_FAVORITE_CHANNEL': {
      const filteredFavChannelIds = state.favoriteChannelIds.filter(
        (channelId) => channelId !== action.channelId
      );
      return {
        ...state,
        allFavoriteChannelIds: {
          ...state.allFavoriteChannelIds,
          [action.channelId]: action.favorited
        },
        favoriteChannelIds: action.favorited
          ? [action.channelId].concat(filteredFavChannelIds)
          : filteredFavChannelIds
      };
    }
    case 'SET_IS_RESPONDING_TO_SUBJECT': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              replyTarget: null,
              isRespondingToSubject: action.isResponding
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                replyTarget: null,
                isRespondingToSubject: action.isResponding
              }
        }
      };
    }
    case 'SET_LOADING_VOCABULARY':
      return {
        ...state,
        loadingVocabulary: action.loading
      };
    case 'SET_LOADING_AI_IMAGE_CHAT':
      return {
        ...state,
        loadingAIImageChat: action.loading
      };
    case 'SET_MESSAGE_STATE':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId].messagesObj,
              [action.messageId]: {
                ...state.channelsObj[action.channelId].messagesObj[
                  action.messageId
                ],
                ...action.newState
              }
            }
          }
        }
      };
    case 'SET_MEMBERS_ON_CALL':
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          members:
            Object.keys(action.members).length > 0
              ? {
                  ...state.channelOnCall?.members,
                  ...action.members
                }
              : {}
        }
      };
    case 'SET_ONLINE_USERS': {
      return {
        ...state,
        chatStatus: action.onlineUsers
      };
    }
    case 'SET_MY_STREAM':
      return {
        ...state,
        myStream: action.stream
      };
    case 'SET_PEER_STREAMS':
      return {
        ...state,
        peerStreams: action.peerId
          ? {
              ...state.peerStreams,
              [action.peerId]: action.stream
            }
          : {}
      };
    case 'SET_RECONNECTING': {
      const newChannelsObj = { ...state.channelsObj };
      for (let key in newChannelsObj) {
        (newChannelsObj[key] || {}).loaded = false;
      }
      return {
        ...state,
        channelsObj: newChannelsObj,
        reconnecting: true
      };
    }
    case 'SET_REPLY_TARGET': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              replyTarget: action.target,
              isRespondingToSubject: false
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: action.subchannelId
            ? {
                ...prevChannelObj,
                subchannelObj
              }
            : {
                ...prevChannelObj,
                replyTarget: action.target,
                isRespondingToSubject: false
              }
        }
      };
    }
    case 'SET_SELECTED_SUBCHANNEL_ID': {
      return {
        ...state,
        selectedSubchannelId: action.subchannelId
      };
    }
    case 'SET_SUBCHANNEL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            subchannelObj: {
              ...state.channelsObj[action.channelId]?.subchannelObj,
              [action.subchannel.id]: action.subchannel
            }
          }
        }
      };
    case 'SET_AI_IMAGE_ERROR_MESSAGE': {
      return {
        ...state,
        aiCardErrorMessage: action.message
      };
    }
    case 'SET_AI_IMAGE_STATUS_MESSAGE': {
      return {
        ...state,
        aiCardStatusMessage: action.message
      };
    }
    case 'SET_IS_GENERATING_AI_CARD': {
      return {
        ...state,
        isGeneratingAICard: action.isGenerating
      };
    }
    case 'SET_VOCAB_ERROR_MESSAGE': {
      return {
        ...state,
        vocabErrorMessage: action.message
      };
    }
    case 'SET_WORDLE_MODAL_SHOWN':
      return {
        ...state,
        wordleModalShown: action.shown
      };
    case 'SET_WORDS_OBJECT': {
      return {
        ...state,
        wordsObj: {
          ...state.wordsObj,
          [action.wordObj.content]: {
            ...(state.wordsObj?.[action.wordObj.content] || {}),
            ...action.wordObj
          }
        }
      };
    }
    case 'SET_WORD_REGISTER_STATUS': {
      return {
        ...state,
        wordRegisterStatus: action.status
      };
    }
    case 'SET_WORDLE_GUESSES':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            wordleGuesses: action.guesses
          }
        }
      };
    case 'SHOW_INCOMING': {
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          incomingShown: true
        }
      };
    }
    case 'SHOW_OUTGOING': {
      return {
        ...state,
        channelOnCall: {
          ...state.channelOnCall,
          outgoingShown: true
        }
      };
    }
    case 'SUBMIT_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.message.channelId] || {};
      const gameState = {
        ...prevChannelObj?.gameState,
        ...(action.message.isChessMsg
          ? {
              chess: {
                ...prevChannelObj?.gameState?.chess,
                drawOfferedBy: null
              }
            }
          : action.message.isDrawOffer
          ? {
              chess: {
                ...prevChannelObj?.gameState?.chess,
                drawOfferedBy: action.message.userId
              }
            }
          : {})
      };
      const messageIds = action.subchannelId
        ? prevChannelObj?.messageIds
        : [action.messageId].concat(prevChannelObj?.messageIds);
      const messagesObj = action.subchannelId
        ? prevChannelObj?.messagesObj
        : {
            ...prevChannelObj?.messagesObj,
            [action.messageId]: {
              ...action.message,
              tempMessageId: action.messageId,
              content: action.message.content,
              targetMessage: action.replyTarget,
              ...(action.isRespondingToSubject
                ? {
                    targetSubject: {
                      ...prevChannelObj?.subjectObj,
                      content:
                        prevChannelObj?.subjectObj?.content ||
                        defaultChatSubject
                    }
                  }
                : {})
            }
          };
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj[action.subchannelId],
              isRespondingToSubject: false,
              messageIds: [action.messageId].concat(
                prevChannelObj?.subchannelObj[action.subchannelId].messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj[action.subchannelId]
                  .messagesObj,
                [action.messageId]: {
                  ...action.message,
                  tempMessageId: action.messageId,
                  subchannelId: action.subchannelId,
                  content: action.message.content,
                  targetMessage: action.replyTarget,
                  ...(action.isRespondingToSubject
                    ? {
                        targetSubject: {
                          ...prevChannelObj?.subchannelObj[action.subchannelId]
                            ?.subjectObj,
                          content:
                            prevChannelObj?.subchannelObj[action.subchannelId]
                              ?.subjectObj?.content || defaultChatSubject
                        }
                      }
                    : {})
                }
              }
            }
          }
        : prevChannelObj?.subchannelObj;

      return {
        ...state,
        homeChannelIds: action.message.isNotification
          ? state.homeChannelIds
          : [action.message.channelId].concat(
              state.homeChannelIds.filter(
                (channelId) => channelId !== action.message.channelId
              )
            ),
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            ...prevChannelObj,
            isRespondingToSubject: false,
            gameState,
            messageIds,
            messagesObj,
            numUnreads: 0,
            subchannelObj
          }
        }
      };
    }
    case 'TRIM_MESSAGES':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesLoadMoreButton:
              state.channelsObj[action.channelId]?.messageIds?.length > 20
                ? true
                : state.channelsObj[action.channelId]?.messagesLoadMoreButton,
            messageIds:
              state.channelsObj[action.channelId]?.messageIds?.length > 20
                ? state.channelsObj[action.channelId]?.messageIds.filter(
                    (messageId, index) => index <= 20
                  )
                : state.channelsObj[action.channelId]?.messageIds
          }
        }
      };
    case 'UPDATE_CURRENT_TRANSACTION_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            currentTransactionId: action.transactionId
          }
        }
      };
    case 'UPDATE_CHANNEL_PATH_ID_HASH':
      return {
        ...state,
        channelPathIdHash: {
          ...state.channelPathIdHash,
          [action.pathId]: action.channelId
        }
      };
    case 'UPDATE_LAST_SUBCHANNEL_PATH':
      return {
        ...state,
        lastSubchannelPaths: {
          ...state.lastSubchannelPaths,
          [action.channelId]: action.path
        },
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            numUnreads: action.currentSubchannelPath
              ? state.channelsObj?.[action.channelId]?.numUnreads || 0
              : 0
          }
        }
      };
    case 'ACCEPT_TRANSACTION':
      return {
        ...state,
        acceptedTransactions: {
          ...state.acceptedTransactions,
          [action.transactionId]: true
        }
      };
    case 'CANCEL_TRANSACTION':
      return {
        ...state,
        cancelledTransactions: {
          ...state.cancelledTransactions,
          [action.transactionId]: action.reason
        }
      };
    case 'UPDATE_UPLOAD_PROGRESS': {
      const targetId =
        action.channelId +
        (action.subchannelId ? `/${action.subchannelId}` : '');
      return {
        ...state,
        filesBeingUploaded: {
          ...state.filesBeingUploaded,
          [targetId]: state.filesBeingUploaded[targetId]?.map((file) =>
            file.filePath === action.path
              ? {
                  ...file,
                  uploadProgress: action.progress
                }
              : file
          )
        }
      };
    }
    case 'UPDATE_COLLECTORS_RANKINGS':
      return {
        ...state,
        wordCollectors:
          action.data.rankings ||
          updateWordCollectorsRankings({
            collector: action.data,
            currentRankings: state.wordCollectors
          })
      };
    case 'UPDATE_LAST_CHESS_MESSAGE_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            lastChessMessageId:
              typeof action.messageId === 'number' &&
              action.messageId >
                (state.channelsObj[action.channelId]?.lastChessMessageId || 0)
                ? action.messageId
                : state.channelsObj[action.channelId]?.lastChessMessageId
          }
        }
      };
    case 'UPDATE_LAST_CHESS_MOVE_VIEWER_ID':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            lastChessMoveViewerId: action.viewerId
          }
        }
      };
    case 'UPDATE_RECENT_CHESS_MESSAGE':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            recentChessMessage: action.message
          }
        }
      };
    case 'UPDATE_NUM_SUMMONED': {
      return {
        ...state,
        numCardSummonedToday: action.numSummoned
      };
    }
    case 'UPDATE_CHAT_TYPE': {
      return {
        ...state,
        chatType: action.chatType
      };
    }
    case 'UPDATE_SELECTED_CHANNEL_ID': {
      return {
        ...state,
        chatType: 'default',
        selectedChannelId: action.channelId,
        channelsObj: {
          ...state.channelsObj,
          ...(state.selectedChannelId
            ? {
                [state.selectedChannelId]: {
                  ...state.channelsObj[state.selectedChannelId],
                  numUnreads: state.lastSubchannelPaths[state.selectedChannelId]
                    ? state.channelsObj[state.selectedChannelId].numUnreads
                    : 0
                }
              }
            : {})
        }
      };
    }
    case 'WITHDRAW_OUTGOING_OFFER': {
      return {
        ...state,
        outgoingOffers: state.outgoingOffers.filter(
          (offer) => offer.id !== action.offerId
        )
      };
    }
    default:
      return state;
  }
}

function updateWordCollectorsRankings({
  collector,
  currentRankings: { all = [], top30s = [] }
}) {
  const newAllRankings = all
    .filter((ranker) => ranker.username !== collector.username)
    .concat([collector]);
  newAllRankings.sort((a, b) => b.numWordsCollected - a.numWordsCollected);
  let newTop30s = top30s;
  if (collector.rank <= 30) {
    newTop30s = top30s
      .filter((ranker) => ranker.username !== collector.username)
      .concat([collector]);
  }
  newTop30s.sort((a, b) => b.numWordsCollected - a.numWordsCollected);
  return { all: newAllRankings.slice(0, 30), top30s: newTop30s };
}
