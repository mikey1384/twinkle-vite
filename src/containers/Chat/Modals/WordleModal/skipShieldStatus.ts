export interface SkipShieldChecklistState {
  metLumine: boolean;
  builtWithLumineToday: boolean;
  triedPeerBuildToday: boolean;
  todayCovered: boolean;
}

export interface NormalizedSkipShieldStatus {
  shieldActive: boolean;
  todayDodgePending: boolean;
  todayCovered: boolean;
  checklist: SkipShieldChecklistState;
}

export function normalizeSkipShieldStatus(
  status: any
): NormalizedSkipShieldStatus | null {
  if (
    !status ||
    typeof status !== 'object' ||
    typeof status.shieldActive !== 'boolean' ||
    typeof status.todayDodgePending !== 'boolean' ||
    typeof status.todayCovered !== 'boolean' ||
    !status.checklist ||
    typeof status.checklist !== 'object'
  ) {
    return null;
  }
  const todayCovered = Boolean(status?.todayCovered);
  return {
    shieldActive: Boolean(status?.shieldActive),
    todayDodgePending: Boolean(status?.todayDodgePending),
    todayCovered,
    checklist: {
      metLumine: Boolean(status?.checklist?.metLumine),
      builtWithLumineToday: Boolean(
        status?.checklist?.builtWithLumineToday ??
        status?.checklist?.hasWorkingBuild
      ),
      triedPeerBuildToday: Boolean(status?.checklist?.triedPeerBuildToday),
      todayCovered
    }
  };
}

export function isSkipShieldReady(checklist: SkipShieldChecklistState | null) {
  return Boolean(
    checklist?.todayCovered ||
    (checklist?.builtWithLumineToday && checklist?.triedPeerBuildToday)
  );
}

export function isSkipShieldChecklistItemDone(
  checklist: SkipShieldChecklistState,
  item: 'builtWithLumineToday' | 'triedPeerBuildToday'
) {
  return checklist.todayCovered || checklist[item];
}

export function shouldBlockWordleClose(status: NormalizedSkipShieldStatus) {
  return (
    status.shieldActive && status.todayDodgePending && !status.todayCovered
  );
}
