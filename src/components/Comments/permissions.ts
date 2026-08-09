interface CommentActionPermissionOptions {
  canDelete: boolean;
  canEdit: boolean;
  uploaderId?: number;
  uploaderLevel?: number;
  userId?: number;
  userLevel?: number;
}

export function getCommentActionPermissions({
  canDelete,
  canEdit,
  uploaderId,
  uploaderLevel,
  userId,
  userLevel
}: CommentActionPermissionOptions) {
  const userIsUploader = Boolean(
    userId && uploaderId && Number(userId) === Number(uploaderId)
  );
  const userHasHigherLevel = Boolean(
    Number.isFinite(userLevel) &&
      Number.isFinite(uploaderLevel) &&
      Number(userLevel) > Number(uploaderLevel)
  );

  return {
    userCanDeleteThis:
      userIsUploader || (canDelete && userHasHigherLevel),
    userCanEditThis: userIsUploader || (canEdit && userHasHigherLevel),
    userIsUploader
  };
}
