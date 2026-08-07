import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export type BuildContributionLumineFixStatus =
  'needs_resolution' | 'running' | 'ready' | 'failed' | 'stale';

export interface BuildContributionLumineFix {
  id?: number | null;
  status?: BuildContributionLumineFixStatus;
  reviewRequired?: boolean;
  conflictPaths?: string[];
  changedPaths?: string[];
  sponsorUserId?: number | null;
  model?: string | null;
  reasoningEffort?: string | null;
  summary?: string | null;
  errorMessage?: string | null;
  blocksBranchSync?: boolean;
}

export interface BuildContributionLumineModelOption {
  model: string;
  label: string;
  description: string;
  defaultReasoningEffort: string;
  supportedReasoningEfforts: string[];
}

export interface BuildContributionLumineFixDetails {
  contributionBuildId?: number | null;
  canSponsor?: boolean;
  canApply?: boolean;
  modelOptions?: BuildContributionLumineModelOption[];
  modelSelection?: {
    model?: string;
    reasoningEffort?: string;
  };
  review?: {
    changedFiles?: Array<{
      path?: string;
      beforeContent?: string;
      afterContent?: string;
    }>;
  } | null;
}

function SponsorBuildContributionLumineFixButton({
  loading,
  onClick
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <GameCTAButton
      variant="purple"
      size="md"
      icon="wand-magic-sparkles"
      loading={loading}
      onClick={onClick}
    >
      Sponsor Lumine Fix
    </GameCTAButton>
  );
}

export function FixBuildContributionWithLumineButton({
  loading,
  onClick,
  size = 'md'
}: {
  loading: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <GameCTAButton
      variant="purple"
      size={size}
      icon="wand-magic-sparkles"
      loading={loading}
      onClick={onClick}
    >
      Fix with Lumine
    </GameCTAButton>
  );
}

export default function ContributionLumineFixPanel({
  fix,
  isOwner,
  presentation = 'contribution-card',
  canSponsor = false,
  onOpenDetails,
  details,
  selectedModel,
  loading,
  onSelectModel,
  onSponsor,
  onApply
}: {
  fix: BuildContributionLumineFix;
  isOwner: boolean;
  presentation?: 'contribution-card' | 'branch-main-update';
  canSponsor?: boolean;
  onOpenDetails?: () => void;
  details: BuildContributionLumineFixDetails | null;
  selectedModel: string;
  loading: string;
  onSelectModel: (model: string) => void;
  onSponsor: () => void;
  onApply: () => void;
}) {
  const status = fix.status || 'needs_resolution';
  const isBranchMainUpdate = presentation === 'branch-main-update';
  const modelOptions = Array.isArray(details?.modelOptions)
    ? details.modelOptions
    : [];
  const selectedOption = modelOptions.find(
    (option) => option.model === selectedModel
  );
  const reviewFiles = details?.review?.changedFiles || [];
  const sponsorable =
    status === 'needs_resolution' || status === 'failed' || status === 'stale';

  return (
    <div className={lumineFixPanelClass}>
      <div className={lumineFixHeadingClass}>
        <Icon icon="wand-magic-sparkles" />
        <strong>
          {getLumineFixHeading({
            status,
            reviewRequired: Boolean(fix.reviewRequired),
            isBranchMainUpdate
          })}
        </strong>
      </div>
      <span className={lumineFixCopyClass}>
        {getLumineFixCopy({
          status,
          isOwner,
          canSponsor: Boolean(details?.canSponsor) || canSponsor,
          reviewRequired: Boolean(fix.reviewRequired),
          isBranchMainUpdate
        })}
      </span>
      {status === 'ready' &&
      fix.reviewRequired &&
      !isBranchMainUpdate &&
      fix.summary ? (
        <span className={lumineFixCopyClass}>{fix.summary}</span>
      ) : null}
      {status === 'ready' && !isBranchMainUpdate && fix.changedPaths?.length ? (
        <span className={lumineFixCopyClass}>
          Lumine prepared {fix.changedPaths.length}{' '}
          {fix.changedPaths.length === 1 ? 'part' : 'parts'} of the fix.
        </span>
      ) : null}
      {/* Step 1 renders here so step 2 (model picker + confirm) expands in
          the same spot; a trigger outside the panel reads as the button
          teleporting once details load. */}
      {!details && onOpenDetails && sponsorable && canSponsor ? (
        <div className={lumineFixControlsClass}>
          <SponsorBuildContributionLumineFixButton
            loading={loading === 'load-lumine-fix'}
            onClick={onOpenDetails}
          />
        </div>
      ) : null}
      {!details && onOpenDetails && isOwner && status === 'ready' ? (
        <div className={lumineFixControlsClass}>
          <GameCTAButton
            variant="purple"
            size="md"
            icon="wand-magic-sparkles"
            loading={loading === 'load-lumine-fix'}
            onClick={onOpenDetails}
          >
            {fix.reviewRequired ? 'Review Lumine Fix' : 'Finish Lumine Fix'}
          </GameCTAButton>
        </div>
      ) : null}
      {sponsorable && details?.canSponsor ? (
        <div className={lumineFixControlsClass}>
          <label className={lumineModelLabelClass}>
            <span>Model</span>
            <select
              value={selectedModel}
              disabled={Boolean(loading)}
              onChange={(event) => onSelectModel(event.target.value)}
            >
              {modelOptions.map((option) => (
                <option key={option.model} value={option.model}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {selectedOption ? (
            <span className={lumineFixCopyClass}>
              {selectedOption.description}
            </span>
          ) : null}
          <GameCTAButton
            variant="purple"
            size="md"
            icon="wand-magic-sparkles"
            loading={loading === 'sponsor-lumine-fix'}
            disabled={!selectedOption || Boolean(loading)}
            onClick={onSponsor}
          >
            Sponsor {selectedOption?.label || 'Lumine'} Fix
          </GameCTAButton>
        </div>
      ) : null}
      {isOwner && status === 'ready' && details?.canApply ? (
        <div className={lumineFixControlsClass}>
          <strong className={lumineReviewTitleClass}>
            {fix.reviewRequired ? 'Review fix' : 'Apply resolved fix'}
          </strong>
          {reviewFiles.map((file) => (
            <details
              key={String(file.path || '')}
              className={lumineReviewFileClass}
            >
              <summary>{String(file.path || 'Changed file')}</summary>
              <span>Before Lumine</span>
              <pre>{String(file.beforeContent || '')}</pre>
              <span>Lumine&apos;s fix</span>
              <pre>{String(file.afterContent || '')}</pre>
            </details>
          ))}
          {reviewFiles.length === 0 ? (
            <span className={lumineFixErrorClass}>
              This proposal could not be verified again, so it cannot be
              applied.
            </span>
          ) : null}
          <GameCTAButton
            variant="success"
            size="md"
            icon="check"
            loading={loading === 'apply-lumine-fix'}
            disabled={reviewFiles.length === 0 || Boolean(loading)}
            onClick={onApply}
          >
            Apply Lumine Fix
          </GameCTAButton>
        </div>
      ) : null}
    </div>
  );
}

function getLumineFixHeading({
  status,
  reviewRequired,
  isBranchMainUpdate
}: {
  status: BuildContributionLumineFixStatus;
  reviewRequired: boolean;
  isBranchMainUpdate: boolean;
}) {
  if (isBranchMainUpdate) {
    if (status === 'running') return 'Lumine is fixing Main';
    if (status === 'ready') {
      return reviewRequired
        ? "Lumine's fix is ready for the project owner"
        : 'Lumine fixed Main';
    }
    if (status === 'failed') return "Lumine couldn't finish the fix";
    if (status === 'stale') return 'Main changed while Lumine was working';
    return 'Main needs a Lumine fix';
  }
  if (status === 'running') return 'Lumine is preparing a fix';
  if (status === 'ready') {
    return reviewRequired
      ? 'Lumine fix is ready to review'
      : 'Lumine combined the changes';
  }
  if (status === 'failed') return 'Lumine fix did not finish';
  if (status === 'stale') return 'Lumine fix is out of date';
  return 'This merge needs a Lumine fix';
}

function getLumineFixCopy({
  status,
  isOwner,
  canSponsor,
  reviewRequired,
  isBranchMainUpdate
}: {
  status: BuildContributionLumineFixStatus;
  isOwner: boolean;
  canSponsor: boolean;
  reviewRequired: boolean;
  isBranchMainUpdate: boolean;
}) {
  if (isBranchMainUpdate) {
    if (status === 'running') {
      return reviewRequired
        ? 'Lumine is fixing Main. The project owner will review it before Main changes.'
        : 'Lumine is fixing Main and will safely apply the result.';
    }
    if (status === 'ready') {
      return reviewRequired
        ? 'The project owner needs to approve the fix. You can update this branch after that.'
        : 'You can update this branch as soon as Main finishes refreshing.';
    }
    if (status === 'stale') {
      return 'Main changed again. Refreshing will check what it needs now.';
    }
    if (status === 'failed') {
      return 'Choose a model to ask Lumine to try again.';
    }
    return reviewRequired
      ? 'Sponsor Lumine to fix Main. The project owner will review the result.'
      : 'Sponsor Lumine to fix Main so this branch can update.';
  }
  if (status === 'running') {
    return reviewRequired
      ? 'Lumine is combining the changes. This project is set to wait for owner review before changing Main.'
      : 'Lumine is combining the changes and will apply the fix to Main automatically after safety checks pass.';
  }
  if (status === 'ready') {
    if (!reviewRequired) {
      return isOwner
        ? 'Automatic apply did not complete. Apply the validated fix below.'
        : 'Automatic apply did not complete. The project owner can finish applying the validated fix.';
    }
    return isOwner
      ? 'Review the exact fix below before applying it to Main.'
      : 'This project requires the owner to review the fix before it changes Main.';
  }
  if (status === 'failed' || status === 'stale') {
    if (status === 'stale') {
      return canSponsor
        ? 'Main changed while this fix was being prepared. Sponsor Lumine to refresh it from the latest project.'
        : 'Main changed while this fix was being prepared. An active project member can refresh it with Lumine.';
    }
    return canSponsor
      ? 'Choose a model to ask Lumine to try the fix again.'
      : 'An active project member can ask Lumine to try the fix again.';
  }
  if (!canSponsor) {
    return 'An active project member can sponsor Lumine to continue this merge.';
  }
  return reviewRequired
    ? 'Sponsor Lumine to combine the changes. This project is set to wait for owner review.'
    : 'Sponsor Lumine to combine the changes and apply the validated fix to Main automatically.';
}

const lumineFixPanelClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border: 1px solid rgba(126, 87, 194, 0.35);
  border-radius: 8px;
  padding: 0.8rem;
  background: #faf7ff;
`;

const lumineFixHeadingClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6038a5;
  font-size: 1.2rem;
`;

const lumineFixCopyClass = css`
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 650;
  line-height: 1.4;
`;

const lumineFixErrorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 750;
  line-height: 1.4;
`;

const lumineFixControlsClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  margin-top: 0.1rem;
`;

const lumineModelLabelClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: ${Color.black()};
  font-size: 1.1rem;
  font-weight: 800;
  select {
    min-height: 2.4rem;
    min-width: min(100%, 18rem);
    border: 1px solid var(--ui-border);
    border-radius: 7px;
    background: #fff;
    padding: 0.3rem 0.55rem;
    color: ${Color.black()};
    font-size: 1.1rem;
  }
`;

const lumineReviewTitleClass = css`
  color: ${Color.black()};
  font-size: 1.2rem;
`;

const lumineReviewFileClass = css`
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 7px;
  background: #fff;
  padding: 0.55rem;
  summary {
    cursor: pointer;
    color: ${Color.logoBlue()};
    font-family: 'Roboto Mono', monospace;
    font-size: 1.1rem;
    font-weight: 800;
  }
  span {
    display: block;
    margin-top: 0.65rem;
    color: ${Color.darkerGray()};
    font-size: 1.1rem;
    font-weight: 800;
  }
  pre {
    max-height: 18rem;
    overflow: auto;
    margin: 0.35rem 0 0;
    border-radius: 6px;
    background: #0f172a;
    padding: 0.65rem;
    color: #e2e8f0;
    font-size: 1.1rem;
    line-height: 1.35;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;
