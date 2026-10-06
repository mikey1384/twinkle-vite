import { extractLiveCommentFields } from '~/helpers/liveComments';

// A comment page used to paint a spinner until GET /content answered, even when
// the comment had just been on screen in a thread (subject page, comment page,
// feed preview). Tapping its timestamp now seeds `comment<id>` in the content
// context with the copy the thread already holds, so ContentPanel can paint the
// comment itself on the first frame while the full load fills in the rest.
//
// The seed never marks the entry `loaded`: the page still runs its full load,
// and everything the thread copy lacks (rootObj/targetObj previews, viewCount)
// arrives with it. Only fields the full response always carries are copied, so
// the full load overwrites every seeded field and nothing thread-only (replies,
// load-more flags, UI flags) can linger on the page after it.
export const COMMENT_CONTENT_PAGE_SEED_FIELDS = [
  'id',
  'userId',
  'content',
  'timeStamp',
  'rootType',
  'rootId',
  'subjectId',
  'commentId',
  'replyId',
  'filePath',
  'fileName',
  'fileSize',
  'thumbUrl',
  'settings',
  'uploader',
  'likes',
  'rewards',
  'recommendations'
] as const;

// A seed is only honoured by a content page that mounts right after it was
// written (the navigation it was written for). An entry seeded for a page whose
// full load then failed must not be shown on a later, unrelated visit.
export const CONTENT_PAGE_SEED_MAX_AGE_MS = 5000;

export function buildCommentContentPageSeed(comment: any) {
  const id = Number(comment?.id || 0);
  if (!id) return null;
  if (
    comment.notFound ||
    comment.isDeleted ||
    comment.isDeleteNotification ||
    comment.isNotification
  ) {
    return null;
  }
  if (!comment.uploader?.id || !comment.timeStamp) return null;
  // Thread and preview copies carry these lists; a copy without them (a slim
  // feed row) would paint zero likes/rewards until the full load corrects it.
  if (
    !Array.isArray(comment.likes) ||
    !Array.isArray(comment.rewards) ||
    !Array.isArray(comment.recommendations)
  ) {
    return null;
  }
  const rootId = Number(comment.rootId || 0);
  if (!comment.rootType || !rootId) return null;
  // Top-level comments only. A reply's page heading names the comment it
  // answers and shows it below (targetObj), which no thread copy carries, so a
  // seeded reply would repaint its heading and grow when the full load lands.
  if (Number(comment.commentId || 0) || Number(comment.replyId || 0)) {
    return null;
  }
  // Secret-message gating on the comment page reads the root (rootType/rootId)
  // and the target subject (subjectId). The seeded paint only has the root, so
  // it needs either a subject root or a copy that states its subjectId: a
  // copy that merely lacks the field must not open a secret-gated comment.
  if (comment.rootType !== 'subject' && !('subjectId' in comment)) {
    return null;
  }
  const subjectId = Number(comment.subjectId || 0);
  if (subjectId && !(comment.rootType === 'subject' && subjectId === rootId)) {
    return null;
  }
  const seed: Record<string, any> = {};
  for (const field of COMMENT_CONTENT_PAGE_SEED_FIELDS) {
    if (comment[field] !== undefined) {
      seed[field] = comment[field];
    }
  }
  return seed;
}

// The `comment<id>` entry may already hold live fields (an edit broadcast, a
// newer thread load) observed after the copy being seeded; those stay.
export function mergeContentPageSeed({
  prevContentState,
  seed,
  seededAt
}: {
  prevContentState: any;
  seed: Record<string, any>;
  seededAt: number;
}) {
  const liveFields = prevContentState?.liveObservedAt
    ? extractLiveCommentFields(prevContentState)
    : {};
  return {
    ...prevContentState,
    ...seed,
    ...liveFields,
    contentPageSeededAt: seededAt
  };
}

export function contentPageSeedIsFresh({
  mountedAt,
  seededAt
}: {
  mountedAt: number;
  seededAt?: number;
}) {
  const seededTime = Number(seededAt || 0);
  if (!seededTime || !mountedAt) return false;
  return seededTime >= mountedAt - CONTENT_PAGE_SEED_MAX_AGE_MS;
}

// Whether ContentPanel may paint the seeded copy before the full load lands.
// The root must already be loaded in the content context: the heading names
// it and Body's secret-message gate reads it, so painting without it could
// show a comment that a secret answer hides.
export function contentPageSeedCanRender({
  contentState,
  contentType,
  isContentPage,
  mountedAt,
  rootObj
}: {
  contentState: any;
  contentType: string;
  isContentPage?: boolean;
  mountedAt: number;
  rootObj: any;
}) {
  if (!isContentPage || contentType !== 'comment') return false;
  if (!contentState || contentState.loaded) return false;
  if (
    contentState.notFound ||
    contentState.isDeleted ||
    contentState.isDeleteNotification
  ) {
    return false;
  }
  if (
    !contentPageSeedIsFresh({
      mountedAt,
      seededAt: contentState.contentPageSeededAt
    })
  ) {
    return false;
  }
  if (!contentState.uploader?.id || !contentState.timeStamp) return false;
  return Boolean(rootObj?.loaded && !rootObj.notFound && !rootObj.isDeleted);
}

export function seedCommentContentPage({
  comment,
  onSeedContentPage
}: {
  comment: any;
  onSeedContentPage: (params: {
    contentId: number;
    contentType: string;
    seed: Record<string, any>;
  }) => void;
}) {
  const seed = buildCommentContentPageSeed(comment);
  if (!seed) return;
  onSeedContentPage({ contentId: seed.id, contentType: 'comment', seed });
}
