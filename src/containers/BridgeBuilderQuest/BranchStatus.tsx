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
  return 'Needs a Twinkle branch';
}

export function BranchStatusBadge({ member }: { member: CrewMember }) {
  const verified = member.branchVerified;
  return (
    <span
      title={branchStatusText(member)}
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 1.15rem;
        font-weight: bold;
        color: ${verified ? Color.green() : Color.orange()};
      `}
    >
      <Icon icon={verified ? 'circle-check' : 'hourglass-half'} />
      {verified ? 'verified' : 'to verify'}
    </span>
  );
}
