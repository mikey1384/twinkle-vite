import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function buildRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async initNewProject(projectType: string) {
      try {
        console.log('Initiating compilation request');
        const response = await request.post(
          `${URL}/project/init`,
          { projectType },
          auth()
        );

        if (!response.data || !response.data.success) {
          console.error('Invalid response from server:', response.data);
          throw new Error(
            'Failed to initiate compilation: Invalid server response'
          );
        }
        return response.data;
      } catch (error: unknown) {
        console.error('Error while initiating new project:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
        if (request.isAxiosError(error) && error.response) {
          console.error(
            'Server responded with:',
            error.response.status,
            error.response.data
          );
        }
        return handleError(error);
      }
    },
    async updateProjectCode(projectId: string, files: Record<string, string>) {
      try {
        console.log(`Updating code for project ${projectId}`);
        const response = await request.post(
          `${URL}/project/update`,
          { projectId, files },
          auth()
        );

        if (!response.data || !response.data.success) {
          console.error('Invalid response from server:', response.data);
          throw new Error(
            'Failed to update project code: Invalid server response'
          );
        }
        return response.data;
      } catch (error: unknown) {
        console.error(
          `Error while updating code for project ${projectId}:`,
          error
        );
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
        if (request.isAxiosError(error) && error.response) {
          console.error(
            'Server responded with:',
            error.response.status,
            error.response.data
          );
        }
        return handleError(error);
      }
    }
  };
}
