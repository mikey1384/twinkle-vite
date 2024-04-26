import { Buffer } from 'buffer';
import { Theme } from '~/constants/css';
import { Card } from '~/types';

import {
  returnCardBurnXP,
  CHAT_ID_BASE_NUMBER,
  returnMaxRewards,
  MOD_LEVEL,
  TEACHER_LEVEL,
  MIKEY_ID
} from '~/constants/defaultValues';

export function calculateTotalBurnValue(cards: Card[]) {
  let totalBv = 0;
  for (const card of cards) {
    if (card.level && card.quality) {
      totalBv += returnCardBurnXP({
        cardLevel: card.level,
        cardQuality: card.quality
      });
    }
  }
  return totalBv;
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
    uploader?.id === MIKEY_ID
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

export function returnTheme(color?: string) {
  return Theme(color || 'logoBlue');
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
