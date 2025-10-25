import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosProgressEvent,
  CanceledError,
  GenericAbortSignal
} from 'axios';
import pLimit from 'p-limit';
import { logForAdmin } from '~/helpers';

export type ChannelName = 'ui' | 'normal' | 'bulk';

export interface RequestPolicy {
  concurrency: number;
  minTimeout: number;
  maxTimeout: number;
  maxRetries: number;
  backoffBase: number;
  backoffMultiplier: number;
  backoffJitter: number;
  collapseGet: boolean;
  enableProgressGuard: boolean;
  stallTimeoutMs?: number;
  allowExtendedTimeout?: boolean;
  extendedTimeoutCap?: number;
}

export interface RequestMeta {
  channel?: ChannelName;
  collapseKey?: string | null;
  enableProgressGuard?: boolean;
  stallTimeoutMs?: number;
  allowExtendedTimeout?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'bulk';
  enforceTimeout?: boolean;
}

export type ExtendedAxiosRequestConfig<T = any> = AxiosRequestConfig<T> & {
  meta?: RequestMeta;
};

interface ResolvedRequestContext {
  channel: ChannelName;
  collapseKey?: string | null;
  enableProgressGuard: boolean;
  stallTimeoutMs?: number;
  allowExtendedTimeout: boolean;
}

interface RequestSchedulerOptions {
  policies?: Partial<Record<ChannelName, Partial<RequestPolicy>>>;
  defaultChannel?: ChannelName;
}

const DEFAULT_POLICIES: Record<ChannelName, RequestPolicy> = {
  ui: {
    concurrency: 6,
    minTimeout: 15000,
    maxTimeout: 60000,
    maxRetries: 2,
    backoffBase: 1000,
    backoffMultiplier: 2,
    backoffJitter: 500,
    collapseGet: true,
    enableProgressGuard: false,
    allowExtendedTimeout: true,
    extendedTimeoutCap: 180000
  },
  normal: {
    concurrency: 4,
    minTimeout: 15000,
    maxTimeout: 60000,
    maxRetries: 3,
    backoffBase: 1500,
    backoffMultiplier: 2,
    backoffJitter: 600,
    collapseGet: true,
    enableProgressGuard: false,
    allowExtendedTimeout: true,
    extendedTimeoutCap: 180000
  },
  bulk: {
    concurrency: 2,
    minTimeout: 20000,
    maxTimeout: 90000,
    maxRetries: 4,
    backoffBase: 2000,
    backoffMultiplier: 2.5,
    backoffJitter: 1000,
    collapseGet: false,
    enableProgressGuard: true,
    stallTimeoutMs: 30000,
    allowExtendedTimeout: true,
    extendedTimeoutCap: 180000
  }
};

class RequestChannel {
  private limiter: ReturnType<typeof pLimit>;
  private inflight = new Map<string, Promise<AxiosResponse>>();
  private breakerState: 'closed' | 'open' | 'half' = 'closed';
  private openedAt = 0;
  private lastProbeAt = 0;
  private recentErrors: number[] = [];
  private pauseUntil = 0;
  private onLatencyMeasured?: (latency: number) => void;

  private static readonly BREAKER = {
    ERROR_WINDOW_MS: 30_000,
    ERROR_THRESHOLD: 10,
    OPEN_MS: 15_000,
    PROBE_EVERY_MS: 3_000
  } as const;

  constructor(
    public readonly name: ChannelName,
    private policy: RequestPolicy,
    onLatencyMeasured?: (latency: number) => void
  ) {
    this.limiter = pLimit(Math.max(1, policy.concurrency));
    this.onLatencyMeasured = onLatencyMeasured;
  }

  updatePolicy(policy: RequestPolicy) {
    this.policy = policy;
    this.limiter = pLimit(Math.max(1, policy.concurrency));
  }

  request<T = any>(
    baseConfig: ExtendedAxiosRequestConfig<T>,
    context: ResolvedRequestContext
  ): Promise<AxiosResponse<T>> {
    const collapseKey =
      context.collapseKey !== undefined
        ? context.collapseKey
        : this.computeDefaultCollapseKey(baseConfig);

    if (collapseKey) {
      const existing = this.inflight.get(collapseKey);
      if (existing) {
        return existing as Promise<AxiosResponse<T>>;
      }
    }

    const promise = this.executeWithRetries(baseConfig, context, 0).finally(
      () => {
        if (collapseKey) {
          this.inflight.delete(collapseKey);
        }
      }
    );

    if (collapseKey) {
      this.inflight.set(collapseKey, promise);
    }

    return promise;
  }

  private computeDefaultCollapseKey(config: AxiosRequestConfig) {
    const method = (config.method || 'get').toLowerCase();
    if (!this.policy.collapseGet || method !== 'get') return null;
    const url = config.url || '';
    const paramsKey = config.params ? JSON.stringify(config.params) : '';
    return `${method}:${url}:${paramsKey}`;
  }

  private async executeWithRetries<T>(
    baseConfig: ExtendedAxiosRequestConfig<T>,
    context: ResolvedRequestContext,
    attempt: number
  ): Promise<AxiosResponse<T>> {
    // Respect pause on resume
    if (this.pauseUntil && Date.now() < this.pauseUntil) {
      await sleep(this.pauseUntil - Date.now());
    }

    // Circuit breaker gate: block until a probe is permitted
    while (!this.breakerAllowsAttempt()) {
      await sleep(RequestChannel.BREAKER.PROBE_EVERY_MS);
    }

    const config = cloneConfig(baseConfig);
    const policy = this.policy;

    const method = (config.method || 'get').toLowerCase();
    const shouldEnforceTimeout =
      typeof config.meta?.enforceTimeout === 'boolean'
        ? config.meta.enforceTimeout
        : method === 'get' || method === 'head';

    const timeoutMs = shouldEnforceTimeout
      ? computeTimeout(policy, attempt, context.allowExtendedTimeout)
      : 0;
    const controller = new AbortController();
    const merged = mergeSignals(config.signal, controller);

    config.signal = merged.signal;
    applyCacheBuster(config, attempt);

    let clearTimeoutFn: (() => void) | undefined;

    let removeGuard: (() => void) | undefined;
    const enableGuard = context.enableProgressGuard;

    if (enableGuard) {
      const stallMs = context.stallTimeoutMs ?? policy.stallTimeoutMs;
      if (stallMs && stallMs > 0) {
        removeGuard = installProgressGuard(config, stallMs, controller);
      }
    }

    try {
      const response = await this.limiter(async () => {
        if (timeoutMs > 0) {
          const timer = setTimeout(() => {
            controller.abort(new CanceledError('timeout'));
          }, timeoutMs);
          clearTimeoutFn = () => clearTimeout(timer);
        }
        const httpStartTime = Date.now();

        try {
          const result = await axios.request<T>(config);

          if (this.onLatencyMeasured) {
            this.onLatencyMeasured(Date.now() - httpStartTime);
          }

          return result;
        } catch (err) {
          if (
            this.onLatencyMeasured &&
            isTimeoutCancellation(err as AxiosError)
          ) {
            this.onLatencyMeasured(Date.now() - httpStartTime);
          }
          throw err;
        }
      });

      this.onSuccessfulProbe();
      return response;
    } catch (error) {
      if (!shouldRetry(error, policy, attempt, method)) {
        throw error;
      }
      this.noteRetryableError();

      const retryAfterMs = parseRetryAfter(error as AxiosError);
      const delayMs =
        typeof retryAfterMs === 'number'
          ? retryAfterMs
          : computeBackoff(policy, attempt);
      await sleep(delayMs);
      return this.executeWithRetries(baseConfig, context, attempt + 1);
    } finally {
      if (removeGuard) removeGuard();
      if (clearTimeoutFn) clearTimeoutFn();
      if (merged.cleanup) merged.cleanup();
    }
  }

  // Breaker helpers
  private noteRetryableError() {
    const now = Date.now();
    this.recentErrors.push(now);
    const windowMs = RequestChannel.BREAKER.ERROR_WINDOW_MS;
    this.recentErrors = this.recentErrors.filter((t) => now - t <= windowMs);
    if (this.breakerState === 'closed') {
      if (this.recentErrors.length >= RequestChannel.BREAKER.ERROR_THRESHOLD) {
        this.breakerState = 'open';
        this.openedAt = now;
      }
      return;
    }

    // In half-open (failed probe) or open (continued errors), re-open and
    // extend the cool-down window so we don't hammer the backend.
    if (this.breakerState === 'half' || this.breakerState === 'open') {
      this.breakerState = 'open';
      this.openedAt = now;
    }
  }

  private breakerAllowsAttempt() {
    const now = Date.now();
    if (this.breakerState === 'open') {
      if (now - this.openedAt >= RequestChannel.BREAKER.OPEN_MS) {
        this.breakerState = 'half';
        this.lastProbeAt = 0;
        return true;
      }
      if (now - this.lastProbeAt >= RequestChannel.BREAKER.PROBE_EVERY_MS) {
        this.lastProbeAt = now;
        return true;
      }
      return false;
    }
    if (this.breakerState === 'half') {
      if (now - this.lastProbeAt >= RequestChannel.BREAKER.PROBE_EVERY_MS) {
        this.lastProbeAt = now;
        return true;
      }
      return false;
    }
    return true;
  }

  private onSuccessfulProbe() {
    if (this.breakerState !== 'closed') {
      this.breakerState = 'closed';
      this.recentErrors = [];
    }
  }

  // Called on iOS long-sleep resume to avoid stale collapses and give time to recover
  onLongSleepResume() {
    this.inflight.clear();
    this.pauseUntil = Date.now() + 1500;
  }
}

export class RequestScheduler {
  private channels = new Map<ChannelName, RequestChannel>();
  private policies: Record<ChannelName, RequestPolicy>;
  private baselinePolicies: Record<ChannelName, RequestPolicy>;
  private defaultChannel: ChannelName;
  private networkQuality: 'good' | 'moderate' | 'poor' = 'good';
  private latencyHistory: number[] = [];
  private readonly LATENCY_WINDOW = 10;
  private readonly POOR_LATENCY_THRESHOLD = 3000;
  private readonly MODERATE_LATENCY_THRESHOLD = 1500;

  constructor(options?: Partial<RequestSchedulerOptions>) {
    const mergedPolicies: Record<ChannelName, RequestPolicy> = {
      ui: {
        ...DEFAULT_POLICIES.ui,
        ...(options?.policies?.ui ?? {})
      },
      normal: {
        ...DEFAULT_POLICIES.normal,
        ...(options?.policies?.normal ?? {})
      },
      bulk: {
        ...DEFAULT_POLICIES.bulk,
        ...(options?.policies?.bulk ?? {})
      }
    } as Record<ChannelName, RequestPolicy>;

    this.policies = mergedPolicies;
    this.baselinePolicies = JSON.parse(JSON.stringify(mergedPolicies));
    this.defaultChannel = options?.defaultChannel ?? 'normal';

    // Create channels with latency measurement callback
    const measureLatency = (latency: number) =>
      this.updateNetworkQuality(latency);
    (Object.keys(this.policies) as ChannelName[]).forEach((name) => {
      this.channels.set(
        name,
        new RequestChannel(name, this.policies[name], measureLatency)
      );
    });

    // iOS long-sleep resume cleanup
    if (typeof document !== 'undefined') {
      let hiddenAt = 0;
      const LONG_HIDDEN_MS = 5 * 60 * 1000;
      const isLikelyIOS = () => {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent || '';
        const isIOSDevice = /iP(ad|hone|od)/i.test(ua);
        const isiPadOS =
          (navigator as any).platform === 'MacIntel' &&
          (navigator as any).maxTouchPoints > 1;
        return isIOSDevice || isiPadOS;
      };

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          hiddenAt = Date.now();
          return;
        }
        const wasHiddenFor = hiddenAt ? Date.now() - hiddenAt : 0;
        hiddenAt = 0;
        if (isLikelyIOS() && wasHiddenFor > LONG_HIDDEN_MS) {
          for (const ch of this.channels.values()) {
            ch.onLongSleepResume();
          }
        }
      });
    }
  }

  request<T = any, R = AxiosResponse<T>>(
    config: ExtendedAxiosRequestConfig<T>
  ): Promise<R> {
    const resolvedChannel = this.resolveChannel(config);
    const channel = this.channels.get(resolvedChannel)!;
    const context = this.resolveContext(config, channel.name);

    return channel.request(config, context) as Promise<R>;
  }

  private updateNetworkQuality(latency: number) {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > this.LATENCY_WINDOW) {
      this.latencyHistory.shift();
    }

    const avgLatency =
      this.latencyHistory.reduce((a, b) => a + b, 0) /
      this.latencyHistory.length;

    const previousQuality = this.networkQuality;
    if (avgLatency > this.POOR_LATENCY_THRESHOLD) {
      this.networkQuality = 'poor';
    } else if (avgLatency > this.MODERATE_LATENCY_THRESHOLD) {
      this.networkQuality = 'moderate';
    } else {
      this.networkQuality = 'good';
    }

    // If network quality has degraded, adjust policies
    if (previousQuality !== this.networkQuality) {
      this.adjustPoliciesForNetworkQuality();
    }
  }

  private adjustPoliciesForNetworkQuality() {
    const multiplier =
      this.networkQuality === 'poor'
        ? 2
        : this.networkQuality === 'moderate'
        ? 1.5
        : 1;

    for (const [channelName, baselinePolicy] of Object.entries(
      this.baselinePolicies
    )) {
      const adjustedPolicy = {
        ...baselinePolicy,
        minTimeout: Math.round(baselinePolicy.minTimeout * multiplier),
        maxTimeout: Math.round(baselinePolicy.maxTimeout * multiplier),
        stallTimeoutMs: baselinePolicy.stallTimeoutMs
          ? Math.round(baselinePolicy.stallTimeoutMs * multiplier)
          : undefined,
        extendedTimeoutCap: baselinePolicy.extendedTimeoutCap
          ? Math.round(baselinePolicy.extendedTimeoutCap * multiplier)
          : undefined
      };

      this.policies[channelName as ChannelName] = adjustedPolicy;
      this.channels
        .get(channelName as ChannelName)
        ?.updatePolicy(adjustedPolicy);
    }

    if (this.networkQuality === 'poor') {
      logForAdmin({
        message: `Network quality detected as poor. Timeouts scaled by 2x from baseline`
      });
    } else if (this.networkQuality === 'moderate') {
      logForAdmin({
        message: `Network quality detected as moderate. Timeouts scaled by 1.5x from baseline`
      });
    } else {
      logForAdmin({
        message: `Network quality returned to good. Timeouts restored to baseline`
      });
    }
  }

  updatePolicy(channel: ChannelName, policy: Partial<RequestPolicy>) {
    const baseline = this.baselinePolicies[channel];
    const updatedBaseline = { ...baseline, ...policy } as RequestPolicy;

    this.baselinePolicies[channel] = updatedBaseline;

    const multiplier =
      this.networkQuality === 'poor'
        ? 2
        : this.networkQuality === 'moderate'
        ? 1.5
        : 1;

    const scaledPolicy = {
      ...updatedBaseline,
      minTimeout: Math.round(updatedBaseline.minTimeout * multiplier),
      maxTimeout: Math.round(updatedBaseline.maxTimeout * multiplier),
      stallTimeoutMs: updatedBaseline.stallTimeoutMs
        ? Math.round(updatedBaseline.stallTimeoutMs * multiplier)
        : undefined,
      extendedTimeoutCap: updatedBaseline.extendedTimeoutCap
        ? Math.round(updatedBaseline.extendedTimeoutCap * multiplier)
        : undefined
    };

    this.policies[channel] = scaledPolicy;
    this.channels.get(channel)?.updatePolicy(scaledPolicy);
  }

  private resolveChannel<T>(
    config: ExtendedAxiosRequestConfig<T>
  ): ChannelName {
    const metaChannel = config.meta?.channel;
    if (metaChannel) return metaChannel;

    const method = (config.method || 'get').toLowerCase();
    const url = (config.url || '').toLowerCase();

    if (config.meta?.priority === 'bulk') return 'bulk';

    if (config.onUploadProgress || config.onDownloadProgress) {
      return 'bulk';
    }

    if (
      url.includes('/upload') ||
      url.includes('/download') ||
      url.includes('/export')
    ) {
      return 'bulk';
    }

    if (method === 'get') {
      return 'ui';
    }

    return this.defaultChannel;
  }

  private resolveContext<T>(
    config: ExtendedAxiosRequestConfig<T>,
    channel: ChannelName
  ): ResolvedRequestContext {
    const policy = this.policies[channel];
    const collapseKey = config.meta?.collapseKey;
    const enableProgressGuard =
      config.meta?.enableProgressGuard ?? policy.enableProgressGuard;
    const stallTimeoutMs = config.meta?.stallTimeoutMs ?? policy.stallTimeoutMs;

    const url = (config.url || '').toLowerCase();
    const isChatEndpoint = url.includes('/chat') || url.includes('/message');
    const allowExtendedTimeout =
      config.meta?.allowExtendedTimeout ??
      policy.allowExtendedTimeout ??
      (isChatEndpoint && this.networkQuality === 'poor');

    return {
      channel,
      collapseKey,
      enableProgressGuard,
      stallTimeoutMs,
      allowExtendedTimeout: Boolean(allowExtendedTimeout)
    };
  }
}

function computeTimeout(
  policy: RequestPolicy,
  attempt: number,
  allowExtended: boolean
) {
  const cappedMax = allowExtended
    ? policy.extendedTimeoutCap || 180000
    : policy.maxTimeout;
  const timeout =
    policy.minTimeout * Math.pow(policy.backoffMultiplier, attempt);
  return Math.min(cappedMax, timeout);
}

function computeBackoff(policy: RequestPolicy, attempt: number) {
  const base = policy.backoffBase * Math.pow(policy.backoffMultiplier, attempt);
  const jitter = Math.random() * policy.backoffJitter;
  return base + jitter;
}

function parseRetryAfter(error?: AxiosError): number | null {
  if (!error || !error.response) return null;
  const headers: any = error.response.headers || {};
  const headerVal = headers['retry-after'] ?? headers['Retry-After'];
  if (!headerVal) return null;

  // Numeric seconds
  const seconds = parseInt(headerVal as string, 10);
  if (!isNaN(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  // HTTP-date
  const dateMs = new Date(headerVal as string).getTime();
  if (!isNaN(dateMs)) {
    const diff = dateMs - Date.now();
    return diff > 0 ? diff : null;
  }

  return null;
}

function shouldRetry(
  error: unknown,
  policy: RequestPolicy,
  attempt: number,
  method: string
): boolean {
  const axiosError = error as AxiosError;

  const remaining = policy.maxRetries - attempt;
  if (remaining <= 0) return false;

  const idempotent = ['get', 'head', 'options'].includes(method);
  if (!idempotent) return false;

  if (axios.isCancel?.(axiosError)) {
    if (isTimeoutCancellation(axiosError)) {
      return idempotent;
    }
    return false;
  }

  if (!axiosError.response) {
    return true;
  }

  const status = axiosError.response.status;
  if (status === 408 || status === 429) return true;
  if (status >= 500 && status < 600) return true;

  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AnyAbortSignal = AbortSignal | GenericAbortSignal | undefined;

function isTimeoutCancellation(error: AxiosError) {
  const message = (error?.message || '').toLowerCase();
  if (message.includes('timeout') || message.includes('progress-stall')) {
    return true;
  }
  const rawCause = (error as any)?.cause;
  if (typeof rawCause === 'string') {
    const lower = rawCause.toLowerCase();
    if (lower.includes('timeout') || lower.includes('progress-stall')) {
      return true;
    }
  } else if (rawCause && typeof rawCause.message === 'string') {
    const lower = rawCause.message.toLowerCase();
    if (lower.includes('timeout') || lower.includes('progress-stall')) {
      return true;
    }
  }
  return false;
}

function mergeSignals(existing: AnyAbortSignal, controller: AbortController) {
  if (!existing) {
    return { signal: controller.signal };
  }

  if ((existing as any).aborted) {
    try {
      controller.abort((existing as any).reason);
    } catch {
      controller.abort();
    }
    return { signal: controller.signal };
  }

  const abortListener = () => {
    try {
      controller.abort((existing as any).reason);
    } catch {
      controller.abort();
    }
  };

  (existing as AbortSignal).addEventListener?.('abort', abortListener as any);
  return {
    signal: controller.signal,
    cleanup: () =>
      (existing as AbortSignal).removeEventListener?.(
        'abort',
        abortListener as any
      )
  };
}

function installProgressGuard(
  config: AxiosRequestConfig,
  stallTimeout: number,
  controller: AbortController
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const reset = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      logForAdmin({
        message: `Progress stall detected after ${stallTimeout}ms for ${config.method?.toUpperCase()} ${
          config.url
        }`
      });
      controller.abort(new CanceledError('progress-stall'));
    }, stallTimeout);
  };

  reset();

  const wrapHandler = (
    handler?: (event: AxiosProgressEvent) => void
  ): ((this: any, event: AxiosProgressEvent) => void) => {
    return function wrapped(this: any, event: AxiosProgressEvent) {
      if (!event || typeof event.loaded === 'number') {
        reset();
      }
      if (handler) handler.call(this, event);
    };
  };

  if (config.onDownloadProgress) {
    config.onDownloadProgress = wrapHandler(config.onDownloadProgress);
  } else {
    config.onDownloadProgress = wrapHandler();
  }

  if (config.onUploadProgress) {
    config.onUploadProgress = wrapHandler(config.onUploadProgress);
  }

  return () => {
    if (timer) clearTimeout(timer);
  };
}

function cloneConfig<T>(config: ExtendedAxiosRequestConfig<T>) {
  const cloned: ExtendedAxiosRequestConfig<T> = {
    ...config,
    headers: config.headers ? { ...(config.headers as any) } : undefined,
    params: config.params ? { ...(config.params as any) } : undefined,
    meta: config.meta ? { ...config.meta } : undefined
  };
  return cloned;
}

function applyCacheBuster(config: AxiosRequestConfig, attempt: number) {
  if (attempt === 0) return;
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get') return;
  const url = config.url || '';
  const separator = url.includes('?') ? '&' : '?';
  config.url = `${url}${separator}_retry=${attempt}&_ts=${Date.now()}`;
}

const schedulerInstance = new RequestScheduler();

export default schedulerInstance;
