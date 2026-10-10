import { useSyncExternalStore } from 'react';
import { useKeyContext } from '~/contexts';
import {
  getBranchSubmitReceipt,
  getBranchSubmitToOwnerTarget,
  subscribeBranchSubmitReceipts
} from '~/helpers/branchSubmitToOwnerHelpers';

// Whether the viewer can hand this branch to its owner right now, and whether
// the current saved work already went. Shared by the chat strip and the phone
// tab dot so they always agree with the Team tab's send panel.
export default function useBranchSendToOwner(build?: any) {
  const userId = useKeyContext((v) => v.myState.userId);
  const target = build ? getBranchSubmitToOwnerTarget({ build, userId }) : null;
  const branchBuildId = target?.branchBuildId || 0;
  const revisionHash = target?.revisionHash || '';
  const receiptSentAt = useSyncExternalStore(subscribeBranchSubmitReceipts, () =>
    getBranchSubmitReceipt({ branchBuildId, revisionHash })
  );
  const ready = Boolean(target?.hasWorkToSend);
  const sentAt = ready ? receiptSentAt || target?.submittedAt || 0 : 0;
  return {
    target: ready ? target : null,
    sentAt,
    waitingToSend: ready && !sentAt
  };
}
