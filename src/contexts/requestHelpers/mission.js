import request from 'axios';
import URL from '~/constants/URL';

export default function missionRequestHelpers({ auth, handleError }) {
  return {
    async approveGrammarQuestion({ questionId, isApproved }) {
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
    async attachMissionTutorial({ missionId, missionTitle }) {
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
    async checkMissionStatus(missionId) {
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
    async formatCode(code) {
      try {
        const {
          data: { formattedCode }
        } = await request.put(`${URL}/mission/formatCode`, { code });
        return Promise.resolve(formattedCode);
      } catch (error) {
        return handleError(error);
      }
    },
    async lintCode(code) {
      try {
        const {
          data: { results }
        } = await request.post(`${URL}/mission/lintCode`, { code });
        return Promise.resolve(results);
      } catch (error) {
        return handleError(error);
      }
    },
    async processAst(ast) {
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
    async loadGitHubData(code) {
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
    async loadMoreGrammarAttempts({ activeTab, lastTimeStamp }) {
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
    async loadGrammarQuestions({ activeTab, lastQuestionId }) {
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
    async loadMission({ missionId, isTask }) {
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
    async loadMissionRankings(missionId) {
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
    async loadGoogleMissionQuestions() {
      try {
        const { data } = await request.get(`${URL}/mission/question`, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCurrentMission(missionId) {
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
    async updateMissionStatus({ missionType, newStatus }) {
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
    async updateTutorialPrompt({ missionId, tutorialPrompt, buttonLabel }) {
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
    async uploadGrammarQuestion({
      leftSideText,
      rightSideText,
      correctChoice,
      wrongChoice1,
      wrongChoice2,
      wrongChoice3
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
    async uploadGrammarAttempt({ result, questionId }) {
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
    async uploadMissionAttempt({ missionId, attempt }) {
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
    async uploadMissionFeedback({ attemptId, feedback, status }) {
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
