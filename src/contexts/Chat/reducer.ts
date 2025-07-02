import { initialChatState } from '.';
import {
  defaultChatSubject,
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE
} from '~/constants/defaultValues';
import { determineSelectedChatTab } from './helpers';
import { objectify } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';

const chatTabHash: {
  [key: string]: string;
} = {
  home: 'homeChannelIds',
  favorite: 'favoriteChannelIds',
  class: 'classChannelIds'
};

export default function ChatReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'AI_CARD_OFFER_WITHDRAWAL': {
      return {
        ...state,
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feedId]: {
            ...state.aiCardFeedObj[action.feedId],
            offer: {
              ...state.aiCardFeedObj[action.feedId]?.offer,
              isCancelled: true
            }
          }
        }
      };
    }
    case 'ADD_ID_TO_NEW_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const messageIds = prevChannelObj?.messageIds?.map((messageId: number) =>
        messageId === action.tempMessageId ? action.messageId : messageId
      );
      const messagesObj = {
        ...prevChannelObj?.messagesObj,
        [action.messageId]: {
          ...prevChannelObj?.messagesObj?.[action.tempMessageId],
          ...(prevChannelObj?.topicObj?.[action.topicId]?.content
            ? { targetSubject: prevChannelObj?.topicObj?.[action.topicId] }
            : {}),
          id: action.messageId,
          timeStamp: action.timeStamp
        }
      };
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.subchannelId
              ]?.messageIds.map((messageId: number) =>
                messageId === action.tempMessageId
                  ? action.messageId
                  : messageId
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
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
                  topicObj: {
                    ...prevChannelObj?.topicObj,
                    [action.topicId]: {
                      ...prevChannelObj?.topicObj[action.topicId],
                      messageIds: (
                        prevChannelObj?.topicObj[action.topicId]?.messageIds ||
                        []
                      ).map((messageId: number) =>
                        messageId === action.tempMessageId
                          ? action.messageId
                          : messageId
                      )
                    }
                  },
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
        cardObj: state.cardObj?.[action.card.id]
          ? {
              ...state.cardObj,
              [action.card.id]: {
                ...action.card,
                isListed: false,
                askPrice: null
              }
            }
          : state.cardObj,
        myCardIds: [action.card.id].concat(
          state.myCardIds.filter((cardId: number) => cardId !== action.card.id)
        )
      };
    }
    case 'REMOVE_MY_AI_CARD': {
      return {
        ...state,
        cardObj: state.cardObj?.[action.cardId]
          ? {
              ...state.cardObj,
              [action.cardId]: {
                ...state.cardObj[action.cardId],
                isListed: false,
                askPrice: null
              }
            }
          : state.cardObj,
        myCardIds: state.myCardIds.filter(
          (cardId: number) => cardId !== action.cardId
        )
      };
    }
    case 'REMOVE_LISTED_AI_CARD': {
      return {
        ...state,
        cardObj: state.cardObj?.[action.cardId]
          ? {
              ...state.cardObj,
              [action.cardId]: {
                ...state.cardObj[action.cardId],
                isListed: false,
                askPrice: 0
              }
            }
          : state.cardObj,
        listedCardIds: state.listedCardIds.filter(
          (cardId: number) => cardId !== action.cardId
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
        .filter((reaction: { userId: number; type: string }) => {
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
          ? prevChannelObj?.subchannelObj?.[action.subchannelId]?.messagesObj?.[
              action.messageId
            ]
          : prevChannelObj?.messagesObj?.[action.messageId]) || {};
      const reactions = (message.reactions || []).filter(
        (reaction: { userId: number; type: string }) => {
          return (
            reaction.userId !== action.userId ||
            reaction.type !== action.reaction
          );
        }
      );
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
            description: action.description,
            isClosed: action.isClosed,
            isPublic: action.isPublic,
            isOwnerPostingOnly: action.isOwnerPostingOnly,
            canChangeSubject: action.canChangeSubject,
            theme: action.theme,
            thumbPath: action.thumbPath
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

      // Get current channel data
      const channel = state.channelsObj[action.channelId];

      // Ensure newOwner is in members array
      let members = [...(channel.members || [])];
      const memberIds = new Set(members.map((member) => member.id));
      const allMemberIds = [...(channel.allMemberIds || [])];

      // If newOwner isn't in members array, add them
      if (!memberIds.has(action.newOwner.id) && action.newOwner.username) {
        members = [action.newOwner, ...members];
      }

      // Remove newOwner from allMemberIds (if present) to re-add at beginning
      const filteredMemberIds = allMemberIds.filter(
        (id) => id !== action.newOwner.id
      );

      // Add newOwner's ID to the beginning of allMemberIds
      const updatedAllMemberIds = [action.newOwner.id, ...filteredMemberIds];

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
            members,
            allMemberIds: updatedAllMemberIds,
            numUnreads: state.selectedChannelId === action.channelId ? 0 : 1
          }
        }
      };
    }
    case 'CHANGE_TOPIC_SETTINGS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                content: action.topicTitle,
                settings: {
                  ...state.channelsObj[action.channelId]?.topicObj?.[
                    action.topicId
                  ]?.settings,
                  isOwnerPostingOnly: action.isOwnerPostingOnly
                }
              }
            }
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
            description: action.description,
            isClosed: action.isClosed,
            isPublic: action.isPublic,
            isOwnerPostingOnly: action.isOwnerPostingOnly,
            canChangeSubject: action.canChangeSubject,
            thumbPath: action.thumbPath
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
              legacyTopicObj: action.subject
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
                featuredTopicId: action.isFeatured
                  ? action.subject.id
                  : prevChannelObj?.featuredTopicId,
                topicObj: action.topicObj
                  ? {
                      ...prevChannelObj?.topicObj,
                      [action.subject.id]: action.topicObj
                    }
                  : prevChannelObj?.topicObj,
                legacyTopicObj: action.subject
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
        chatType: null,
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
            allMemberIds: action.data.members.map(
              (member: { id: number }) => member.id
            ),
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
      const messageId = action.message?.id || uuidv1();
      return {
        ...state,
        subject: {},
        homeChannelIds: [
          action.channel.id,
          ...state.homeChannelIds.filter((channelId: number) => channelId !== 0)
        ],
        selectedChannelId: action.channel.id,
        ...(action.withoutMessage
          ? {}
          : {
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
              }
            })
      };
    }
    case 'DELETE_AI_CHAT_FILE': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            files: {
              ...state.channelsObj[action.channelId].files,
              main: {
                ...state.channelsObj[action.channelId].files.main,
                ids: state.channelsObj[action.channelId].files.main.ids.filter(
                  (fileId: number) => fileId !== action.fileId
                )
              },
              ...(action.topicId &&
              state.channelsObj[action.channelId]?.files?.[action.topicId]
                ? {
                    [action.topicId]: {
                      ...state.channelsObj[action.channelId].files[
                        action.topicId
                      ],
                      ids: state.channelsObj[action.channelId].files[
                        action.topicId
                      ].ids.filter((fileId: number) => fileId !== action.fileId)
                    }
                  }
                : {})
            }
          }
        }
      };
    }
    case 'DELETE_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj?.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.subchannelId
              ]?.messageIds?.filter(
                (messageId: number) => messageId !== action.messageId
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
            topicObj: action.topicId
              ? {
                  ...state.channelsObj[action.channelId]?.topicObj,
                  [action.topicId]: {
                    ...state.channelsObj[action.channelId]?.topicObj?.[
                      action.topicId
                    ],
                    messageIds: state.channelsObj[action.channelId]?.topicObj?.[
                      action.topicId
                    ]?.messageIds?.filter(
                      (messageId: number) => messageId !== action.messageId
                    )
                  }
                }
              : state.channelsObj[action.channelId]?.topicObj,
            messageIds: prevChannelObj?.messageIds?.filter(
              (messageId: number) => messageId !== action.messageId
            ),
            ...(subchannelObj ? { subchannelObj } : {})
          }
        }
      };
    }
    case 'CANCEL_AI_MESSAGE': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const newChannelState = {
        currentlyStreamingAIMsgId: null,
        cancelledMessageIds: new Set([
          ...(prevChannelObj?.cancelledMessageIds || new Set()),
          action.messageId
        ])
      };

      let messageIds = prevChannelObj?.messageIds;
      let messagesObj = prevChannelObj?.messagesObj;
      let topicObj = prevChannelObj?.topicObj;

      if (action.shouldRemoveMessage) {
        messageIds = messageIds?.filter(
          (messageId: number) => messageId !== action.messageId
        );
        messagesObj = { ...messagesObj };
        delete messagesObj[action.messageId];

        if (action.topicId) {
          topicObj = {
            ...topicObj,
            [action.topicId]: {
              ...topicObj?.[action.topicId],
              messageIds: topicObj?.[action.topicId]?.messageIds?.filter(
                (messageId: number) => messageId !== action.messageId
              )
            }
          };
        }
      }

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            ...newChannelState,
            messageIds,
            messagesObj,
            topicObj
          }
        }
      };
    }
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
              legacyTopicObj:
                action.isSubject && action.subjectChanged
                  ? {
                      ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                        ?.legacyTopicObj,
                      content: action.editedMessage
                    }
                  : prevChannelObj?.subchannelObj?.[action.subchannelId]
                      ?.legacyTopicObj,
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
                      legacyTopicObj:
                        action.isSubject && action.subjectChanged
                          ? {
                              ...prevChannelObj.legacyTopicObj,
                              content: action.editedMessage
                            }
                          : prevChannelObj.legacyTopicObj,
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
    case 'APPLY_AI_GENERATED_DEFINITIONS': {
      const definitionOrder: Record<string, string[]> = {};
      for (const key in action.partOfSpeeches) {
        definitionOrder[key] = action.partOfSpeeches[key].map(
          (def: { id: number }) => def.id
        );
      }

      return {
        ...state,
        wordsObj: {
          ...state.wordsObj,
          [action.word]: {
            ...state.wordsObj[action.word],
            ...action.partOfSpeeches,
            definitionOrder,
            partOfSpeechOrder: action.partOfSpeechOrder
          }
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
            canChangeSubject: 'owner',
            featuredTopicId: action.topic.id,
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topic.id]: action.topic
            }
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
      if (action.data.messages.length === 21) {
        action.data.messages.pop();
        messagesLoadMoreButton = true;
      }
      let newSubchannelObj = {};
      if (
        action.data.currentSubchannelId &&
        action.data.channel?.subchannelObj
      ) {
        newSubchannelObj = {
          ...state.channelsObj[loadedChannel.id]?.subchannelObj,
          ...action.data.channel?.subchannelObj,
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

      const messagesObj: any = {};
      for (const message of action.data.messages) {
        messagesObj[message.id] = {
          ...message,
          isLoaded: false
        };
      }

      return {
        ...state,
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
            loadMoreMembersShown: action.data.channel?.loadMoreMembersShown,
            subchannelIds: action.data.channel?.subchannelIds,
            subchannelObj: action.data.channel?.subchannelObj,
            messageIds: action.data.messages.map((message: any) => message.id),
            messagesObj,
            numUnreads: 0,
            isReloadRequired: false,
            legacyTopicObj: state.channelsObj[loadedChannel.id]?.legacyTopicObj,
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
        chatType: null,
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
    case 'ENTER_TOPIC': {
      const prevChannelObj = state.channelsObj[action.channelId];
      const currentTopicIndex = prevChannelObj.currentTopicIndex ?? -1; // Assuming -1 if not set
      let topicHistory = prevChannelObj?.topicHistory || [];
      let newTopicIndex = currentTopicIndex;

      if (action.direction) {
        if (
          action.direction === 'forward' &&
          currentTopicIndex < topicHistory.length - 1
        ) {
          newTopicIndex = currentTopicIndex + 1;
        } else if (action.direction === 'back' && currentTopicIndex > 0) {
          newTopicIndex = currentTopicIndex - 1;
        }
      } else if (action.topicId) {
        if (
          action.topicId !== prevChannelObj.topicHistory?.[currentTopicIndex]
        ) {
          if (currentTopicIndex < topicHistory.length - 1) {
            topicHistory = topicHistory.slice(0, currentTopicIndex + 1);
          }
          topicHistory.push(action.topicId);
          newTopicIndex = topicHistory.length - 1;
        }
      }

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            lastTopicId: action.topicId,
            selectedTab: 'topic',
            selectedTopicId: topicHistory[newTopicIndex],
            topicHistory,
            currentTopicIndex: newTopicIndex,
            topicObj: {
              ...prevChannelObj?.topicObj,
              [action.topicId]: {
                ...prevChannelObj?.topicObj?.[action.topicId],
                isSearchActive: false
              }
            }
          }
        }
      };
    }
    case 'FEATURE_TOPIC': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            featuredTopicId: action.topic.id,
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topic.id]: action.topic
            }
          }
        }
      };
    }
    case 'LOAD_AI_CARD_FEED': {
      return {
        ...state,
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feed.id]: {
            ...action.feed,
            isLoaded: true
          }
        },
        ...(action.feed.card
          ? {
              cardObj: {
                ...state.cardObj,
                [action.feed.card.id]: action.feed.card
              }
            }
          : {})
      };
    }
    case 'PIN_TOPIC': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            pinnedTopicIds: action.pinnedTopicIds
          }
        }
      };
    }
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
      if (!action.data?.channelsObj) return state;
      const alreadyUsingChat =
        (!!state.selectedChannelId || state.selectedChannelId === 0) &&
        state.selectedChannelId !== action.data.currentChannelId &&
        action.userId === state.prevUserId;
      let messagesLoadMoreButton = false;
      let classLoadMoreButton = false;
      let homeLoadMoreButton = false;
      let favoriteLoadMoreButton = false;
      let vocabFeedsLoadMoreButton = false;
      const newMessageIds = action.data.messageIds
        ? [...action.data.messageIds]
        : null;
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
      if (action.data.vocabFeeds?.length > 20) {
        action.data.vocabFeeds.pop();
        vocabFeedsLoadMoreButton = true;
      }
      action.data.vocabFeeds?.reverse?.();
      const newChannelsObj = {
        ...state.channelsObj,
        ...action.data.channelsObj
      };
      const newSubchannelObj: {
        messageIds: number[];
        messagesObj: Record<number, object>;
        subchannelObj: Record<number, { id: number }>;
        [key: number]: any;
      } = { messageIds: [], messagesObj: {}, subchannelObj: {} };
      const newCurrentChannel =
        action.data.channelsObj?.[action.data.currentChannelId];
      if (action.data.currentSubchannelId && action.data.channelsObj) {
        for (const subchannel of Object.values<{ id: number }>(
          newCurrentChannel?.subchannelObj
        )) {
          newSubchannelObj[subchannel.id] = {
            ...(state.channelsObj[action.data.currentChannelId]
              ?.subchannelObj?.[subchannel.id] || {}),
            ...subchannel
          };
        }
      }
      newChannelsObj[action.data.currentChannelId] = {
        ...(action.data.channelsObj[action.data.currentChannelId] || {}),
        allMemberIds:
          newCurrentChannel?.allMemberIds ||
          action.data.channelsObj[action.data.currentChannelId]?.allMemberIds ||
          [],
        messagesLoadMoreButton,
        messageIds: newMessageIds,
        messagesObj: newMessagesObj,
        recentChessMessage: null,
        loaded: true,
        ...(action.data.currentSubchannelId
          ? {
              subchannelObj: {
                ...(state.channelsObj[action.data.currentChannelId]
                  ?.subchannelObj || {}),
                ...newSubchannelObj
              }
            }
          : {})
      };
      if (alreadyUsingChat) {
        newChannelsObj[state.selectedChannelId] = {
          ...state.channelsObj[state.selectedChannelId],
          isReloadRequired: true,
          loaded: true
        };
      }
      for (const channelId in newChannelsObj) {
        if (
          state.channelsObj[channelId]?.loaded &&
          Number(channelId) !== Number(state.selectedChannelId)
        ) {
          newChannelsObj[channelId].loaded = false;
        }
      }
      const aiCardsLoaded =
        action.data.cardFeeds?.length > 1 ||
        (action.data.cardFeeds[0]?.id &&
          !state.aiCardFeedIds.includes(action.data.cardFeeds[0]?.id));
      const vocabActivitiesLoaded =
        action.data.vocabFeeds?.length > 1 ||
        (action.data.vocabFeeds?.[0] &&
          !(state.vocabFeeds || []).includes(action.data.vocabFeeds[0]));
      const newVocabLeaderboardAllSelected: Record<string, boolean> = {};
      for (const tab of Object.keys(state.vocabLeaderboardAllSelected)) {
        if (tab === 'month') {
          newVocabLeaderboardAllSelected[tab] =
            !!action.data.monthlyVocabRankings?.all?.length;
        }
        if (tab === 'year') {
          newVocabLeaderboardAllSelected[tab] =
            !!action.data.yearlyVocabRankings?.all?.length;
        }
      }

      return {
        ...state,
        ...initialChatState,
        wordleModalShown: state.wordleModalShown || false,
        currentMonth: action.data.currentMonth,
        currentYear: action.data.currentYear,
        chatStatus: state.chatStatus,
        aiCardFeedIds: aiCardsLoaded
          ? action.data.cardFeeds.map((feed: { id: number }) => feed.id)
          : state.aiCardFeedIds,
        aiCardFeedObj: aiCardsLoaded
          ? objectify(action.data.cardFeeds)
          : state.aiCardFeedObj,
        aiCardLoadMoreButton: aiCardsLoaded
          ? action.data.aiCardLoadMoreButton
          : state.aiCardLoadMoreButton,
        allFavoriteChannelIds: action.data.allFavoriteChannelIds,
        cardObj: action.data.cardObj
          ? {
              ...state.cardObj,
              ...action.data.cardObj
            }
          : state.cardObj,
        channelsObj: newChannelsObj,
        chatType:
          action.userId === state.prevUserId &&
          (!state.chatType || !action.data.chatType)
            ? state.chatType
            : action.data.chatType,
        classChannelIds: action.data.classChannelIds,
        classLoadMoreButton,
        customChannelNames: action.data.customChannelNames,
        favoriteChannelIds: action.data.favoriteChannelIds,
        favoriteLoadMoreButton,
        homeChannelIds: action.data.homeChannelIds,
        homeLoadMoreButton: alreadyUsingChat
          ? state.homeLoadMoreButton
          : homeLoadMoreButton,
        incomingOffers:
          action.userId === state.prevUserId
            ? state.incomingOffers
            : action.data.incomingOffers || [],
        incomingOffersLoadMoreButton:
          action.userId === state.prevUserId
            ? state.incomingOffersLoadMoreButton
            : action.data.incomingOffersLoadMoreButton || false,
        lastSubchannelPaths:
          action.data.currentSubchannelId &&
          action.data.currentChannelId === state.selectedChannelId
            ? {
                ...state.lastSubchannelPaths,
                [action.data.currentChannelId]:
                  newSubchannelObj[action.data.currentSubchannelId].path
              }
            : action.userId === state.prevUserId
            ? state.lastSubchannelPaths
            : action.data.lastSubchannelPaths || {},
        loaded: true,
        listedCardIds:
          action.userId === state.prevUserId
            ? state.listedCardIds
            : action.data.listedCardIds || [],
        listedCardsLoadMoreButton:
          action.userId === state.prevUserId
            ? state.listedCardsLoadMoreButton
            : action.data.listedCardsLoadMoreButton || false,
        myCardIds:
          action.userId === state.prevUserId
            ? state.myCardIds
            : action.data.myCardIds || [],
        myCardsLoadMoreButton:
          action.userId === state.prevUserId
            ? state.myCardsLoadMoreButton
            : action.data.myCardsLoadMoreButton || false,
        myListedCardIds:
          action.userId === state.prevUserId
            ? state.myListedCardIds
            : action.data.myListedCardIds || [],
        myListedCardsLoadMoreButton:
          action.userId === state.prevUserId
            ? state.myListedCardsLoadMoreButton
            : action.data.myListedCardsLoadMoreButton || false,
        mostRecentOfferTimeStamp: action.data.mostRecentOfferTimeStamp,
        numCardSummonedToday: action.data.numCardSummonedToday,
        numUnreads: alreadyUsingChat ? 0 : state.numUnreads,
        outgoingOffers:
          action.userId === state.prevUserId
            ? state.outgoingOffers
            : action.data.outgoingOffers || [],
        outgoingOffersLoadMoreButton:
          action.userId === state.prevUserId
            ? state.outgoingOffersLoadMoreButton
            : action.data.outgoingOffersLoadMoreButton || false,
        reconnecting: false,
        recipientId:
          action.userId === state.prevUserId
            ? state.recipientId
            : action.data.recipientId || null,
        selectedChannelId:
          (state.selectedChannelId || state.selectedChannelId === 0) &&
          action.userId === state.prevUserId
            ? state.selectedChannelId
            : action.data.currentChannelId,
        vocabFeedIds: vocabActivitiesLoaded
          ? action.data.vocabFeeds
              .map((feed: { id: number }) => feed.id)
              .reverse()
          : state.vocabFeedIds,
        vocabFeedObj: vocabActivitiesLoaded
          ? objectify(action.data.vocabFeeds)
          : state.vocabFeedObj,
        vocabFeedsLoadMoreButton: vocabActivitiesLoaded
          ? vocabFeedsLoadMoreButton
          : state.vocabFeedsLoadMoreButton,
        vocabLeaderboardAllSelected: newVocabLeaderboardAllSelected,
        collectorRankings: vocabActivitiesLoaded
          ? action.data.collectorRankings
          : state.collectorRankings,
        monthlyVocabRankings: vocabActivitiesLoaded
          ? action.data.monthlyVocabRankings
          : state.monthlyVocabRankings,
        yearlyVocabRankings: vocabActivitiesLoaded
          ? action.data.yearlyVocabRankings
          : state.yearlyVocabRankings,
        wordsObj: {
          ...state.wordsObj,
          ...action.data.wordsObj
        },
        aiCallChannelId: state.aiCallChannelId,
        zeroChannelId: state.zeroChannelId,
        prevUserId: action.userId
      };
    }

    case 'INVITE_USERS_TO_CHANNEL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [state.selectedChannelId]: {
            ...state.channelsObj[state.selectedChannelId],
            allMemberIds: (
              state.channelsObj[state.selectedChannelId]?.allMemberIds || []
            ).concat(
              action.data.selectedUsers.map((user: { id: number }) => user.id)
            ),
            messageIds: [action.data.message.id].concat(
              state.channelsObj[state.selectedChannelId].messageIds
            ),
            messagesObj: {
              ...state.channelsObj[state.selectedChannelId].messagesObj,
              [action.data.message.id]: action.data.message
            },
            members:
              action.data.selectedUsers.length > 0
                ? action.data.selectedUsers
                    .map(
                      (user: {
                        id: number;
                        username: string;
                        profilePicUrl: string;
                      }) => ({
                        id: user.id,
                        username: user.username,
                        profilePicUrl: user.profilePicUrl
                      })
                    )
                    .concat(state.channelsObj[state.selectedChannelId].members)
                : state.channelsObj[state.selectedChannelId].members
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
            allMemberIds: (
              state.channelsObj[action.channelId]?.allMemberIds || []
            ).filter((memberId: number) => memberId !== action.userId),
            loaded: false,
            members: (
              state.channelsObj[action.channelId]?.members || []
            )?.filter((member: { id: number }) => member.id !== action.userId)
          }
        },
        allFavoriteChannelIds: {
          ...state.allFavoriteChannelIds,
          [action.channelId]: false
        },
        favoriteChannelIds: state.favoriteChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
        ),
        homeChannelIds: state.homeChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
        ),
        classChannelIds: state.classChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
        )
      };
    case 'REMOVE_MEMBER_FROM_CHANNEL':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            allMemberIds: (
              state.channelsObj[action.channelId]?.allMemberIds || []
            ).filter((memberId: number) => memberId !== action.memberId),
            members: (
              state.channelsObj[action.channelId]?.members || []
            )?.filter((member: { id: number }) => member.id !== action.memberId)
          }
        },
        allFavoriteChannelIds: {
          ...state.allFavoriteChannelIds,
          [action.channelId]: false
        },
        favoriteChannelIds: state.favoriteChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
        ),
        homeChannelIds: state.homeChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
        ),
        classChannelIds: state.classChannelIds.filter(
          (channelId: number) => channelId !== action.channelId
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
          (cardId: number) => cardId !== action.cardId
        )
      };
    }
    case 'LOAD_MORE_BOOKMARKS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            ...(action.topicId
              ? {
                  topicObj: {
                    ...state.channelsObj[action.channelId]?.topicObj,
                    [action.topicId]: {
                      ...state.channelsObj[action.channelId]?.topicObj?.[
                        action.topicId
                      ],
                      bookmarkedMessages: [
                        ...(state.channelsObj[action.channelId]?.topicObj?.[
                          action.topicId
                        ]?.bookmarkedMessages || []),
                        ...action.bookmarks
                      ],
                      loadMoreBookmarksShown: action.loadMoreShown
                    }
                  }
                }
              : {
                  bookmarkedMessages: [
                    ...(state.channelsObj[action.channelId]
                      ?.bookmarkedMessages || []),
                    ...action.bookmarks
                  ],
                  loadMoreBookmarksShown: action.loadMoreShown
                })
          }
        }
      };
    }
    case 'LOAD_MORE_CHANNEL_MEMBERS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            loadMoreMembersShown: action.loadMoreShown,
            members: [
              ...state.channelsObj[action.channelId].members,
              ...action.members.filter(
                (newMember: any) =>
                  !state.channelsObj[action.channelId].members.some(
                    (existingMember: any) => existingMember.id === newMember.id
                  )
              )
            ]
          }
        }
      };
    }
    case 'LOAD_MORE_CHANNELS': {
      let loadMoreButton = false;
      if (
        ['home', 'class', 'favorite'].includes(action.channelType) &&
        action.channels.length > 20
      ) {
        action.channels.pop();
        loadMoreButton = true;
      }

      const newChannels = { ...state.channelsObj };
      for (const channel of action.channels) {
        newChannels[channel.id] = {
          ...state.channelsObj[channel.id],
          ...(state.channelsObj[channel.id]?.loaded ? {} : channel)
        };
      }

      const existingChannelIds = new Set(
        state[chatTabHash[action.channelType]]
      );
      const newChannelIds = action.channels
        .map((channel: any) => channel.id)
        .filter((id: number) => !existingChannelIds.has(id));

      return {
        ...state,
        [`${action.channelType}LoadMoreButton`]: loadMoreButton,
        [chatTabHash[action.channelType]]: [
          ...state[chatTabHash[action.channelType]],
          ...newChannelIds
        ],
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
    case 'LOAD_LISTED_AI_CARDS': {
      if (!action.cards) return state;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        listedCardIds: action.cards.map((card: { id: number }) => card.id),
        listedCardsLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MORE_LISTED_AI_CARDS': {
      if (!action.cards) return state;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        listedCardIds: state.listedCardIds.concat(
          action.cards.map((card: { id: number }) => card.id)
        ),
        listedCardsLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_MY_AI_CARDS':
      if (!action.cards) return state;
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myCardIds: action.cards.map((card: { id: number }) => card.id),
        myCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MORE_MY_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myCardIds: state.myCardIds.concat(
          action.cards.map((card: { id: number }) => card.id)
        ),
        myCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_MY_LISTED_AI_CARDS':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(action.cards)
        },
        myListedCardIds: action.cards.map((card: { id: number }) => card.id),
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
          action.cards.map((card: { id: number }) => card.id)
        ),
        myListedCardsLoadMoreButton: action.loadMoreShown
      };
    case 'LOAD_INCOMING_OFFERS': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
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
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
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
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
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
          ...objectify(
            action.offers.map((offer: { card: object }) => offer.card)
          )
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
              legacyTopicObj: {
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
                legacyTopicObj: {
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
        mostRecentOfferTimeStamp: action.mostRecentOfferTimeStamp,
        numCardSummonedToday: action.numCardSummonedToday,
        selectedChannelId: null,
        selectedSubchannelId: null,
        chatType: AI_CARD_CHAT_TYPE,
        cardObj: {
          ...state.cardObj,
          ...action.cardObj
        },
        aiCardFeedIds: action.cardFeeds.map((feed: { id: number }) => feed.id),
        aiCardFeedObj: objectify(action.cardFeeds),
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
        aiCardFeedIds: state.aiCardFeedIds.concat(
          action.cardFeeds.map((feed: { id: number }) => feed.id)
        ),
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          ...objectify(action.cardFeeds)
        },
        aiCardLoadMoreButton: action.loadMoreShown
      };
    }
    case 'LOAD_TOPIC_MESSAGES': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...(state.channelsObj[action.channelId]?.messagesObj || {}),
              ...(objectify(action.messages) as Record<number, object>)
            },
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                ...action.topicObj,
                messageIds: action.messages.map(
                  (message: { id: number }) => message.id
                ),
                loadMoreButtonShown: action.loadMoreShown,
                loadMoreShownAtBottom: action.loadMoreShownAtBottom,
                loaded: true
              }
            }
          }
        }
      };
    }
    case 'LOAD_MORE_TOPIC_MESSAGES': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...(state.channelsObj[action.channelId]?.messagesObj || {}),
              ...(objectify(action.messages) as Record<number, object>)
            },
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                ...action.topicObj,
                messageIds: (
                  state.channelsObj[action.channelId]?.topicObj?.[
                    action.topicId
                  ]?.messageIds || []
                ).concat(
                  action.messages.map((message: { id: number }) => message.id)
                ),
                loadMoreButtonShown: action.loadMoreShown
              }
            }
          }
        }
      };
    }
    case 'LOAD_MORE_RECENT_TOPIC_MESSAGES': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId]?.messagesObj,
              ...objectify(action.messages)
            },
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                messageIds: action.messages
                  .map((message: { id: number }) => message.id)
                  .concat(
                    state.channelsObj[action.channelId]?.topicObj?.[
                      action.topicId
                    ]?.messageIds || []
                  ),
                loadMoreShownAtBottom: action.loadMoreShownAtBottom
              }
            }
          }
        }
      };
    }
    case 'POST_AI_CARD_FEED': {
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: action.card
        },
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feed.id]: {
            ...action.feed,
            isLoaded: true
          }
        },
        aiCardFeedIds: [action.feed.id].concat(state.aiCardFeedIds || []),
        myCardIds: action.isSummon
          ? [action.card.id].concat(
              state.myCardIds.filter(
                (cardId: number) => cardId !== action.card.id
              )
            )
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
    case 'UPDATE_AI_THINKING_STATUS': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            messagesObj: {
              ...state.channelsObj[action.channelId]?.messagesObj,
              [action.messageId]: {
                ...state.channelsObj[action.channelId]?.messagesObj?.[
                  action.messageId
                ],
                aiThinkingStatus: action.status
              }
            }
          }
        }
      };
    }
    case 'UPDATE_LAST_USED_FILE': {
      const channel = state.channelsObj[action.channelId];
      const fileList = action.topicId
        ? channel?.files?.[action.topicId] || { ids: [] }
        : channel?.files?.main || { ids: [] };

      const filteredIds = fileList.ids.filter(
        (id: number) => id !== action.file.id
      );
      const newIds = [...filteredIds, action.file.id];

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...channel,
            files: {
              ...channel.files,
              [action.topicId ? action.topicId : 'main']: {
                ...fileList,
                ids: newIds
              }
            },
            fileDataObj: {
              ...channel.fileDataObj,
              [action.file.id]: action.file
            }
          }
        }
      };
    }
    case 'LOAD_VOCABULARY': {
      let vocabFeedsLoadMoreButton = false;
      if (action.vocabFeeds?.length > 20) {
        action.vocabFeeds.pop();
        vocabFeedsLoadMoreButton = true;
      }

      return {
        ...state,
        currentMonth: action.currentMonth,
        currentYear: action.currentYear,
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
        vocabFeedIds: action.vocabFeeds.map((feed: { id: number }) => feed.id),
        vocabFeedObj: objectify(action.vocabFeeds),
        vocabFeedsLoadMoreButton,
        wordsObj: action.wordsObj,
        collectorRankings: action.collectorRankings,
        monthlyVocabRankings: action.monthlyVocabRankings,
        yearlyVocabRankings: action.yearlyVocabRankings
      };
    }
    case 'LOAD_VOCAB_RANKINGS': {
      return {
        ...state,
        collectorRankings: action.collectorRankings,
        monthlyVocabRankings: action.monthlyVocabRankings,
        yearlyVocabRankings: action.yearlyVocabRankings
      };
    }
    case 'LOAD_MORE_VOCABULARY': {
      let vocabFeedsLoadMoreButton = false;
      if (action.vocabFeeds.length > 20) {
        action.vocabFeeds.pop();
        vocabFeedsLoadMoreButton = true;
      }

      return {
        ...state,
        vocabFeedIds: state.vocabFeedIds.concat(
          action.vocabFeeds.map((feed: { id: number }) => feed.id)
        ),
        vocabFeedObj: {
          ...state.vocabFeedObj,
          ...objectify(action.vocabFeeds)
        },
        wordsObj: {
          ...state.wordsObj,
          ...action.wordsObj
        },
        vocabFeedsLoadMoreButton
      };
    }
    case 'LOAD_MORE_AI_CHAT_FILES': {
      const isForMain = !action.topicId;
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            files: {
              ...state.channelsObj[action.channelId]?.files,
              [isForMain ? 'main' : action.topicId]: {
                ...state.channelsObj[action.channelId]?.files?.[
                  isForMain ? 'main' : action.topicId
                ],
                ids: action.files[
                  isForMain ? 'main' : action.topicId
                ].ids.concat(
                  state.channelsObj[action.channelId]?.files?.[
                    isForMain ? 'main' : action.topicId
                  ]?.ids || []
                ),
                hasMore:
                  action.files[isForMain ? 'main' : action.topicId].hasMore
              }
            },
            fileDataObj: {
              ...state.channelsObj[action.channelId]?.fileDataObj,
              ...action.fileDataObj
            }
          }
        }
      };
    }
    case 'LOAD_WORD_COLLECTORS':
      return {
        ...state,
        collectorRankings: action.collectorRankings
      };
    case 'NEW_TOPIC': {
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
              legacyTopicObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        homeChannelIds: [
          action.channelId,
          ...state.homeChannelIds.filter(
            (channelId: number) => channelId !== action.channelId
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
                topicObj: {
                  ...prevChannelObj?.topicObj,
                  [action.subject.subjectId]: {
                    ...(prevChannelObj?.topicObj?.[action.subject.subjectId] ||
                      action.subject),
                    messageIds: [action.subject.id].concat(
                      prevChannelObj?.topicObj?.[action.subject.subjectId]
                        ?.messageIds
                    )
                  }
                },
                messageIds: [action.subject.id].concat(
                  prevChannelObj?.messageIds
                ),
                messagesObj: {
                  ...prevChannelObj?.messagesObj,
                  [action.subject.id]: {
                    id: action.subject.id,
                    channelId: action.channelId,
                    ...action.subject
                  }
                },
                legacyTopicObj: action.subject
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
      return state.channelsObj[action.channelId]
        ? {
            ...state,
            channelsObj: {
              ...state.channelsObj,
              [action.channelId]: {
                ...state.channelsObj[action.channelId],
                allMemberIds: (
                  state.channelsObj[action.channelId]?.allMemberIds || []
                ).filter((memberId: number) => memberId !== action.userId),
                messageIds: [messageId].concat(
                  state.channelsObj[action.channelId].messageIds
                ),
                messagesObj: {
                  ...state.channelsObj[action.channelId].messagesObj,
                  [messageId]: {
                    id: messageId,
                    channelId: action.channelId,
                    content: leaveMessage,
                    timeStamp: timeStamp,
                    isNotification: true,
                    username: action.username,
                    userId: action.userId,
                    profilePicUrl: action.profilePicUrl
                  }
                },
                numUnreads: 0,
                members: (
                  state.channelsObj[action.channelId]?.members || []
                )?.filter(
                  (member: { id: number }) => member.id !== action.userId
                )
              }
            }
          }
        : state;
      // this will mean that if the channel where the user has left is not loaded in the left channel list initially, it will not appear in the list when user scrolls down and triggers "load more" event (because load more event only loads channels with older update time than the bottom item) and because this is new update. but is that really that bad? this channel will surface when user reloads the website anyway and user wasn't really interested in this channel to keep it bumped up in the first place.
    }
    case 'OPEN_NEW_TAB':
      return {
        ...state,
        chatType: null,
        subject: {},
        homeChannelIds: [
          0,
          ...state.homeChannelIds.filter((channelId: number) => channelId !== 0)
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
        recipientUsername: action.recipient.username,
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
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds: prevChannelObj?.subchannelObj?.[
                action.subchannelId
              ]?.messageIds.map((messageId: number) =>
                messageId === action.tempMessageId
                  ? action.messageId
                  : messageId
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
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
            topicObj: action.topicId
              ? {
                  ...prevChannelObj?.topicObj,
                  [action.topicId]: {
                    ...prevChannelObj?.topicObj?.[action.topicId],
                    messageIds: (
                      prevChannelObj?.topicObj?.[action.topicId]?.messageIds ||
                      []
                    ).map((messageId: number) =>
                      messageId === action.tempMessageId
                        ? action.messageId
                        : messageId
                    )
                  }
                }
              : prevChannelObj?.topicObj,
            messageIds: prevChannelObj?.messageIds?.map((messageId: number) =>
              messageId === action.tempMessageId ? action.messageId : messageId
            ),
            messagesObj: {
              ...prevChannelObj?.messagesObj,
              [action.messageId]: {
                ...prevChannelObj?.messagesObj?.[action.tempMessageId],
                ...(action.topicId
                  ? { targetSubject: prevChannelObj?.topicObj[action.topicId] }
                  : {})
              }
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
      const prevChannelObj = state.channelsObj[action.message.channelId] || {};
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
            [messageId]: { ...action.message, id: messageId, isLoaded: true }
          };
      const members = action.newMembers
        ? [
            ...(prevChannelObj?.members || []),
            ...action.newMembers.filter(
              (newMember: { id: number }) =>
                !(prevChannelObj?.members || [])
                  .map((member: { id: number }) => member.id)
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
                [messageId]: {
                  ...action.message,
                  id: messageId,
                  isLoaded: true
                }
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
            topicObj: {
              ...prevChannelObj?.topicObj,
              [action.message.subjectId]: {
                ...prevChannelObj?.topicObj?.[action.message.subjectId],
                messageIds: [messageId].concat(
                  prevChannelObj?.topicObj?.[action.message.subjectId]
                    ?.messageIds
                )
              }
            },
            allMemberIds: action.newMembers
              ? [
                  ...(prevChannelObj?.allMemberIds || []),
                  ...action.newMembers.map((m: { id: number }) => m.id)
                ]
              : prevChannelObj?.allMemberIds,
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
      const messageId = action.message.id ? action.message.id : uuidv1();
      return {
        ...state,
        numUnreads:
          action.isDuplicate && action.pageVisible
            ? state.numUnreads
            : Number(state.numUnreads) + 1,
        selectedChannelId: action.isDuplicate
          ? action.message.channelId
          : state.selectedChannelId,
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            id: action.message.channelId,
            messagesObj: {
              [messageId]: {
                id: messageId,
                ...action.message,
                isLoaded: true
              }
            },
            twoPeople: action.isTwoPeople,
            pathId: action.pathId,
            messageIds: [messageId],
            isClass: action.isClass,
            members: action.message.members,
            channelName: action.message.channelName || action.message.username,
            numUnreads: action.isDuplicate ? 0 : 1
          }
        },
        homeChannelIds: [action.message.channelId].concat(
          state.homeChannelIds.filter((_: number, index: number) =>
            action.isDuplicate ? index !== 0 : true
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
              ...prevChannelObj?.subchannelObj?.[subchannelId],
              numUnreads:
                Number(
                  prevChannelObj?.subchannelObj?.[subchannelId]?.numUnreads || 0
                ) + 1,
              messageIds: [messageId].concat(
                prevChannelObj?.subchannelObj?.[subchannelId]?.messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[subchannelId]?.messagesObj,
                [messageId]: {
                  ...action.message,
                  id: messageId,
                  isLoaded: true
                }
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
                      allMemberIds: (prevChannelObj?.allMemberIds || []).concat(
                        action.newMembers
                          .map((member: { id: number }) => member.id)
                          .filter(
                            (memberId: number) =>
                              !(prevChannelObj?.allMemberIds || []).includes(
                                memberId
                              )
                          )
                      ),
                      members: [
                        ...(prevChannelObj?.members || []),
                        ...action.newMembers.filter(
                          (newMember: { id: number }) =>
                            !(prevChannelObj?.members || [])
                              .map((member: { id: number }) => member.id)
                              .includes(newMember.id)
                        )
                      ]
                    }
                  : {}),
                topicObj: action.message.subjectId
                  ? {
                      ...prevChannelObj?.topicObj,
                      [action.message.subjectId]: {
                        ...prevChannelObj?.topicObj?.[action.message.subjectId],
                        messageIds: [messageId].concat(
                          prevChannelObj?.topicObj?.[action.message.subjectId]
                            ?.messageIds
                        )
                      }
                    }
                  : prevChannelObj?.topicObj,
                messageIds: [messageId].concat(
                  prevChannelObj?.messageIds || []
                ),
                messagesObj: {
                  ...prevChannelObj?.messagesObj,
                  [messageId]: {
                    ...action.message,
                    id: messageId,
                    isLoaded: true
                  }
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
                (channelId: number) => channelId !== action.channel.id
              )
            )
          : state.favoriteChannelIds,
        homeChannelIds: [action.channel.id].concat(
          state.homeChannelIds.filter(
            (channelId: number) => channelId !== action.channel.id
          )
        )
      };
    }
    case 'INSERT_BLACK_AI_CARD_UPDATE_LOG': {
      return {
        ...state,
        wordLogs: [
          {
            id: uuidv1(),
            message: action.message,
            timeStamp: Date.now(),
            isSummonMsg: true,
            isNew: true
          },
          ...state.wordLogs
        ]
      };
    }
    case 'RECEIVE_AI_CARD_SUMMON':
      return {
        ...state,
        cardObj: {
          ...state.cardObj,
          [action.card.id]: action.card
        },
        aiCardFeedIds: [action.feed.id].concat(state.aiCardFeedIds),
        aiCardFeedObj: {
          ...state.aiCardFeedObj,
          [action.feed.id]: {
            ...action.feed,
            isLoaded: true
          }
        }
      };
    case 'POST_VOCAB_FEED': {
      const newWordLog =
        action.feed.action !== 'reward' && action.isMyFeed
          ? {
              id: uuidv1(),
              word: action.feed.content,
              level: action.feed.wordLevel,
              xp: action.feed.xpReward,
              coins: action.feed.coinReward,
              action: action.feed.action,
              timeStamp: Date.now(),
              isNew: true
            }
          : null;

      const isNewYear = action.currentYear !== state.currentYear;
      const filteredVocabFeedIds = isNewYear
        ? state.vocabFeedIds.filter(
            (feedId: number) =>
              state.vocabFeedObj[feedId]?.year === action.currentYear
          )
        : state.vocabFeedIds;

      return {
        ...state,
        currentYear: action.currentYear,
        currentMonth: action.currentMonth,
        vocabFeedIds: [action.feed.id, ...filteredVocabFeedIds],
        vocabFeedObj: {
          ...state.vocabFeedObj,
          [action.feed.id]: {
            ...action.feed,
            isNewFeed: true
          }
        },
        wordsObj: {
          ...state.wordsObj,
          [action.feed.content]: {
            ...state.wordsObj[action.feed.content],
            ...action.feed
          }
        },
        wordLogs: newWordLog ? [newWordLog, ...state.wordLogs] : state.wordLogs,
        vocabFeedsLoadMoreButton: isNewYear
          ? false
          : state.vocabFeedsLoadMoreButton
      };
    }
    case 'REMOVE_NEW_LOG_STATE': {
      return {
        ...state,
        wordLogs: state.wordLogs.map((log: any) => ({
          ...log,
          isNew: action.logId === log.id ? false : log.isNew
        }))
      };
    }
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
              legacyTopicObj: action.subject
            }
          }
        : prevChannelObj?.subchannelObj;
      return {
        ...state,
        homeChannelIds: [
          action.channelId,
          ...state.homeChannelIds.filter(
            (channelId: number) => channelId !== action.channelId
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
                  prevChannelObj?.messageIds
                ),
                messagesObj: {
                  ...prevChannelObj?.messagesObj,
                  [action.message.id]: action.message
                },
                legacyTopicObj: action.subject
              }
        }
      };
    }
    case 'RESET_CHAT': {
      const newChatStatus: Record<string, any> = {};
      for (const key in state.chatStatus) {
        if (Number(key) !== Number(action.userId)) {
          newChatStatus[key] = state.chatStatus[key];
        }
      }
      return {
        ...initialChatState,
        currentYear: state.currentYear,
        currentMonth: state.currentMonth,
        aiCardFeedIds: state.aiCardFeedIds,
        aiCardFeedObj: state.aiCardFeedObj,
        vocabFeedIds: state.vocabFeedIds,
        vocabFeedObj: state.vocabFeedObj,
        chatStatus: newChatStatus,
        cardObj: state.cardObj
      };
    }
    case 'SEARCH':
      return {
        ...state,
        chatSearchResults: action.data
      };
    case 'SEARCH_MESSAGES': {
      const {
        channelId,
        topicId,
        messageIds: searchedMessageIds,
        loadMoreShown,
        messagesObj
      } = action;
      const prevChannelObj = state.channelsObj[channelId];

      const updatedChannel = {
        ...prevChannelObj,
        messagesObj: {
          ...prevChannelObj.messagesObj,
          ...messagesObj
        },
        ...(topicId
          ? {
              topicObj: {
                ...prevChannelObj.topicObj,
                [topicId]: {
                  ...prevChannelObj.topicObj[topicId],
                  searchedMessageIds,
                  searchedLoadMoreButtonShown: loadMoreShown
                }
              }
            }
          : {
              searchedMessageIds,
              searchedLoadMoreButton: loadMoreShown
            })
      };

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [channelId]: updatedChannel
        }
      };
    }
    case 'LOAD_MORE_SEARCHED_MESSAGES': {
      const { channelId, topicId, messageIds, loadMoreShown, messagesObj } =
        action;
      const prevChannelObj = state.channelsObj[channelId];

      const updatedChannel = {
        ...prevChannelObj,
        messagesObj: {
          ...prevChannelObj.messagesObj,
          ...messagesObj
        },
        ...(topicId
          ? {
              topicObj: {
                ...prevChannelObj.topicObj,
                [topicId]: {
                  ...prevChannelObj.topicObj[topicId],
                  searchedMessageIds: [
                    ...(prevChannelObj.topicObj[topicId].searchedMessageIds ||
                      []),
                    ...messageIds
                  ],
                  searchedLoadMoreButtonShown: loadMoreShown
                }
              }
            }
          : {
              searchedMessageIds: [
                ...(prevChannelObj.searchedMessageIds || []),
                ...messageIds
              ],
              searchedLoadMoreButton: loadMoreShown
            })
      };

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [channelId]: updatedChannel
        }
      };
    }
    case 'SEARCH_SUBJECTS':
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
    case 'SET_AI_CALL': {
      return {
        ...state,
        aiCallChannelId: action.channelId
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
    case 'SET_IS_SEARCH_ACTIVE': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const selectedTab = prevChannelObj.selectedTab;

      const updateSearchActive = (currentValue: boolean) => {
        if (action.isToggle) {
          return !currentValue;
        }
        return action.isActive;
      };

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            ...(selectedTab === 'all' || !selectedTab
              ? {
                  isSearchActive: updateSearchActive(
                    prevChannelObj.isSearchActive
                  )
                }
              : {}),
            topicObj: {
              ...prevChannelObj.topicObj,
              [prevChannelObj.selectedTopicId]: {
                ...prevChannelObj.topicObj?.[prevChannelObj.selectedTopicId],
                ...(selectedTab === 'topic'
                  ? {
                      isSearchActive: updateSearchActive(
                        prevChannelObj.topicObj?.[
                          prevChannelObj.selectedTopicId
                        ]?.isSearchActive
                      )
                    }
                  : {})
              }
            }
          }
        }
      };
    }
    case 'SET_TOPIC_SETTINGS_JSON':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                settings: {
                  ...state.channelsObj[action.channelId]?.topicObj?.[
                    action.topicId
                  ]?.settings,
                  ...action.newSettings
                }
              }
            }
          }
        }
      };
    case 'SET_CHANNEL_SETTINGS_JSON':
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            settings: {
              ...state.channelsObj[action.channelId]?.settings,
              ...action.newSettings
            }
          }
        }
      };
    case 'SET_VOCAB_LEADERBOARDS':
      return {
        ...state,
        collectorRankings: action.collectorRankings,
        monthlyVocabRankings: action.monthlyVocabRankings,
        yearlyVocabRankings: action.yearlyVocabRankings
      };
    case 'ADD_BOOKMARKED_MESSAGE': {
      const currentBookmarkedMessages =
        state.channelsObj[action.channelId]?.bookmarkedMessages || [];
      const currentBookmarks =
        state.channelsObj[action.channelId]?.settings?.bookmarks || [];
      const currentTopicObj =
        state.channelsObj[action.channelId]?.topicObj || {};

      const filteredBookmarkedMessages = currentBookmarkedMessages.filter(
        (bookmark: { id: number }) => bookmark.id !== action.message.id
      );
      const filteredBookmarks = currentBookmarks.filter(
        (bookmarkId: number) => bookmarkId !== action.message.id
      );

      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            topicObj: action.topicId
              ? {
                  ...currentTopicObj,
                  [action.topicId]: {
                    ...currentTopicObj[action.topicId],
                    bookmarkedMessages: [action.message].concat(
                      (
                        currentTopicObj[action.topicId]?.bookmarkedMessages ||
                        []
                      ).filter(
                        (bookmark: { id: number }) =>
                          bookmark.id !== action.message.id
                      )
                    ),
                    settings: {
                      ...currentTopicObj[action.topicId]?.settings,
                      bookmarks: [action.message.id].concat(
                        (
                          currentTopicObj[action.topicId]?.settings
                            ?.bookmarks || []
                        ).filter(
                          (bookmarkId: number) =>
                            bookmarkId !== action.message.id
                        )
                      )
                    }
                  }
                }
              : currentTopicObj,
            bookmarkedMessages: action.topicId
              ? currentBookmarkedMessages
              : [action.message].concat(filteredBookmarkedMessages),
            settings: {
              ...state.channelsObj[action.channelId]?.settings,
              bookmarks: action.topicId
                ? currentBookmarks
                : [action.message.id].concat(filteredBookmarks)
            }
          }
        }
      };
    }

    case 'REMOVE_BOOKMARKED_MESSAGE': {
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            topicObj: {
              ...state.channelsObj[action.channelId]?.topicObj,
              [action.topicId]: {
                ...state.channelsObj[action.channelId]?.topicObj?.[
                  action.topicId
                ],
                bookmarkedMessages: state.channelsObj[
                  action.channelId
                ]?.topicObj?.[action.topicId]?.bookmarkedMessages?.filter(
                  (bookmark: { id: number }) => bookmark.id !== action.messageId
                ),
                settings: {
                  ...state.channelsObj[action.channelId]?.topicObj?.[
                    action.topicId
                  ]?.settings,
                  bookmarks: state.channelsObj[action.channelId]?.topicObj?.[
                    action.topicId
                  ]?.settings?.bookmarks?.filter(
                    (bookmarkId: number) => bookmarkId !== action.messageId
                  )
                }
              }
            },
            bookmarkedMessages: state.channelsObj[
              action.channelId
            ]?.bookmarkedMessages?.filter(
              (bookmark: { id: number }) => bookmark.id !== action.messageId
            ),
            settings: {
              ...state.channelsObj[action.channelId]?.settings,
              bookmarks: state.channelsObj[
                action.channelId
              ]?.settings?.bookmarks?.filter(
                (bookmarkId: number) => bookmarkId !== action.messageId
              )
            }
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
    case 'SET_FAVORITE_CHANNEL': {
      const filteredFavChannelIds = state.favoriteChannelIds.filter(
        (channelId: number) => channelId !== action.channelId
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
    case 'SET_LOADING_AI_CARD_CHAT':
      return {
        ...state,
        loadingAICardChat: action.loading
      };
    case 'SET_MESSAGE_STATE': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const subchannelObj = prevChannelObj.subchannelObj || {};
      const newSubchannelObj: any = {};
      for (const key in subchannelObj) {
        newSubchannelObj[key] = {
          ...subchannelObj[key],
          messagesObj: {
            ...subchannelObj[key].messagesObj,
            [action.messageId]: {
              ...subchannelObj[key].messagesObj?.[action.messageId],
              ...action.newState,
              isLoaded: true
            }
          }
        };
      }
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...prevChannelObj,
            messagesObj: {
              ...prevChannelObj.messagesObj,
              [action.messageId]: {
                ...prevChannelObj.messagesObj?.[action.messageId],
                ...action.newState,
                isLoaded: true
              }
            },
            ...(prevChannelObj.subchannelObj
              ? { subchannelObj: newSubchannelObj }
              : {})
          }
        }
      };
    }
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
      for (const key in newChannelsObj) {
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
    case 'SET_SUBCHANNEL': {
      const newSubchannelObj = {
        ...state.channelsObj[action.channelId]?.subchannelObj,
        [action.subchannel.id]: action.subchannel
      };
      return {
        ...state,
        channelsObj: {
          ...state.channelsObj,
          [action.channelId]: {
            ...state.channelsObj[action.channelId],
            subchannelObj: newSubchannelObj
          }
        }
      };
    }
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
    case 'SET_IS_ZERO_CALL_AVAILABLE': {
      return {
        ...state,
        isZeroCallAvailable: action.isAvailable
      };
    }
    case 'SET_ZERO_CHANNEL_ID': {
      return {
        ...state,
        zeroChannelId: action.channelId
      };
    }
    case 'SET_VOCAB_ERROR_MESSAGE': {
      return {
        ...state,
        vocabErrorMessage: action.message
      };
    }
    case 'SET_VOCAB_LEADERBOARD_TAB': {
      return {
        ...state,
        vocabLeaderboardTab: action.tab
      };
    }
    case 'SET_VOCAB_LEADERBOARD_ALL_SELECTED': {
      return {
        ...state,
        vocabLeaderboardAllSelected: {
          ...state.vocabLeaderboardAllSelected,
          [action.tab]: action.selected
        }
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
              isLoaded: true,
              tempMessageId: action.messageId,
              content: action.message.content,
              targetMessage: action.replyTarget,
              ...(action.isRespondingToSubject
                ? {
                    targetSubject: {
                      ...prevChannelObj?.legacyTopicObj,
                      content:
                        prevChannelObj?.legacyTopicObj?.content ||
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
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              isRespondingToSubject: false,
              messageIds: [action.messageId].concat(
                prevChannelObj?.subchannelObj?.[action.subchannelId].messageIds
              ),
              messagesObj: {
                ...prevChannelObj?.subchannelObj?.[action.subchannelId]
                  .messagesObj,
                [action.messageId]: {
                  ...action.message,
                  isLoaded: true,
                  tempMessageId: action.messageId,
                  subchannelId: action.subchannelId,
                  content: action.message.content,
                  targetMessage: action.replyTarget,
                  ...(action.isRespondingToSubject
                    ? {
                        targetSubject: {
                          ...prevChannelObj?.subchannelObj?.[
                            action.subchannelId
                          ]?.legacyTopicObj,
                          content:
                            prevChannelObj?.subchannelObj?.[action.subchannelId]
                              ?.legacyTopicObj?.content || defaultChatSubject
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
                (channelId: number) => channelId !== action.message.channelId
              )
            ),
        channelsObj: {
          ...state.channelsObj,
          [action.message.channelId]: {
            ...prevChannelObj,
            topicObj: {
              ...prevChannelObj?.topicObj,
              [action.topicId]: {
                ...prevChannelObj?.topicObj?.[action.topicId],
                isSearchActive: false,
                messageIds: [action.messageId].concat(
                  prevChannelObj?.topicObj?.[action.topicId]?.messageIds || []
                )
              }
            },
            isSearchActive: false,
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
                    (_: number, index: number) => index <= 20
                  )
                : state.channelsObj[action.channelId]?.messageIds
          }
        }
      };
    case 'TRIM_SUBCHANNEL_MESSAGES': {
      const prevChannelObj = state.channelsObj[action.channelId] || {};
      const subchannelObj = action.subchannelId
        ? {
            ...prevChannelObj.subchannelObj,
            [action.subchannelId]: {
              ...prevChannelObj?.subchannelObj?.[action.subchannelId],
              messageIds:
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
                  ?.length > 20
                  ? prevChannelObj?.subchannelObj?.[
                      action.subchannelId
                    ]?.messageIds?.filter(
                      (_: number, index: number) => index <= 20
                    )
                  : prevChannelObj?.subchannelObj?.[action.subchannelId]
                      ?.messageIds,
              loadMoreButtonShown:
                prevChannelObj?.subchannelObj?.[action.subchannelId]?.messageIds
                  ?.length > 20
                  ? true
                  : prevChannelObj?.subchannelObj?.[action.subchannelId]
                      ?.loadMoreButtonShown
            }
          }
        : prevChannelObj?.subchannelObj;
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
          [targetId]: state.filesBeingUploaded[targetId]?.map(
            (file: { filePath: string }) =>
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
    case 'UPDATE_LATEST_PATH_ID': {
      return {
        ...state,
        latestPathId: action.pathId
      };
    }
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
    case 'UPDATE_MOST_RECENT_AI_CARD_OFFER_TIMESTAMP':
      return {
        ...state,
        mostRecentOfferTimeStamp: action.timeStamp
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
        chatType: null,
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
          (offer: { id: number }) => offer.id !== action.offerId
        )
      };
    }
    case 'SET_THINK_HARD_ZERO': {
      return {
        ...state,
        thinkHardZero: action.thinkHard
      };
    }
    case 'SET_THINK_HARD_CIEL': {
      return {
        ...state,
        thinkHardCiel: action.thinkHard
      };
    }
    default:
      return state;
  }
}
