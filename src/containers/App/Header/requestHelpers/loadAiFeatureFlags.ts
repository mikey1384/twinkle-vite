import request from '~/contexts/requestHelpers/axiosInstance';
import URL from '~/constants/URL';

export default async function loadAiFeatureFlags() {
  const { data } = await request.get(`${URL}/feature-flags`, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    },
    params: {
      ts: Date.now()
    }
  });
  return {
    aiFeaturesDisabled:
      typeof data?.aiFeaturesDisabled === 'boolean'
        ? data.aiFeaturesDisabled
        : data?.aiFeaturesEnabled !== true
  };
}
