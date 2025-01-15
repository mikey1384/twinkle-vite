import request from './axiosInstance';
import axios from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function zeroRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async checkWorkshopAvailability({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      if (!contentId || !contentType)
        return handleError('Invalid contentId or contentType');
      try {
        const { data } = await request.get(
          `${URL}/zero/workshop?contentId=${contentId}&contentType=${contentType}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async generateVideoSubtitles({
      chunk,
      targetLanguage,
      filename
    }: {
      chunk: string;
      targetLanguage: string;
      filename: string;
    }) {
      try {
        const { data } = await axios.post(`${URL}/zero/subtitle`, {
          chunk,
          targetLanguage,
          filename
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async textToSpeech(text: string, voice: string) {
      try {
        const { data } = await request.post(
          `${URL}/zero/tts`,
          { text, voice },
          {
            responseType: 'blob'
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}
