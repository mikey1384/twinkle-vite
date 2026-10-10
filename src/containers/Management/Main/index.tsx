import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Approvals from './Approvals';
import Supermods from './Supermods';
import Moderators from './Legacy/Moderators';
import AccountTypes from './Legacy/AccountTypes';
import BannedUsers from './BannedUsers';
import Achievements from './Achievements';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import WealthData from './WealthData';
import BuildRewardApprovals from './BuildRewardApprovals';

export default function Main() {
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const canManage = useMemo(() => managementLevel > 2, [managementLevel]);
  // pending approvals hold children's birthdays and mentor applicants' real
  // names and emails: approved teachers, staff account types and the admin
  // only, as the API decides (managementLevel alone comes from AP)
  const canViewApprovals = !!useKeyContext(
    (v) => v.myState.canAccessSensitiveManagement
  );
  const loadAccountTypes = useAppContext(
    (v) => v.requestHelpers.loadAccountTypes
  );
  const loadBannedUsers = useAppContext(
    (v) => v.requestHelpers.loadBannedUsers
  );
  const loadWealthData = useAppContext((v) => v.requestHelpers.loadWealthData);
  const loadModerators = useAppContext((v) => v.requestHelpers.loadModerators);
  const loadSupermods = useAppContext((v) => v.requestHelpers.loadSupermods);
  const loadApprovalItems = useAppContext(
    (v) => v.requestHelpers.loadApprovalItems
  );
  const onLoadAccountTypes = useManagementContext(
    (v) => v.actions.onLoadAccountTypes
  );
  const onLoadBannedUsers = useManagementContext(
    (v) => v.actions.onLoadBannedUsers
  );
  const onLoadModerators = useManagementContext(
    (v) => v.actions.onLoadModerators
  );
  const onLoadSupermods = useManagementContext(
    (v) => v.actions.onLoadSupermods
  );
  const onLoadWealthData = useManagementContext(
    (v) => v.actions.onLoadWealthData
  );
  const onLoadApprovalItems = useManagementContext(
    (v) => v.actions.onLoadApprovalItems
  );

  useEffect(() => {
    if (!canViewApprovals) return;
    initApprovalItems();
    async function initApprovalItems() {
      const approvalItems = await loadApprovalItems();
      onLoadApprovalItems(approvalItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewApprovals]);

  useEffect(() => {
    initModerators();
    initSupermods();
    initAccountTypes();
    initBannedUsers();
    initWealthData();
    async function initModerators() {
      const moderators = await loadModerators();
      onLoadModerators(moderators);
    }
    async function initSupermods() {
      const supermods = await loadSupermods();
      onLoadSupermods(supermods);
    }
    async function initAccountTypes() {
      const data = await loadAccountTypes();
      onLoadAccountTypes(data);
    }
    async function initBannedUsers() {
      try {
        const data = await loadBannedUsers();
        onLoadBannedUsers(data);
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 403) {
          return setBannedUsersRefused(true);
        }
        console.error(error);
      }
    }
    async function initWealthData() {
      const data = await loadWealthData();
      onLoadWealthData(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Restricted accounts are for approved teachers, staff account types and the
  // admin (the API decides; AP-derived managementLevel opens this page but not
  // that list). Declared below the effect only to keep this hunk apart from
  // the sensitive-access change; hook order is still unconditional.
  const [bannedUsersRefused, setBannedUsersRefused] = useState(false);

  return (
    <ErrorBoundary
      componentPath="Management/Main/index"
      style={{ paddingBottom: '10rem' }}
    >
      <BuildRewardApprovals />
      <WealthData />
      {canViewApprovals && <Approvals canManage={canManage} />}
      {canManage && <Achievements />}
      <Supermods canManage={canManage} />
      {canManage && <Moderators canManage={canManage} />}
      {canManage && <AccountTypes canManage={canManage} />}
      {!bannedUsersRefused && <BannedUsers canManage={canManage} />}
    </ErrorBoundary>
  );
}
