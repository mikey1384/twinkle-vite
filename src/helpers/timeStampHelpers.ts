import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export function timeSince(dateText: string | number) {
  const date = new Date(Number(dateText) * 1000);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval: string | number = Math.floor(seconds / 31536000);
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

export function formatDate(dateText: string | number) {
  const date = new Date(Number(dateText) * 1000);
  return date.toLocaleString(SELECTED_LANGUAGE === 'kr' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Compact relative time: 3s, 1m, 2h, 3d
export function timeSinceShort(dateText: string | number) {
  const date = new Date(Number(dateText) * 1000);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds <= 0) return 'now';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
