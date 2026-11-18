interface MemberProfile {
  id: number;
}

export interface MemberPage {
  members: MemberProfile[];
  loadMoreShown: boolean;
  nextMemberCursor: number | null;
  allMemberIds?: number[];
}

export interface MemberPageRequest {
  nextMemberCursor?: number | null;
  members?: MemberProfile[];
  allMemberIds?: number[];
}

export function getMemberPageQuery(cursor: number) {
  // The old API only handles an exclusive lastId. userId is INT UNSIGNED.
  return `memberCursor=${cursor}&lastId=${cursor || 2 ** 32}`;
}

export function resolveMemberPage({
  members,
  loadMoreShown,
  nextMemberCursor,
  allMemberIds
}: Omit<MemberPage, 'nextMemberCursor'> & { nextMemberCursor?: number | null }): MemberPage {
  return {
    members,
    loadMoreShown,
    // During API overlap, only the unfiltered legacy page can supply the ID
    // boundary. Neither the preview nor the reordered member list can.
    nextMemberCursor: nextMemberCursor === undefined
      ? (loadMoreShown ? members[members.length - 1].id : null)
      : nextMemberCursor,
    allMemberIds
  };
}

export function applyMemberPage(channel: any, requested: MemberPageRequest, page: MemberPage) {
  // The array identities bind the response to its hydrated roster, even when
  // the cursor repeats after a reload or a terminal reconciliation. They also
  // protect membership events applied while this page was in flight.
  if (
    !channel ||
    channel.nextMemberCursor === null ||
    channel.nextMemberCursor !== requested.nextMemberCursor ||
    channel.members !== requested.members ||
    channel.allMemberIds !== requested.allMemberIds
  ) {
    return channel;
  }
  const allMemberIds = page.allMemberIds ?? channel.allMemberIds;
  const currentIds = allMemberIds ? new Set(allMemberIds) : null;
  const members = [];
  const seen = new Set<number>();
  for (const member of [...(channel.members || []), ...page.members]) {
    if ((!currentIds || currentIds.has(member.id)) && !seen.has(member.id)) {
      members.push(member);
      seen.add(member.id);
    }
  }
  const needsReconciliation = page.allMemberIds?.some((id) => !seen.has(id));
  return {
    ...channel,
    members,
    allMemberIds,
    nextMemberCursor: needsReconciliation ? 0 : page.nextMemberCursor,
    loadMoreMembersShown: Boolean(needsReconciliation) || page.loadMoreShown
  };
}
