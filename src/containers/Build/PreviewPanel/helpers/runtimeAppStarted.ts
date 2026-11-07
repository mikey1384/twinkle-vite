import type {
  BuildRuntimeHealthSnapshot,
  BuildRuntimeObservationIssue
} from '../../types/runtimeObservationTypes';

// Whether the app's own code was seen starting, in three states. The preview
// SDK sends booted: true only when the app's code changed the page or drew on
// a canvas; a missing signal is not a failed start (static and fully
// synchronous pages never send it). "no" needs a reported error with nothing
// meaningful on screen. Same rule as the API's normalizeBuildRuntime-
// ObservationPayload (helpers/build/lumine/runtime/observation).
export type BuildRuntimeAppStarted = 'yes' | 'no' | 'not_confirmed';

export function resolveBuildRuntimeAppStarted(
  health: Pick<BuildRuntimeHealthSnapshot, 'booted' | 'meaningfulRender'>,
  issues: Pick<BuildRuntimeObservationIssue, 'kind'>[]
): BuildRuntimeAppStarted {
  if (health.booted === true) return 'yes';
  if (
    !health.meaningfulRender &&
    issues.some(
      (issue) => issue.kind === 'error' || issue.kind === 'unhandledrejection'
    )
  ) {
    return 'no';
  }
  return 'not_confirmed';
}

export function formatBuildRuntimeAppStartedLine(
  health: Pick<BuildRuntimeHealthSnapshot, 'booted' | 'meaningfulRender'>,
  issues: Pick<BuildRuntimeObservationIssue, 'kind'>[]
) {
  const started = resolveBuildRuntimeAppStarted(health, issues);
  return started === 'yes'
    ? '- app started: yes (its code was seen changing the page)'
    : started === 'no'
      ? '- app started: no (an error was reported and nothing meaningful rendered)'
      : '- app started: not confirmed (the preview could not observe it; this alone is not a failure, judge from the screenshot and issues)';
}
