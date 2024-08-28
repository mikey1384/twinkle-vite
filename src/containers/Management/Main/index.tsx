import React, { useEffect, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Approvals from './Approvals';
import Supermods from './Supermods';
import Moderators from './Legacy/Moderators';
import AccountTypes from './Legacy/AccountTypes';
import BannedUsers from './BannedUsers';
import Achievements from './Achievements';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';

export default function Main() {
  const { managementLevel } = useKeyContext((v) => v.myState);
  const canManage = useMemo(() => managementLevel > 1, [managementLevel]);
  const loadAccountTypes = useAppContext(
    (v) => v.requestHelpers.loadAccountTypes
  );
  const loadBannedUsers = useAppContext(
    (v) => v.requestHelpers.loadBannedUsers
  );
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
  const onLoadApprovalItems = useManagementContext(
    (v) => v.actions.onLoadApprovalItems
  );

  useEffect(() => {
    initApprovalItems();
    initModerators();
    initSupermods();
    initAccountTypes();
    initBannedUsers();
    async function initApprovalItems() {
      const approvalItems = await loadApprovalItems();
      onLoadApprovalItems(approvalItems);
    }
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
      const data = await loadBannedUsers();
      onLoadBannedUsers(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary
      componentPath="Management/Main/index"
      style={{ paddingBottom: '10rem' }}
    >
      <Approvals canManage={canManage} />
      <Achievements />
      <Supermods canManage={canManage} />
      {managementLevel > 1 && <Moderators canManage={canManage} />}
      {managementLevel > 1 && <AccountTypes canManage={canManage} />}
      <BannedUsers canManage={canManage} />
    </ErrorBoundary>
  );
}
