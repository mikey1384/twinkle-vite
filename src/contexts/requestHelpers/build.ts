import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import { io } from 'socket.io-client';

export default function buildRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async runSimulation(fileContents: Record<string, string>) {
      try {
        console.log('Initiating compilation request');
        const response = await request.post(
          `${URL}/project/run`,
          { fileContents },
          auth()
        );
        console.log('Compilation request response:', response);

        if (!response.data || !response.data.success) {
          console.error('Invalid response from server:', response.data);
          throw new Error(
            'Failed to initiate compilation: Invalid server response'
          );
        }

        // If the server directly returns the compiled code, use it
        if (response.data.compiledCode) {
          console.log('Compilation completed directly');
          return { compiledHtml: response.data.compiledCode };
        }

        // If the server returns a projectId, set up WebSocket connection
        if (response.data.projectId) {
          const socket = io(`${URL}`);

          return new Promise((resolve, reject) => {
            socket.on('connect', () => {
              console.log('WebSocket connected');
              socket.emit('subscribeToCompilation', response.data.projectId);
            });

            socket.on('compilationComplete', ({ result }) => {
              console.log('Compilation completed via WebSocket');
              socket.disconnect();
              resolve({ compiledHtml: result });
            });

            socket.on('compilationError', ({ error }) => {
              console.error('Compilation error:', error);
              socket.disconnect();
              reject(new Error(`Compilation error: ${error}`));
            });

            socket.on('error', (error) => {
              console.error('Socket error:', error);
              socket.disconnect();
              reject(new Error(`Socket error: ${error}`));
            });

            setTimeout(() => {
              socket.disconnect();
              reject(new Error('Compilation timed out'));
            }, 30000);
          });
        }

        throw new Error('Unexpected server response format');
      } catch (error: unknown) {
        console.error('Error in runSimulation:', error);
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
        throw error; // Re-throw the error to be handled by the caller
      }
    },

    async fetchSampleCode() {
      try {
        const { data } = await request.get(
          `${URL}/project/samples/website`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}
