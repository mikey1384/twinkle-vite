import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useManagementContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ApproveModal from '../Modals/ApproveModal';

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
    <ErrorBoundary componentPath="Management/Main/Approvals">
      <SectionPanel
        title="Pending Approvals"
        isEmpty={approvalItems.length === 0}
        emptyMessage="No pending approvals"
        loaded={approvalItemsLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
      >
        <Table
          color={tableHeaderColor}
          columns={`
            minmax(10rem, 1fr)
            minmax(10rem, 1fr)
            minmax(10rem, 1fr)
            minmax(15rem, 1.2fr)
            ${canManage ? 'minmax(13rem, 1.2fr)' : ''}
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
              .map((item: any) => {
                let displayedItemContent = item.content;
                if (item.type === 'mentor') {
                  const itemData = JSON.parse(item.content);
                  displayedItemContent = `${itemData.className}, ${itemData.branchName}`;
                }

                return (
                  <tr
                    key={item.id}
                    onClick={() =>
                      canManage ? setApprovalModalTarget(item) : null
                    }
                    className={css`
                      cursor: ${canManage ? 'pointer' : ''};
                      td {
                        display: flex;
                        align-items: center;
                      }
                    `}
                  >
                    <td
                      className={css`
                        font-weight: bold;
                        font-size: 1.6rem;
                      `}
                    >
                      {item.username}
                    </td>
                    <td>{item.type}</td>
                    <td>{displayedItemContent}</td>
                    <td>{timeSince(item.timeStamp)}</td>
                    {canManage && (
                      <td
                        className={css`
                          display: flex;
                          justify-content: center;
                        `}
                      >
                        <span
                          className={css`
                            font-weight: bold;
                            color: ${Color[
                              item.status === 'approved'
                                ? 'limeGreen'
                                : item.status === 'rejected'
                                ? 'redOrange'
                                : 'logoBlue'
                            ]()};
                            &:hover {
                              text-decoration: underline;
                            }
                          `}
                        >
                          {item.status}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </Table>
        {approvalItems.length > numApprovalItemsShown && (
          <div
            className={css`
              display: flex;
              justify-content: center;
              align-items: center;
              margin-top: 2rem;
              width: 100%;
            `}
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
        <ApproveModal
          target={approvalModalTarget}
          onSetApprovalModalTarget={setApprovalModalTarget}
          onHide={() => setApprovalModalTarget(null)}
        />
      )}
    </ErrorBoundary>
  );
}
