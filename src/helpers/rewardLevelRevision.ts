type ShouldApplyRewardLevelUpdate = (params: {
  contentId: number;
  contentType: string;
  rewardLevel?: number;
  rewardLevelRevision?: number;
}) => boolean;

type GetCanonicalRewardLevel = (
  contentId: number,
  contentType: string
) =>
  | {
      rewardLevel?: unknown;
      rewardLevelRevision?: unknown;
    }
  | undefined;

function getRewardLevelRevision(data: unknown) {
  const revision = Number(
    (data as { rewardLevelRevision?: unknown })?.rewardLevelRevision
  );
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : undefined;
}

function getRewardLevel(data: unknown) {
  const rewardLevel = Number((data as { rewardLevel?: unknown })?.rewardLevel);
  return Number.isFinite(rewardLevel) ? rewardLevel : undefined;
}

export function getCanonicalRewardLevelSnapshot(data: unknown) {
  const rewardLevel = getRewardLevel(data);
  const rewardLevelRevision = getRewardLevelRevision(data);
  if (
    typeof rewardLevel !== 'number' ||
    typeof rewardLevelRevision !== 'number'
  ) {
    return undefined;
  }
  return { rewardLevel, rewardLevelRevision };
}

export async function resolveCanonicalRewardLevelSnapshot({
  response,
  loadCanonicalSnapshot
}: {
  response: unknown;
  loadCanonicalSnapshot: () => Promise<unknown>;
}) {
  return (
    getCanonicalRewardLevelSnapshot(response) ||
    getCanonicalRewardLevelSnapshot(await loadCanonicalSnapshot())
  );
}

export function getDisplayedSubjectRewardLevel({
  contentType,
  snapshotRewardLevel,
  canonicalRewardLevel
}: {
  contentType: string;
  snapshotRewardLevel: unknown;
  canonicalRewardLevel: unknown;
}) {
  const canonicalLevel = getRewardLevel({ rewardLevel: canonicalRewardLevel });
  if (contentType === 'subject' && typeof canonicalLevel === 'number') {
    return canonicalLevel;
  }
  return getRewardLevel({ rewardLevel: snapshotRewardLevel });
}

function hasRewardLevelSnapshot(data: unknown): boolean {
  return (
    !!data &&
    typeof data === 'object' &&
    ('rewardLevel' in data || 'rewardLevelRevision' in data)
  );
}

function getSubjectId(snapshot: any) {
  const subjectId = Number(snapshot?.contentId || snapshot?.id);
  return Number.isSafeInteger(subjectId) && subjectId > 0 ? subjectId : 0;
}

function isRevisionedRewardLevelContentType(contentType: string) {
  return contentType === 'subject' || contentType === 'video';
}

function omitStaleRewardLevel({
  snapshot,
  contentId,
  contentType,
  shouldApplyRewardLevelUpdate,
  getCanonicalRewardLevel
}: {
  snapshot: any;
  contentId: number;
  contentType: string;
  shouldApplyRewardLevelUpdate: ShouldApplyRewardLevelUpdate;
  getCanonicalRewardLevel: GetCanonicalRewardLevel;
}) {
  if (!hasRewardLevelSnapshot(snapshot)) return snapshot;
  if (
    shouldApplyRewardLevelUpdate({
      contentId,
      contentType,
      rewardLevel: getRewardLevel(snapshot),
      rewardLevelRevision: getRewardLevelRevision(snapshot)
    })
  ) {
    return snapshot;
  }

  const canonicalRewardLevel = getCanonicalRewardLevel(contentId, contentType);
  if (canonicalRewardLevel && 'rewardLevel' in canonicalRewardLevel) {
    return {
      ...snapshot,
      rewardLevel: canonicalRewardLevel.rewardLevel,
      rewardLevelRevision: canonicalRewardLevel.rewardLevelRevision
    };
  }

  // Keep the rest of a delayed hydration response: only this server-owned
  // field is versioned here. Omitting it lets a direct content merge retain
  // the newer canonical copy rather than inventing a replacement value.
  const {
    rewardLevel: _rewardLevel,
    rewardLevelRevision: _revision,
    ...rest
  } = snapshot;
  return rest;
}

function reconcileNestedSubjectSnapshots({
  value,
  shouldApplyRewardLevelUpdate,
  getCanonicalRewardLevel
}: {
  value: any;
  shouldApplyRewardLevelUpdate: ShouldApplyRewardLevelUpdate;
  getCanonicalRewardLevel: GetCanonicalRewardLevel;
}): any {
  if (Array.isArray(value)) {
    let changed = false;
    const nextValues = value.map((item) => {
      const nextItem = reconcileNestedSubjectSnapshots({
        value: item,
        shouldApplyRewardLevelUpdate,
        getCanonicalRewardLevel
      });
      changed ||= nextItem !== item;
      return nextItem;
    });
    return changed ? nextValues : value;
  }
  if (!value || typeof value !== 'object') return value;

  let nextValue = value;
  function set(key: string, nextChild: any) {
    if (nextChild === nextValue[key]) return;
    if (nextValue === value) nextValue = { ...value };
    nextValue[key] = nextChild;
  }

  if (Array.isArray(value.subjects)) {
    set(
      'subjects',
      reconcileSubjectRewardLevelSnapshots({
        subjects: value.subjects,
        shouldApplyRewardLevelUpdate,
        getCanonicalRewardLevel
      })
    );
  }

  if (value.targetObj?.subject) {
    const subjectId = getSubjectId(value.targetObj.subject);
    const subject = subjectId
      ? omitStaleRewardLevel({
          snapshot: value.targetObj.subject,
          contentId: subjectId,
          contentType: 'subject',
          shouldApplyRewardLevelUpdate,
          getCanonicalRewardLevel
        })
      : value.targetObj.subject;
    const nextSubject = reconcileNestedSubjectSnapshots({
      value: subject,
      shouldApplyRewardLevelUpdate,
      getCanonicalRewardLevel
    });
    if (nextSubject !== value.targetObj.subject) {
      set('targetObj', { ...nextValue.targetObj, subject: nextSubject });
    }
  }

  if (value.rootObj) {
    const rootIsSubject =
      value.rootType === 'subject' || value.rootObj.contentType === 'subject';
    const rootSubjectId = rootIsSubject
      ? Number(value.rootId) || getSubjectId(value.rootObj)
      : 0;
    const rootObj = rootSubjectId
      ? omitStaleRewardLevel({
          snapshot: value.rootObj,
          contentId: rootSubjectId,
          contentType: 'subject',
          shouldApplyRewardLevelUpdate,
          getCanonicalRewardLevel
        })
      : value.rootObj;
    const nextRootObj = reconcileNestedSubjectSnapshots({
      value: rootObj,
      shouldApplyRewardLevelUpdate,
      getCanonicalRewardLevel
    });
    set('rootObj', nextRootObj);
  }

  for (const key of ['comments', 'replies']) {
    if (Array.isArray(value[key])) {
      set(
        key,
        reconcileNestedSubjectSnapshots({
          value: value[key],
          shouldApplyRewardLevelUpdate,
          getCanonicalRewardLevel
        })
      );
    }
  }
  if (value.targetObj?.comment) {
    const nextComment = reconcileNestedSubjectSnapshots({
      value: value.targetObj.comment,
      shouldApplyRewardLevelUpdate,
      getCanonicalRewardLevel
    });
    if (nextComment !== value.targetObj.comment) {
      set('targetObj', { ...nextValue.targetObj, comment: nextComment });
    }
  }

  return nextValue;
}

export function reconcileSubjectRewardLevelSnapshots({
  subjects,
  shouldApplyRewardLevelUpdate,
  getCanonicalRewardLevel
}: {
  subjects: object[];
  shouldApplyRewardLevelUpdate: ShouldApplyRewardLevelUpdate;
  getCanonicalRewardLevel: GetCanonicalRewardLevel;
}) {
  let changed = false;
  const nextSubjects = subjects.map((subject: any) => {
    const subjectId = getSubjectId(subject);
    const nextSubject = subjectId
      ? omitStaleRewardLevel({
          snapshot: subject,
          contentId: subjectId,
          contentType: 'subject',
          shouldApplyRewardLevelUpdate,
          getCanonicalRewardLevel
        })
      : subject;
    const reconciledSubject = reconcileNestedSubjectSnapshots({
      value: nextSubject,
      shouldApplyRewardLevelUpdate,
      getCanonicalRewardLevel
    });
    changed ||= reconciledSubject !== subject;
    return reconciledSubject;
  });
  return changed ? nextSubjects : subjects;
}

export function reconcileHydratedRewardLevels({
  contentId,
  contentType,
  data,
  shouldApplyRewardLevelUpdate,
  getCanonicalRewardLevel
}: {
  contentId: number;
  contentType: string;
  data: object;
  shouldApplyRewardLevelUpdate: ShouldApplyRewardLevelUpdate;
  getCanonicalRewardLevel: GetCanonicalRewardLevel;
}) {
  const directContentId =
    isRevisionedRewardLevelContentType(contentType) &&
    Number.isSafeInteger(contentId) &&
    contentId > 0
      ? contentId
      : 0;
  const directContent = directContentId
    ? omitStaleRewardLevel({
        snapshot: data,
        contentId: directContentId,
        contentType,
        shouldApplyRewardLevelUpdate,
        getCanonicalRewardLevel
      })
    : data;
  return reconcileNestedSubjectSnapshots({
    value: directContent,
    shouldApplyRewardLevelUpdate,
    getCanonicalRewardLevel
  });
}

export function shouldApplyRewardLevelRevision({
  revisions,
  contentId,
  contentType,
  rewardLevelRevision
}: {
  revisions: Map<string, number>;
  contentId: number;
  contentType: string;
  rewardLevelRevision?: number;
}) {
  const contentKey = `${contentType}:${contentId}`;
  const knownRevision = revisions.get(contentKey);
  if (
    !Number.isSafeInteger(rewardLevelRevision) ||
    (rewardLevelRevision as number) < 0
  ) {
    // During rollout, an older server/event can still omit a revision. It is
    // usable only until this client has seen an ordered canonical version; it
    // must never be allowed to replace that version afterward.
    return typeof knownRevision !== 'number';
  }
  if (
    typeof knownRevision === 'number' &&
    (rewardLevelRevision as number) < knownRevision
  ) {
    return false;
  }
  revisions.set(contentKey, rewardLevelRevision as number);
  return true;
}
