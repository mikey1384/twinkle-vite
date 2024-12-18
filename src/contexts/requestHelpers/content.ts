import request from './axiosInstance';
import URL from '~/constants/URL';
import axios from 'axios';
import { RequestHelpers } from '~/types';
import { queryStringForArray, stringIsEmpty } from '~/helpers/stringHelpers';
import { attemptUpload } from '~/helpers';

export default function contentRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async addVideoToPlaylists({
      videoId,
      playlistIds
    }: {
      videoId: number | string;
      playlistIds: number[];
    }) {
      try {
        await request.post(
          `${URL}/playlist/videoToPlaylists`,
          { videoId, playlistIds },
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkDrafts({
      contentType,
      rootType,
      rootId
    }: {
      contentType: string;
      rootType?: string;
      rootId?: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/content/draft?type=${contentType}${
            rootType ? `&rootType=${rootType}` : ''
          }${rootId ? `&rootId=${rootId}` : ''}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveFileData({
      fileName,
      filePath,
      actualFileName,
      rootType
    }: {
      fileName: string;
      filePath: string;
      actualFileName: string;
      rootType: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/file`,
          {
            fileName,
            filePath,
            actualFileName,
            rootType
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveDraft({
      contentType,
      draftId,
      title,
      description,
      content,
      rootType,
      rootId,
      secretAnswer
    }: {
      contentType: string;
      draftId?: number;
      title: string;
      description: string;
      content: string;
      rootType?: string;
      rootId?: number;
      secretAnswer?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/draft`,
          {
            draftId,
            type: contentType,
            title,
            description,
            content,
            rootType,
            rootId,
            secretAnswer
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteDraft(draftId: number) {
      try {
        await request.delete(`${URL}/content/draft/${draftId}`, auth());
        return true;
      } catch (error) {
        return handleError(error);
      }
    },
    async addVideoView(params: object) {
      try {
        request.post(`${URL}/video/view`, params);
        return true;
      } catch (error) {
        return handleError(error);
      }
    },
    async checkContentUrl({
      url,
      videoCode,
      contentType
    }: {
      url: string;
      videoCode?: string;
      contentType: string;
    }) {
      try {
        const {
          data: { exists, content, ytDetails }
        } = await request.get(
          `${URL}/content/checkUrl?url=${encodeURIComponent(
            url
          )}&contentType=${contentType}${
            videoCode ? `&videoCode=${videoCode}` : ''
          }`
        );
        return {
          exists,
          content,
          ytDetails
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkIfHomeOutdated({
      lastInteraction,
      category,
      subFilter
    }: {
      lastInteraction: number;
      category: string;
      subFilter: string;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/content/outdated?lastInteraction=${lastInteraction}&category=${category}&subFilter=${subFilter}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async checkIfUserResponded(subjectId: number) {
      try {
        const {
          data: { responded }
        } = await request.get(
          `${URL}/content/checkResponded?subjectId=${subjectId}`,
          auth()
        );
        return { responded };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkNumGrammarGamesPlayedToday() {
      try {
        const {
          data: { attemptResults, attemptNumber, earnedCoins, nextDayTimeStamp }
        } = await request.get(
          `${URL}/content/game/grammar/gamesPlayedToday`,
          auth()
        );
        return {
          attemptResults,
          attemptNumber,
          earnedCoins,
          nextDayTimeStamp
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async closeContent({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      try {
        const {
          data: { isClosedBy, cannotChange, moderatorName }
        } = await request.put(
          `${URL}/content/close`,
          { contentId, contentType },
          auth()
        );
        return { isClosedBy, cannotChange, moderatorName };
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteContent({
      id,
      contentType,
      undo
    }: {
      id: number;
      contentType: string;
      undo?: boolean;
    }) {
      try {
        const {
          data: { success, isRecovered }
        } = await request.delete(
          `${URL}/content?contentId=${id}&contentType=${contentType}${
            undo ? '&undo=1' : ''
          }`,
          auth()
        );
        return {
          contentId: id,
          contentType,
          success,
          isRecovered
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async deletePlaylist(playlistId: number) {
      try {
        await request.delete(
          `${URL}/playlist?playlistId=${playlistId}`,
          auth()
        );
        return true;
      } catch (error) {
        return handleError(error);
      }
    },
    async editContent({
      contentId,
      editedComment,
      editedDescription,
      editedSecretAnswer,
      editedTitle,
      editedUrl,
      contentType
    }: {
      contentId: number;
      editedComment?: string;
      editedDescription?: string;
      editedSecretAnswer?: string;
      editedTitle?: string;
      editedUrl?: string;
      contentType: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/content`,
          {
            contentId,
            editedComment,
            editedDescription,
            editedSecretAnswer,
            editedTitle,
            editedUrl,
            contentType
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async editPlaylistTitle(params: object) {
      try {
        const {
          data: { title }
        } = await request.put(`${URL}/playlist/title`, params, auth());
        return title;
      } catch (error) {
        return handleError(error);
      }
    },
    async editPlaylistVideos({
      addedVideoIds,
      removedVideoIds,
      playlistId
    }: {
      addedVideoIds: number[];
      removedVideoIds: number[];
      playlistId: number;
    }) {
      try {
        const { data: playlist } = await request.put(
          `${URL}/playlist/videos`,
          { addedVideoIds, removedVideoIds, playlistId },
          auth()
        );
        return playlist;
      } catch (error) {
        return handleError(error);
      }
    },
    async fetchPlaylistsContaining({ videoId }: { videoId: number }) {
      try {
        const { data: playlists } = await request.get(
          `${URL}/playlist/containing?videoId=${videoId}`
        );
        return playlists;
      } catch (error) {
        return handleError(error);
      }
    },
    async fetchUrlEmbedData(url: string) {
      try {
        const { data } = await request.get(`${URL}/content/embed?url=${url}`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async finishWatchingVideo(videoId: number) {
      try {
        const { data } = await request.put(
          `${URL}/video/finish`,
          { videoId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async likeContent({
      id,
      contentType
    }: {
      id: number;
      contentType: string;
    }) {
      try {
        const {
          data: { likes }
        } = await request.post(
          `${URL}/content/like`,
          { id, contentType },
          auth()
        );
        return likes;
      } catch (error) {
        return handleError(error);
      }
    },
    async batchSellAICards({
      selectedCardIds,
      price,
      cardIdsToSellNow
    }: {
      selectedCardIds: number[];
      price: number;
      cardIdsToSellNow: number[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/ai-card/batchSell`,
          { selectedCardIds, price, cardIdsToSellNow },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAICards(lastInteraction: number, lastId: number) {
      try {
        const {
          data: { cards, loadMoreShown, numCards }
        } = await request.get(
          `${URL}/ai-card${
            lastInteraction ? `?lastInteraction=${lastInteraction}` : ''
          }${lastId ? `&lastId=${lastId}` : ''}`
        );
        return { cards, loadMoreShown, numCards };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFilteredAICards({
      lastInteraction,
      lastPrice,
      lastId,
      filters,
      limit,
      excludeMyCards
    }: {
      lastInteraction: number;
      lastPrice: number;
      lastId: number;
      limit: number;
      filters: { [key: string]: string };
      excludeMyCards: boolean;
    }) {
      try {
        const filterString = Object.keys(filters)
          .filter((key) => filters[key])
          .map((key) => `${key}=${filters[key]}`)
          .join('&');

        let urlString = `${URL}/ai-card/search?${filterString}`;

        if (filters.isBuyNow) {
          if (lastPrice && lastId) {
            urlString += `&lastPrice=${lastPrice}&lastId=${lastId}`;
          }
        } else if (lastInteraction) {
          urlString += `&lastInteraction=${lastInteraction}&lastId=${lastId}`;
        }
        if (excludeMyCards) {
          urlString += '&excludeMyCards=true';
        }

        const {
          data: { cards, loadMoreShown, numCards, totalBv }
        } = await request.get(
          `${urlString}${limit ? `&limit=${limit}` : ''}`,
          auth()
        );

        return { cards, loadMoreShown, numCards, totalBv };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadComments({
      contentId,
      contentType,
      lastCommentId,
      limit,
      isRepliesOfReply,
      isPreview
    }: {
      contentId: number;
      contentType: string;
      lastCommentId?: number;
      limit?: number;
      isRepliesOfReply?: boolean;
      isPreview?: boolean;
    }) {
      try {
        const {
          data: { comments, loadMoreButton }
        } = await request.get(
          `${URL}/content/comments?contentId=${contentId}&contentType=${contentType}${
            lastCommentId ? `&lastCommentId=${lastCommentId}` : ''
          }${isPreview ? '&isPreview=1' : ''}${
            isRepliesOfReply ? '&isRepliesOfReply=1' : ''
          }${limit ? `&limit=${limit}` : ''}`
        );
        return { comments, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCommentsByPoster({
      contentId,
      contentType,
      lastCommentId,
      posterId
    }: {
      contentId: number;
      contentType: string;
      lastCommentId?: number;
      posterId: number;
    }) {
      try {
        const {
          data: { comments, loadMoreButton }
        } = await request.get(
          `${URL}/content/comments/byPoster?contentId=${contentId}&contentType=${contentType}&posterId=${posterId}${
            lastCommentId ? `&lastCommentId=${lastCommentId}` : ''
          }`
        );
        return { comments, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadContent({
      contentId,
      contentType,
      rootType,
      isPinnedComment
    }: {
      contentId: number;
      contentType: string;
      rootType?: string;
      isPinnedComment?: boolean;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/content?contentId=${contentId}&contentType=${contentType}${
            rootType ? `&rootType=${rootType}` : ''
          }${isPinnedComment ? '&isPinnedComment=1' : ''}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadContinueWatching(lastTimeStamp: number) {
      try {
        const {
          data: { videos, loadMoreButton, noVideosToContinue }
        } = await request.get(
          `${URL}/video/continue${
            lastTimeStamp ? `?lastTimeStamp=${lastTimeStamp}` : ''
          }`,
          auth()
        );
        return { videos, loadMoreButton, noVideosToContinue };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFeaturedPlaylists() {
      try {
        const { data } = await request.get(
          `${URL}/content/featured/playlists`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFeaturedSubjects() {
      try {
        const { data } = await request.get(`${URL}/content/featured/subjects`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFeeds({
      lastFeedId,
      lastTimeStamp,
      lastRewardLevel,
      lastViewDuration,
      isRecommended,
      filter = 'all',
      order = 'desc',
      orderBy = 'lastInteraction',
      username
    }: {
      lastFeedId?: number;
      lastTimeStamp?: string;
      lastRewardLevel?: number;
      lastViewDuration?: number;
      isRecommended?: boolean;
      filter?: string;
      order?: string;
      orderBy?: string;
      username?: string;
    } = {}) {
      try {
        const { data } = await request.get(
          `${URL}/content/feeds?filter=${filter}&username=${username}&order=${order}&orderByLabel=${orderBy}${
            isRecommended ? `&isRecommended=1` : ''
          }${
            lastFeedId
              ? `&lastFeedId=${lastFeedId}&lastTimeStamp=${lastTimeStamp}&lastRewardLevel=${lastRewardLevel}&lastViewDuration=${lastViewDuration}`
              : ''
          }`,
          auth()
        );
        return { data, filter };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAIStoryTopic(difficulty: number) {
      try {
        const {
          data: { topic, topicKey, type, imageGeneratedCount, readCount }
        } = await request.get(
          `${URL}/content/game/story/topic?difficulty=${difficulty}`,
          auth()
        );
        return { topic, topicKey, type, imageGeneratedCount, readCount };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAIStory({
      difficulty,
      topic,
      topicKey,
      type
    }: {
      difficulty: number;
      topic: string;
      topicKey: string;
      type: string;
    }) {
      try {
        const {
          data: { imageUrl, attemptId, storyObj }
        } = await request.get(
          `${URL}/content/game/story?difficulty=${difficulty}&topic=${topic}&topicKey=${topicKey}&type=${type}`,
          auth()
        );
        return { imageUrl, attemptId, storyObj };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAIStoryListeningAudio({
      difficulty,
      topic,
      topicKey,
      type
    }: {
      difficulty: number;
      topic: string;
      topicKey: string;
      type: string;
    }) {
      try {
        const { data } = await axios.get(
          `${URL}/content/game/story/listening/audio?difficulty=${difficulty}&topic=${topic}&topicKey=${topicKey}&type=${type}`,
          {
            ...auth(),
            responseType: 'json'
          }
        );
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        return { attemptId: data.attemptId, storyId: data.storyId, audioBlob };
      } catch (error) {
        console.error('Error fetching audio:', error);
        throw error;
      }
    },
    async loadAIStoryListeningImage(storyText: string, userId: string) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/story/listening/image`,
          {
            story: storyText,
            userId
          },
          {
            ...auth(),
            responseType: 'json'
          }
        );
        return data.imageUrl;
      } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
      }
    },
    async loadAIStoryQuestions(storyId: number) {
      try {
        const {
          data: { questions }
        } = await axios.get(
          `${URL}/content/game/story/questions?storyId=${storyId}`,
          auth()
        );
        return questions;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadAIStoryAttempt({
      attemptId,
      difficulty,
      result,
      isPassed
    }: {
      attemptId: number;
      difficulty: number;
      result: number;
      isPassed: boolean;
    }) {
      try {
        const {
          data: { newXp, newCoins }
        } = await request.post(
          `${URL}/content/game/story/attempt`,
          { attemptId, difficulty, result, isPassed },
          auth()
        );
        return {
          newXp,
          newCoins
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAIStoryRankings() {
      try {
        const {
          data: { all, top30s, myRank }
        } = await request.get(`${URL}/content/game/story/leaderBoard`, auth());
        return {
          all,
          top30s,
          myRank
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async generateAIStoryImage({
      storyId,
      style
    }: {
      storyId: string;
      style?: string;
    }) {
      try {
        const {
          data: { imageUrl, coins }
        } = await request.post(
          `${URL}/content/game/story/image`,
          { storyId, style },
          auth()
        );
        return { imageUrl, coins };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGrammarGame() {
      try {
        const {
          data: { nextDayTimeStamp, questions, maxAttemptNumberReached }
        } = await request.get(`${URL}/content/game/grammar`, auth());
        return {
          nextDayTimeStamp,
          questions,
          maxAttemptNumberReached
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGrammarRankings() {
      try {
        const {
          data: { all, top30s, myRank }
        } = await request.get(
          `${URL}/content/game/grammar/leaderBoard`,
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
    async loadLikedFeeds({
      filter = 'all',
      lastFeedId,
      lastTimeStamp,
      username
    }: {
      filter?: string;
      lastFeedId?: number;
      lastTimeStamp?: number;
      username?: string;
    } = {}) {
      try {
        const { data } = await request.get(
          `${URL}/content/feeds/liked?filter=${filter}&username=${username}${
            lastFeedId
              ? `&lastFeedId=${lastFeedId}&lastTimeStamp=${lastTimeStamp}`
              : ''
          }`,
          auth()
        );
        return { data, filter };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFeedsByUser({
      lastFeedId,
      lastTimeStamp,
      section = 'all',
      username
    }: {
      lastFeedId?: number;
      lastTimeStamp?: number;
      section?: string;
      username?: string;
    } = {}) {
      try {
        const { data } = await request.get(
          `${URL}/content/feeds/byUser?section=${section}&username=${username}${
            lastFeedId
              ? `&lastFeedId=${lastFeedId}&lastTimeStamp=${lastTimeStamp}`
              : ''
          }`,
          auth()
        );
        return { data, section };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPostsToReward() {
      try {
        const { data } = await request.get(`${URL}/content/earn/karma/reward`, {
          ...auth(),
          timeout: 10000
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPostsToRecommend() {
      try {
        const { data } = await request.get(
          `${URL}/content/earn/karma/recommend`,
          { ...auth(), timeout: 10000 }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadHighXPSubjects() {
      try {
        const { data } = await request.get(`${URL}/content/earn/xp/subjects`, {
          timeout: 10000
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async markPostAsSkipped({
      earnType,
      action,
      contentType,
      contentId
    }: {
      earnType: string;
      action: string;
      contentType: string;
      contentId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/earn/skip`,
          { earnType, action, contentType, contentId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMorePlaylistList(playlistId: number) {
      try {
        const { data } = await request.get(
          `${URL}/playlist/list?playlistId=${playlistId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreNotableContents({
      userId,
      lastFeedId
    }: {
      userId: number;
      lastFeedId: number;
    }) {
      try {
        const {
          data: { results, loadMoreButton }
        } = await request.get(
          `${URL}/content/noteworthy?userId=${userId}&lastFeedId=${lastFeedId}`
        );
        return { results, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadNotableContent({ userId }: { userId: number }) {
      try {
        const {
          data: { results, loadMoreButton }
        } = await request.get(
          `${URL}/content/noteworthy?userId=${userId}&limit=1`
        );
        return { results, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadNewFeeds({ lastInteraction }: { lastInteraction: number }) {
      try {
        const { data } = await request.get(
          `${URL}/content/newFeeds?lastInteraction=${lastInteraction}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPlaylistList(playlistId: number) {
      try {
        const { data } = await request.get(
          `${URL}/playlist/list${playlistId ? `?playlistId=${playlistId}` : ''}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPlaylists({
      shownPlaylists
    }: {
      shownPlaylists?: number[];
    } = {}) {
      try {
        const {
          data: { results, loadMoreButton }
        } = await request.get(
          `${URL}/playlist${
            shownPlaylists
              ? `/?${queryStringForArray({
                  array: shownPlaylists,
                  originVar: 'id',
                  destinationVar: 'shownPlaylists'
                })}`
              : ''
          }`,
          auth()
        );
        return { results, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPlaylistVideos({
      limit,
      shownVideos,
      targetVideos,
      playlistId
    }: {
      limit: number;
      shownVideos?: number[];
      targetVideos?: number[];
      playlistId: number;
    }) {
      try {
        const {
          data: { title, videos, loadMoreButton }
        } = await request.get(
          `${URL}/playlist/playlist?playlistId=${playlistId}${
            shownVideos
              ? '&' +
                queryStringForArray({
                  array: shownVideos,
                  originVar: 'id',
                  destinationVar: 'shownVideos'
                })
              : ''
          }${
            targetVideos
              ? '&' +
                queryStringForArray({
                  array: targetVideos,
                  originVar: 'id',
                  destinationVar: 'targetVideos'
                })
              : ''
          }${limit ? `&limit=${limit}` : ''}`
        );
        return { title, results: videos, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadReplies({
      lastReplyId,
      commentId,
      isReverse,
      isLoadingRepliesOfReply
    }: {
      lastReplyId?: number;
      commentId: number;
      isReverse?: boolean;
      isLoadingRepliesOfReply?: boolean;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/content/replies?${
            lastReplyId ? `lastReplyId=${lastReplyId}&` : ''
          }commentId=${commentId}${isReverse ? '&isReverse=true' : ''}${
            isLoadingRepliesOfReply ? '&isLoadingRepliesOfReply=true' : ''
          }`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadRightMenuVideos({
      playlistId,
      videoId,
      isContinuing
    }: {
      playlistId?: number;
      videoId: number;
      isContinuing?: boolean;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/${
            playlistId ? 'playlist' : 'video'
          }/rightMenu?videoId=${videoId}${
            playlistId ? `&playlistId=${playlistId}` : ''
          }${isContinuing ? '&isContinuing=true' : ''}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadSubjects({
      contentType,
      contentId,
      lastSubjectId
    }: {
      contentType: string;
      contentId: number;
      lastSubjectId?: number;
    }) {
      try {
        const {
          data: { results, loadMoreButton }
        } = await request.get(
          `${URL}/content/subjects?contentId=${contentId}&contentType=${contentType}&lastSubjectId=${lastSubjectId}`
        );
        return { results, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadByUserUploads({
      contentType,
      lastId,
      limit
    }: {
      contentType: string;
      lastId?: number;
      limit: number;
    }) {
      try {
        const {
          data: { results, loadMoreButton }
        } = await request.get(
          `${URL}/content/uploads/byUser?numberToLoad=${limit}&contentType=${contentType}${
            lastId ? `&lastId=${lastId}` : ''
          }`
        );
        return { results, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadRecommendedUploads({
      limit,
      lastRecommendationId,
      lastInteraction,
      contentType
    }: {
      limit: number;
      lastRecommendationId?: number;
      lastInteraction?: number;
      contentType: string;
    }) {
      try {
        const {
          data: { results, loadMoreButton }
        } = await request.get(
          `${URL}/content/uploads/recommended?numberToLoad=${limit}&contentType=${contentType}${
            lastRecommendationId
              ? `&lastRecommendationId=${lastRecommendationId}&lastInteraction=${lastInteraction}`
              : ''
          }`
        );
        return { results, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUploads({
      limit,
      contentId,
      includeRoot,
      excludeContentIds = [],
      contentType
    }: {
      limit: number;
      contentId: number;
      includeRoot?: boolean;
      excludeContentIds?: number[];
      contentType: string;
    }) {
      try {
        const {
          data: { results, loadMoreButton }
        } = await request.get(
          `${URL}/content/uploads?numberToLoad=${limit}&contentType=${contentType}&contentId=${contentId}${
            excludeContentIds.length > 0
              ? `&${queryStringForArray({
                  array: excludeContentIds,
                  destinationVar: 'excludes'
                })}`
              : ''
          }${includeRoot ? '&includeRoot=true' : ''}`
        );
        return { results, loadMoreButton };
      } catch (error) {
        return handleError(error);
      }
    },
    async makeThumbnailSecure({
      contentId,
      contentType,
      thumbUrl
    }: {
      contentId: number;
      contentType: string;
      thumbUrl: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/content/thumb/secure`,
          { contentId, contentType, thumbUrl },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadVideoCurrentTime(videoId: number) {
      try {
        const {
          data: { currentTime, userViewDuration }
        } = await request.get(
          `${URL}/video/currentTime?videoId=${videoId}`,
          auth()
        );
        return { currentTime, userViewDuration };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadVideoWatchPercentage(videoId: number) {
      try {
        const {
          data: { percentage }
        } = await request.get(
          `${URL}/video/percentage?videoId=${videoId}`,
          auth()
        );
        return percentage;
      } catch (error) {
        return handleError(error);
      }
    },
    async recommendContent({
      contentId,
      contentType,
      rootType,
      currentRecommendations,
      rewardDisabled,
      uploaderId
    }: {
      contentId: number;
      contentType: string;
      rootType?: string;
      currentRecommendations: number[];
      rewardDisabled: boolean;
      uploaderId: number;
    }) {
      try {
        const {
          data: { coins, recommendations }
        } = await request.post(
          `${URL}/content/recommend`,
          {
            contentId,
            contentType,
            rootType,
            currentRecommendations,
            uploaderId,
            rewardDisabled
          },
          auth()
        );
        return { coins, recommendations };
      } catch (error) {
        return handleError(error);
      }
    },
    async reorderPlaylistVideos({
      originalVideoIds,
      reorderedVideoIds,
      playlistId
    }: {
      originalVideoIds: number[];
      reorderedVideoIds: number[];
      playlistId: number;
    }) {
      try {
        const { data: playlist } = await request.put(
          `${URL}/playlist/videos`,
          { originalVideoIds, reorderedVideoIds, playlistId },
          auth()
        );
        return playlist;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchContent({
      filter,
      limit,
      searchText,
      shownResults
    }: {
      filter: string;
      limit: number;
      searchText: string;
      shownResults?: number[];
    }) {
      try {
        const { data } = await request.get(
          `${URL}/content/search?filter=${filter}&searchText=${searchText}${
            limit ? `&limit=${limit}` : ''
          }${
            shownResults
              ? `&${queryStringForArray({
                  array: shownResults,
                  originVar: 'id',
                  destinationVar: 'shownResults'
                })}`
              : ''
          }`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async getHigherAICardBids(cardIds: number[], price: number) {
      try {
        const { data: result } = await request.post(
          `${URL}/ai-card/price/higherOffers`,
          {
            cardIds,
            price
          },
          auth()
        );
        return result;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchAICardIds(cardId: string) {
      try {
        const { data: ids } = await request.get(
          `${URL}/ai-card/search/id?cardId=${cardId}`
        );
        return ids;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchAICardStyles(style: string) {
      try {
        const { data: styles } = await request.get(
          `${URL}/ai-card/search/style?style=${style}`
        );
        return styles;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchAICardWords(word: string) {
      try {
        const { data: words } = await request.get(
          `${URL}/ai-card/search/word?word=${word}`
        );
        return words;
      } catch (error) {
        return handleError(error);
      }
    },
    async setByUser({
      contentType,
      contentId
    }: {
      contentType: string;
      contentId: number;
    }) {
      try {
        const {
          data: { byUser, cannotChange, moderatorName }
        } = await request.put(
          `${URL}/content/byUser`,
          { contentType, contentId },
          auth()
        );
        return { byUser, cannotChange, moderatorName };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCommentPinStatus({
      commentId,
      contentType,
      contentId
    }: {
      commentId: number;
      contentType: string;
      contentId: number;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/content/pin`,
          { commentId, contentType, contentId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateRewardLevel({
      rewardLevel,
      contentId,
      contentType
    }: {
      rewardLevel: number;
      contentId: number;
      contentType: string;
    }) {
      try {
        const {
          data: { cannotChange, success, moderatorName }
        } = await request.put(
          `${URL}/content/rewardLevel`,
          { rewardLevel, contentId, contentType },
          auth()
        );
        return { cannotChange, success, moderatorName };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkCurrentlyWatchingAnotherVideo({
      rewardLevel,
      watchCode
    }: {
      rewardLevel: number;
      watchCode: string;
    }) {
      try {
        const {
          data: { currentlyWatchingAnotherVideo }
        } = await request.get(
          `${URL}/video/currentlyWatching?watchCode=${watchCode}&rewardLevel=${rewardLevel}`,
          auth()
        );
        return currentlyWatchingAnotherVideo;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateTotalViewDuration({
      videoId,
      currentTime,
      totalTime
    }: {
      videoId: number;
      currentTime: number;
      totalTime: number;
    }) {
      try {
        await request.put(
          `${URL}/video/duration`,
          {
            videoId,
            currentTime,
            totalTime
          },
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadComment({
      content,
      parent,
      rootCommentId,
      subjectId,
      targetCommentId,
      attachment,
      filePath,
      fileName,
      fileSize,
      isNotification,
      thumbUrl
    }: {
      content: string;
      parent: object;
      rootCommentId: number;
      subjectId: number;
      targetCommentId: number | null;
      attachment: object;
      filePath: string;
      fileName: string;
      fileSize: number;
      isNotification: boolean;
      thumbUrl: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/comments`,
          {
            content,
            parent,
            rootCommentId,
            subjectId,
            targetCommentId,
            attachment,
            filePath,
            fileName,
            fileSize,
            isNotification,
            thumbUrl
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadContent({
      byUser,
      url,
      isVideo,
      title,
      description,
      fileName,
      filePath,
      fileSize,
      rewardLevel,
      rootId,
      rootType,
      secretAnswer,
      secretAttachmentFilePath,
      secretAttachmentFileName,
      secretAttachmentFileSize,
      secretAttachmentThumbUrl,
      thumbUrl,
      ytDetails
    }: {
      byUser: boolean;
      url: string;
      isVideo: boolean;
      title: string;
      description: string;
      fileName: string;
      filePath: string;
      fileSize: number;
      rewardLevel: number;
      rootId: number;
      rootType: string;
      secretAnswer: string;
      secretAttachmentFilePath: string;
      secretAttachmentFileName: string;
      secretAttachmentFileSize: number;
      secretAttachmentThumbUrl: string;
      thumbUrl: string;
      ytDetails: object;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content`,
          {
            byUser,
            url,
            isVideo,
            title,
            description,
            fileName,
            filePath,
            fileSize,
            rewardLevel,
            rootId,
            rootType,
            secretAnswer,
            secretAttachmentFilePath,
            secretAttachmentFileName,
            secretAttachmentFileSize,
            secretAttachmentThumbUrl,
            thumbUrl,
            ytDetails
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadFeaturedPlaylists({
      selectedPlaylists
    }: {
      selectedPlaylists: number[];
    }) {
      try {
        const {
          data: { playlists }
        } = await request.post(
          `${URL}/playlist/pinned`,
          { selectedPlaylists },
          auth()
        );
        return playlists;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadFeaturedSubjects({ selected }: { selected: number[] }) {
      try {
        const { data: subjects } = await request.post(
          `${URL}/content/featured/subjects`,
          { selectedSubjects: selected },
          auth()
        );
        return subjects;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGrammarGameResult({
      attemptNumber,
      scoreArray
    }: {
      attemptNumber: number;
      scoreArray: number[];
    }) {
      try {
        const {
          data: { newXp, newCoins, isDuplicate }
        } = await request.post(
          `${URL}/content/game/grammar`,
          { attemptNumber, scoreArray },
          auth()
        );
        return { isDuplicate, newXp, newCoins };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadQuestions({
      questions,
      videoId
    }: {
      questions: {
        title: string;
        choiceIds: number[];
        choicesObj: {
          [key: number]: string;
        };
        correctChoice: number;
      }[];
      videoId: number;
    }) {
      const data = {
        videoId,
        questions: questions.map((question) => {
          const choices = question.choiceIds
            .map((id) => ({ id, label: question.choicesObj[id] }))
            .filter((choice) => choice.label && !stringIsEmpty(choice.label));
          return {
            videoId,
            title: question.title,
            correctChoice:
              choices
                .map((choice) => choice.id)
                .indexOf(question.correctChoice) + 1,
            choice1: choices[0].label,
            choice2: choices[1].label,
            choice3: choices[2]?.label,
            choice4: choices[3]?.label,
            choice5: choices[4]?.label
          };
        })
      };
      try {
        await request.post(`${URL}/video/questions`, data, auth());
        const questions = data.questions.map((question) => {
          return {
            title: question.title,
            choices: [
              question.choice1,
              question.choice2,
              question.choice3,
              question.choice4,
              question.choice5
            ],
            correctChoice: question.correctChoice
          };
        });
        return questions;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadFile({
      context = 'feed',
      filePath,
      file,
      fileName,
      onUploadProgress
    }: {
      context?: string;
      filePath: string;
      file: File;
      fileName?: string;
      onUploadProgress?: (progressEvent: any) => void;
    }) {
      const path = await attemptUpload({
        fileName: fileName ?? file.name,
        selectedFile: file,
        onUploadProgress: onUploadProgress ?? (() => {}),
        path: filePath,
        context,
        auth
      });
      return path;
    },
    async uploadPlaylist({
      title,
      description,
      selectedVideos
    }: {
      title: string;
      description: string;
      selectedVideos: number[];
    }) {
      try {
        const {
          data: { result }
        } = await request.post(
          `${URL}/playlist`,
          { title, description, selectedVideos },
          auth()
        );
        return result;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadSubject({
      contentType,
      contentId,
      title,
      description,
      rewardLevel,
      secretAnswer,
      secretAttachmentFilePath,
      secretAttachmentFileName,
      secretAttachmentFileSize,
      secretAttachmentThumbUrl
    }: {
      contentType: string;
      contentId: number;
      title: string;
      description: string;
      rewardLevel: number;
      secretAnswer: string;
      secretAttachmentFilePath: string;
      secretAttachmentFileName: string;
      secretAttachmentFileSize: number;
      secretAttachmentThumbUrl: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/subjects`,
          {
            title,
            description,
            contentId,
            rewardLevel,
            secretAnswer,
            contentType,
            secretAttachmentFilePath,
            secretAttachmentFileName,
            secretAttachmentFileSize,
            secretAttachmentThumbUrl
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadThumb({
      contentId,
      contentType,
      file,
      isSecretAttachment,
      path
    }: {
      contentId: number;
      contentType: string;
      file: File;
      isSecretAttachment: boolean;
      path: string;
    }) {
      try {
        const { data: url } = await request.post(`${URL}/content/thumb`, {
          fileSize: file.size,
          path
        });
        await request.put(url.signedRequest, file);
        const {
          data: { thumbUrl }
        } = await request.put(`${URL}/content/thumb`, {
          path,
          contentId,
          contentType,
          isSecretAttachment
        });
        return thumbUrl;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}
