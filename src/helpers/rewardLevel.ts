interface RewardLevelContent {
  byUser?: boolean | number | string | null;
  contentId?: number | string | null;
  contentType?: string | null;
  id?: number | string | null;
  rewardLevel?: number | string | null;
  rootId?: number | string | null;
  rootObj?: RewardLevelContent | null;
  rootType?: string | null;
  targetObj?: {
    subject?: RewardLevelContent | null;
  } | null;
}

export function normalizeRewardLevel(
  rewardLevel?: number | string | null
): number {
  const normalized = Number(rewardLevel || 0);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
}

export function resolveRootRewardFallbackLevel({
  rootId,
  rootRewardLevel,
  rootType
}: {
  rootId?: number | string | null;
  rootRewardLevel?: number | string | null;
  rootType?: string | null;
}) {
  if (rootType === 'url') {
    return Number(rootId || 0) > 0 ? 1 : 0;
  }
  if (rootType === 'video') {
    return normalizeRewardLevel(rootRewardLevel) > 0 ? 1 : 0;
  }
  return normalizeRewardLevel(rootRewardLevel);
}

export function resolveSubjectRewardLevel({
  rootId,
  rootRewardLevel,
  rootType,
  subject
}: {
  rootId?: number | string | null;
  rootRewardLevel?: number | string | null;
  rootType?: string | null;
  subject?: RewardLevelContent | null;
}) {
  const subjectRewardLevel = normalizeRewardLevel(subject?.rewardLevel);
  if (subjectRewardLevel > 0) {
    return subjectRewardLevel;
  }
  if (Number(subject?.byUser || 0) > 0) {
    return 5;
  }
  return resolveRootRewardFallbackLevel({
    rootId,
    rootRewardLevel,
    rootType
  });
}

export function resolveContentRewardLevel({
  content,
  rootObj,
  subject
}: {
  content?: RewardLevelContent | null;
  rootObj?: RewardLevelContent | null;
  subject?: RewardLevelContent | null;
}) {
  const resolvedRootObj =
    rootObj?.id || rootObj?.contentId ? rootObj : content?.rootObj;
  const rootType = content?.rootType || resolvedRootObj?.contentType || null;
  const rootId =
    content?.rootId ||
    resolvedRootObj?.id ||
    resolvedRootObj?.contentId ||
    null;
  const rootRewardLevel = resolvedRootObj?.rewardLevel ?? null;
  const targetSubject = subject || content?.targetObj?.subject || null;

  if (content?.contentType === 'subject') {
    return resolveSubjectRewardLevel({
      rootId,
      rootRewardLevel,
      rootType,
      subject: content
    });
  }

  if (targetSubject?.id || normalizeRewardLevel(targetSubject?.rewardLevel)) {
    return resolveSubjectRewardLevel({
      rootId,
      rootRewardLevel,
      rootType,
      subject: targetSubject
    });
  }

  if (Number(content?.byUser || 0) > 0) {
    return 5;
  }

  return resolveRootRewardFallbackLevel({
    rootId,
    rootRewardLevel,
    rootType
  });
}

export function resolveCommentRewardLevel({
  isPreview = false,
  parent,
  rootContent,
  subject
}: {
  isPreview?: boolean;
  parent?: RewardLevelContent | null;
  rootContent?: RewardLevelContent | null;
  subject?: RewardLevelContent | null;
}) {
  if (isPreview) return 0;

  if (parent?.contentType === 'subject') {
    return resolveSubjectRewardLevel({
      rootId: parent.rootId || rootContent?.id || rootContent?.contentId,
      rootRewardLevel: rootContent?.rewardLevel,
      rootType: parent.rootType || rootContent?.contentType,
      subject: parent
    });
  }

  if (rootContent?.contentType === 'subject') {
    return resolveSubjectRewardLevel({
      rootId: rootContent.rootId || parent?.rootId,
      rootRewardLevel: parent?.rewardLevel,
      rootType: rootContent.rootType || parent?.rootType,
      subject: rootContent
    });
  }

  if (subject?.id || normalizeRewardLevel(subject?.rewardLevel)) {
    const parentIsRoot =
      parent?.contentType === 'video' || parent?.contentType === 'url';
    return resolveSubjectRewardLevel({
      rootId: parentIsRoot
        ? parent?.contentId
        : parent?.rootId || rootContent?.id || rootContent?.contentId,
      rootRewardLevel: parentIsRoot
        ? parent?.rewardLevel
        : (rootContent?.rewardLevel ?? parent?.rewardLevel),
      rootType: parentIsRoot
        ? parent?.contentType
        : parent?.rootType || rootContent?.contentType,
      subject
    });
  }

  if (parent?.contentType === 'video' || parent?.contentType === 'url') {
    return resolveRootRewardFallbackLevel({
      rootId: parent.contentId,
      rootRewardLevel: parent.rewardLevel,
      rootType: parent.contentType
    });
  }

  return resolveRootRewardFallbackLevel({
    rootId: parent?.rootId || rootContent?.id || rootContent?.contentId,
    rootRewardLevel: rootContent?.rewardLevel ?? parent?.rewardLevel,
    rootType: parent?.rootType || rootContent?.contentType
  });
}
