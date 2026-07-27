// The feed payload copy of a comment is a snapshot taken when the feed page
// was fetched. The content context copy is the live one: socket `content_edited`
// broadcasts, canonical request responses, and local mutations all land there,
// including the swap of an AI Energy placeholder for the generated reply. So
// for one comment id the content copy wins, with the feed copy filling in any
// preview-only fields it does not carry.
//
// This precedence is safe because the content copy can no longer be the older
// one: FeedCard writes every arriving feed row's comments into `comment<id>`
// (`SYNC_SERVER_COMMENTS`), and that write keeps whichever copy this client
// observed most recently — so a feed page that is fresher than the cache has
// already updated the cache before this merge runs. Freshness is settled there,
// by observation order, and not here by field precedence; comments carry only a
// creation `timeStamp`, so this function could never have judged it itself.
export function chooseHomeFeedPreviewComment(
  contentComment: any,
  feedComment: any
) {
  if (!contentComment) return feedComment;
  if (!feedComment) return contentComment;
  return { ...feedComment, ...contentComment };
}
