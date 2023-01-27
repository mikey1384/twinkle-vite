import { Buffer } from 'buffer';

import {
  CHAT_ID_BASE_NUMBER,
  returnMaxRewards,
  MODERATOR_AUTH_LEVEL,
  MIKEY_ID
} from '~/constants/defaultValues';

export function checkScrollIsAtTheBottom({ content, container }) {
  return content.offsetHeight <= container.offsetHeight + container.scrollTop;
}

export function determineUserCanRewardThis({
  canReward,
  authLevel,
  recommendations = [],
  uploader,
  userId
}) {
  if (!userId) return false;
  let studentsCanReward = false;
  let moderatorCanReward = canReward;
  if (authLevel === MODERATOR_AUTH_LEVEL && uploader?.id === MIKEY_ID) {
    moderatorCanReward = false;
  }
  if (authLevel <= MODERATOR_AUTH_LEVEL) {
    for (let recommendation of recommendations) {
      if (
        recommendation.authLevel > MODERATOR_AUTH_LEVEL &&
        !recommendation.rewardDisabled
      ) {
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
  const maxRewardables = Math.min(Math.ceil(maxRewards / 2), 10);
  if (numPrevRewards >= maxRewardables) {
    return `${maxRewardables}/${maxRewardables} Rewarded`;
  }
  return false;
}

export function returnImageFileFromUrl({ imageUrl, fileName = 'thumb.png' }) {
  const dataUri = imageUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(dataUri, 'base64');
  const file = new File([buffer], fileName);
  return file;
}

export function getSectionFromPathname(pathname) {
  const result = pathname?.split('/')[1];
  return {
    section: result === '' ? 'home' : result,
    isSubsection: !!pathname?.split(result)[1]
  };
}

export function isMobile(navigator) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function last(array) {
  return array[array.length - 1];
}

export function objectify(array, id = 'id') {
  const result = {};
  for (let elem of array) {
    result[elem[id]] = elem;
  }
  return result;
}

export function parseChannelPath(pathId) {
  return Number(pathId) - Number(CHAT_ID_BASE_NUMBER);
}

export function scrollElementToCenter(element, adjustment = -50) {
  if (!element) return;
  let offsetTop = 0;
  const body = document
    ? document.scrollingElement || document.documentElement
    : {};
  addAllOffsetTop(element);
  body.scrollTop =
    offsetTop + adjustment - (body.clientHeight - element.clientHeight) / 2;
  document.getElementById('App').scrollTop =
    offsetTop +
    adjustment -
    (document.getElementById('App').clientHeight - element.clientHeight) / 2;
  function addAllOffsetTop(element) {
    offsetTop += element.offsetTop;
    if (element.offsetParent) {
      addAllOffsetTop(element.offsetParent);
    }
  }
}

export function scrollElementTo({ element, amount }) {
  if (!element) return;
  let offsetTop = 0;
  const body = document
    ? document.scrollingElement || document.documentElement
    : {};
  addAllOffsetTop(element);
  body.scrollTop = offsetTop + amount - 350;
  document.getElementById('App').scrollTop = offsetTop + amount - 350;
  function addAllOffsetTop(element) {
    offsetTop += element.offsetTop;
    if (element.offsetParent) {
      addAllOffsetTop(element.offsetParent);
    }
  }
}

export function textIsOverflown(element) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}
