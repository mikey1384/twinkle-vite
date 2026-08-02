export interface BuildViewAnalyticsPayload {
  buildId: number;
  buildTitle: string;
  ownerUsername: string;
}

export function getBuildViewAnalyticsParams(
  buildView: BuildViewAnalyticsPayload
) {
  return {
    build_id: buildView.buildId,
    build_title: buildView.buildTitle,
    owner_username: buildView.ownerUsername
  };
}

export function createBuildViewOnceController(
  track: (buildView: BuildViewAnalyticsPayload) => void
) {
  let lastTrackedKey = '';

  return {
    track(key: string, buildView: BuildViewAnalyticsPayload) {
      if (!key || key === lastTrackedKey) return false;
      lastTrackedKey = key;
      track(buildView);
      return true;
    }
  };
}
