import React from 'react';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import DeleteModal from '../DeleteModal';
import type { BuildBranchDeleteTarget } from './types';

export default function BranchActionModals({
  activeBuildTitle,
  deletingBranch,
  deletingBranchLoading,
  replaceMainConfirmShown,
  onCloseDeleteBranch,
  onCloseReplaceMainConfirm,
  onDeleteBranch,
  onReplaceMainWithCurrentBranch
}: {
  activeBuildTitle?: string | null;
  deletingBranch: BuildBranchDeleteTarget | null;
  deletingBranchLoading: boolean;
  replaceMainConfirmShown: boolean;
  onCloseDeleteBranch: () => void;
  onCloseReplaceMainConfirm: () => void;
  onDeleteBranch: (confirmTitle: string) => void | Promise<void>;
  onReplaceMainWithCurrentBranch: () => void | Promise<void>;
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
          title="Replace Main?"
          descriptionFontSize="1.1rem"
          confirmButtonColor="orange"
          confirmButtonLabel="Replace Main"
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
                This will make Main identical to{' '}
                <b>{activeBuildTitle || 'this branch'}</b>.
              </p>
              <p>
                Any Main changes that are not in this branch will be
                overwritten. No merge conflict resolution will run.
              </p>
              <p>The branch will be marked as merged after Main is replaced.</p>
            </div>
          }
        />
      ) : null}
    </>
  );
}
