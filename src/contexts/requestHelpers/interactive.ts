import request from 'axios';
import URL from '~/constants/URL';

export default function interactiveRequestHelpers({ auth, handleError }) {
  return {
    async appendInteractiveSlide({ interactiveId, lastFork }) {
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
    async checkInteractiveNumUpdates(interactiveId) {
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
    async deleteInteractiveSlide(slideId) {
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
    async insertInteractiveSlide({ interactiveId, forkedFrom, slideId }) {
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
    async undeleteInteractiveSlide(slideId) {
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
    async loadInteractive(contentId) {
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
    async editInteractiveSlide({ slideId, post }) {
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
    async publishInteractive(interactiveId) {
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
    async publishInteractiveSlide(slideId) {
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
    async recoverArchivedSlide({ interactiveId, selectedSlideId, lastFork }) {
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
    async unPublishInteractiveSlide(slideId) {
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
    async uploadThumbForInteractiveSlide({ slideId, file, path }) {
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
