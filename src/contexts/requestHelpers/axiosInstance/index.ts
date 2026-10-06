import { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import scheduler, { ExtendedAxiosRequestConfig } from './requestScheduler';
import {
  WEBSITE_AGENT_ACTION_HEADER,
  isWebsiteAgentActionActive
} from '~/helpers/websiteAgentAction';
import { isOwnerTraceActive, traceOwnerRequest } from '~/helpers/ownerTrace';

export type {
  RequestMeta,
  RequestAttemptTiming,
  ChannelName,
  RequestPolicy
} from './requestScheduler';
export { RequestScheduler } from './requestScheduler';

function request<T = any, R = AxiosResponse<T>>(
  config: ExtendedAxiosRequestConfig<T>
): Promise<R> {
  if (isWebsiteAgentActionActive()) {
    config = {
      ...config,
      headers: {
        ...(config.headers as Record<string, string> | undefined),
        [WEBSITE_AGENT_ACTION_HEADER]: '1'
      }
    };
  }
  // Owner trace only: slow requests (a no-op check for everyone else).
  if (isOwnerTraceActive()) {
    return traceOwnerRequest(config, (traced) =>
      scheduler.request<T, R>(traced)
    );
  }
  return scheduler.request<T, R>(config);
}

function buildConfig<T = any>(
  method: Method,
  url: string,
  data?: any,
  config?: AxiosRequestConfig<T>
): ExtendedAxiosRequestConfig<T> {
  const finalConfig: ExtendedAxiosRequestConfig<T> = {
    ...(config || {}),
    method,
    url
  };
  if (typeof data !== 'undefined') {
    finalConfig.data = data;
  }
  return finalConfig;
}

const client = {
  request,
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig<T>
  ): Promise<R> {
    return request<T, R>(buildConfig('get', url, undefined, config));
  },
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig<T>
  ): Promise<R> {
    return request<T, R>(buildConfig('delete', url, undefined, config));
  },
  head<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig<T>
  ): Promise<R> {
    return request<T, R>(buildConfig('head', url, undefined, config));
  },
  options<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig<T>
  ): Promise<R> {
    return request<T, R>(buildConfig('options', url, undefined, config));
  },
  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig<T>
  ): Promise<R> {
    return request<T, R>(buildConfig('post', url, data, config));
  },
  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig<T>
  ): Promise<R> {
    return request<T, R>(buildConfig('put', url, data, config));
  },
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig<T>
  ): Promise<R> {
    return request<T, R>(buildConfig('patch', url, data, config));
  }
};

export default client;
