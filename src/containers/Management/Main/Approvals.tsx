import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useManagementContext, useKeyContext } from '~/contexts';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ApproveDobModal from '../Modals/ApproveDobModal';

export default function Approvals({ canManage }: { canManage: boolean }) {
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
  const approvalItems = useManagementContext((v) => v.state.approvalItems);
  const approvalItemsLoaded = useManagementContext(
    (v) => v.state.approvalItemsLoaded
  );
  const numApprovalItemsShown = useManagementContext(
    (v) => v.state.numApprovalItemsShown
  );
  const onLoadMoreApprovalItems = useManagementContext(
    (v) => v.actions.onLoadMoreApprovalItems
  );
  const [approvalModalTarget, setApprovalModalTarget] = useState(null);

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
              .map((item: any) => (
                <tr
                  key={item.id}
                  style={{ cursor: canManage ? 'pointer' : '' }}
                  onClick={() => setApprovalModalTarget(item)}
                >
                  <td style={{ fontWeight: 'bold', fontSize: '1.6rem' }}>
                    {item.username}
                  </td>
                  <td
                    style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {item.type}
                  </td>
                  <td
                    style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {item.content}
                  </td>
                  <td>{timeSince(item.timeStamp)}</td>
                  {canManage && (
                    <td style={{ display: 'flex', justifyContent: 'center' }}>
                      <a>review</a>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </Table>
        {approvalItems.length > numApprovalItemsShown && (
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
              onClick={onLoadMoreApprovalItems}
            />
          </div>
        )}
      </SectionPanel>
      {approvalModalTarget && (
        <ApproveDobModal
          target={approvalModalTarget}
          onHide={() => setApprovalModalTarget(null)}
        />
      )}
    </ErrorBoundary>
  );
}
