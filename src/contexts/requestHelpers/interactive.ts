import { RequestHelpers } from '~/types';
import request from './axiosInstance';
import URL from '~/constants/URL';

export default function interactiveRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async appendInteractiveSlide({
      interactiveId,
      lastFork
    }: {
      interactiveId: number;
      lastFork: object;
    }) {
      try {
        const {
          data: { slide, numUpdates }
        } = await request.post(
          `${URL}/interactive/slide`,
          { interactiveId, lastFork },
          auth()
        );
        return Promise.resolve({ slide, numUpdates });
      } catch (error) {
        return handleError(error);
      }
    },
    async checkInteractiveNumUpdates(interactiveId: number) {
      try {
        const {
          data: { numUpdates }
        } = await request.get(
          `${URL}/interactive/numUpdates?interactiveId=${interactiveId}`,
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteInteractiveSlide(slideId: number) {
      try {
        const {
          data: { numUpdates }
        } = await request.delete(
          `${URL}/interactive/slide?slideId=${slideId}`,
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async insertArchivedSlide({
      interactiveId,
      slideId,
      selectedSlideId,
      forkedFrom
    }: {
      interactiveId: number;
      slideId: number;
      selectedSlideId: number;
      forkedFrom: number;
    }) {
      try {
        const {
          data: { numUpdates }
        } = await request.post(
          `${URL}/interactive/slide/recover`,
          { interactiveId, slideId, selectedSlideId, forkedFrom },
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async insertInteractiveSlide({
      interactiveId,
      forkedFrom,
      slideId
    }: {
      interactiveId: number;
      forkedFrom: number;
      slideId: number;
    }) {
      try {
        const {
          data: { slide, numUpdates }
        } = await request.post(
          `${URL}/interactive/slide/insert`,
          { interactiveId, forkedFrom, slideId },
          auth()
        );
        return Promise.resolve({ slide, numUpdates });
      } catch (error) {
        return handleError(error);
      }
    },
    async undeleteInteractiveSlide(slideId: number) {
      try {
        const {
          data: { numUpdates }
        } = await request.delete(
          `${URL}/interactive/slide/cancel?slideId=${slideId}`,
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadInteractive(contentId: number) {
      try {
        const { data } = await request.get(
          `${URL}/interactive?contentId=${contentId}`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async editInteractiveSlide({
      slideId,
      post
    }: {
      slideId: number;
      post: object;
    }) {
      try {
        const {
          data: { slide, numUpdates }
        } = await request.put(
          `${URL}/interactive/slide`,
          { slideId, post },
          auth()
        );
        return Promise.resolve({ slide, numUpdates });
      } catch (error) {
        return handleError(error);
      }
    },
    async moveInteractiveSlide({
      direction,
      forkedFrom,
      interactiveId,
      slideId
    }: {
      direction: string;
      forkedFrom: number;
      interactiveId: number;
      slideId: number;
    }) {
      try {
        const {
          data: { numUpdates }
        } = await request.put(
          `${URL}/interactive/slide/move`,
          { direction, forkedFrom, interactiveId, slideId },
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async publishInteractive(interactiveId: number) {
      try {
        const {
          data: { numUpdates }
        } = await request.put(
          `${URL}/interactive/publish`,
          { interactiveId },
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async publishInteractiveSlide(slideId: number) {
      try {
        const {
          data: { numUpdates }
        } = await request.put(
          `${URL}/interactive/slide/publish`,
          { slideId },
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async recoverArchivedSlide({
      interactiveId,
      selectedSlideId,
      lastFork
    }: {
      interactiveId: number;
      selectedSlideId: number;
      lastFork: object;
    }) {
      try {
        const {
          data: { numUpdates }
        } = await request.put(
          `${URL}/interactive/slide/recover`,
          { interactiveId, selectedSlideId, lastFork },
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async unPublishInteractiveSlide(slideId: number) {
      try {
        const {
          data: { numUpdates }
        } = await request.put(
          `${URL}/interactive/slide/unpublish`,
          { slideId },
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateEmbedData({
      slideId,
      thumbUrl,
      actualTitle,
      actualDescription,
      siteUrl
    }: {
      slideId: number;
      thumbUrl: string;
      actualTitle: string;
      actualDescription: string;
      siteUrl: string;
    }) {
      try {
        const {
          data: { numUpdates }
        } = await request.put(
          `${URL}/interactive/slide/embed`,
          { slideId, thumbUrl, actualTitle, actualDescription, siteUrl },
          auth()
        );
        return Promise.resolve(numUpdates);
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadThumbForInteractiveSlide({
      slideId,
      file,
      path
    }: {
      slideId: number;
      file: File;
      path: string;
    }) {
      const { data: url } = await request.post(
        `${URL}/interactive/slide/thumb`,
        {
          fileSize: file.size,
          path
        }
      );
      await request.put(url.signedRequest, file);
      const {
        data: { thumbUrl, numUpdates }
      } = await request.put(`${URL}/interactive/slide/thumb`, {
        path,
        slideId
      });
      return Promise.resolve({ thumbUrl, numUpdates });
    }
  };
}
