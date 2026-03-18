import { Buffer } from 'buffer';
import { Card } from '~/types';
import { userIdRef } from '~/constants/state';
import { socket } from '~/constants/sockets/api';
import { Theme } from '~/constants/css';

import {
  returnCardBurnXP,
  CHAT_ID_BASE_NUMBER,
  returnMaxRewards,
  MOD_LEVEL,
  TEACHER_LEVEL,
  ADMIN_USER_ID
} from '~/constants/defaultValues';

import axios from 'axios';
import URL from '~/constants/URL';

const twinkleDayIndexEpochMs = Date.UTC(2022, 0, 1, 0, 0, 0);
const msInDay = 86400000;
const dailyTaskStreakRepairCost = 100000;
const dailyTaskStreakDaysPerTier = 10;
const dailyTaskStreakMultiplierCap = 10;

function toNonNegativeInt(value: any) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toNullableInt(value: any) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export function toValidNextDayTimeStamp(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function clampLevel(value: any, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(1, Math.min(5, parsed));
}

function calculateDailyTaskStreakMultiplier(streakDays: any) {
  const appliedStreakDays = toNonNegativeInt(streakDays);
  return Math.min(
    Math.floor(Math.max(appliedStreakDays - 1, 0) / dailyTaskStreakDaysPerTier) + 2,
    dailyTaskStreakMultiplierCap
  );
}

function calculateDailyTaskRepairCost(streakDays: any) {
  const appliedStreakDays = toNonNegativeInt(streakDays);
  if (appliedStreakDays < 1) return 0;

  // Match repair pricing to the same 10-day tiers used by the reward boost.
  return dailyTaskStreakRepairCost * Math.max(
    1,
    calculateDailyTaskStreakMultiplier(appliedStreakDays) - 1
  );
}

function getDayIndexFromNextDayTimeStamp(nextDayTimeStamp: number) {
  const parsed = Number(nextDayTimeStamp);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor((parsed - twinkleDayIndexEpochMs) / msInDay) - 1;
}

function buildDailyTaskStreakForNextDay({
  nextDayTimeStamp,
  previousDailyTaskStatus,
  previousDailyTaskBestStreak
}: {
  nextDayTimeStamp: number;
  previousDailyTaskStatus?: any;
  previousDailyTaskBestStreak?: number;
}) {
  const currentDayIndex = getDayIndexFromNextDayTimeStamp(nextDayTimeStamp);
  const previousStreak = previousDailyTaskStatus?.streak || {};
  const rawCurrentStreak = toNonNegativeInt(previousStreak.currentStreak);
  const longestStreak = Math.max(
    toNonNegativeInt(previousStreak.longestStreak),
    toNonNegativeInt(previousDailyTaskBestStreak)
  );
  const lastCompletedDayIndex = toNullableInt(previousStreak.lastCompletedDayIndex);

  if (currentDayIndex === null) {
    return {
      currentStreak: rawCurrentStreak,
      longestStreak,
      lastCompletedDayIndex,
      rewardMultiplier: calculateDailyTaskStreakMultiplier(rawCurrentStreak),
      streakRepairAvailable: false,
      repairNoticeHidden: false,
      streakAtRisk: false,
      streakBroken: false,
      repairableStreak: 0,
      repairCost: 0
    };
  }

  const dayGap =
    lastCompletedDayIndex === null ? null : currentDayIndex - lastCompletedDayIndex;
  const streakAtRisk =
    rawCurrentStreak > 0 &&
    lastCompletedDayIndex !== null &&
    dayGap === 2;
  const streakBroken =
    rawCurrentStreak > 0 &&
    lastCompletedDayIndex !== null &&
    (dayGap || 0) > 2;
  const streakRepairAvailable = false;
  const streakIsCurrent =
    lastCompletedDayIndex === currentDayIndex ||
    lastCompletedDayIndex === currentDayIndex - 1 ||
    streakRepairAvailable;
  const effectiveCurrentStreak = streakIsCurrent ? rawCurrentStreak : 0;
  const repairableStreak = streakAtRisk ? rawCurrentStreak : 0;

  return {
    currentStreak: effectiveCurrentStreak,
    longestStreak,
    lastCompletedDayIndex,
    rewardMultiplier: calculateDailyTaskStreakMultiplier(effectiveCurrentStreak),
    streakRepairAvailable,
    repairNoticeHidden: false,
    streakAtRisk,
    streakBroken,
    repairableStreak,
    repairCost: calculateDailyTaskRepairCost(repairableStreak)
  };
}

function buildDailyTaskStatusForNextDay({
  nextDayTimeStamp,
  previousDailyTaskStatus,
  previousDailyTaskBestStreak
}: {
  nextDayTimeStamp: number;
  previousDailyTaskStatus?: any;
  previousDailyTaskBestStreak?: number;
}) {
  const grammarblesLevel = clampLevel(
    previousDailyTaskStatus?.progression?.grammarblesLevel ??
      previousDailyTaskStatus?.grammarbles?.progressionLevel ??
      previousDailyTaskStatus?.grammarbles?.currentLevel,
    1
  );
  const aiStoryLevel = clampLevel(
    previousDailyTaskStatus?.progression?.aiStoryLevel ??
      previousDailyTaskStatus?.aiStory?.progressionLevel ??
      previousDailyTaskStatus?.aiStory?.currentLevel,
    1
  );
  const streak = buildDailyTaskStreakForNextDay({
    nextDayTimeStamp,
    previousDailyTaskStatus,
    previousDailyTaskBestStreak
  });

  return {
    wordleDone: false,
    grammarblesDone: false,
    aiStoryDone: false,
    isComplete: false,
    achievedDailyGoals: [],
    streak,
    preferences: {
      boostStripCompact: !!previousDailyTaskStatus?.preferences?.boostStripCompact,
      boostStripCompactSet: !!previousDailyTaskStatus?.preferences?.boostStripCompactSet
    },
    progression: {
      grammarblesLevel,
      aiStoryLevel
    },
    reward: {
      rewardLevel: 1,
      baseMultiplier: 1,
      basicMultiplier: 1,
      excellenceMultiplier: 1,
      finalMultiplier: 1,
      basicQualified: false,
      excellenceQualified: false,
      streakMultiplier: streak.rewardMultiplier
    },
    wordle: {
      attempted: false,
      completed: false,
      failed: false,
      isSolved: false,
      numGuesses: 0,
      basicQualified: false,
      excellenceQualified: false
    },
    grammarbles: {
      attemptCount: 0,
      earnedCoins: false,
      passes: 0,
      highestPassedLevel: 0,
      currentLevel: grammarblesLevel,
      progressionLevel: grammarblesLevel,
      bestScoreAtCurrentLevel: 0,
      currentLevelPerfect: false,
      allPerfectToday: false,
      isPassed: false,
      basicQualified: false,
      excellenceQualified: false,
      excellenceMode: 'baseline',
      comparisonScore: null
    },
    aiStory: {
      highestPassedLevel: 0,
      currentLevel: aiStoryLevel,
      progressionLevel: aiStoryLevel,
      hasReadingClearAtCurrentLevel: false,
      hasListeningClearAtCurrentLevel: false,
      isPassed: false,
      basicQualified: false,
      excellenceQualified: false
    }
  };
}

export function calculateTotalBurnValue(cards: Card[]) {
  let totalBv = 0;
  for (const card of cards) {
    if (card?.level && card?.quality) {
      totalBv += returnCardBurnXP({
        cardLevel: card.level,
        cardQuality: card.quality
      });
    }
  }
  return totalBv;
}

export async function checkMicrophoneAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone access not granted:', error);
    return false;
  }
}

export function buildTodayStatsForNextDay(
  nextDayTimeStamp: number,
  todayStats?: any
) {
  const dailyTaskStatus = buildDailyTaskStatusForNextDay({
    nextDayTimeStamp,
    previousDailyTaskStatus: todayStats?.dailyTaskStatus,
    previousDailyTaskBestStreak: todayStats?.dailyTaskBestStreak
  });
  const dailyTaskPatch = buildTodayStatsPatchFromDailyTaskStatus(dailyTaskStatus);

  return {
    aiCallDuration: 0,
    xpEarned: 0,
    coinsEarned: 0,
    ...dailyTaskPatch,
    dailyTaskBestStreak: Math.max(
      dailyTaskPatch.dailyTaskBestStreak,
      toNonNegativeInt(todayStats?.dailyTaskBestStreak)
    ),
    dailyHasBonus: false,
    dailyBonusAttempted: false,
    dailyQuestionCompleted: false,
    dailyRewardResultViewed: false,
    nextDayTimeStamp
  };
}

export function buildTodayStatsPatchFromDailyTaskStatus(dailyTaskStatus?: any) {
  return {
    achievedDailyGoals: dailyTaskStatus?.achievedDailyGoals || [],
    dailyTaskStatus: dailyTaskStatus || null,
    dailyTaskStreak: dailyTaskStatus?.streak?.currentStreak || 0,
    dailyTaskBestStreak: dailyTaskStatus?.streak?.longestStreak || 0
  };
}

export function buildTodayStatsFromResponse({
  achievedDailyGoals,
  dailyTaskStreak,
  dailyTaskBestStreak,
  dailyTaskStatus,
  aiCallDuration,
  dailyHasBonus,
  dailyBonusAttempted,
  dailyRewardResultViewed,
  dailyQuestionCompleted,
  xpEarned,
  coinsEarned,
  nextMission,
  standardTimeStamp,
  nextDayTimeStamp
}: any) {
  let timeDifference = 0;
  if (standardTimeStamp) {
    timeDifference = new Date(standardTimeStamp).getTime() - Date.now();
  }

  return {
    achievedDailyGoals,
    dailyTaskStreak,
    dailyTaskBestStreak,
    dailyTaskStatus,
    aiCallDuration,
    dailyHasBonus,
    dailyBonusAttempted,
    dailyRewardResultViewed,
    dailyQuestionCompleted,
    xpEarned,
    coinsEarned,
    nextDayTimeStamp,
    nextMission,
    standardTimeStamp,
    timeDifference
  };
}

export function checkScrollIsAtTheBottom({
  content,
  container
}: {
  content: HTMLElement;
  container: HTMLElement;
}) {
  return content.offsetHeight <= container.offsetHeight + container.scrollTop;
}

export function determineUserCanRewardThis({
  canReward,
  userLevel,
  recommendations = [],
  uploader,
  userId
}: {
  canReward: boolean;
  userLevel: number;
  recommendations?: any[];
  uploader?: { id: number };
  userId: number;
}) {
  if (!userId) return false;
  let studentsCanReward = false;
  let moderatorCanReward = canReward;
  if (
    userLevel >= MOD_LEVEL &&
    !isSupermod(userLevel) &&
    uploader?.id === ADMIN_USER_ID
  ) {
    moderatorCanReward = false;
  }
  if (!isSupermod(userLevel)) {
    for (const recommendation of recommendations) {
      if (isSupermod(recommendation.level) && !recommendation.rewardDisabled) {
        studentsCanReward = true;
        moderatorCanReward = true;
        break;
      }
    }
  }
  return (studentsCanReward || moderatorCanReward) && userId !== uploader?.id;
}

export function determineXpButtonDisabled({
  rewardLevel,
  rewards,
  myId,
  xpRewardInterfaceShown
}: {
  rewardLevel: number;
  rewards: any[];
  myId: number;
  xpRewardInterfaceShown: boolean;
}) {
  const maxRewards = returnMaxRewards({ rewardLevel });
  if (xpRewardInterfaceShown) return 'Reward';
  const numTotalRewards = rewards.reduce(
    (prev, reward) => prev + reward.rewardAmount,
    0
  );
  if (numTotalRewards >= maxRewards) {
    return `${maxRewards}/${maxRewards} Twinkles`;
  }
  const numPrevRewards = rewards.reduce((prev, reward) => {
    if (reward.rewarderId === myId) {
      return prev + reward.rewardAmount;
    }
    return prev;
  }, 0);
  const maxRewardables = Math.min(Math.ceil(maxRewards / 2), 3);
  if (numPrevRewards >= maxRewardables) {
    return `${maxRewardables}/${maxRewardables} Rewarded`;
  }
  return false;
}

export function returnImageFileFromUrl({
  imageUrl,
  fileName = 'thumb.png'
}: {
  imageUrl: string;
  fileName?: string;
}) {
  const dataUri = imageUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(dataUri, 'base64');
  const file = new File([buffer], fileName);
  return file;
}

export function getAge(dateString: string) {
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getSectionFromPathname(pathname: string) {
  const result = pathname?.split('/')[1];
  return {
    section: result === '' ? 'home' : result,
    isSubsection: !!pathname?.split(result)[1]
  };
}

export function isPhone(navigator: Navigator) {
  return (
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) && !/iPad|Macintosh/i.test(navigator.userAgent)
  );
}

export function isTablet(navigator: Navigator) {
  return (
    /iPad|Macintosh/i.test(navigator.userAgent) &&
    'ontouchend' in document &&
    !/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

export function isMobile(navigator: Navigator) {
  return (
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (/iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document)
  );
}

export function isSupermod(level = 0) {
  return level >= TEACHER_LEVEL;
}

export function last(array: any[]) {
  return array[array.length - 1];
}

// Minimal theme adapter used by legacy components
// Returns color keys for roles so callers can resolve via Color[role]()
export function returnTheme(themeName?: string) {
  const roles = Theme(themeName || 'logoBlue');
  const linkColor = (roles.link?.color as string) || 'logoBlue';
  const userLinkColor = (roles.userLink?.color as string) || linkColor;
  const contentColor = (roles.content?.color as string) || 'logoBlue';
  return {
    link: { color: linkColor },
    userLink: { color: userLinkColor },
    content: { color: contentColor }
  } as const;
}

/**
 * @param callback
 * @param delay
 * @returns
 */
export function throttle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    // Clear any existing timeout
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      callback(...args);
    } else {
      lastArgs = args;
      timeoutId = window.setTimeout(() => {
        if (lastArgs) {
          lastCall = Date.now();
          callback(...lastArgs);
          lastArgs = null;
          timeoutId = null;
        }
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * @param callback
 * @param delay
 * @returns
 */
export function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
}

export function logForAdmin({
  message,
  showPopup = false
}: {
  message: string;
  showPopup?: boolean;
}) {
  if (userIdRef.current === ADMIN_USER_ID) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (showPopup) {
      socket.emit('new_log_for_admin', message);
    }
  }
}

export function objectify(array: any[] = [], id: any = 'id') {
  const result: any = {};
  for (const elem of array || []) {
    result[elem[id]] = elem;
  }
  return result;
}

export function parseChannelPath(pathId: string | number) {
  return Number(pathId) - Number(CHAT_ID_BASE_NUMBER);
}

export function scrollElementToCenter(element: any, adjustment = -50): void {
  if (!element) return;
  let offsetTop = 0;
  const body: { scrollTop: number; clientHeight: number } = document
    ? ((document.scrollingElement || document.documentElement) as {
        scrollTop: number;
        clientHeight: number;
      })
    : { scrollTop: 0, clientHeight: 0 };
  addAllOffsetTop(element);
  body.scrollTop =
    offsetTop + adjustment - (body.clientHeight - element.clientHeight) / 2;

  const appElement = document.getElementById('App') as HTMLElement;
  if (appElement) {
    appElement.scrollTop =
      offsetTop +
      adjustment -
      (appElement.clientHeight - element.clientHeight) / 2;
  }

  function addAllOffsetTop(element: HTMLElement): void {
    offsetTop += element.offsetTop;
    if (element.offsetParent) {
      addAllOffsetTop(element.offsetParent as HTMLElement);
    }
  }
}

export function scrollElementTo({
  element,
  amount
}: {
  element: HTMLElement | null;
  amount: number;
}): void {
  if (!element) return;
  let offsetTop = 0;
  const body: { scrollTop: number; clientHeight: number } = document
    ? ((document.scrollingElement || document.documentElement) as {
        scrollTop: number;
        clientHeight: number;
      })
    : { scrollTop: 0, clientHeight: 0 };
  addAllOffsetTop(element);
  body.scrollTop = offsetTop + amount - 350;
  const appElement = document.getElementById('App') as HTMLElement;
  if (appElement) {
    appElement.scrollTop = offsetTop + amount - 350;
  }
  function addAllOffsetTop(element: HTMLElement): void {
    offsetTop += element.offsetTop;
    if (element.offsetParent) {
      addAllOffsetTop(element.offsetParent as HTMLElement);
    }
  }
}

export function textIsOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

export async function attemptUpload({
  fileName,
  selectedFile,
  onUploadProgress,
  path,
  context = 'feed',
  isProfilePic,
  isAIChat = false,
  onSignedUploadMeta,
  auth
}: {
  fileName: string;
  selectedFile: File;
  onUploadProgress: (progressEvent: any) => void;
  path: string;
  context?: string;
  isProfilePic?: boolean;
  isAIChat?: boolean;
  onSignedUploadMeta?: (meta: { profileUploadToken?: string }) => void;
  auth: () => any;
}): Promise<string | void> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  const CHUNK_SIZE = 5 * 1024 * 1024;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  logForAdmin({
    message: `Attempting to upload file ${fileName}`
  });
  const { uploadId, urls, key } = await initiateUpload();
  logForAdmin({
    message: `Fetched signed S3 URLs for ${fileName}`
  });
  const parts = [];
  let start = 0;

  // Upload parts sequentially
  for (let partNumber = 0; partNumber < urls.length; partNumber++) {
    const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
    const chunk = selectedFile.slice(start, end);
    logForAdmin({
      message: `Uploading part ${partNumber + 1} of ${
        urls.length
      } for ${fileName}`
    });
    const part = await uploadPart(urls[partNumber], chunk, partNumber);
    logForAdmin({
      message: `Part ${partNumber + 1} of ${
        urls.length
      } for ${fileName} successfully uploaded`
    });
    parts.push(part);
    start = end;
  }

  await completeUpload(uploadId, key, parts);
  const result = key.split('.com')?.[1] || `/${key}`;
  logForAdmin({
    message: `Upload completed for ${fileName}. Returning key: ${result}`
  });
  return result;

  async function initiateUpload(
    attempt = 1
  ): Promise<{ uploadId: string; urls: string[]; key: string }> {
    try {
      logForAdmin({
        message: `Getting signed S3 URL for ${fileName}`
      });
      const queryParams = new URLSearchParams();
      queryParams.append('fileSize', selectedFile.size.toString());
      queryParams.append('fileName', encodeURIComponent(fileName));
      queryParams.append('path', path);
      queryParams.append('context', context);
      if (typeof isProfilePic === 'boolean') {
        queryParams.append('isProfilePic', String(isProfilePic));
      }
      if (isAIChat) {
        queryParams.append('isAIChat', 'true');
      }
      const { data } = await axios.get(
        `${URL}/content/sign-s3?${queryParams.toString()}`,
        auth()
      );
      if (onSignedUploadMeta) {
        onSignedUploadMeta({
          profileUploadToken: data?.profileUploadToken
        });
      }
      logForAdmin({
        message: `Got signed S3 URL for ${fileName}`
      });
      return data;
    } catch (error: any) {
      if (error.status === 400) {
        throw new Error(
          error?.response?.data?.error || 'ai_file_not_supported'
        );
      }
      if (attempt < MAX_RETRIES) {
        logForAdmin({
          message: `Retrying initiation, attempt ${attempt + 1}`
        });
        await sleep(RETRY_DELAY);
        return initiateUpload(attempt + 1);
      }
      throw error;
    }
  }

  async function uploadPart(
    url: string,
    chunk: Blob,
    partNumber: number,
    attempt = 1
  ): Promise<{ ETag: string; PartNumber: number }> {
    try {
      logForAdmin({
        message: `Making PUT request for part ${partNumber + 1} of ${
          urls.length
        } for ${fileName}`
      });
      const response = await axios.put(url, chunk, {
        timeout: 30000 * attempt,
        headers: {
          'Content-Type': selectedFile.type,
          ...(context === 'interactive' || context === 'mission'
            ? {
                'Content-Disposition': `attachment; filename="${fileName}"`
              }
            : {})
        },
        onUploadProgress: (progressEvent) => {
          const totalProgress =
            (partNumber * CHUNK_SIZE + progressEvent.loaded) /
            selectedFile.size;
          onUploadProgress({
            loaded: totalProgress * selectedFile.size,
            total: selectedFile.size
          });
        }
      });
      logForAdmin({
        message: `PUT request for part ${partNumber + 1} of ${
          urls.length
        } for ${fileName} completed`
      });

      const etag = response.headers?.etag || response.headers?.ETag;
      if (!etag) {
        throw new Error(
          `Missing ETag in response for part ${partNumber + 1}. Status: ${
            response.status
          }`
        );
      }

      return {
        ETag: etag.replace(/['"]/g, ''),
        PartNumber: partNumber + 1
      };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        logForAdmin({
          message: `Retrying part ${partNumber + 1}, attempt ${attempt + 1}`
        });
        await sleep(RETRY_DELAY);
        return uploadPart(url, chunk, partNumber, attempt + 1);
      }
      throw error;
    }
  }

  async function completeUpload(
    uploadId: string,
    key: string,
    parts: any[],
    attempt = 1
  ) {
    try {
      logForAdmin({
        message: `Completing upload for ${fileName}`
      });
      await axios.post(
        `${URL}/content/complete-upload`,
        { uploadId, key, parts },
        auth()
      );
      logForAdmin({
        message: `Completed upload for ${fileName}`
      });
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        logForAdmin({
          message: `Retrying completion, attempt ${attempt + 1}`
        });
        await sleep(RETRY_DELAY);
        return completeUpload(uploadId, key, parts, attempt + 1);
      }
      throw error;
    }
  }
}

export function forceIOSLayoutRecalc() {
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    requestAnimationFrame(() => {
      document.body.offsetHeight;

      const bodyStyle = document.body.style;
      const originalTransform = bodyStyle.transform;
      bodyStyle.transform = 'translateZ(0)';

      requestAnimationFrame(() => {
        bodyStyle.transform = originalTransform;
      });
    });
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
