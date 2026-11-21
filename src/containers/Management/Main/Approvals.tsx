import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useAppContext, useKeyContext, useManagementContext } from '~/contexts';
import { MIKEY_USER_ID } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ApproveModal from '../Modals/ApproveModal';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

export default function Approvals({ canManage }: { canManage: boolean }) {
  const tableHeaderRole = useRoleColor('tableHeader', { fallback: 'logoBlue' });
  const tableHeaderColor = useMemo(
    () => tableHeaderRole.colorKey || 'logoBlue',
    [tableHeaderRole.colorKey]
  );
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
  const myId = useKeyContext((v) => v.myState.userId);
  const isOwner = myId === MIKEY_USER_ID;
  const loadApprovalItemById = useAppContext(
    (v) => v.requestHelpers.loadApprovalItemById
  );
  const loadMeetupReviewEvidence = useAppContext(
    (v) => v.requestHelpers.loadMeetupReviewEvidence
  );
  const [approvalModalTarget, setApprovalModalTarget] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const revocationRequested = searchParams.has('bridgeRevocation');
  const requestedApprovalId = Number(
    searchParams.get(revocationRequested ? 'bridgeRevocation' : 'approval')
  );
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    if (
      !isOwner ||
      !Number.isSafeInteger(requestedApprovalId) ||
      requestedApprovalId <= 0
    )
      return;
    let active = true;
    setApprovalModalTarget(null);
    setRequestMessage('Opening approval…');
    void openRequestedApproval();

    return () => {
      active = false;
    };

    async function openRequestedApproval() {
      try {
        const item = revocationRequested
          ? {
              ...(await loadMeetupReviewEvidence({
                userId: requestedApprovalId,
                revocation: true
              })),
              id: `revocation-${requestedApprovalId}`,
              type: 'meetupRevocation',
              status: 'pending'
            }
          : await loadApprovalItemById(requestedApprovalId);
        if (!active) return;
        if (
          item.status === 'pending' &&
          ['dob', 'meetup', 'meetupRevocation', 'bridgeTour'].includes(
            item.type
          )
        ) {
          setApprovalModalTarget(item);
          setRequestMessage('');
        } else {
          setRequestMessage(
            'This request is no longer waiting for a decision.'
          );
        }
      } catch (error) {
        if (!active) return;
        setRequestMessage(
          (error as { status?: number })?.status === 404
            ? 'This request is no longer available.'
            : 'Could not open the request. Reload this page to try again.'
        );
      }
    }
    // The request helper is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, requestedApprovalId, revocationRequested]);

  return (
    <ErrorBoundary componentPath="Management/Main/Approvals">
      {isOwner && requestedApprovalId > 0 && requestMessage && (
        <p
          role="status"
          className={css`
            margin: 0 0 1rem;
            font-size: 1.4rem;
            color: ${Color.darkerGray()};
          `}
        >
          {requestMessage}
        </p>
      )}
      {isOwner && (
        <p
          className={css`
            margin: 0 0 1rem;
            font-size: 1.3rem;
            color: ${Color.darkerGray()};
          `}
        >
          Bridge Builder crew meetups and parent emails are decided on the{' '}
          <Link
            to="/achievements/bridge-builder/staff"
            style={{ fontWeight: 'bold' }}
          >
            Bridge Builder staff desk
          </Link>
          .
        </p>
      )}
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
            ${canManage || isOwner ? 'minmax(13rem, 1.2fr)' : ''}
          `}
        >
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Value</th>
              <th>Submitted at</th>
              {(canManage || isOwner) && <th></th>}
            </tr>
          </thead>
          <tbody>
            {approvalItems
              .filter((_: any, index: number) => index < numApprovalItemsShown)
              .map((item: any) => {
                const canDecide = ['dob', 'meetup', 'bridgeTour'].includes(
                  item.type
                )
                  ? isOwner
                  : canManage;
                let displayedItemContent = item.content;
                if (item.type === 'mentor') {
                  const itemData = JSON.parse(item.content);
                  displayedItemContent = `${itemData.className}, ${itemData.branchName}`;
                }
                if (item.type === 'bridgeTour') {
                  // the first line; the modal shows the whole evidence
                  displayedItemContent = String(item.content || '').split(
                    '\n'
                  )[0];
                }

                return (
                  <tr
                    key={item.id}
                    onClick={() => (canDecide ? openApproval(item) : null)}
                    className={css`
                      cursor: ${canDecide ? 'pointer' : ''};
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
                    {(canManage || isOwner) && (
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
              variant="ghost"
              style={{ fontSize: '2rem' }}
              onClick={onLoadMoreApprovalItems}
            />
          </div>
        )}
      </SectionPanel>
      {approvalModalTarget && (
        <ApproveModal
          key={approvalModalTarget.id}
          target={approvalModalTarget}
          onSetApprovalModalTarget={setApprovalModalTarget}
          onHide={() => openApproval(null)}
        />
      )}
    </ErrorBoundary>
  );

  function openApproval(item: any) {
    setApprovalModalTarget(item);
    if (searchParams.has('approval') || searchParams.has('bridgeRevocation')) {
      const next = new URLSearchParams(searchParams);
      next.delete('approval');
      next.delete('bridgeRevocation');
      setSearchParams(next, { replace: true });
    }
  }
}
