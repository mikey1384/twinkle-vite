import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

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
        return Promise.resolve(data);
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
          `${URL}/chat/transaction/accept`,
          { channelId, transactionId },
          auth()
        );
        return Promise.resolve({ isDisabled, disableReason, responsibleParty });
      } catch (error) {
        return handleError(error);
      }
    },
    async burnAICard(cardId: number) {
      try {
        const {
          data: { newXp }
        } = await request.delete(
          `${URL}/chat/aiCard/burn?cardId=${cardId}`,
          auth()
        );
        return Promise.resolve(newXp);
      } catch (error) {
        return handleError(error);
      }
    },
    async buyAICard(cardId: number) {
      try {
        const {
          data: { coins }
        } = await request.put(`${URL}/chat/aiCard/buy`, { cardId }, auth());
        return Promise.resolve(coins);
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
        return Promise.resolve({
          coins,
          topic
        });
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
        return Promise.resolve(data);
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
        return Promise.resolve();
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
          `${URL}/chat/transaction?transactionId=${transactionId}&channelId=${channelId}${
            cancelReason ? `&cancelReason=${cancelReason}` : ''
          }`,
          auth()
        );
        return Promise.resolve(data);
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
        return Promise.resolve(notificationMsg);
      } catch (error) {
        return handleError(error);
      }
    },
    async checkTransactionPossible(transactionId: number) {
      try {
        const {
          data: { disableReason, responsibleParty, isDisabled }
        } = await request.get(
          `${URL}/chat/transaction/check?transactionId=${transactionId}`,
          auth()
        );
        return Promise.resolve({ disableReason, responsibleParty, isDisabled });
      } catch (error) {
        return handleError(error);
      }
    },
    async checkChatAccessible(pathId: number) {
      try {
        const {
          data: { isAccessible, generalChatPathId }
        } = await request.get(
          `${URL}/chat/check/accessible?pathId=${pathId}`,
          auth()
        );
        return Promise.resolve({ isAccessible, generalChatPathId });
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
        return Promise.resolve(data);
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
        return Promise.resolve({ messageId, cancelMessage, timeStamp });
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
        return Promise.resolve({ messageId, declineMessage, timeStamp });
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
        return Promise.resolve();
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
        return Promise.resolve({ success, isRecovered });
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
        return Promise.resolve(message);
      } catch (error) {
        return handleError(error);
      }
    },
    async editChannelSettings(params: object) {
      try {
        await request.put(`${URL}/chat/settings`, params, auth());
        return Promise.resolve();
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
        return Promise.resolve(subjectChanged);
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
          `${URL}/chat/word`,
          { deletedDefIds, editedDefinitionOrder, partOfSpeeches, word },
          auth()
        );
        return Promise.resolve(data);
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
        return Promise.resolve(data);
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
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async getOpenAiImage({
      prompt,
      cardId
    }: {
      prompt: string;
      cardId: number;
    }) {
      try {
        const {
          data: { engine, imageUrl, style }
        } = await request.get(
          `${URL}/chat/openai/image?prompt=${prompt}&cardId=${cardId}`,
          auth()
        );
        return Promise.resolve({ engine, imageUrl, style });
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
        return Promise.resolve({ offers, loadMoreShown });
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
        return Promise.resolve({ offers, loadMoreShown });
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
        return Promise.resolve({
          offers,
          loadMoreShown,
          recentAICardOfferCheckTimeStamp
        });
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
        return Promise.resolve({ offers, loadMoreShown });
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
        return Promise.resolve(coins);
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
        return Promise.resolve(coins);
      } catch (error) {
        return handleError(error);
      }
    },
    async processAiCardQuality() {
      try {
        const {
          data: {
            quality,
            isMaxReached,
            level,
            cardId,
            word,
            prompt,
            coins,
            numCardSummoned
          }
        } = await request.get(`${URL}/chat/aiCard/quality`, auth());
        return Promise.resolve({
          quality,
          isMaxReached,
          level,
          cardId,
          word,
          prompt,
          coins,
          numCardSummoned
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async saveAIImageToS3(imageUrl: string) {
      try {
        const {
          data: { imagePath }
        } = await request.post(`${URL}/chat/aiCard/s3`, { imageUrl }, auth());
        return Promise.resolve(imagePath);
      } catch (error) {
        return handleError(error);
      }
    },
    async postAICard({
      cardId,
      engine,
      imagePath,
      style,
      quality,
      level,
      word,
      prompt
    }: {
      cardId: number;
      engine: string;
      imagePath: string;
      style: string;
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
          { cardId, engine, imagePath, style, quality, level, word, prompt },
          auth()
        );
        return Promise.resolve({ feed, card });
      } catch (error) {
        return handleError(error);
      }
    },
    async getCurrentNextDayTimeStamp() {
      try {
        const {
          data: { nextDayTimeStamp }
        } = await request.get(`${URL}/chat/wordle/nextDayTimeStamp`);
        return Promise.resolve(nextDayTimeStamp);
      } catch (error) {
        return handleError(error);
      }
    },
    async getNumberOfUnreadMessages() {
      if (auth() === null) return;
      try {
        const {
          data: { numUnreads }
        } = await request.get(`${URL}/chat/numUnreads`, auth());
        return Promise.resolve(Number(numUnreads));
      } catch (error) {
        return handleError(error);
      }
    },
    async hideChatAttachment(messageId: number) {
      try {
        await request.put(`${URL}/chat/hide/attachment`, { messageId }, auth());
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async hideChat(channelId: number) {
      try {
        await request.put(`${URL}/chat/hide/chat`, { channelId }, auth());
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async inviteUsersToChannel(params: object) {
      try {
        const {
          data: { message }
        } = await request.post(`${URL}/chat/invite`, params, auth());
        return Promise.resolve({ ...params, message });
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
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async listAICard({ cardId, price }: { cardId: number; price: number }) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/chat/aiCard/list`,
          { cardId, price },
          auth()
        );
        return Promise.resolve(success);
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
        return Promise.resolve(success);
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
        return Promise.resolve(data);
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
        return Promise.resolve(data);
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
          data: { members }
        } = await request.get(
          `${URL}/chat/channel/members/more?channelId=${channelId}&lastId=${lastId}`
        );
        return Promise.resolve({ members });
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
        return Promise.resolve(subchannel);
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
        const {
          data: { topicObj, messages, loadMoreShown }
        } = await request.get(
          `${URL}/chat/topic/messages?channelId=${channelId}&topicId=${topicId}${
            lastMessageId ? `&lastMessageId=${lastMessageId}` : ''
          }`,
          auth()
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
        const { data } = await request.get(
          `${URL}/chat/chatSubject?channelId=${channelId}${
            subchannelId ? `&subchannelId=${subchannelId}` : ''
          }`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDMChannel({ recipient }: { recipient: { id: number } }) {
      try {
        const { data } = await request.get(
          `${URL}/chat/channel/check?partnerId=${recipient.id}`,
          auth()
        );
        return Promise.resolve(data);
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
        return Promise.resolve(data);
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
        return Promise.resolve({
          messageIds,
          messagesObj,
          loadedChannelId,
          loadedSubchannelId
        });
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
        return Promise.resolve({ mySubjects, allSubjects });
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
        return Promise.resolve({ subjects, loadMoreButton });
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
        return Promise.resolve({ cards, loadMoreShown });
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
        return Promise.resolve({ cards, loadMoreShown });
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
        return Promise.resolve({
          myCards: cards,
          myCardsLoadMoreShown: loadMoreShown
        });
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
        return Promise.resolve({ card, prevCardId, nextCardId });
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
        return Promise.resolve({
          cardFeeds,
          cardObj,
          loadMoreShown,
          mostRecentOfferTimeStamp,
          numCardSummonedToday
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPendingTransaction(channelId: number) {
      try {
        const {
          data: { transaction }
        } = await request.get(
          `${URL}/chat/transaction?channelId=${channelId}`,
          auth()
        );
        return Promise.resolve({ transaction });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadVocabulary(lastWordId: number) {
      try {
        const { data } = await request.get(
          `${URL}/chat/vocabulary${
            lastWordId ? `?lastWordId=${lastWordId}` : ''
          }`,
          auth()
        );
        return Promise.resolve(data);
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
        return Promise.resolve({
          wordleSolution,
          wordleWordLevel,
          nextDayTimeStamp
        });
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
        return Promise.resolve({
          all,
          top30s,
          myRank
        });
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
        return Promise.resolve({ bestStreaks, bestStreakObj });
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
        return Promise.resolve({ bestStreaks, bestStreakObj });
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
        return Promise.resolve({ subject, message });
      } catch (error) {
        return handleError(error);
      }
    },
    async lookUpWord(word: string) {
      try {
        const { data } = await request.get(
          `${URL}/chat/word?word=${word}`,
          auth()
        );
        return Promise.resolve(data);
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
        return Promise.resolve(data);
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
      wanted: number;
      offered: number;
      targetId: number;
    }) {
      try {
        const {
          data: { isNewChannel, newChannelId, pathId }
        } = await request.post(
          `${URL}/chat/transaction`,
          { type, wanted, offered, targetId },
          auth()
        );
        return Promise.resolve({
          isNewChannel,
          newChannelId,
          pathId
        });
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
        return Promise.resolve(favorited);
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
        return Promise.resolve(data);
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
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async registerWord(definitions: string[]) {
      try {
        const { data } = await request.post(
          `${URL}/chat/word`,
          { definitions },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async saveChatMessage({
      message,
      targetMessageId,
      targetSubject,
      isCielChat,
      isZeroChat
    }: {
      message: string;
      targetMessageId: number;
      targetSubject: string;
      isCielChat: boolean;
      isZeroChat: boolean;
    }) {
      try {
        const {
          data: { messageId, timeStamp }
        } = await request.post(
          `${URL}/chat`,
          {
            message,
            targetMessageId,
            targetSubject,
            isCielChat,
            isZeroChat
          },
          auth()
        );
        return Promise.resolve({ messageId, timeStamp });
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
        return Promise.resolve({
          isDuplicate,
          actualSolution,
          actualWordLevel,
          needsReload
        });
      } catch (error) {
        handleError(error);
        return Promise.resolve(true);
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
        return Promise.resolve({
          wordleAttemptState,
          wordleStats
        });
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
        return Promise.resolve(data);
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
        return Promise.resolve(data);
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
        return Promise.resolve(data);
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
          `${URL}/chat/aicard/sell`,
          { offerId, cardId, price, offererId },
          auth()
        );
        return Promise.resolve(coins);
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
        return Promise.resolve({ invitationMessage, channels, messages });
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
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async startNewDMChannel(params: object) {
      try {
        const {
          data: { alreadyExists, channel, message, pathId }
        } = await request.post(`${URL}/chat/channel/twoPeople`, params, auth());
        return Promise.resolve({ alreadyExists, channel, message, pathId });
      } catch (error) {
        return handleError(error);
      }
    },
    async updateLastChannelId(channelId: number) {
      try {
        await request.put(`${URL}/chat/lastChannelId`, { channelId }, auth());
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async updateChatLastRead(channelId: number) {
      if (channelId < 0) return;
      try {
        await request.post(`${URL}/chat/lastRead`, { channelId }, auth());
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
        return Promise.resolve();
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
        return Promise.resolve(data);
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
        return Promise.resolve(isSuccess);
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
        return Promise.resolve();
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
        const { data: url } = await request.get(
          `${URL}/content/sign-s3?fileSize=${
            selectedFile.size
          }&fileName=${encodeURIComponent(fileName)}&path=${path}&context=chat`,
          auth()
        );
        await request.put(url.signedRequest, selectedFile, {
          onUploadProgress,
          headers: {
            'Content-Disposition': `attachment; filename="${fileName}"`
          }
        });
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async saveChatMessageWithFileAttachment({
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
      thumbUrl
    }: {
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
    }) {
      const {
        data: { channel, message, messageId, alreadyExists }
      } = await request.post(
        `${URL}/chat/file`,
        {
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
          thumbUrl
        },
        auth()
      );
      return Promise.resolve({
        channel,
        message,
        messageId,
        alreadyExists,
        fileName
      });
    }
  };
}
