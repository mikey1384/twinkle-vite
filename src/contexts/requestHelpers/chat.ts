import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import request from './axiosInstance';
import axios from 'axios';
import { attemptUpload, logForAdmin } from '~/helpers';

export default function chatRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async acceptInvitation(channelId: number) {
      try {
        const { data } = await request.post(
          `${URL}/chat/invitation/accept`,
          { channelId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async acceptTrade({
      channelId,
      transactionId
    }: {
      channelId: number;
      transactionId: number;
    }) {
      try {
        const {
          data: { isDisabled, disableReason, responsibleParty }
        } = await request.put(
          `${URL}/chat/trade/accept`,
          { channelId, transactionId },
          auth()
        );
        return { isDisabled, disableReason, responsibleParty };
      } catch (error) {
        return handleError(error);
      }
    },
    async burnAICard(cardId: number) {
      try {
        const {
          data: { newXp, newCoins }
        } = await request.delete(
          `${URL}/chat/aiCard/burn?cardId=${cardId}`,
          auth()
        );
        return { newXp, newCoins };
      } catch (error) {
        return handleError(error);
      }
    },
    async buyAICard(cardId: number) {
      try {
        const {
          data: { coins }
        } = await request.put(`${URL}/ai-card/buy`, { cardId }, auth());
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async buyChatSubject(channelId: number) {
      try {
        const {
          data: { coins, topic }
        } = await request.put(
          `${URL}/chat/chatSubject/buy`,
          {
            channelId
          },
          auth()
        );
        return {
          coins,
          topic
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async buyChatTheme({
      channelId,
      theme
    }: {
      channelId: number;
      theme: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/chat/theme/buy`,
          {
            channelId,
            theme
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async cancelAIMessage(AIMessageId: number) {
      try {
        await request.delete(
          `${URL}/chat/aiMessage?AIMessageId=${AIMessageId}`,
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async closeTransaction({
      transactionId,
      channelId,
      cancelReason
    }: {
      transactionId: number;
      channelId: number;
      cancelReason: string;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/chat/trade?transactionId=${transactionId}&channelId=${channelId}${
            cancelReason ? `&cancelReason=${cancelReason}` : ''
          }`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async changeChannelOwner({
      channelId,
      newOwner
    }: {
      channelId: number;
      newOwner: object;
    }) {
      try {
        const {
          data: { notificationMsg }
        } = await request.put(
          `${URL}/chat/owner`,
          { channelId, newOwner },
          auth()
        );
        return notificationMsg;
      } catch (error) {
        return handleError(error);
      }
    },
    async checkTransactionPossible(transactionId: number) {
      try {
        const {
          data: { disableReason, responsibleParty, isDisabled }
        } = await request.get(
          `${URL}/chat/trade/check?transactionId=${transactionId}`,
          auth()
        );
        return { disableReason, responsibleParty, isDisabled };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkChatAccessible(pathId: number) {
      try {
        const {
          data: { isAccessible, isPublic, channelId }
        } = await request.get(
          `${URL}/chat/check/accessible?pathId=${pathId}`,
          auth()
        );
        return { isAccessible, isPublic, channelId };
      } catch (error) {
        return handleError(error);
      }
    },
    async createNewChat({
      channelName,
      isClass,
      isClosed,
      selectedUsers = []
    }: {
      channelName: string;
      isClass: boolean;
      isClosed: boolean;
      selectedUsers?: number[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/chat/channel`,
          { channelName, isClass, isClosed, selectedUsers },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async cancelChessRewind(channelId: number) {
      try {
        const {
          data: { messageId, cancelMessage, timeStamp }
        } = await request.put(
          `${URL}/chat/chess/rewind/cancel`,
          { channelId },
          auth()
        );
        return { messageId, cancelMessage, timeStamp };
      } catch (error) {
        return handleError(error);
      }
    },
    async declineChessRewind(channelId: number) {
      try {
        const {
          data: { messageId, declineMessage, timeStamp }
        } = await request.post(
          `${URL}/chat/chess/rewind/decline`,
          { channelId },
          auth()
        );
        return { messageId, declineMessage, timeStamp };
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteChatSubject(subjectId: number) {
      try {
        await request.delete(
          `${URL}/chat/chatSubject?subjectId=${subjectId}`,
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteChatMessage({
      messageId,
      isUndo
    }: {
      messageId: number;
      isUndo: boolean;
    }) {
      try {
        const {
          data: { success, isRecovered }
        } = await request.delete(
          `${URL}/chat/message?messageId=${messageId}${
            isUndo ? '&isUndo=1' : ''
          }`,
          auth()
        );
        return { success, isRecovered };
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteAIChatFile(fileId: number) {
      try {
        await request.delete(`${URL}/chat/file/ai?fileId=${fileId}`, auth());
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteTopic({
      topicId,
      channelId
    }: {
      topicId: number;
      channelId: number;
    }) {
      try {
        await request.delete(
          `${URL}/chat/topic?topicId=${topicId}&channelId=${channelId}`,
          auth()
        );
        return;
      } catch (error) {
        return handleError(error);
      }
    },
    async bookmarkAIMessage({
      messageId,
      channelId,
      topicId
    }: {
      messageId: number;
      channelId: number;
      topicId: number;
    }) {
      try {
        const data = await request.put(
          `${URL}/chat/ai/bookmark`,
          { messageId, channelId, topicId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async unBookmarkAIMessage({
      messageId,
      channelId,
      topicId
    }: {
      messageId: number;
      channelId: number;
      topicId?: number;
    }) {
      try {
        const data = await request.delete(
          `${URL}/chat/ai/bookmark?messageId=${messageId}&channelId=${channelId}${
            topicId ? `&topicId=${topicId}` : ''
          }`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async editTopic({
      channelId,
      topicId,
      topicText,
      isOwnerPostingOnly,
      isAIChat,
      customInstructions
    }: {
      channelId: number;
      topicId: number;
      topicText: string;
      isOwnerPostingOnly: boolean;
      isAIChat: boolean;
      customInstructions: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/chat/topic`,
          {
            channelId,
            topicId,
            topicText,
            isOwnerPostingOnly,
            isAIChat,
            customInstructions
          },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async editCanChangeTopic({
      channelId,
      canChangeTopic
    }: {
      channelId: number;
      canChangeTopic: boolean;
    }) {
      try {
        const {
          data: { message }
        } = await request.put(
          `${URL}/chat/canChangeTopic`,
          { channelId, canChangeTopic },
          auth()
        );
        return message;
      } catch (error) {
        return handleError(error);
      }
    },
    async editChannelSettings(params: object) {
      try {
        await request.put(`${URL}/chat/settings`, params, auth());
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async editChatMessage({
      editedMessage,
      messageId,
      isSubject,
      subjectId
    }: {
      editedMessage: string;
      messageId: number;
      isSubject: boolean;
      subjectId: number;
    }) {
      try {
        const {
          data: { subjectChanged }
        } = await request.put(
          `${URL}/chat/message`,
          { editedMessage, messageId, isSubject, subjectId },
          auth()
        );
        return subjectChanged;
      } catch (error) {
        return handleError(error);
      }
    },
    async editWord({
      deletedDefIds,
      editedDefinitionOrder,
      partOfSpeeches,
      word
    }: {
      deletedDefIds: number[];
      editedDefinitionOrder: any[];
      partOfSpeeches: any[];
      word: string;
    }) {
      try {
        const data = await request.put(
          `${URL}/chat/vocabulary/word`,
          { deletedDefIds, editedDefinitionOrder, partOfSpeeches, word },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async fetchCurrentChessState({
      channelId,
      recentChessMessage
    }: {
      channelId: number;
      recentChessMessage: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/chat/chess`,
          {
            channelId,
            recentChessMessage
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async fetchCurrentRewindRequest({
      channelId,
      rewindRequestId
    }: {
      channelId: number;
      rewindRequestId: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/chess/rewind?channelId=${channelId}&rewindRequestId=${rewindRequestId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async getCustomInstructionsForTopic(topicText: string) {
      try {
        const {
          data: { customInstructions }
        } = await request.get(
          `${URL}/chat/topic/customInstructions?topicText=${topicText}`,
          auth()
        );
        return customInstructions;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAIChatFiles({
      channelId,
      lastFileLastUsed
    }: {
      channelId: number;
      lastFileLastUsed: string | number;
    }) {
      try {
        const {
          data: { files, fileDataObj }
        } = await request.get(
          `${URL}/chat/file/ai?channelId=${channelId}${
            lastFileLastUsed ? `&lastFileLastUsed=${lastFileLastUsed}` : ''
          }`,
          auth()
        );
        return {
          files,
          fileDataObj
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async improveCustomInstructions({
      customInstructions,
      topicText
    }: {
      customInstructions: string;
      topicText: string;
    }) {
      try {
        const {
          data: { improvedInstructions }
        } = await request.post(
          `${URL}/chat/topic/customInstructions/improve`,
          { customInstructions, topicText },
          auth()
        );
        return improvedInstructions;
      } catch (error) {
        return handleError(error);
      }
    },
    async getAiImage({ prompt }: { prompt: string }) {
      try {
        const {
          data: { imageUrl, style, engine }
        } = await axios.get(
          `${URL}/chat/aiCard/image?prompt=${prompt}`,
          auth()
        );
        return { imageUrl, style, engine };
      } catch (error) {
        return handleError(error);
      }
    },
    async getOffersForCard({
      cardId,
      lastPrice
    }: {
      cardId: number;
      lastPrice?: number;
    }) {
      try {
        const {
          data: { offers, loadMoreShown }
        } = await request.get(
          `${URL}/chat/aiCard/offer/card?cardId=${cardId}${
            lastPrice ? `&lastPrice=${lastPrice}` : ''
          }`
        );
        return { offers, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async getOffersForCardByPrice({
      cardId,
      price,
      lastTimeStamp
    }: {
      cardId: number;
      price: number;
      lastTimeStamp?: number;
    }) {
      try {
        const {
          data: { offers, loadMoreShown }
        } = await request.get(
          `${URL}/chat/aiCard/offer/card/price?cardId=${cardId}&price=${price}${
            lastTimeStamp ? `&lastTimeStamp=${lastTimeStamp}` : ''
          }`,
          auth()
        );
        return { offers, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async getIncomingCardOffers(lastPrice: number) {
      try {
        const {
          data: { offers, loadMoreShown, recentAICardOfferCheckTimeStamp }
        } = await request.get(
          `${URL}/chat/aiCard/offer/incoming${
            typeof lastPrice === 'number' ? `?lastPrice=${lastPrice}` : ''
          }`,
          auth()
        );
        return {
          offers,
          loadMoreShown,
          recentAICardOfferCheckTimeStamp
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async getMyAICardOffers(lastId: number) {
      try {
        const {
          data: { offers, loadMoreShown }
        } = await request.get(
          `${URL}/chat/aiCard/offer/outgoing${
            lastId ? `?lastId=${lastId}` : ''
          }`,
          auth()
        );
        return { offers, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async getVocabRouletteResult({ word }: { word: string }) {
      try {
        const {
          data: { coins, message, outcome, partOfSpeechOrder, partOfSpeeches }
        } = await request.get(
          `${URL}/chat/vocabulary/bonus?word=${word}`,
          auth()
        );
        return { coins, message, outcome, partOfSpeechOrder, partOfSpeeches };
      } catch (error) {
        return handleError(error);
      }
    },
    async postAICardOffer({
      cardId,
      price
    }: {
      cardId: number;
      price: number;
    }) {
      try {
        const {
          data: { coins }
        } = await request.post(
          `${URL}/chat/aiCard/offer`,
          { cardId, price },
          auth()
        );
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteAICardOffer({
      cardId,
      offerId
    }: {
      cardId: number;
      offerId: number;
    }) {
      try {
        const {
          data: { coins }
        } = await request.delete(
          `${URL}/chat/aiCard/offer?offerId=${offerId}&cardId=${cardId}`,
          auth()
        );
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async generateAICard() {
      try {
        const { data } = await request.post(
          `${URL}/chat/aiCard/generate`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveAIImageToS3(imageUrl: string) {
      try {
        const {
          data: { imagePath }
        } = await request.post(`${URL}/chat/aiCard/s3`, { imageUrl }, auth());
        return imagePath;
      } catch (error) {
        return handleError(error);
      }
    },
    async postAICard({
      cardId,
      imagePath,
      style,
      engine,
      quality,
      level,
      word,
      prompt
    }: {
      cardId: number;
      imagePath: string;
      style: string;
      engine: string;
      quality: string;
      level: number;
      word: string;
      prompt: string;
    }) {
      try {
        const {
          data: { feed, card }
        } = await request.post(
          `${URL}/chat/aiCard`,
          { cardId, imagePath, engine, style, quality, level, word, prompt },
          auth()
        );
        return { feed, card };
      } catch (error) {
        return handleError(error);
      }
    },
    async getCurrentNextDayTimeStamp() {
      try {
        const {
          data: { nextDayTimeStamp }
        } = await request.get(`${URL}/chat/wordle/nextDayTimeStamp`);
        return nextDayTimeStamp;
      } catch (error) {
        return handleError(error);
      }
    },
    async getNumberOfUnreadMessages() {
      if (auth() === null) return 0;
      try {
        const {
          data: { numUnreads }
        } = await request.get(`${URL}/chat/numUnreads`, auth());
        return Number(numUnreads);
      } catch (error) {
        return handleError(error);
      }
    },
    async hideChatAttachment(messageId: number) {
      try {
        await request.put(`${URL}/chat/hide/attachment`, { messageId }, auth());
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async hideChat(channelId: number) {
      try {
        await request.put(`${URL}/chat/hide/chat`, { channelId }, auth());
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async inviteUsersToChannel(params: object) {
      try {
        const {
          data: { message }
        } = await request.post(`${URL}/chat/invite`, params, auth());
        return { ...params, message };
      } catch (error) {
        return handleError(error);
      }
    },
    async leaveChannel(channelId: number) {
      try {
        await request.delete(
          `${URL}/chat/channel?channelId=${channelId}`,
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async removeMemberFromChannel({
      channelId,
      memberId
    }: {
      channelId: number;
      memberId: number;
    }) {
      try {
        await request.delete(
          `${URL}/chat/channel/member?channelId=${channelId}&memberId=${memberId}`,
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async listAICard({ cardId, price }: { cardId: number; price: number }) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/ai-card/list`,
          { cardId, price },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async delistAICard(cardId: number) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/chat/aiCard/list?cardId=${cardId}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadChat({
      channelId,
      subchannelPath
    }: {
      channelId: number;
      subchannelPath: string;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat?channelId=${channelId}${
            subchannelPath ? `&subchannelPath=${subchannelPath}` : ''
          }`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadChatChannel({
      channelId,
      isForInvitation,
      subchannelPath,
      skipUpdateChannelId
    }: {
      channelId: number;
      isForInvitation?: boolean;
      subchannelPath?: string;
      skipUpdateChannelId?: boolean;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/channel?channelId=${channelId}${
            subchannelPath ? `&subchannelPath=${subchannelPath}` : ''
          }${skipUpdateChannelId ? '&skipUpdateChannelId=1' : ''}${
            isForInvitation ? '&isForInvitation=1' : ''
          }`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadChatMessage({ messageId }: { messageId: number }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/message?messageId=${messageId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAICardFeed({ feedId }: { feedId: number }) {
      try {
        const { data: feed } = await request.get(
          `${URL}/chat/aiCard/feed?feedId=${feedId}`,
          auth()
        );
        return feed;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAICardFeeds(lastId: number) {
      try {
        const {
          data: {
            cardFeeds,
            cardObj,
            loadMoreShown,
            mostRecentOfferTimeStamp,
            numCardSummonedToday
          }
        } = await request.get(
          `${URL}/chat/aiCard${lastId ? `?lastId=${lastId}` : ''}`,
          auth()
        );
        return {
          cardFeeds,
          cardObj,
          loadMoreShown,
          mostRecentOfferTimeStamp,
          numCardSummonedToday
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreBookmarks({
      channelId,
      topicId,
      lastBookmarkId
    }: {
      channelId: number;
      topicId?: number;
      lastBookmarkId: number;
    }) {
      try {
        const {
          data: { bookmarks, loadMoreShown }
        } = await request.get(
          `${URL}/chat/ai/bookmark/more?channelId=${channelId}&topicId=${topicId}&lastBookmarkId=${lastBookmarkId}`
        );
        return { bookmarks, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreChannelMembers({
      channelId,
      lastId
    }: {
      channelId: number;
      lastId: number;
    }) {
      try {
        const {
          data: { members, loadMoreShown }
        } = await request.get(
          `${URL}/chat/channel/members/more?channelId=${channelId}&lastId=${lastId}`
        );
        return { members, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadSubchannel({
      channelId,
      subchannelId
    }: {
      channelId: number;
      subchannelId: number;
    }) {
      try {
        const { data: subchannel } = await request.get(
          `${URL}/chat/channel/subchannel?channelId=${channelId}&subchannelId=${subchannelId}`,
          auth()
        );
        return subchannel;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPublicGroups({
      lastUpdated,
      limit
    }: {
      lastUpdated?: number;
      limit?: number;
    } = {}) {
      try {
        const queryParams = new URLSearchParams();
        if (lastUpdated)
          queryParams.append('lastUpdated', lastUpdated.toString());
        if (limit) queryParams.append('limit', limit.toString());

        const queryString = queryParams.toString();
        const url = `${URL}/chat/groups${queryString ? `?${queryString}` : ''}`;

        const {
          data: { results, loadMoreShown }
        } = await request.get(url);

        return {
          results,
          loadMoreShown
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGroupsForTrade({
      partnerId,
      lastId,
      type
    }: {
      partnerId: number;
      lastId?: number;
      type: 'want' | 'offer';
    }) {
      try {
        const queryParams = new URLSearchParams({
          partnerId: partnerId.toString(),
          type
        });
        if (lastId) queryParams.append('lastId', lastId.toString());

        const url = `${URL}/chat/trade/group?${queryParams.toString()}`;

        const {
          data: { results, loadMoreShown }
        } = await request.get(url, auth());

        return {
          results,
          loadMoreShown
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async searchGroups({ searchQuery }: { searchQuery: string }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/groups/search?queryString=${encodeURIComponent(
            searchQuery
          )}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchGroupsForTrade({
      partnerId,
      searchQuery,
      type,
      lastId
    }: {
      partnerId: number;
      searchQuery: string;
      type: 'want' | 'offer';
      lastId?: number;
    }) {
      try {
        const queryParams = new URLSearchParams({
          partnerId: partnerId.toString(),
          searchQuery,
          type
        });
        if (lastId) queryParams.append('lastId', lastId.toString());

        const url = `${URL}/chat/trade/group/search?${queryParams.toString()}`;

        const {
          data: { results, loadMoreShown }
        } = await request.get(url, auth());

        return {
          results,
          loadMoreShown
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadTopicMessages({
      channelId,
      topicId,
      lastMessageId,
      messageIdToScrollTo
    }: {
      channelId: number;
      topicId: number;
      lastMessageId: number;
      messageIdToScrollTo?: number;
    }) {
      try {
        const {
          data: { topicObj, messages, loadMoreShown, loadMoreShownAtBottom }
        } = await request.get(
          `${URL}/chat/topic/messages?channelId=${channelId}&topicId=${topicId}${
            lastMessageId ? `&lastMessageId=${lastMessageId}` : ''
          }${
            messageIdToScrollTo
              ? `&messageIdToScrollTo=${messageIdToScrollTo}`
              : ''
          }`,
          auth()
        );
        return { topicObj, messages, loadMoreShown, loadMoreShownAtBottom };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreRecentTopicMessages({
      channelId,
      topicId,
      lastMessageId
    }: {
      channelId: number;
      topicId: number;
      lastMessageId: number;
    }) {
      try {
        const {
          data: { messages, loadMoreShownAtBottom }
        } = await request.get(
          `${URL}/chat/topic/messages/more/recent?channelId=${channelId}&topicId=${topicId}&lastMessageId=${lastMessageId}`,
          auth()
        );
        return { messages, loadMoreShownAtBottom };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadChatSubject({
      channelId,
      subchannelId
    }: {
      channelId: number;
      subchannelId: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/chatSubject?channelId=${channelId}${
            subchannelId ? `&subchannelId=${subchannelId}` : ''
          }`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDMChannel({
      recipient,
      createIfNotExist
    }: {
      recipient: { id: number };
      createIfNotExist?: boolean;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/channel/check?partnerId=${recipient.id}${
            createIfNotExist ? '&createIfNotExist=1' : ''
          }`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreChannels({
      currentChannelId,
      lastId,
      lastUpdated,
      type
    }: {
      currentChannelId: number;
      lastId: number;
      lastUpdated: number;
      type: string;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/more/channels?type=${type}&currentChannelId=${currentChannelId}&lastUpdated=${lastUpdated}&lastId=${lastId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreChatMessages({
      userId,
      messageId,
      channelId,
      subchannelId
    }: {
      userId: number;
      messageId: number;
      channelId: number;
      subchannelId?: number;
    }) {
      try {
        const {
          data: { messageIds, messagesObj, loadedChannelId, loadedSubchannelId }
        } = await request.get(
          `${URL}/chat/more/messages?userId=${userId}&messageId=${messageId}&channelId=${channelId}${
            subchannelId ? `&subchannelId=${subchannelId}` : ''
          }`,
          auth()
        );
        return {
          messageIds,
          messagesObj,
          loadedChannelId,
          loadedSubchannelId
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadChatSubjects({ channelId }: { channelId: number }) {
      try {
        const {
          data: { mySubjects, allSubjects }
        } = await request.get(
          `${URL}/chat/chatSubject/modal?channelId=${channelId}`,
          auth()
        );
        return { mySubjects, allSubjects };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreChatSubjects({
      channelId,
      mineOnly,
      lastSubject
    }: {
      channelId: number;
      mineOnly: boolean;
      lastSubject: { id: number; timeStamp: number; reloadTimeStamp: number };
    }) {
      try {
        const {
          data: { subjects, loadMoreButton }
        } = await request.get(
          `${URL}/chat/chatSubject/modal/more?channelId=${channelId}&lastTimeStamp=${
            lastSubject.reloadTimeStamp || lastSubject.timeStamp
          }&lastId=${lastSubject.id}${mineOnly ? `&mineOnly=1` : ''}`,
          auth()
        );
        return { subjects, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadListedAICards({
      lastPrice,
      lastId
    }: {
      lastPrice?: number;
      lastId?: number;
    } = {}) {
      try {
        let url = `${URL}/chat/aiCard/listed`;
        if (lastPrice && lastId) {
          url += `?lastPrice=${lastPrice}&lastId=${lastId}`;
        }
        const {
          data: { cards, loadMoreShown }
        } = await request.get(url, auth());
        return { cards, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyListedAICards(lastId: number) {
      try {
        const {
          data: { cards, loadMoreShown }
        } = await request.get(
          `${URL}/chat/aiCard/listed/my${lastId ? `?lastId=${lastId}` : ''}`,
          auth()
        );
        return { cards, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyAICardCollections(
      {
        lastTimeStamp,
        lastId
      }: {
        lastTimeStamp: number;
        lastId: number;
      } = { lastTimeStamp: 0, lastId: 0 }
    ) {
      try {
        const {
          data: { cards, loadMoreShown }
        } = await request.get(
          `${URL}/chat/aiCard/myCollections${
            lastTimeStamp
              ? `?lastTimeStamp=${lastTimeStamp}&lastId=${lastId}`
              : ''
          }`,
          auth()
        );
        return {
          myCards: cards,
          myCardsLoadMoreShown: loadMoreShown
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAICard(cardId: number) {
      try {
        const {
          data: { card, prevCardId, nextCardId }
        } = await request.get(
          `${URL}/chat/aiCard/card?cardId=${cardId}`,
          auth()
        );
        return { card, prevCardId, nextCardId };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPendingTransaction(channelId: number) {
      try {
        const {
          data: { transaction }
        } = await request.get(
          `${URL}/chat/trade?channelId=${channelId}`,
          auth()
        );
        return { transaction };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadVocabularyFeeds(lastFeedId: number) {
      try {
        const {
          data: {
            vocabFeeds,
            wordsObj,
            collectorRankings,
            monthlyVocabRankings,
            yearlyVocabRankings,
            currentMonth,
            currentYear
          }
        } = await request.get(
          `${URL}/chat/vocabulary${
            lastFeedId ? `?lastFeedId=${lastFeedId}` : ''
          }`,
          auth()
        );
        return {
          vocabFeeds,
          wordsObj,
          collectorRankings,
          monthlyVocabRankings,
          yearlyVocabRankings,
          currentMonth,
          currentYear
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadVocabularyLeaderboards() {
      try {
        const {
          data: { collectorRankings, monthlyVocabRankings, yearlyVocabRankings }
        } = await request.get(`${URL}/chat/vocabulary/leaderboards`, auth());
        return {
          collectorRankings,
          monthlyVocabRankings,
          yearlyVocabRankings
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWordle(channelId: number) {
      try {
        const {
          data: { wordleSolution, wordleWordLevel, nextDayTimeStamp }
        } = await request.get(
          `${URL}/chat/wordle?channelId=${channelId}`,
          auth()
        );
        return {
          wordleSolution,
          wordleWordLevel,
          nextDayTimeStamp
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWordleRankings(channelId: number) {
      try {
        const {
          data: { all, top30s, myRank }
        } = await request.get(
          `${URL}/chat/wordle/leaderBoard?channelId=${channelId}`,
          auth()
        );
        return {
          all,
          top30s,
          myRank
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWordleStreaks(channelId: number) {
      try {
        const {
          data: { bestStreaks, bestStreakObj }
        } = await request.get(
          `${URL}/chat/wordle/leaderBoard/streak?channelId=${channelId}`,
          auth()
        );
        return { bestStreaks, bestStreakObj };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWordleDoubleStreaks(channelId: number) {
      try {
        const {
          data: { bestStreaks, bestStreakObj }
        } = await request.get(
          `${URL}/chat/wordle/leaderBoard/streak/double?channelId=${channelId}`,
          auth()
        );
        return { bestStreaks, bestStreakObj };
      } catch (error) {
        return handleError(error);
      }
    },
    async reloadChatSubject({
      subjectId,
      subchannelId,
      channelId
    }: {
      subjectId: number;
      subchannelId: number;
      channelId: number;
    }) {
      try {
        const {
          data: { subject, message }
        } = await request.put(
          `${URL}/chat/chatSubject/reload`,
          { channelId, subchannelId, subjectId },
          auth()
        );
        return { subject, message };
      } catch (error) {
        return handleError(error);
      }
    },
    async lookUpWord(word: string) {
      try {
        const { data } = await request.get(
          `${URL}/chat/vocabulary/word?word=${word}`,
          {
            ...auth(),
            timeout: 10000
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async pinChatTopic({
      channelId,
      topicId
    }: {
      channelId: number;
      topicId: number;
    }) {
      try {
        const { data: pinnedTopicIds } = await request.put(
          `${URL}/chat/topic/pin`,
          { channelId, topicId },
          auth()
        );
        return pinnedTopicIds;
      } catch (error) {
        return handleError(error);
      }
    },
    async postChatReaction({
      messageId,
      reaction
    }: {
      messageId: number;
      reaction: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/chat/reaction`,
          { messageId, reaction },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async postTradeRequest({
      type,
      wanted,
      offered,
      targetId
    }: {
      type: string;
      wanted: {
        coins: number;
        cardIds: number[];
        groupIds: number[];
      };
      offered: {
        coins: number;
        cardIds: number[];
        groupIds: number[];
      };
      targetId: number;
    }) {
      try {
        const {
          data: { isNewChannel, newChannelId, pathId }
        } = await request.post(
          `${URL}/chat/trade`,
          { type, wanted, offered, targetId },
          auth()
        );
        return {
          isNewChannel,
          newChannelId,
          pathId
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async putFavoriteChannel(channelId: number) {
      try {
        const {
          data: { favorited }
        } = await request.put(
          `${URL}/chat/channel/favorite`,
          { channelId },
          auth()
        );
        return favorited;
      } catch (error) {
        return handleError(error);
      }
    },
    async removeChatReaction({
      messageId,
      reaction
    }: {
      messageId: number;
      reaction: string;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/chat/reaction?messageId=${messageId}&reaction=${reaction}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async rewindChessMove({
      channelId,
      chessState
    }: {
      channelId: number;
      chessState: string;
    }) {
      try {
        await request.post(
          `${URL}/chat/chess/rewind`,
          { channelId, chessState },
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async collectVocabulary(wordObject: any) {
      try {
        const { data } = await request.post(
          `${URL}/chat/vocabulary/word`,
          wordObject,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveChatMessage({
      message,
      targetMessageId,
      targetSubject,
      isCielChat,
      isZeroChat,
      aiThinkingLevel
    }: {
      message: string;
      targetMessageId: number;
      targetSubject: string;
      isCielChat: boolean;
      isZeroChat: boolean;
      aiThinkingLevel: number;
    }) {
      try {
        const {
          data: { messageId, timeStamp, netCoins }
        } = await request.post(
          `${URL}/chat`,
          {
            message,
            targetMessageId,
            targetSubject,
            isCielChat,
            isZeroChat,
            aiThinkingLevel
          },
          auth()
        );
        return { messageId, timeStamp, netCoins };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkIfDuplicateWordleAttempt({
      channelId,
      numGuesses,
      solution
    }: {
      channelId: number;
      numGuesses: number;
      solution: string;
    }) {
      try {
        const {
          data: { isDuplicate, actualSolution, actualWordLevel, needsReload }
        } = await request.get(
          `${URL}/chat/wordle/attempt/duplicate?channelId=${channelId}&numGuesses=${numGuesses}&solution=${solution}`,
          auth()
        );
        return {
          isDuplicate,
          actualSolution,
          actualWordLevel,
          needsReload
        };
      } catch (error) {
        handleError(error);
        return true;
      }
    },
    async updateWordleAttempt({
      channelName,
      channelId,
      guesses,
      solution,
      isSolved
    }: {
      channelName: string;
      channelId: number;
      guesses: string[];
      solution: string;
      isSolved: boolean;
    }) {
      try {
        const {
          data: { wordleAttemptState, wordleStats }
        } = await request.put(
          `${URL}/chat/wordle/attempt`,
          { channelName, channelId, guesses, solution, isSolved },
          auth()
        );
        return {
          wordleAttemptState,
          wordleStats
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async searchChat(text: string) {
      try {
        const { data } = await request.get(
          `${URL}/chat/search/chat?text=${text}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchChatMessages({
      channelId,
      topicId,
      text,
      lastId
    }: {
      channelId: number;
      topicId?: number;
      text: string;
      lastId?: number;
    }) {
      try {
        const {
          data: { searchText, messageIds, messagesObj, loadMoreButton }
        } = await request.get(
          `${URL}/chat/search/message?channelId=${channelId}&searchText=${text}${
            topicId ? `&topicId=${topicId}` : ''
          }${lastId ? `&lastId=${lastId}` : ''}`,
          auth()
        );
        return { searchText, messageIds, messagesObj, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async searchChatSubject({
      text,
      channelId
    }: {
      text: string;
      channelId: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/search/subject?text=${text}&channelId=${channelId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchUserToInvite({
      channelId,
      searchText
    }: {
      channelId: number;
      searchText: string;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/search/users?text=${searchText}&channelId=${channelId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async sellAICard({
      offerId,
      cardId,
      price,
      offererId
    }: {
      offerId: number;
      cardId: number;
      price: number;
      offererId: number;
    }) {
      try {
        const {
          data: { coins }
        } = await request.put(
          `${URL}/ai-card/sell`,
          { offerId, cardId, price, offererId },
          auth()
        );
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendInvitationMessage({
      origin,
      recipients
    }: {
      origin: string | number;
      recipients: number[];
    }) {
      try {
        const {
          data: { invitationMessage, channels, messages }
        } = await request.post(
          `${URL}/chat/invitation`,
          { origin, recipients },
          auth()
        );
        return { invitationMessage, channels, messages };
      } catch (error) {
        return handleError(error);
      }
    },
    async setChessMoveViewTimeStamp({
      channelId,
      message
    }: {
      channelId: number;
      message: string;
    }) {
      try {
        await request.put(
          `${URL}/chat/chess/timeStamp`,
          { channelId, message },
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async startNewDMChannel(params: object) {
      try {
        const {
          data: { alreadyExists, channel, message, pathId }
        } = await request.post(`${URL}/chat/channel/twoPeople`, params, auth());
        return { alreadyExists, channel, message, pathId };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateLastChannelId(channelId: number) {
      try {
        await request.put(`${URL}/chat/lastChannelId`, { channelId }, auth());
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateChatLastRead(channelId: number) {
      if (channelId < 0) return { success: false };
      try {
        await request.post(`${URL}/chat/lastRead`, { channelId }, auth());
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateSubchannelLastRead(subchannelId: number) {
      try {
        await request.post(
          `${URL}/chat/lastRead/subchannel`,
          { subchannelId },
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadChatTopic({
      channelId,
      content,
      subchannelId,
      isFeatured = true
    }: {
      channelId: number;
      content: string;
      subchannelId: number;
      isFeatured: boolean;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/chat/chatSubject`,
          { channelId, content, subchannelId, isFeatured },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateFeaturedTopic({
      channelId,
      topicId
    }: {
      channelId: number;
      topicId: number;
    }) {
      try {
        const {
          data: { isSuccess }
        } = await request.put(
          `${URL}/chat/topic/featured`,
          { channelId, topicId },
          auth()
        );
        return isSuccess;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateLastTopicId({
      channelId,
      topicId
    }: {
      channelId: number;
      topicId: number;
    }) {
      try {
        await request.put(
          `${URL}/chat/topic/lastTopicId`,
          { channelId, topicId },
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadFileOnChat({
      fileName,
      selectedFile,
      onUploadProgress,
      path
    }: {
      fileName: string;
      selectedFile: File;
      onUploadProgress: (progressEvent: any) => void;
      path: string;
    }) {
      try {
        logForAdmin({
          message: `Uploading file ${fileName} to chat`
        });
        await attemptUpload({
          fileName,
          selectedFile,
          onUploadProgress,
          path,
          context: 'chat',
          auth
        });
        return;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveChatMessageWithFileAttachment({
      aiThinkingLevel,
      channelId,
      chessState,
      content,
      fileName,
      fileSize,
      path,
      recipientId,
      targetMessageId,
      subchannelId,
      topicId,
      thumbUrl,
      isCielChat,
      isZeroChat
    }: {
      aiThinkingLevel: number;
      channelId: number;
      chessState: object;
      content: string;
      fileName: string;
      fileSize: number;
      path: string;
      recipientId: number;
      targetMessageId: number;
      subchannelId: number;
      topicId: number;
      thumbUrl: string;
      isCielChat: boolean;
      isZeroChat: boolean;
    }) {
      const {
        data: { channel, message, messageId, alreadyExists, netCoins }
      } = await request.post(
        `${URL}/chat/file`,
        {
          aiThinkingLevel,
          fileName,
          fileSize,
          path,
          channelId,
          content,
          chessState,
          recipientId,
          targetMessageId,
          subchannelId,
          topicId,
          thumbUrl,
          isCielChat,
          isZeroChat
        },
        auth()
      );
      return {
        channel,
        message,
        messageId,
        alreadyExists,
        fileName,
        netCoins
      };
    }
  };
}
