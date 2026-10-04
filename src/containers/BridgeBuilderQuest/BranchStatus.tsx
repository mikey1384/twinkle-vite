import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import type { CrewMember } from './types';

// A member's branch answer is checked against the official branches. Until it
// is approved the crew's steps wait: staff approve new names, and the crew
// manager nudges members to fix vague ones.
// This is how a member's branch status reads.
export function branchStatusText(member: Pick<CrewMember, 'branch' | 'branchStatus'>) {
  if (member.branchStatus === 'official') return 'Verified';
  if (member.branchStatus === 'pending') {
    return `Staff are checking "${member.branch}"`;
  }
  if (member.branchStatus === 'rejected') {
    return `"${member.branch}" is not a Twinkle branch: pick the branch you go to`;
  }
  return 'Needs a Twinkle branch';
}

export function BranchStatusBadge({ member }: { member: CrewMember }) {
  // three states: approved; waiting for staff; or not a branch / missing, which
  // the member has to fix (a rejected name never reads as "being checked")
  const state = member.branchVerified
    ? 'verified'
    : member.branchStatus === 'pending'
    ? 'checking'
    : 'fix';
  const look = {
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
