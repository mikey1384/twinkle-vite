import type { BuildViewAnalyticsPayload } from '~/helpers/buildViewAnalytics';

interface BuildViewSession {
  buildId: number;
  buildView: BuildViewAnalyticsPayload | null;
  buildViewTracked: boolean;
  loaded: boolean;
}

export function getActiveBuildViewEvent({
  activeBuildId,
  isRuntimeRoute,
  session
}: {
  activeBuildId: number | null;
  isRuntimeRoute: boolean;
  session: BuildViewSession | null;
}) {
  if (
    !isRuntimeRoute ||
    !activeBuildId ||
    !session?.loaded ||
    session.buildViewTracked ||
    !session.buildView ||
    session.buildId !== activeBuildId ||
    session.buildView.buildId !== session.buildId
  ) {
    return null;
  }
  return session.buildView;
}
