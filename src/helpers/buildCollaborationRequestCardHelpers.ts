export type BuildCollaborationRequestStatus =
  | 'pending'
  | 'invited'
  | 'accepted'
  | 'rejected'
  | 'canceled';

export function getBuildCollaborationRequestChipLabel({
  memberLeft,
  sentByMe,
  status
}: {
  memberLeft: boolean;
  sentByMe: boolean;
  status: BuildCollaborationRequestStatus;
}) {
  if (memberLeft) return 'Left the team';
  if (status === 'accepted') return 'On the team';
  if (status === 'rejected') return 'Declined';
  if (status === 'canceled') return 'Canceled';
  if (status === 'invited') return 'Invited';
  return sentByMe ? 'Waiting for reply' : 'Waiting on you';
}
