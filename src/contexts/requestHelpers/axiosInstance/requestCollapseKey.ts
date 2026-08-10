import type { AxiosRequestConfig } from 'axios';
import { getHttpHeaderValue } from '~/helpers/httpHeaderHelpers';

export function getDefaultRequestCollapseKey(
  config: AxiosRequestConfig,
  collapseGet: boolean
) {
  const method = (config.method || 'get').toLowerCase();
  if (!collapseGet || method !== 'get') return null;
  const url = config.url || '';
  const paramsKey = config.params ? JSON.stringify(config.params) : '';
  const authorization = getHttpHeaderValue(config.headers, 'authorization');
  const buildApiToken = getHttpHeaderValue(config.headers, 'x-build-api-token');
  return JSON.stringify([method, url, paramsKey, authorization, buildApiToken]);
}
