function toSubjectId(value: unknown) {
  const subjectId = Number(value);
  return Number.isSafeInteger(subjectId) && subjectId > 0 ? subjectId : 0;
}

const mountedSubjectIds = new Map<number, number>();

// ContentListItem is shared by Explore, profile, home, search, and selection
// lists. Track mounted subject cards here so resume recovery covers every
// visible owner without duplicating state traversal in each context.
export function observeMountedSubject(subjectIdValue: unknown) {
  const subjectId = toSubjectId(subjectIdValue);
  if (!subjectId) return () => {};

  mountedSubjectIds.set(subjectId, (mountedSubjectIds.get(subjectId) || 0) + 1);
  let observed = true;
  return () => {
    if (!observed) return;
    observed = false;
    const count = mountedSubjectIds.get(subjectId) || 0;
    if (count <= 1) {
      mountedSubjectIds.delete(subjectId);
    } else {
      mountedSubjectIds.set(subjectId, count - 1);
    }
  };
}

export function getMountedSubjectIds() {
  return [...mountedSubjectIds.keys()];
}

// This is the API's documented per-request contract. Keeping resume refreshes
// below it avoids a silently truncated response and keeps each URL bounded.
export const SUBJECT_REWARD_LEVEL_SYNC_BATCH_SIZE = 200;

export function chunkSubjectIds(subjectIds: number[]) {
  const batches: number[][] = [];
  for (
    let startIndex = 0;
    startIndex < subjectIds.length;
    startIndex += SUBJECT_REWARD_LEVEL_SYNC_BATCH_SIZE
  ) {
    batches.push(
      subjectIds.slice(
        startIndex,
        startIndex + SUBJECT_REWARD_LEVEL_SYNC_BATCH_SIZE
      )
    );
  }
  return batches;
}

export async function refreshSubjectRewardLevelBatches({
  subjectIds,
  loadSubjectRewardLevels,
  shouldContinue,
  onSubject,
  onBatchError
}: {
  subjectIds: number[];
  loadSubjectRewardLevels: (subjectIds: number[]) => Promise<any[] | undefined>;
  shouldContinue: () => boolean;
  onSubject: (subject: {
    contentId: number;
    rewardLevel: number;
    rewardLevelRevision?: number;
  }) => void;
  onBatchError: (error: unknown) => void;
}) {
  for (const subjectIdBatch of chunkSubjectIds(subjectIds)) {
    if (!shouldContinue()) return;
    try {
      const subjects = (await loadSubjectRewardLevels(subjectIdBatch)) || [];
      if (!shouldContinue()) return;
      for (const subject of subjects) {
        const contentId = Number(subject?.id);
        const rewardLevel = Number(subject?.rewardLevel);
        const rewardLevelRevision = Number(subject?.rewardLevelRevision);
        if (!Number.isSafeInteger(contentId) || !Number.isFinite(rewardLevel)) {
          continue;
        }
        onSubject({
          contentId,
          rewardLevel,
          rewardLevelRevision: Number.isSafeInteger(rewardLevelRevision)
            ? rewardLevelRevision
            : undefined
        });
      }
    } catch (error) {
      // One unavailable request cannot leave every later observed subject
      // stale, so complete the remaining bounded recovery batches.
      onBatchError(error);
    }
  }
}

function collectCommentSubjectIds(comment: any, subjectIds: Set<number>) {
  if (!comment || typeof comment !== 'object') return;

  const subjectId = toSubjectId(comment.subjectId);
  if (subjectId) subjectIds.add(subjectId);

  for (const reply of comment.replies || []) {
    collectCommentSubjectIds(reply, subjectIds);
  }
}

// Content state holds canonical copies and nearby feed/target snapshots;
// mounted card ids cover lists owned by other contexts. Refreshing these ids
// on resume covers reward capacity without reloading whole feeds or threads.
export function collectObservedSubjectIds(
  contentState: Record<string, any>,
  mountedIds: number[] = []
) {
  const subjectIds = new Set<number>();

  for (const subjectIdValue of mountedIds) {
    const subjectId = toSubjectId(subjectIdValue);
    if (subjectId) subjectIds.add(subjectId);
  }

  for (const content of Object.values(contentState || {})) {
    if (!content || typeof content !== 'object') continue;

    if (content.contentType === 'subject') {
      const subjectId = toSubjectId(content.contentId || content.id);
      if (subjectId) subjectIds.add(subjectId);
    }

    const directSubjectId = toSubjectId(content.subjectId);
    if (directSubjectId) subjectIds.add(directSubjectId);

    if (content.rootType === 'subject') {
      const rootSubjectId = toSubjectId(content.rootId);
      if (rootSubjectId) subjectIds.add(rootSubjectId);
    }

    const targetSubjectId = toSubjectId(content.targetObj?.subject?.id);
    if (targetSubjectId) subjectIds.add(targetSubjectId);

    if (content.rootObj?.contentType === 'subject') {
      const rootSubjectId = toSubjectId(
        content.rootObj.contentId || content.rootObj.id
      );
      if (rootSubjectId) subjectIds.add(rootSubjectId);
    }

    for (const subject of content.subjects || []) {
      const subjectId = toSubjectId(subject?.id);
      if (subjectId) subjectIds.add(subjectId);
      for (const comment of subject?.comments || []) {
        collectCommentSubjectIds(comment, subjectIds);
      }
    }

    for (const comment of content.comments || []) {
      collectCommentSubjectIds(comment, subjectIds);
    }

    collectCommentSubjectIds(content.targetObj?.comment, subjectIds);
  }

  return [...subjectIds];
}
