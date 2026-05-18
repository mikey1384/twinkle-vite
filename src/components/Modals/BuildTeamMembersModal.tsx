import React from 'react';
import { BuildUserListTrigger } from '~/components/Modals/BuildUserListModal';

export function BuildTeamMembersTrigger({
  buildId,
  children,
  className,
  disabled,
  style,
  title = 'Team members'
}: {
  buildId: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <BuildUserListTrigger
      buildId={buildId}
      className={className}
      disabled={disabled}
      emptyMessage="No team members found."
      requestHelperName="loadBuildTeamMembers"
      style={style}
      title={title}
    >
      {children}
    </BuildUserListTrigger>
  );
}
