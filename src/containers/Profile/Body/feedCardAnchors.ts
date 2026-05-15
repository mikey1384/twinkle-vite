interface ProfileFeedAnchorInput {
  feed: any;
  index: number;
  prefix: string;
}

export function getProfileFeedCardAnchorId({
  feed,
  index,
  prefix
}: ProfileFeedAnchorInput) {
  const primary = `${prefix}:${
    getAnchorPart(feed?.feedId) || `position:${index}`
  }`;
  return [
    primary,
    getLabeledAnchorPart('type', feed?.contentType),
    getLabeledAnchorPart('content', feed?.contentId),
    getLabeledAnchorPart('activity', feed?.feedActivityType),
    getLabeledAnchorPart('rootType', feed?.rootType),
    getLabeledAnchorPart('root', feed?.rootId),
    getLabeledAnchorPart(
      'uploader',
      feed?.feedUploader?.id ?? feed?.uploader?.id ?? feed?.userId
    ),
    getLabeledAnchorPart('time', feed?.timeStamp),
    getLabeledAnchorPart(
      'last',
      feed?.lastInteraction ?? feed?.viewTimeStamp
    ),
    `position:${index}`
  ]
    .filter(Boolean)
    .join('|');
}

export function getProfileFeedContentKey(feed: any) {
  const contentType = getAnchorPart(feed?.contentType) || 'unknown';
  const contentId = getAnchorPart(feed?.contentId) || 'unknown';
  return `${contentType}:${contentId}`;
}

function getLabeledAnchorPart(label: string, value: unknown) {
  const part = getAnchorPart(value);
  return part ? `${label}:${part}` : '';
}

function getAnchorPart(value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(/[|\s]+/g, '-').slice(0, 120);
}
