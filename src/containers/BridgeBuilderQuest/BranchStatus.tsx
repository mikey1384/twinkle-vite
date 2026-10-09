import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import type { CrewMember } from './types';

// Non-Twinkle members have no branch to verify. New branch names wait for the
// administrator; missing or rejected answers still need a member's choice.
export function branchStatusText(member: Pick<CrewMember, 'branch' | 'branchStatus'>) {
  if (member.branchStatus === 'not_student') return 'Not a Twinkle student';
  if (member.branchStatus === 'official') return 'Verified';
  if (member.branchStatus === 'pending') {
    return `The administrator is checking "${member.branch}"`;
  }
  if (member.branchStatus === 'rejected') {
    return `"${member.branch}" is not a Twinkle branch: choose your branch or "Not a Twinkle student"`;
  }
  return 'Choose a Twinkle branch or "Not a Twinkle student"';
}

export function BranchStatusBadge({ member }: { member: CrewMember }) {
  const state = member.branchStatus === 'not_student'
    ? 'notStudent'
    : member.branchVerified
    ? 'verified'
    : member.branchStatus === 'pending'
    ? 'checking'
    : 'fix';
  const look = {
    notStudent: { color: Color.darkGray(), icon: 'user', text: 'member' },
    verified: { color: Color.green(), icon: 'circle-check', text: 'verified' },
    checking: { color: Color.orange(), icon: 'hourglass-half', text: 'to verify' },
    fix: { color: Color.red(), icon: 'exclamation-circle', text: 'pick a branch' }
  }[state];
  return (
    <span
      title={branchStatusText(member)}
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 1.15rem;
        font-weight: bold;
        color: ${look.color};
      `}
    >
      <Icon icon={look.icon} />
      {look.text}
    </span>
  );
}
