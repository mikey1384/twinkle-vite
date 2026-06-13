import React from 'react';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import DeleteModal from '../DeleteModal';
import type { BuildBranchDeleteTarget } from './types';

export default function BranchActionModals({
  activeBuildTitle,
  deletingBranch,
  deletingBranchLoading,
  replaceBranchButtonLabel,
  replaceBranchTargetLabel,
  replaceMainConfirmShown,
  resetBranchConfirmShown,
  onCloseDeleteBranch,
  onCloseReplaceMainConfirm,
  onCloseResetBranchConfirm,
  onDeleteBranch,
  onReplaceMainWithCurrentBranch,
  onResetBranchToMain
}: {
  activeBuildTitle?: string | null;
  deletingBranch: BuildBranchDeleteTarget | null;
  deletingBranchLoading: boolean;
  replaceBranchButtonLabel: string;
  replaceBranchTargetLabel: string;
  replaceMainConfirmShown: boolean;
  resetBranchConfirmShown: boolean;
  onCloseDeleteBranch: () => void;
  onCloseReplaceMainConfirm: () => void;
  onCloseResetBranchConfirm: () => void;
  onDeleteBranch: (confirmTitle: string) => void | Promise<void>;
  onReplaceMainWithCurrentBranch: () => void | Promise<void>;
  onResetBranchToMain: () => void | Promise<void>;
}) {
  return (
    <>
      {deletingBranch ? (
        <DeleteModal
          title="Delete Branch"
          actionLabel="Delete Branch"
          buildTitle={deletingBranch.confirmTitle}
          loading={deletingBranchLoading}
          body={
            <>
              This permanently deletes the branch{' '}
              <b>{deletingBranch.title}</b>, including its files, Team
              comments, and Lumine chat history.
            </>
          }
          confirmLabel={
            <>
              Type <b>{deletingBranch.confirmTitle}</b> to confirm.
            </>
          }
          onHide={onCloseDeleteBranch}
          onSubmit={onDeleteBranch}
        />
      ) : null}
      {replaceMainConfirmShown ? (
        <ConfirmModal
          title={`${replaceBranchButtonLabel}?`}
          descriptionFontSize="1.1rem"
          confirmButtonColor="orange"
          confirmButtonLabel={replaceBranchButtonLabel}
          onHide={onCloseReplaceMainConfirm}
          onConfirm={onReplaceMainWithCurrentBranch}
          description={
            <div
              style={{
                width: '100%',
                textAlign: 'left',
                lineHeight: 1.5
              }}
            >
              <p>
                This will make {replaceBranchTargetLabel} identical to{' '}
                <b>{activeBuildTitle || 'this branch'}</b>.
              </p>
              <p>
                Any {replaceBranchTargetLabel} changes that are not in this
                branch will be overwritten. No merge conflict resolution will
                run.
              </p>
              {replaceBranchTargetLabel === 'Main' ? (
                <p>
                  The branch will be marked as merged after Main is replaced.
                </p>
              ) : (
                <p>Your branch will stay editable after it is replaced.</p>
              )}
            </div>
          }
        />
      ) : null}
      {resetBranchConfirmShown ? (
        <ConfirmModal
          title="Reset to Main?"
          descriptionFontSize="1.1rem"
          confirmButtonColor="orange"
          confirmButtonLabel="Reset to Main"
          onHide={onCloseResetBranchConfirm}
          onConfirm={onResetBranchToMain}
          description={
            <div
              style={{
                width: '100%',
                textAlign: 'left',
                lineHeight: 1.5
              }}
            >
              <p>
                This will make <b>{activeBuildTitle || 'this branch'}</b>{' '}
                identical to Main.
              </p>
              <p>
                Any branch changes that are not in Main will be{' '}
                <b>permanently discarded</b>. No merge conflict resolution will
                run.
              </p>
              <p>Your branch will stay editable after it is reset.</p>
            </div>
          }
        />
      ) : null}
    </>
  );
}
