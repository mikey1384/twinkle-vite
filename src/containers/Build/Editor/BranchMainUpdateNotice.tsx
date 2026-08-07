import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ContributionLumineFixPanel, {
  FixBuildContributionWithLumineButton,
  type BuildContributionLumineFix,
  type BuildContributionLumineFixDetails
} from '~/components/Build/ContributionLumineFix';
import { mobileMaxWidth } from '~/constants/css';

const noticeClass = css`
  border: 2px solid #db2777;
  border-radius: 8px;
  background: color-mix(in srgb, #ec4899 10%, #ffffff);
  color: #831843;
  padding: 0.85rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  box-shadow: 0 2px 0 rgba(190, 24, 93, 0.16);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
`;

const copyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  strong {
    font-size: 1.1rem;
    font-weight: 900;
  }
  span {
    color: #4b5563;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.35;
  }
`;

const errorClass = css`
  color: #be123c !important;
  overflow-wrap: anywhere;
`;

const actionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const fullWidthClass = css`
  grid-column: 1 / -1;
  width: 100%;
`;

export interface BranchMainLumineFixControl {
  fix: BuildContributionLumineFix;
  details: BuildContributionLumineFixDetails | null;
  selectedModel: string;
  loading: string;
  error: string;
  canSponsor: boolean;
  onOpenSponsor: () => void;
  onSelectModel: (model: string) => void;
  onSponsor: () => void;
}

export interface BranchMainUpdateNoticeControl {
  shown: boolean;
  canUpdate: boolean;
  loading: boolean;
  error: string;
  lumineFixBlocksBranchSync?: boolean;
  lumineFixTargetsCurrentBranch?: boolean;
  lumineFixControl?: BranchMainLumineFixControl | null;
  branchLumineFixControl?: {
    loading: boolean;
    onFix: () => void;
  } | null;
  onUpdate: () => Promise<void> | void;
}

export interface BranchMainUpdateNoticeProps {
  canUpdate: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
  lumineFixBlocksBranchSync?: boolean;
  lumineFixTargetsCurrentBranch?: boolean;
  lumineFixControl?: BranchMainLumineFixControl | null;
  branchLumineFixControl?: {
    loading: boolean;
    onFix: () => void;
  } | null;
  loading?: boolean;
  onUpdate: () => Promise<void> | void;
}

export default function BranchMainUpdateNotice({
  canUpdate,
  className,
  disabled = false,
  error = '',
  lumineFixBlocksBranchSync = false,
  lumineFixTargetsCurrentBranch = false,
  lumineFixControl = null,
  branchLumineFixControl = null,
  loading = false,
  onUpdate
}: BranchMainUpdateNoticeProps) {
  const title = lumineFixControl
    ? lumineFixTargetsCurrentBranch
      ? 'This branch is waiting for Lumine'
      : lumineFixBlocksBranchSync
        ? 'Main needs a quick fix'
        : 'A team branch is waiting for Lumine'
    : branchLumineFixControl
      ? 'This branch needs a quick fix'
      : canUpdate
        ? 'Main has updates'
        : 'Branch needs attention';
  const body = lumineFixControl
    ? lumineFixTargetsCurrentBranch
      ? 'Sponsor Lumine to finish safely combining this branch with Main.'
      : lumineFixBlocksBranchSync
        ? 'Sponsor Lumine to fix Main, then update this branch.'
        : 'You can sponsor its fix without stopping this branch from updating.'
    : branchLumineFixControl
      ? 'Let Lumine safely combine the overlapping changes in this branch.'
      : canUpdate
        ? 'Update this branch with the latest main changes.'
        : 'This branch cannot update from Main yet.';

  return (
    <div
      className={[noticeClass, className].filter(Boolean).join(' ')}
      aria-live="polite"
    >
      <div className={copyClass}>
        <strong>{title}</strong>
        <span>{body}</span>
        {error ? <span className={errorClass}>{error}</span> : null}
      </div>
      <div className={actionsClass}>
        {branchLumineFixControl ? (
          <FixBuildContributionWithLumineButton
            loading={branchLumineFixControl.loading}
            onClick={branchLumineFixControl.onFix}
          />
        ) : null}
        {canUpdate && !lumineFixBlocksBranchSync ? (
          <GameCTAButton
            variant="magenta"
            size="sm"
            icon="redo"
            shiny
            loading={loading}
            disabled={loading || disabled}
            onClick={handleUpdateClick}
          >
            Update from Main
          </GameCTAButton>
        ) : null}
      </div>
      {lumineFixControl ? (
        <div className={fullWidthClass}>
          <ContributionLumineFixPanel
            fix={lumineFixControl.fix}
            isOwner={false}
            presentation={
              lumineFixBlocksBranchSync && !lumineFixTargetsCurrentBranch
                ? 'branch-main-update'
                : 'contribution-card'
            }
            canSponsor={lumineFixControl.canSponsor}
            onOpenDetails={lumineFixControl.onOpenSponsor}
            details={lumineFixControl.details}
            selectedModel={lumineFixControl.selectedModel}
            loading={lumineFixControl.loading}
            onSelectModel={lumineFixControl.onSelectModel}
            onSponsor={lumineFixControl.onSponsor}
            onApply={handleUnavailableApply}
          />
        </div>
      ) : null}
      {lumineFixControl?.error ? (
        <span className={[errorClass, fullWidthClass].join(' ')}>
          {lumineFixControl.error}
        </span>
      ) : null}
    </div>
  );

  function handleUpdateClick() {
    void onUpdate();
  }

  function handleUnavailableApply() {
    return undefined;
  }
}
