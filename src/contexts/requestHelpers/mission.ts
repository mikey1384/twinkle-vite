import request from './axiosInstance';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function missionRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async approveGrammarQuestion({
      questionId,
      isApproved
    }: {
      questionId: number;
      isApproved: boolean;
    }) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/grammar/question/approve?isApproved=${isApproved}`,
          { questionId },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteGrammarQuestion(questionId: number) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/mission/grammar/question?questionId=${questionId}`,
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async attachMissionTutorial({
      missionId,
      missionTitle
    }: {
      missionId: number;
      missionTitle: string;
    }) {
      try {
        const {
          data: { tutorialId }
        } = await request.post(
          `${URL}/mission/tutorial`,
          {
            missionId,
            missionTitle
          },
          auth()
        );
        return Promise.resolve(tutorialId);
      } catch (error) {
        return handleError(error);
      }
    },
    async checkMissionStatus(missionId: number) {
      try {
        const {
          data: { filePath, feedback, status, reviewer, reviewTimeStamp }
        } = await request.get(
          `${URL}/mission/status?missionId=${missionId}`,
          auth()
        );
        return Promise.resolve({
          filePath,
          feedback,
          status,
          reviewer,
          reviewTimeStamp
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async editGrammarQuestion({
      leftSideText,
      rightSideText,
      correctChoice,
      wrongChoice1,
      wrongChoice2,
      wrongChoice3,
      questionId
    }: {
      leftSideText: string;
      rightSideText: string;
      correctChoice: string;
      wrongChoice1: string;
      wrongChoice2: string;
      wrongChoice3: string;
      questionId: number;
    }) {
      try {
        const {
          data: { question }
        } = await request.put(
          `${URL}/mission/grammar/question`,
          {
            leftSideText,
            rightSideText,
            correctChoice,
            wrongChoice1,
            wrongChoice2,
            wrongChoice3,
            questionId
          },
          auth()
        );
        return Promise.resolve(question);
      } catch (error) {
        return handleError(error);
      }
    },
    async formatCode(code: string) {
      try {
        const {
          data: { formattedCode }
        } = await request.put(`${URL}/mission/formatCode`, { code });
        return Promise.resolve(formattedCode);
      } catch (error) {
        return handleError(error);
      }
    },
    async lintCode(code: string) {
      try {
        const {
          data: { results }
        } = await request.post(`${URL}/mission/lintCode`, { code });
        return Promise.resolve(results);
      } catch (error) {
        return handleError(error);
      }
    },
    async processAst(ast: string) {
      try {
        const {
          data: { result }
        } = await request.post(`${URL}/mission/processAst`, {
          ast
        });
        return Promise.resolve(result);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGitHubData(code: string) {
      try {
        const {
          data: { githubUsername }
        } = await request.get(`${URL}/mission/github?code=${code}`, auth());
        return Promise.resolve(githubUsername);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGrammarAttempts() {
      try {
        const { data } = await request.get(
          `${URL}/mission/grammar/attempt`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreGrammarAttempts({
      activeTab,
      lastTimeStamp
    }: {
      activeTab: string;
      lastTimeStamp: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/mission/grammar/attempt/more?activeTab=${activeTab}&lastTimeStamp=${lastTimeStamp}`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGrammarCategories() {
      try {
        const {
          data: { categories, categoryObj }
        } = await request.get(`${URL}/mission/grammar/category`, auth());
        return Promise.resolve({ categories, categoryObj });
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteGrammarCategory(category: string) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/mission/grammar/category?category=${category}`,
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGrammarCategoryQuestions(category: string) {
      try {
        const {
          data: { questions }
        } = await request.get(
          `${URL}/mission/grammar/category/questions?category=${category}`,
          auth()
        );
        return Promise.resolve(questions);
      } catch (error) {
        return handleError(error);
      }
    },
    async editGrammarCategory({
      category,
      newCategory
    }: {
      category: string;
      newCategory: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/grammar/category`,
          { category, newCategory },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGrammarCategory(category: string) {
      try {
        await request.post(
          `${URL}/mission/grammar/category`,
          { category },
          auth()
        );
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGrammarQuestions({
      activeTab,
      lastQuestionId
    }: {
      activeTab: string;
      lastQuestionId: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/mission/grammar/question?activeTab=${activeTab}${
            lastQuestionId ? `&lastQuestionId=${lastQuestionId}` : ''
          }`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateGrammarQuestionCategory({
      questionId,
      category
    }: {
      questionId: number;
      category: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/grammar/question/category`,
          { questionId, category },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMission({
      missionId,
      isTask
    }: {
      missionId: number;
      isTask: boolean;
    }) {
      try {
        const {
          data: { page, myAttempts }
        } = await request.get(
          `${URL}/mission/page?missionId=${missionId}${
            isTask ? '&isTask=1' : ''
          }`,
          auth()
        );
        return Promise.resolve({ page, myAttempts });
      } catch (error) {
        return handleError(error);
      }
    },
    async updateMissionData(missionId: number) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/page/update`,
          { missionId },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionRankings(missionId: number) {
      try {
        const { data } = await request.get(
          `${URL}/mission/ranking?missionId=${missionId}`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionAttempts({
      activeTab,
      lastAttemptId,
      lastAttemptReviewTimeStamp
    }: {
      activeTab: string;
      lastAttemptId: number;
      lastAttemptReviewTimeStamp: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/mission/attempt?activeTab=${activeTab}${
            lastAttemptId ? `&lastAttemptId=${lastAttemptId}` : ''
          }${
            lastAttemptReviewTimeStamp
              ? `&lastAttemptReviewTimeStamp=${lastAttemptReviewTimeStamp}`
              : ''
          }`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionAttemptsForPage({
      activeTab,
      missionId,
      lastAttemptId,
      lastAttemptReviewTimeStamp
    }: {
      activeTab: string;
      missionId: number;
      lastAttemptId: number;
      lastAttemptReviewTimeStamp: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/mission/page/attempt?activeTab=${activeTab}&missionId=${missionId}${
            lastAttemptId ? `&lastAttemptId=${lastAttemptId}` : ''
          }${
            lastAttemptReviewTimeStamp
              ? `&lastAttemptReviewTimeStamp=${lastAttemptReviewTimeStamp}`
              : ''
          }`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionList() {
      try {
        const { data } = await request.get(`${URL}/mission`, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionTypeIdHash() {
      try {
        const { data } = await request.get(`${URL}/mission/typeIdHash`, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGoogleMissionQuestions({ missionId }: { missionId: number }) {
      try {
        const { data } = await request.get(
          `${URL}/mission/question?missionId=${missionId}`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCurrentMission(missionId: number) {
      try {
        await request.put(
          `${URL}/mission/current`,
          { missionId: Number(missionId) },
          auth()
        );
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async updateMissionStatus({
      missionType,
      newStatus
    }: {
      missionType: string;
      newStatus: string;
    }) {
      try {
        await request.put(
          `${URL}/user/state/mission`,
          { missionType, newStatus },
          auth()
        );
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async updateTutorialPrompt({
      missionId,
      tutorialPrompt,
      buttonLabel
    }: {
      missionId: number;
      tutorialPrompt: string;
      buttonLabel: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/tutorial/prompt`,
          { missionId, tutorialPrompt, buttonLabel },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGoogleQuestion({
      missionId,
      questionText
    }: {
      missionId: number;
      questionText: string;
    }) {
      try {
        const {
          data: { alreadyExists, questionId, question }
        } = await request.post(
          `${URL}/mission/google/question`,
          { missionId, questionText },
          auth()
        );
        return Promise.resolve({ alreadyExists, question, questionId });
      } catch (error) {
        return handleError(error);
      }
    },
    async approveGoogleQuestion(questionId: number) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/google/question/approve`,
          { questionId },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async disapproveGoogleQuestion(questionId: number) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/google/question/disapprove`,
          { questionId },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteGoogleQuestion(questionId: number) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/mission/google/question?questionId=${questionId}`,
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGrammarQuestion({
      leftSideText,
      rightSideText,
      correctChoice,
      wrongChoice1,
      wrongChoice2,
      wrongChoice3
    }: {
      leftSideText: string;
      rightSideText: string;
      correctChoice: string;
      wrongChoice1: string;
      wrongChoice2: string;
      wrongChoice3: string;
    }) {
      try {
        const {
          data: { alreadyExists, question }
        } = await request.post(
          `${URL}/mission/grammar/question`,
          {
            leftSideText,
            rightSideText,
            correctChoice,
            wrongChoice1,
            wrongChoice2,
            wrongChoice3
          },
          auth()
        );
        return Promise.resolve({ alreadyExists, question });
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGrammarAttempt({
      result,
      questionId
    }: {
      result: boolean;
      questionId: number;
    }) {
      try {
        await request.post(
          `${URL}/mission/grammar/attempt`,
          { result, questionId },
          auth()
        );
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadMissionAttempt({
      missionId,
      attempt
    }: {
      missionId: number;
      attempt: object;
    }) {
      try {
        const {
          data: { success, newXpAndRank, newCoins }
        } = await request.post(
          `${URL}/mission/attempt`,
          {
            missionId: Number(missionId),
            attempt
          },
          auth()
        );
        return Promise.resolve({ success, newXpAndRank, newCoins });
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadMissionFeedback({
      attemptId,
      feedback,
      status
    }: {
      attemptId: number;
      feedback: string;
      status: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/mission/attempt`,
          {
            attemptId,
            feedback,
            status
          },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    }
  };
}
