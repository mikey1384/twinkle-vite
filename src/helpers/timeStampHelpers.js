import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export function timeSince(dateText) {
  const date = Number(dateText);
  const seconds = Math.floor((new Date() - date * 1000) / 1000);
  let interval = Math.floor(seconds / 31536000);
  let s = 's';
  if (interval >= 1) {
    if (interval === 1 && SELECTED_LANGUAGE === 'en') {
      interval = 'a';
      s = '';
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return `${interval}년 전`;
    }
    return interval + ' year' + s + ' ago';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    if (interval === 1 && SELECTED_LANGUAGE === 'en') {
      interval = 'a';
      s = '';
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return `${interval}달 전`;
    }
    return interval + ' month' + s + ' ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    if (interval === 1 && SELECTED_LANGUAGE === 'en') {
      interval = 'a';
      s = '';
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return `${interval}일 전`;
    }
    return interval + ' day' + s + ' ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    if (interval === 1 && SELECTED_LANGUAGE === 'en') {
      interval = 'an';
      s = '';
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return `${interval}시간 전`;
    }
    return interval + ' hour' + s + ' ago';
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    if (interval === 1 && SELECTED_LANGUAGE === 'en') {
      interval = 'a';
      s = '';
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return `${interval}분 전`;
    }
    return interval + ' minute' + s + ' ago';
  }
  s = Math.floor(seconds) > 1 ? 's' : '';
  if (seconds <= 0) {
    if (SELECTED_LANGUAGE === 'kr') {
      return '방금';
    }
    return 'just now';
  }
  if (SELECTED_LANGUAGE === 'kr') {
    return `${seconds}초 전`;
  }
  return Math.floor(seconds) + ' second' + s + ' ago';
}
