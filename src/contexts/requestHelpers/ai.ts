import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function aiRequestHelpers({
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
    loadUserAIWidgets() {
      return {
        results: [
          { id: 1, name: 'AI Widget 1', latestOutput: 'Initial output 1' },
          { id: 2, name: 'AI Widget 2', latestOutput: 'Initial output 2' },
          { id: 3, name: 'AI Widget 3', latestOutput: 'Initial output 3' }
        ]
      };
    },
    sendPromptToAI(widgetId: number, prompt: string) {
      // Replace with actual API call
      return {
        output: `Response to prompt "${prompt}" from widget ${widgetId}`
      };
    }
  };
}
