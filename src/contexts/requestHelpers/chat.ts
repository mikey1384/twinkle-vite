import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

async function handleFetchRequest(url: string, options: any = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export default function chatRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  const getAuthHeader = () => {
    const authData = auth();
    return authData?.headers || {};
  };

  return {
    async acceptInvitation(channelId: number) {
      try {
        const data = await handleFetchRequest(`${URL}/chat/invitation/accept`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId })
        });
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
        const { isDisabled, disableReason, responsibleParty } =
          await handleFetchRequest(`${URL}/chat/trade/accept`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId, transactionId })
          });
        return { isDisabled, disableReason, responsibleParty };
      } catch (error) {
        return handleError(error);
      }
    },
    async burnAICard(cardId: number) {
      try {
        const { newXp, newCoins } = await handleFetchRequest(
          `${URL}/chat/aiCard/burn?cardId=${cardId}`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
        );
        return { newXp, newCoins };
      } catch (error) {
        return handleError(error);
      }
    },
    async buyAICard(cardId: number) {
      try {
        const { coins } = await handleFetchRequest(`${URL}/ai-card/buy`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ cardId })
        });
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async buyChatSubject(channelId: number) {
      try {
        const { coins, topic } = await handleFetchRequest(
          `${URL}/chat/chatSubject/buy`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId })
          }
        );
        return { coins, topic };
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
        const data = await handleFetchRequest(`${URL}/chat/theme/buy`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId, theme })
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async cancelAIMessage(AIMessageId: number) {
      try {
        await handleFetchRequest(
          `${URL}/chat/aiMessage?AIMessageId=${AIMessageId}`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
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
        const data = await handleFetchRequest(
          `${URL}/chat/trade?transactionId=${transactionId}&channelId=${channelId}${
            cancelReason ? `&cancelReason=${cancelReason}` : ''
          }`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
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
        const { notificationMsg } = await handleFetchRequest(
          `${URL}/chat/owner`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId, newOwner })
          }
        );
        return notificationMsg;
      } catch (error) {
        return handleError(error);
      }
    },
    async checkTransactionPossible(transactionId: number) {
      try {
        const { disableReason, responsibleParty, isDisabled } =
          await handleFetchRequest(
            `${URL}/chat/trade/check?transactionId=${transactionId}`,
            {
              headers: getAuthHeader()
            }
          );
        return { disableReason, responsibleParty, isDisabled };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkChatAccessible(pathId: number) {
      try {
        const { isAccessible, isPublic } = await handleFetchRequest(
          `${URL}/chat/check/accessible?pathId=${pathId}`,
          {
            headers: getAuthHeader()
          }
        );
        return { isAccessible, isPublic };
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
        const data = await handleFetchRequest(`${URL}/chat/channel`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            channelName,
            isClass,
            isClosed,
            selectedUsers
          })
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async cancelChessRewind(channelId: number) {
      try {
        const { messageId, cancelMessage, timeStamp } =
          await handleFetchRequest(`${URL}/chat/chess/rewind/cancel`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId })
          });
        return { messageId, cancelMessage, timeStamp };
      } catch (error) {
        return handleError(error);
      }
    },
    async declineChessRewind(channelId: number) {
      try {
        const { messageId, declineMessage, timeStamp } =
          await handleFetchRequest(`${URL}/chat/chess/rewind/decline`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId })
          });
        return { messageId, declineMessage, timeStamp };
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteChatSubject(subjectId: number) {
      try {
        await handleFetchRequest(
          `${URL}/chat/chatSubject?subjectId=${subjectId}`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
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
        const { success, isRecovered } = await handleFetchRequest(
          `${URL}/chat/message?messageId=${messageId}${
            isUndo ? '&isUndo=1' : ''
          }`,
          {
            headers: getAuthHeader()
          }
        );
        return { success, isRecovered };
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
        await handleFetchRequest(
          `${URL}/chat/topic?topicId=${topicId}&channelId=${channelId}`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
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
        const data = await handleFetchRequest(`${URL}/chat/ai/bookmark`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ messageId, channelId, topicId })
        });
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
        const data = await handleFetchRequest(
          `${URL}/chat/ai/bookmark?messageId=${messageId}&channelId=${channelId}${
            topicId ? `&topicId=${topicId}` : ''
          }`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async editAIMemory({
      channelId,
      topicId,
      memory
    }: {
      channelId: number;
      topicId: number;
      memory: string;
    }) {
      try {
        const data = await handleFetchRequest(`${URL}/chat/ai/memory`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId, topicId, memory })
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async editAIMemoryInstructions({
      channelId,
      topicId,
      instructions
    }: {
      channelId: number;
      topicId: number;
      instructions: string;
    }) {
      try {
        const data = await handleFetchRequest(
          `${URL}/chat/ai/memory/instruction`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId, topicId, instructions })
          }
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
        const { success } = await handleFetchRequest(`${URL}/chat/topic`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({
            channelId,
            topicId,
            topicText,
            isOwnerPostingOnly,
            isAIChat,
            customInstructions
          })
        });
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
        const { message } = await handleFetchRequest(
          `${URL}/chat/canChangeTopic`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId, canChangeTopic })
          }
        );
        return message;
      } catch (error) {
        return handleError(error);
      }
    },
    async editChannelSettings(params: object) {
      try {
        await handleFetchRequest(`${URL}/chat/settings`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(params)
        });
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
        const { subjectChanged } = await handleFetchRequest(
          `${URL}/chat/message`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({
              editedMessage,
              messageId,
              isSubject,
              subjectId
            })
          }
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
        const data = await handleFetchRequest(`${URL}/chat/word`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({
            deletedDefIds,
            editedDefinitionOrder,
            partOfSpeeches,
            word
          })
        });
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
        const data = await handleFetchRequest(`${URL}/chat/chess`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId, recentChessMessage })
        });
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
        const data = await handleFetchRequest(
          `${URL}/chat/chess/rewind?channelId=${channelId}&rewindRequestId=${rewindRequestId}`,
          {
            headers: getAuthHeader()
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async getCustomInstructionsForTopic(topicText: string) {
      try {
        const { customInstructions } = await handleFetchRequest(
          `${URL}/chat/topic/customInstructions?topicText=${topicText}`,
          {
            headers: getAuthHeader()
          }
        );
        return customInstructions;
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
        const { improvedInstructions } = await handleFetchRequest(
          `${URL}/chat/topic/customInstructions/improve`,
          {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ customInstructions, topicText })
          }
        );
        return improvedInstructions;
      } catch (error) {
        return handleError(error);
      }
    },
    async getAiImage({ prompt }: { prompt: string }) {
      try {
        const { imageUrl, style, engine } = await handleFetchRequest(
          `${URL}/chat/aiCard/image?prompt=${prompt}`,
          {
            headers: getAuthHeader()
          }
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
        const { offers, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/aiCard/offer/card?cardId=${cardId}${
            lastPrice ? `&lastPrice=${lastPrice}` : ''
          }`,
          {
            headers: getAuthHeader()
          }
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
        const { offers, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/aiCard/offer/card/price?cardId=${cardId}&price=${price}${
            lastTimeStamp ? `&lastTimeStamp=${lastTimeStamp}` : ''
          }`,
          {
            headers: getAuthHeader()
          }
        );
        return { offers, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async getIncomingCardOffers(lastPrice: number) {
      try {
        const { offers, loadMoreShown, recentAICardOfferCheckTimeStamp } =
          await handleFetchRequest(
            `${URL}/chat/aiCard/offer/incoming${
              typeof lastPrice === 'number' ? `?lastPrice=${lastPrice}` : ''
            }`,
            {
              headers: getAuthHeader()
            }
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
        const { offers, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/aiCard/offer/outgoing${
            lastId ? `?lastId=${lastId}` : ''
          }`,
          {
            headers: getAuthHeader()
          }
        );
        return { offers, loadMoreShown };
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
        const { coins } = await handleFetchRequest(`${URL}/chat/aiCard/offer`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ cardId, price })
        });
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
        const { coins } = await handleFetchRequest(
          `${URL}/chat/aiCard/offer?offerId=${offerId}&cardId=${cardId}`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
        );
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async processAiCardQuality() {
      try {
        const {
          quality,
          isMaxReached,
          level,
          cardId,
          word,
          prompt,
          coins,
          numCardSummoned
        } = await handleFetchRequest(`${URL}/chat/aiCard/quality`, {
          headers: getAuthHeader()
        });
        return {
          quality,
          isMaxReached,
          level,
          cardId,
          word,
          prompt,
          coins,
          numCardSummoned
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async saveAIImageToS3(imageUrl: string) {
      try {
        const { imagePath } = await handleFetchRequest(
          `${URL}/chat/aiCard/s3`,
          {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ imageUrl })
          }
        );
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
        const { feed, card } = await handleFetchRequest(`${URL}/chat/aiCard`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            cardId,
            imagePath,
            engine,
            style,
            quality,
            level,
            word,
            prompt
          })
        });
        return { feed, card };
      } catch (error) {
        return handleError(error);
      }
    },
    async getCurrentNextDayTimeStamp() {
      try {
        const { nextDayTimeStamp } = await handleFetchRequest(
          `${URL}/chat/wordle/nextDayTimeStamp`,
          {
            headers: getAuthHeader()
          }
        );
        return nextDayTimeStamp;
      } catch (error) {
        return handleError(error);
      }
    },
    async getNumberOfUnreadMessages() {
      if (auth() === null) return 0;
      try {
        const { numUnreads } = await handleFetchRequest(
          `${URL}/chat/numUnreads`,
          {
            headers: getAuthHeader()
          }
        );
        return Number(numUnreads);
      } catch (error) {
        return handleError(error);
      }
    },
    async hideChatAttachment(messageId: number) {
      try {
        await handleFetchRequest(`${URL}/chat/hide/attachment`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ messageId })
        });
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async hideChat(channelId: number) {
      try {
        await handleFetchRequest(`${URL}/chat/hide/chat`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId })
        });
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async inviteUsersToChannel(params: object) {
      try {
        const { message } = await handleFetchRequest(`${URL}/chat/invite`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(params)
        });
        return { ...params, message };
      } catch (error) {
        return handleError(error);
      }
    },
    async leaveChannel(channelId: number) {
      try {
        await handleFetchRequest(`${URL}/chat/channel?channelId=${channelId}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async listAICard({ cardId, price }: { cardId: number; price: number }) {
      try {
        const { success } = await handleFetchRequest(`${URL}/ai-card/list`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ cardId, price })
        });
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async delistAICard(cardId: number) {
      try {
        const { success } = await handleFetchRequest(
          `${URL}/chat/aiCard/list?cardId=${cardId}`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
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
        const data = await handleFetchRequest(
          `${URL}/chat?channelId=${channelId}${
            subchannelPath ? `&subchannelPath=${subchannelPath}` : ''
          }`,
          {
            headers: getAuthHeader()
          }
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
        const data = await handleFetchRequest(
          `${URL}/chat/channel?channelId=${channelId}${
            subchannelPath ? `&subchannelPath=${subchannelPath}` : ''
          }${skipUpdateChannelId ? '&skipUpdateChannelId=1' : ''}${
            isForInvitation ? '&isForInvitation=1' : ''
          }`,
          {
            headers: getAuthHeader()
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadChatMessage({ messageId }: { messageId: number }) {
      try {
        const data = await handleFetchRequest(
          `${URL}/chat/message?messageId=${messageId}`,
          {
            headers: getAuthHeader()
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAICardFeed({ feedId }: { feedId: number }) {
      try {
        const feed = await handleFetchRequest(
          `${URL}/chat/aiCard/feed?feedId=${feedId}`,
          {
            headers: getAuthHeader()
          }
        );
        return feed;
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
        const { bookmarks, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/ai/bookmark/more?channelId=${channelId}&topicId=${topicId}&lastBookmarkId=${lastBookmarkId}`,
          {
            headers: getAuthHeader()
          }
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
        const { members, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/channel/members/more?channelId=${channelId}&lastId=${lastId}`,
          {
            headers: getAuthHeader()
          }
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
        const { subchannel } = await handleFetchRequest(
          `${URL}/chat/channel/subchannel?channelId=${channelId}&subchannelId=${subchannelId}`,
          {
            headers: getAuthHeader()
          }
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

        const { results, loadMoreShown } = await handleFetchRequest(url, {
          headers: getAuthHeader()
        });

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

        const { results, loadMoreShown } = await handleFetchRequest(url, {
          headers: getAuthHeader()
        });

        return {
          results,
          loadMoreShown
        };
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

        const { results, loadMoreShown } = await handleFetchRequest(url, {
          headers: getAuthHeader()
        });

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
      lastMessageId
    }: {
      channelId: number;
      topicId: number;
      lastMessageId: number;
    }) {
      try {
        const { topicObj, messages, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/topic/messages?channelId=${channelId}&topicId=${topicId}${
            lastMessageId ? `&lastMessageId=${lastMessageId}` : ''
          }`,
          {
            headers: getAuthHeader()
          }
        );
        return { topicObj, messages, loadMoreShown };
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
        const data = await handleFetchRequest(
          `${URL}/chat/chatSubject?channelId=${channelId}${
            subchannelId ? `&subchannelId=${subchannelId}` : ''
          }`,
          {
            headers: getAuthHeader()
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDMChannel({ recipient }: { recipient: { id: number } }) {
      try {
        const data = await handleFetchRequest(
          `${URL}/chat/channel/check?partnerId=${recipient.id}`,
          {
            headers: getAuthHeader()
          }
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
        const data = await handleFetchRequest(
          `${URL}/chat/more/channels?type=${type}&currentChannelId=${currentChannelId}&lastUpdated=${lastUpdated}&lastId=${lastId}`,
          {
            headers: getAuthHeader()
          }
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
        const { messageIds, messagesObj, loadedChannelId, loadedSubchannelId } =
          await handleFetchRequest(
            `${URL}/chat/more/messages?userId=${userId}&messageId=${messageId}&channelId=${channelId}${
              subchannelId ? `&subchannelId=${subchannelId}` : ''
            }`,
            {
              headers: getAuthHeader()
            }
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
        const { mySubjects, allSubjects } = await handleFetchRequest(
          `${URL}/chat/chatSubject/modal?channelId=${channelId}`,
          {
            headers: getAuthHeader()
          }
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
        const { subjects, loadMoreButton } = await handleFetchRequest(
          `${URL}/chat/chatSubject/modal/more?channelId=${channelId}&lastTimeStamp=${
            lastSubject.reloadTimeStamp || lastSubject.timeStamp
          }&lastId=${lastSubject.id}${mineOnly ? `&mineOnly=1` : ''}`,
          {
            headers: getAuthHeader()
          }
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
        const { cards, loadMoreShown } = await handleFetchRequest(url, {
          headers: getAuthHeader()
        });
        return { cards, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyListedAICards(lastId: number) {
      try {
        const { cards, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/aiCard/listed/my${lastId ? `?lastId=${lastId}` : ''}`,
          {
            headers: getAuthHeader()
          }
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
        const { cards, loadMoreShown } = await handleFetchRequest(
          `${URL}/chat/aiCard/myCollections${
            lastTimeStamp
              ? `?lastTimeStamp=${lastTimeStamp}&lastId=${lastId}`
              : ''
          }`,
          {
            headers: getAuthHeader()
          }
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
        const { card, prevCardId, nextCardId } = await handleFetchRequest(
          `${URL}/chat/aiCard/card?cardId=${cardId}`,
          {
            headers: getAuthHeader()
          }
        );
        return { card, prevCardId, nextCardId };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAICardFeeds(lastId: number) {
      try {
        const {
          cardFeeds,
          cardObj,
          loadMoreShown,
          mostRecentOfferTimeStamp,
          numCardSummonedToday
        } = await handleFetchRequest(
          `${URL}/chat/aiCard${lastId ? `?lastId=${lastId}` : ''}`,
          {
            headers: getAuthHeader()
          }
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
    async loadPendingTransaction(channelId: number) {
      try {
        const { transaction } = await handleFetchRequest(
          `${URL}/chat/trade?channelId=${channelId}`,
          {
            headers: getAuthHeader()
          }
        );
        return { transaction };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadVocabulary(lastWordId: number) {
      try {
        const data = await handleFetchRequest(
          `${URL}/chat/vocabulary${
            lastWordId ? `?lastWordId=${lastWordId}` : ''
          }`,
          {
            headers: getAuthHeader()
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWordle(channelId: number) {
      try {
        const { wordleSolution, wordleWordLevel, nextDayTimeStamp } =
          await handleFetchRequest(
            `${URL}/chat/wordle?channelId=${channelId}`,
            {
              headers: getAuthHeader()
            }
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
        const { all, top30s, myRank } = await handleFetchRequest(
          `${URL}/chat/wordle/leaderBoard?channelId=${channelId}`,
          {
            headers: getAuthHeader()
          }
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
        const { bestStreaks, bestStreakObj } = await handleFetchRequest(
          `${URL}/chat/wordle/leaderBoard/streak?channelId=${channelId}`,
          {
            headers: getAuthHeader()
          }
        );
        return { bestStreaks, bestStreakObj };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWordleDoubleStreaks(channelId: number) {
      try {
        const { bestStreaks, bestStreakObj } = await handleFetchRequest(
          `${URL}/chat/wordle/leaderBoard/streak/double?channelId=${channelId}`,
          {
            headers: getAuthHeader()
          }
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
        const { subject, message } = await handleFetchRequest(
          `${URL}/chat/chatSubject/reload`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId, subchannelId, subjectId })
          }
        );
        return { subject, message };
      } catch (error) {
        return handleError(error);
      }
    },
    async lookUpWord(word: string) {
      try {
        const data = await handleFetchRequest(`${URL}/chat/word?word=${word}`, {
          headers: getAuthHeader()
        });
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
        const { pinnedTopicIds } = await handleFetchRequest(
          `${URL}/chat/topic/pin`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId, topicId })
          }
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
        const data = await handleFetchRequest(`${URL}/chat/reaction`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ messageId, reaction })
        });
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
        const { isNewChannel, newChannelId, pathId } = await handleFetchRequest(
          `${URL}/chat/trade`,
          {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ type, wanted, offered, targetId })
          }
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
        const { favorited } = await handleFetchRequest(
          `${URL}/chat/channel/favorite`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId })
          }
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
        const data = await handleFetchRequest(
          `${URL}/chat/reaction?messageId=${messageId}&reaction=${reaction}`,
          {
            method: 'DELETE',
            headers: getAuthHeader()
          }
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
        await handleFetchRequest(`${URL}/chat/chess/rewind`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId, chessState })
        });
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async registerWord(definitions: string[]) {
      try {
        const data = await handleFetchRequest(`${URL}/chat/word`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ definitions })
        });
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
        const { messageId, timeStamp, netCoins } = await handleFetchRequest(
          `${URL}/chat`,
          {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
              message,
              targetMessageId,
              targetSubject,
              isCielChat,
              isZeroChat,
              aiThinkingLevel
            })
          }
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
        const { isDuplicate, actualSolution, actualWordLevel, needsReload } =
          await handleFetchRequest(
            `${URL}/chat/wordle/attempt/duplicate?channelId=${channelId}&numGuesses=${numGuesses}&solution=${solution}`,
            {
              headers: getAuthHeader()
            }
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
        const { wordleAttemptState, wordleStats } = await handleFetchRequest(
          `${URL}/chat/wordle/attempt`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({
              channelName,
              channelId,
              guesses,
              solution,
              isSolved
            })
          }
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
        const data = await handleFetchRequest(
          `${URL}/chat/search/chat?text=${text}`,
          {
            headers: getAuthHeader()
          }
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
        const { searchText, messageIds, messagesObj, loadMoreButton } =
          await handleFetchRequest(
            `${URL}/chat/search/message?channelId=${channelId}&searchText=${text}${
              topicId ? `&topicId=${topicId}` : ''
            }${lastId ? `&lastId=${lastId}` : ''}`,
            {
              headers: getAuthHeader()
            }
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
        const data = await handleFetchRequest(
          `${URL}/chat/search/subject?text=${text}&channelId=${channelId}`,
          {
            headers: getAuthHeader()
          }
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
        const data = await handleFetchRequest(
          `${URL}/chat/search/users?text=${searchText}&channelId=${channelId}`,
          {
            headers: getAuthHeader()
          }
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
        const { coins } = await handleFetchRequest(`${URL}/ai-card/sell`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ offerId, cardId, price, offererId })
        });
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
        const { invitationMessage, channels, messages } =
          await handleFetchRequest(`${URL}/chat/invitation`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ origin, recipients })
          });
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
        await handleFetchRequest(`${URL}/chat/chess/timeStamp`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId, message })
        });
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async startNewDMChannel(params: object) {
      try {
        const { alreadyExists, channel, message, pathId } =
          await handleFetchRequest(`${URL}/chat/channel/twoPeople`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(params)
          });
        return { alreadyExists, channel, message, pathId };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateLastChannelId(channelId: number) {
      try {
        await handleFetchRequest(`${URL}/chat/lastChannelId`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId })
        });
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateChatLastRead(channelId: number) {
      if (channelId < 0) return { success: false };
      try {
        await handleFetchRequest(`${URL}/chat/lastRead`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId })
        });
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateSubchannelLastRead(subchannelId: number) {
      try {
        await handleFetchRequest(`${URL}/chat/lastRead/subchannel`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ subchannelId })
        });
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
        const data = await handleFetchRequest(`${URL}/chat/chatSubject`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId, content, subchannelId, isFeatured })
        });
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
        const { isSuccess } = await handleFetchRequest(
          `${URL}/chat/topic/featured`,
          {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ channelId, topicId })
          }
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
        await handleFetchRequest(`${URL}/chat/topic/lastTopicId`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({ channelId, topicId })
        });
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
        const url = await handleFetchRequest(
          `${URL}/content/sign-s3?fileSize=${
            selectedFile.size
          }&fileName=${encodeURIComponent(fileName)}&path=${path}&context=chat`,
          {
            headers: getAuthHeader()
          }
        );

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = onUploadProgress;

        return new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(undefined);
            } else {
              reject(new Error('Upload failed'));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.open('PUT', url.signedRequest);
          xhr.setRequestHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`
          );
          xhr.send(selectedFile);
        });
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
      const { channel, message, messageId, alreadyExists, netCoins } =
        await handleFetchRequest(`${URL}/chat/file`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
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
          })
        });
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
