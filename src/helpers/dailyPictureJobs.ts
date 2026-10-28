import { getLocalStorage } from './userDataHelpers';

export interface PictureDayCandidate {
  path: string;
  prompt: string;
  style: string;
  quality: string;
  paidBy: 'site' | 'battery';
  requestId?: string;
}

export interface PictureDayState {
  prompt: string;
  style: string;
  chosenPath: string;
  freeAvailable: boolean;
  candidates: PictureDayCandidate[];
}

export interface DailyPictureResult {
  questionId: number;
  userId?: number;
  requestId?: string;
  isToday: boolean;
  path?: string;
  picture: PictureDayState;
  generationFailure?: { requestId: string; message: string };
}

export interface DailyPictureJob {
  questionId: number;
  requestId: string;
  prompt: string;
  style: string;
  quality: string;
  startedAt: number;
  status: 'painting' | 'checking' | 'unconfirmed' | 'ready' | 'failed';
  picture?: PictureDayState;
  path?: string;
  isToday?: boolean;
  error?: string;
  notified?: boolean;
  backgroundOnly?: boolean;
}

type LoadPicture = (questionId: number) => Promise<DailyPictureResult>;
const RECOVERY_WINDOW_MS = 10 * 60 * 1000;
const RETAIN_MS = 7 * 24 * 60 * 60 * 1000;
const listeners = new Set<() => void>();
let snapshot: { userId: number; jobs: DailyPictureJob[] } = {
  userId: 0,
  jobs: []
};
let seenPaths: string[] = [];
let epoch = 0;
const requests = new Set<string>();
const recoveryRequests = new Set<string>();

export const dailyPictureJobs = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  syncStored() {
    if (!snapshot.userId) return;
    const saved = readSaved(snapshot.userId);
    seenPaths = [...new Set([...seenPaths, ...saved.seenPaths])].slice(-24);
    const known = new Set(snapshot.jobs.map((job) => job.requestId));
    snapshot = {
      ...snapshot,
      jobs: [
        ...snapshot.jobs.map((job) =>
          job.path && seenPaths.includes(job.path)
            ? { ...job, notified: true }
            : job
        ),
        ...saved.jobs.filter((job) => !known.has(job.requestId))
      ]
    };
    emit();
  },
  activate(userId: number) {
    if (snapshot.userId === userId) return;
    epoch++;
    requests.clear();
    recoveryRequests.clear();
    const saved = readSaved(userId);
    const jobs = saved.jobs;
    seenPaths = saved.seenPaths;
    snapshot = { userId, jobs };
    emit();
  },
  async start({
    userId,
    questionId,
    prompt,
    style,
    quality,
    generate,
    load
  }: {
    userId: number;
    questionId: number;
    prompt: string;
    style: string;
    quality: string;
    generate: (args: {
      questionId: number;
      prompt: string;
      style: string;
      quality: string;
      requestId: string;
    }) => Promise<DailyPictureResult>;
    load: LoadPicture;
  }) {
    if (!userId || userId !== snapshot.userId) return;
    if (
      snapshot.jobs.some(
        (job) =>
          job.questionId === questionId && isPending(job) && !job.backgroundOnly
      )
    )
      return;
    const job: DailyPictureJob = {
      questionId,
      requestId: `daily-picture-${crypto.randomUUID()}`,
      prompt,
      style,
      quality,
      startedAt: Date.now(),
      status: 'painting'
    };
    const session = epoch;
    requests.add(job.requestId);
    update(job);
    try {
      const result = await generate({
        questionId,
        prompt,
        style,
        quality,
        requestId: job.requestId
      });
      if (session !== epoch) return;
      if (!complete(job.requestId, result)) {
        update({ ...current(job), status: 'checking' });
      }
    } catch (error: any) {
      if (session !== epoch || current(job).status === 'ready') return;
      update({ ...current(job), status: 'checking' });
      // A lost reply is not a failed generation. Only read here: never replay
      // the billable POST, and match the exact request rather than any new art.
      let fresh: DailyPictureResult | undefined;
      try {
        fresh = await load(questionId);
      } catch {
        /* retry on reconnect */
      }
      if (session !== epoch || current(job).status === 'ready') return;
      if (fresh && complete(job.requestId, fresh)) return;
      if (
        fresh?.picture &&
        !error?.isTransportError &&
        Number(error?.status) >= 400
      ) {
        update({
          ...current(job),
          picture: fresh.picture,
          isToday: fresh.isToday,
          status: 'failed',
          error:
            error?.message ||
            'Your picture could not be made. Please try again.'
        });
      }
    } finally {
      if (session === epoch) requests.delete(job.requestId);
    }
  },
  async recover(load: LoadPicture, includeUnconfirmed = false) {
    const session = epoch;
    for (const job of snapshot.jobs) {
      if (
        !isPending(job) ||
        (job.status === 'unconfirmed' && !includeUnconfirmed) ||
        requests.has(job.requestId) ||
        recoveryRequests.has(job.requestId)
      )
        continue;
      recoveryRequests.add(job.requestId);
      if (job.status === 'unconfirmed') update({ ...job, status: 'checking' });
      try {
        const result = await load(job.questionId);
        if (session !== epoch) return;
        if (
          !complete(job.requestId, result) &&
          current(job).status !== 'ready'
        ) {
          update({
            ...current(job),
            picture: result.picture,
            status:
              Date.now() - job.startedAt >= RECOVERY_WINDOW_MS
                ? 'unconfirmed'
                : 'checking'
          });
        }
      } catch {
        if (
          session === epoch &&
          isPending(current(job)) &&
          Date.now() - job.startedAt >= RECOVERY_WINDOW_MS
        ) {
          update({ ...current(job), status: 'unconfirmed' });
        }
      } finally {
        if (session === epoch) recoveryRequests.delete(job.requestId);
      }
    }
  },
  receive(result: DailyPictureResult) {
    if (
      result?.userId !== snapshot.userId ||
      !result?.requestId ||
      !result.picture
    )
      return;
    const candidate = result.picture.candidates.find(
      (c) => c.requestId === result.requestId
    );
    if (
      !candidate ||
      !isPicturePath(candidate.path) ||
      seenPaths.includes(candidate.path)
    )
      return;
    if (!snapshot.jobs.some((job) => job.requestId === result.requestId)) {
      update({
        questionId: result.questionId,
        requestId: result.requestId,
        prompt: candidate.prompt,
        style: candidate.style,
        quality: candidate.quality,
        startedAt: Date.now(),
        status: 'checking'
      });
    }
    complete(result.requestId, result);
  },
  returnToEditor(requestId: string) {
    const job = snapshot.jobs.find((item) => item.requestId === requestId);
    if (job?.status !== 'unconfirmed') return;
    // This is only a UI choice after the extended wait, never a retry or a
    // claim that the original request failed. Keep recovering it on reconnect.
    update({ ...job, backgroundOnly: true });
  },
  markNotified(requestId: string) {
    const job = snapshot.jobs.find((item) => item.requestId === requestId);
    if (!job) return;
    if (job.path)
      seenPaths = [
        ...seenPaths.filter((path) => path !== job.path),
        job.path
      ].slice(-24);
    update({ ...job, notified: true });
  }
};

export function isPending(job: DailyPictureJob) {
  return (
    job.status === 'painting' ||
    job.status === 'checking' ||
    job.status === 'unconfirmed'
  );
}

function current(job: DailyPictureJob) {
  return snapshot.jobs.find((item) => item.requestId === job.requestId) || job;
}

function complete(requestId: string, result: DailyPictureResult) {
  const job = snapshot.jobs.find((item) => item.requestId === requestId);
  if (!job || Number(result?.questionId) !== job.questionId || !result?.picture)
    return false;
  const candidate = result.picture.candidates.find(
    (item) => item.requestId === requestId
  );
  if (!candidate || !isPicturePath(candidate.path)) {
    if (result.generationFailure?.requestId !== requestId) return false;
    update({
      ...job,
      picture: result.picture,
      isToday: result.isToday,
      status: 'failed',
      error: result.generationFailure.message
    });
    return true;
  }
  update({
    ...job,
    picture: result.picture,
    path: candidate.path,
    isToday: result.isToday,
    status: 'ready',
    error: undefined,
    notified: job.notified || seenPaths.includes(candidate.path)
  });
  return true;
}

function isPicturePath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    /^daily-reflection\/[a-zA-Z0-9-]+\.(png|jpe?g|webp)$/.test(path)
  );
}

function storageKey(userId: number) {
  return `daily-picture-jobs:${userId}`;
}

function readSaved(userId: number): {
  jobs: DailyPictureJob[];
  seenPaths: string[];
} {
  const jobs: DailyPictureJob[] = [];
  let seenPaths: string[] = [];
  if (!userId) return { jobs, seenPaths };
  try {
    const saved = JSON.parse(
      getLocalStorage()?.getItem(storageKey(userId)) || '{}'
    );
    seenPaths = Array.isArray(saved.seenPaths)
      ? saved.seenPaths.filter(isPicturePath).slice(-24)
      : [];
    for (const job of Array.isArray(saved.jobs) ? saved.jobs.slice(0, 8) : []) {
      if (
        Number.isSafeInteger(job?.questionId) &&
        job.questionId > 0 &&
        typeof job.requestId === 'string' &&
        job.requestId.length > 0 &&
        job.requestId.length <= 80 &&
        typeof job.prompt === 'string' &&
        typeof job.style === 'string' &&
        typeof job.quality === 'string' &&
        Number.isFinite(job.startedAt) &&
        Date.now() - job.startedAt < RETAIN_MS
      ) {
        // Local storage remembers the request, never proves its outcome.
        jobs.push({
          questionId: job.questionId,
          requestId: job.requestId,
          prompt: job.prompt.slice(0, 1000),
          style: job.style.slice(0, 120),
          quality: job.quality,
          startedAt: job.startedAt,
          backgroundOnly: job.backgroundOnly === true,
          status: 'checking'
        });
      }
    }
  } catch {
    /* In-memory tracking still survives navigation without storage. */
  }
  return { jobs, seenPaths };
}

function update(job: DailyPictureJob) {
  snapshot = {
    ...snapshot,
    jobs: [
      job,
      ...snapshot.jobs.filter((item) => item.requestId !== job.requestId)
    ].slice(0, 24)
  };
  try {
    getLocalStorage()?.setItem(
      storageKey(snapshot.userId),
      JSON.stringify({
        seenPaths,
        jobs: snapshot.jobs
          .filter((item) => isPending(item) || !item.notified)
          .map((item) => ({
            questionId: item.questionId,
            requestId: item.requestId,
            prompt: item.prompt,
            style: item.style,
            quality: item.quality,
            startedAt: item.startedAt,
            backgroundOnly: item.backgroundOnly === true
          }))
      })
    );
  } catch {
    /* blocked/full storage does not interrupt a running request */
  }
  emit();
}

function emit() {
  listeners.forEach((listener) => listener());
}
