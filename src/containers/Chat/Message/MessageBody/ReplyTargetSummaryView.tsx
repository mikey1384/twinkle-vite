import React from 'react';
import BuildCardTargetSummary from './BuildCardTargetSummary';
import ModerationTargetDetail from './ModerationTargetDetail';
import type { ReplyTargetSummary } from './replyTargetSummary';

// The compact quote of a card: one look for the reply composer and for the
// quote inside a sent reply.
export default function ReplyTargetSummaryView({
  summary,
  children,
  style
}: {
  summary: ReplyTargetSummary;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <BuildCardTargetSummary summary={summary} style={style}>
      {summary.moderationId ? (
        <ModerationTargetDetail modificationId={summary.moderationId} />
      ) : null}
      {children}
    </BuildCardTargetSummary>
  );
}
