export function isRenderableHomeFeedTargetComment(targetComment: any) {
  return Boolean(
    targetComment &&
      !targetComment.notFound &&
      !targetComment.isDeleted &&
      !targetComment.isDeleteNotification
  );
}
