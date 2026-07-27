import { useMemo } from 'react';
import { useContentContext } from '~/contexts';
import { mergeLiveCommentState } from '~/helpers/aiEnergySponsorship';

// Feed payloads, target objects, and embed props all carry point-in-time
// snapshots of a comment. The content context holds the copy that stays
// current (socket `content_edited` broadcasts, canonical request responses,
// local mutations), so surfaces rendering a snapshot overlay it from there.
export default function useLiveComment(comment: any, commentId?: number) {
  const liveCommentId = Number(
    commentId === undefined ? comment?.id || 0 : commentId || 0
  );
  const liveContentState = useContentContext(
    (v) => v.state[`comment${liveCommentId}`]
  );
  return useMemo(
    () =>
      liveCommentId ? mergeLiveCommentState(comment, liveContentState) : comment,
    [comment, liveCommentId, liveContentState]
  );
}
