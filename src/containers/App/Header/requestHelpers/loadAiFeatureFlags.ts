import request from '~/contexts/requestHelpers/axiosInstance';
import URL from '~/constants/URL';

export default async function loadAiFeatureFlags() {
  const { data } = await request.get(`${URL}/feature-flags`);
  return {
    aiFeaturesDisabled:
      typeof data?.aiFeaturesDisabled === 'boolean'
        ? data.aiFeaturesDisabled
        : data?.aiFeaturesEnabled !== true
  };
}
