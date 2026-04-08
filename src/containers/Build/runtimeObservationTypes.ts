export type BuildRuntimeExplorationPlanStepKind = 'click' | 'submit-form';

export interface BuildRuntimeExplorationExpectedSignals {
  routeChange: boolean | null;
  textIncludes: string[];
  revealsLabels: string[];
}

export interface BuildRuntimeExplorationPlanStep {
  kind: BuildRuntimeExplorationPlanStepKind;
  goal: string;
  labelHints: string[];
  inputHints: string[];
  expectedSignals: BuildRuntimeExplorationExpectedSignals | null;
}

export interface BuildRuntimeExplorationPlan {
  summary: string;
  generatedFrom: 'planner' | 'heuristic';
  steps: BuildRuntimeExplorationPlanStep[];
}

export type BuildRuntimeObservationIssueKind =
  | 'error'
  | 'consoleerror'
  | 'unhandledrejection'
  | 'blankrender'
  | 'formsubmitblocked'
  | 'sdkblocked'
  | 'interactionnoop'
  | 'keyboardscroll'
  | 'playfieldmismatch';

export interface BuildRuntimeObservationIssue {
  kind: BuildRuntimeObservationIssueKind;
  message: string;
  stack: string | null;
  filename: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  createdAt: number;
}

export interface BuildRuntimeInteractionStep {
  source: 'planned' | 'generic';
  goal: string | null;
  actionKind: BuildRuntimeExplorationPlanStepKind | null;
  expectedSignals: BuildRuntimeExplorationExpectedSignals | null;
  targetLabel: string | null;
  status: 'changed' | 'unchanged' | 'skipped';
  routeBefore: string | null;
  routeAfter: string | null;
  hashBefore: string | null;
  hashAfter: string | null;
  routeChanged: boolean;
  hashChanged: boolean;
  visibleTextBefore: string | null;
  visibleTextAfter: string | null;
  headingDelta: number;
  buttonDelta: number;
  formDelta: number;
  revealedTargetLabels: string[];
  observedAt: number;
}

export interface BuildRuntimeGameplayRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BuildRuntimeGameplayTelemetry {
  playfieldBounds: BuildRuntimeGameplayRect | null;
  playerBounds: BuildRuntimeGameplayRect | null;
  overflowTop: number;
  overflowRight: number;
  overflowBottom: number;
  overflowLeft: number;
  status: 'ok' | 'out-of-bounds' | 'incomplete';
  reportedAt: number;
}

export interface BuildRuntimeHealthSnapshot {
  booted: boolean;
  meaningfulRender: boolean;
  gameLike: boolean;
  headingCount: number;
  buttonCount: number;
  formCount: number;
  viewportOverflowY: number;
  viewportOverflowX: number;
  visibleTextSample: string | null;
  interactionStatus: 'idle' | 'changed' | 'unchanged' | 'skipped';
  interactionTargetLabel: string | null;
  interactionSteps: BuildRuntimeInteractionStep[];
  gameplayTelemetry: BuildRuntimeGameplayTelemetry | null;
  observedAt: number;
}

export interface BuildRuntimeObservationState {
  buildId: number;
  codeSignature: string | null;
  issues: BuildRuntimeObservationIssue[];
  health: BuildRuntimeHealthSnapshot | null;
  updatedAt: number;
}
