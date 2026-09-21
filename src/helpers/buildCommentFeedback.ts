import { buildAttachmentUrl } from './attachmentHelpers';

export interface BuildFeedbackComment {
  id: number;
  username: string;
  content: string;
  fileName?: string;
  filePath?: string;
}

export interface BuildCommentFeedback {
  buildId: number;
  buildTitle: string;
  comment: BuildFeedbackComment;
  parentComment?: BuildFeedbackComment;
}

export interface BuildCommentFeedbackHandoff {
  userId: number;
  feedback: BuildCommentFeedback;
}

export function canUseBuildCommentInLumine(
  build: {
    id: number;
    userId: number;
    contributionRootBuildId?: number | null;
    hasActiveContributionInvite?: boolean;
  } | null,
  userId: number
) {
  return Boolean(
    build?.id &&
    userId &&
    !build.contributionRootBuildId &&
    (Number(build.userId) === Number(userId) ||
      build.hasActiveContributionInvite)
  );
}

export function getBuildFeedbackComment(
  value: any
): BuildFeedbackComment | null {
  if (
    !value ||
    value.isDeleted ||
    value.isNotification ||
    value.isDeleteNotification ||
    !Number.isSafeInteger(Number(value.id)) ||
    Number(value.id) <= 0
  )
    return null;
  const content = typeof value.content === 'string' ? value.content : '';
  const fileName = typeof value.fileName === 'string' ? value.fileName : '';
  const filePath = typeof value.filePath === 'string' ? value.filePath : '';
  if (!content.trim() && !(fileName && filePath)) return null;
  return {
    id: Number(value.id),
    username: String(value.uploader?.username || value.username || 'Someone'),
    content,
    ...(fileName && filePath ? { fileName, filePath } : {})
  };
}

export function getBuildCommentFeedbackHandoff({
  value,
  userId,
  buildId,
  rootBuildId
}: {
  value: unknown;
  userId: number;
  buildId: number;
  rootBuildId?: number | null;
}): BuildCommentFeedback | null {
  const handoff = value as BuildCommentFeedbackHandoff | null;
  const feedback = handoff?.feedback;
  if (
    !userId ||
    handoff?.userId !== userId ||
    !feedback ||
    !Number.isSafeInteger(feedback.buildId) ||
    feedback.buildId <= 0 ||
    feedback.buildId !== (rootBuildId || buildId) ||
    typeof feedback.buildTitle !== 'string'
  )
    return null;
  const comment = getBuildFeedbackComment(feedback.comment);
  if (!comment) return null;
  const parentComment = getBuildFeedbackComment(feedback.parentComment);
  return {
    buildId: feedback.buildId,
    buildTitle: feedback.buildTitle,
    comment,
    ...(parentComment && parentComment.id !== comment.id
      ? { parentComment }
      : {})
  };
}

export function addBuildCommentFeedback(
  current: BuildCommentFeedback[],
  feedback: BuildCommentFeedback
) {
  return current.some(
    (entry) =>
      entry.buildId === feedback.buildId &&
      entry.comment.id === feedback.comment.id
  )
    ? current
    : [...current, feedback];
}

export function formatBuildCommentFeedbackMessage(
  message: string,
  feedback: BuildCommentFeedback[]
) {
  if (!feedback.length) return message;
  return [
    message.trim() || 'Please help me address this app feedback.',
    ...feedback.map((entry) =>
      [
        `App feedback for [${escapeMarkdown(entry.buildTitle)}](/app/${entry.buildId})`,
        ...(entry.parentComment
          ? [formatComment(entry.parentComment, 'Original comment')]
          : []),
        formatComment(entry.comment, entry.parentComment ? 'Reply' : 'Comment')
      ].join('\n\n')
    )
  ].join('\n\n');
}

function formatComment(comment: BuildFeedbackComment, label: string) {
  const attachmentUrl =
    comment.filePath && comment.fileName
      ? buildAttachmentUrl({ ...comment, contentType: 'comment' }).replace(
          /[()<>\s]/g,
          (character) =>
            encodeURIComponent(character)
              .replace(/\(/g, '%28')
              .replace(/\)/g, '%29')
        )
      : '';
  return [
    `${label} by [${escapeMarkdown(comment.username)}](/comments/${comment.id}):`,
    comment.content
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n'),
    ...(attachmentUrl
      ? [
          `Attachment: [${escapeMarkdown(comment.fileName || 'File')}](${attachmentUrl})`
        ]
      : [])
  ]
    .filter(Boolean)
    .join('\n');
}

function escapeMarkdown(text: string) {
  return text.replace(/\s+/g, ' ').replace(/[\\[\]<>`*_]/g, '\\$&');
}
