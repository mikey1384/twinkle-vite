import React from 'react';
import { QuestNote } from '../StepCard';
import type { CheckinProgress } from '../types';

export default function ParentInviteStatus({
  invite
}: {
  invite: NonNullable<CheckinProgress['parentInvite']>;
}) {
  const when = (at: number) =>
    new Date(at * 1000).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  const messages = {
    held: [
      'Invitation waiting for review',
      `Mikey will review the email to ${invite.toMasked} before it is sent. You don’t need to send another request.`
    ],
    sent: [
      'Invitation sent',
      `The email was sent to ${invite.toMasked}. When you meet your friends, ask your parent to open it and press “We’re together” / “함께 있어요”. Each of you scans the code from your own Twinkle account. The link works until ${when(invite.expiresAt)}.`
    ],
    active: [
      invite.checkedIn
        ? 'Your check-in is saved'
        : 'Your parent’s check-in is open',
      invite.checkedIn
        ? `${invite.attendees} checked in. At least two kids need to scan and have their birthdates checked before Mikey reviews the meetup.`
        : `Open Check in and scan the code on your parent’s screen. Ask your friends to scan too. It stays open until ${when(invite.sessionEndsAt)}.`
    ],
    ended: [
      'The check-in session ended',
      invite.checkedIn
        ? 'Your scan is saved. If another friend still needs to check in, your parent can open the email again when you’re together. Everyone needs to scan the new code.'
        : 'You haven’t scanned this code yet. When you’re together, your parent can open the email again to start another session.'
    ],
    failed: [
      'Email delivery needs attention',
      'The email could not be sent. Mikey can retry it. Check that you gave the right address; send a new invitation if it needs correcting.'
    ],
    discarded: [
      'Invitation not sent',
      'This invitation was closed without being sent. If you still want your parent to join, you can send a new request.'
    ],
    expired: [
      'Parent link expired',
      'Send a new invitation when you want your parent to join a meetup. Your previous check-ins are saved.'
    ],
    unknown: [
      'Parent invitation recorded',
      'Delivery status isn’t available for this invitation. Ask your parent to check their email; you can send a new request if they need one.'
    ]
  };
  const [title, message] = messages[invite.state];
  return (
    <QuestNote tone={invite.state === 'failed' ? 'warning' : 'info'}>
      <strong>{title}</strong>
      <div style={{ marginTop: '0.4rem' }}>{message}</div>
    </QuestNote>
  );
}
