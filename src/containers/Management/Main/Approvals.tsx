import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import AddModeratorModal from '../Modals/AddModeratorModal';
import EditModeratorModal from '../Modals/EditModeratorModal';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useManagementContext, useKeyContext } from '~/contexts';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

export default function Approvals({ canManage }: { canManage: boolean }) {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
  const accountTypes = useManagementContext((v) => v.state.accountTypes);
  const approvalItems = useManagementContext((v) => v.state.approvalItems);
  const approvalItemsLoaded = useManagementContext(
    (v) => v.state.approvalItemsLoaded
  );
  const numApprovalItemsShown = useManagementContext(
    (v) => v.state.numApprovalItemsShown
  );

  return (
    <ErrorBoundary componentPath="Management/Main/Moderators">
      <SectionPanel
        title="Items to Approve"
        isEmpty={approvalItems.length === 0}
        emptyMessage="No items to approve"
        loaded={approvalItemsLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
      >
        <Table
          color={tableHeaderColor}
          columns={`
            minmax(15rem, 1.5fr)
            minmax(10rem, 1fr)
            minmax(15rem, 1fr)
            minmax(8rem, 1fr)
            ${canManage ? 'minmax(7rem, 1fr)' : ''}
          `}
        >
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Value</th>
              <th>Submitted at</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {approvalItems
              .filter((_: any, index: number) => index < numApprovalItemsShown)
              .map((moderator: any) => (
                <tr
                  key={moderator.id}
                  style={{ cursor: canManage ? 'pointer' : '' }}
                  onClick={() => console.log('clicked')}
                >
                  <td style={{ fontWeight: 'bold', fontSize: '1.6rem' }}>
                    {moderator.username}
                  </td>
                  <td>
                    {userId === moderator.id || moderator.online
                      ? nowLabel
                      : timeSince(moderator.lastActive)}
                  </td>
                  <td
                    style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {moderator.userType}
                  </td>
                  {canManage && (
                    <td style={{ display: 'flex', justifyContent: 'center' }}>
                      <a>{changeAccountTypeLabel}</a>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </Table>
        {moderators.length > numModeratorsShown && !searchQuery && (
          <div
            style={{
              marginTop: '2rem',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <LoadMoreButton
              transparent
              style={{ fontSize: '2rem' }}
              onClick={onLoadMoreModerators}
            />
          </div>
        )}
      </SectionPanel>
      {addModeratorModalShown && (
        <AddModeratorModal
          accountTypes={accountTypes}
          onHide={() => setAddModeratorModalShown(false)}
        />
      )}
      {moderatorModalTarget && (
        <EditModeratorModal
          accountTypes={accountTypes}
          target={moderatorModalTarget}
          onHide={() => setModeratorModalTarget(null)}
        />
      )}
    </ErrorBoundary>
  );
}
