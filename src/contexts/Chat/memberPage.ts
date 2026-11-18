// Presence/call display ordering and duplicate preview members never move the
// server's pagination boundary. Concurrent consumers may finish out of order.
export function applyMemberPage(channel: any, page: {
  members: any[];
  requestedMemberCursor: number;
  loadMoreShown: boolean;
  nextMemberCursor: number | null;
}) {
  // A channel reload replaces its preview and resets progress to 0. Discard
  // pages from the previous traversal, including a late terminal response.
  if (
    (channel.nextMemberCursor ?? 0) !== page.requestedMemberCursor ||
    channel.nextMemberCursor === null
  ) {
    return channel;
  }
  const members = [...(channel.members || [])];
  const seen = new Set(members.map((member) => member.id));
  for (const member of page.members) {
    if (!seen.has(member.id)) {
      members.push(member);
      seen.add(member.id);
    }
  }
  return {
    ...channel,
    members,
    nextMemberCursor: page.nextMemberCursor,
    loadMoreMembersShown: page.nextMemberCursor !== null && page.loadMoreShown
  };
}
