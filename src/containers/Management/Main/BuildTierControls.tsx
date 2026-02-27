import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Table from '../Table';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

type BuildPlanTier = 'free' | 'pro' | 'premium';

interface BuildAdminUsageSnapshot {
  lookbackDays: number;
  fromDayKey: string;
  toDayKey: string;
  copilotRequests: number;
  copilotPaidRequests: number;
  copilotCoinSpent: number;
  copilotRunCount: number;
  copilotInputTokens: number;
  copilotCachedInputTokens: number;
  copilotOutputTokens: number;
  copilotTotalTokens: number;
  copilotPricedTokens: number;
  copilotUnpricedTokens: number;
  copilotCostUsd: number;
  apiCallCount: number;
  apiInputTokens: number;
  apiOutputTokens: number;
  apiTotalTokens: number;
  apiCostUsd: number;
  totalTokens: number;
  totalCostUsd: number;
}

interface BuildByoAssignment {
  userId: number;
  enabled: boolean;
  assignedByUserId: number | null;
  reason: string | null;
  createdAt: number;
  updatedAt: number;
}

interface BuildByoStatus {
  enabled: boolean;
  source: 'override' | 'env' | 'none';
  assignment: BuildByoAssignment | null;
}

interface TierOverrideItem {
  userId: number;
  username: string | null;
  tier: BuildPlanTier;
  assignedByUserId: number | null;
  assignedByUsername: string | null;
  reason: string | null;
  createdAt: number;
  updatedAt: number;
  usage?: BuildAdminUsageSnapshot | null;
  byo?: BuildByoStatus | null;
}

interface UserSearchResult {
  id: number;
  username: string;
}

interface UserTierStatus {
  user: {
    id: number;
    username: string;
  };
  assignment: TierOverrideItem | null;
  effectiveTier: BuildPlanTier;
  assignedTier?: BuildPlanTier;
  byo?: BuildByoStatus | null;
  usage?: BuildAdminUsageSnapshot | null;
}

const TIER_OPTIONS: BuildPlanTier[] = ['free', 'pro', 'premium'];

export default function BuildTierControls({
  canManage
}: {
  canManage: boolean;
}) {
  const tableHeaderRole = useRoleColor('tableHeader', { fallback: 'logoBlue' });
  const tableHeaderColor = tableHeaderRole.colorKey || 'logoBlue';
  const loadBuildTierOverrides = useAppContext(
    (v) => v.requestHelpers.loadBuildTierOverrides
  );
  const loadBuildTierForUser = useAppContext(
    (v) => v.requestHelpers.loadBuildTierForUser
  );
  const setBuildTierForUser = useAppContext(
    (v) => v.requestHelpers.setBuildTierForUser
  );
  const clearBuildTierForUser = useAppContext(
    (v) => v.requestHelpers.clearBuildTierForUser
  );
  const setBuildByoForUser = useAppContext(
    (v) => v.requestHelpers.setBuildByoForUser
  );
  const clearBuildByoForUser = useAppContext(
    (v) => v.requestHelpers.clearBuildByoForUser
  );
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);

  const [loaded, setLoaded] = useState(false);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [overridesError, setOverridesError] = useState('');
  const [overrides, setOverrides] = useState<TierOverrideItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<UserTierStatus | null>(
    null
  );
  const [loadingSelectedStatus, setLoadingSelectedStatus] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [savingTierAction, setSavingTierAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const selectedUserRef = useRef<UserSearchResult | null>(null);
  const selectedUserStatusRequestRef = useRef(0);

  useEffect(() => {
    void refreshOverrides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  return (
    <ErrorBoundary componentPath="Management/Main/BuildTierControls">
      <SectionPanel
        title="Build Plan Tiers"
        loaded={loaded}
        isEmpty={!canManage && !loadingOverrides && overrides.length === 0}
        emptyMessage="No Build tier overrides"
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          canManage ? (
            <Button
              color="darkerGray"
              variant="solid"
              tone="raised"
              onClick={() => refreshOverrides()}
              disabled={loadingOverrides}
            >
              <Icon icon={loadingOverrides ? 'spinner' : 'sync'} />
              <span style={{ marginLeft: '0.7rem' }}>
                {loadingOverrides ? 'Refreshing...' : 'Refresh'}
              </span>
            </Button>
          ) : null
        }
      >
        {canManage && (
          <div
            className={css`
              margin-bottom: 1.4rem;
              padding: 1rem;
              border: 1px solid var(--border-gray);
              border-radius: 0.8rem;
              display: flex;
              flex-direction: column;
              gap: 0.9rem;
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.6rem;
              `}
            >
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search user by username"
                className={css`
                  flex: 1;
                  min-width: 14rem;
                  padding: 0.55rem 0.65rem;
                  border-radius: 0.55rem;
                  border: 1px solid var(--border-gray);
                  font-size: 1.4rem;
                `}
              />
              <Button
                color="logoBlue"
                variant="solid"
                tone="raised"
                disabled={searchingUsers}
                onClick={handleSearchUsers}
              >
                {searchingUsers ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchError ? (
              <div
                className={css`
                  color: ${Color.rose()};
                  font-size: 1.3rem;
                `}
              >
                {searchError}
              </div>
            ) : null}

            {searchResults.length > 0 && (
              <div
                className={css`
                  display: flex;
                  flex-wrap: wrap;
                  gap: 0.45rem;
                `}
              >
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={css`
                      border: 1px solid var(--border-gray);
                      border-radius: 999px;
                      background: ${selectedUser?.id === user.id
                        ? Color.logoBlue(0.16)
                        : '#fff'};
                      color: var(--text-gray);
                      font-size: 1.25rem;
                      font-weight: 700;
                      padding: 0.35rem 0.75rem;
                      cursor: pointer;
                    `}
                  >
                    {user.username} ({user.id})
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div
                className={css`
                  border: 1px solid var(--border-gray);
                  border-radius: 0.65rem;
                  padding: 0.8rem;
                  background: #fff;
                  display: flex;
                  flex-direction: column;
                  gap: 0.75rem;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.8rem;
                    flex-wrap: wrap;
                  `}
                >
                  <div
                    className={css`
                      font-size: 1.6rem;
                      font-weight: 700;
                    `}
                  >
                    {selectedUser.username} ({selectedUser.id})
                  </div>
                  <Button
                    color="darkerGray"
                    variant="solid"
                    tone="raised"
                    disabled={loadingSelectedStatus}
                    onClick={() => handleLoadSelectedUserTier(selectedUser)}
                  >
                    {loadingSelectedStatus ? 'Loading...' : 'Reload status'}
                  </Button>
                </div>

                {selectedStatus && (
                  <div
                    className={css`
                      display: flex;
                      flex-direction: column;
                      gap: 0.55rem;
                    `}
                  >
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        flex-wrap: wrap;
                      `}
                    >
                      <StatusBadge
                        label={`Effective: ${selectedStatus.effectiveTier}`}
                        color={resolveTierColor(selectedStatus.effectiveTier)}
                      />
                      <StatusBadge
                        label={`Override: ${
                          selectedStatus.assignment?.tier || 'none'
                        }`}
                        color={
                          selectedStatus.assignment
                            ? resolveTierColor(selectedStatus.assignment.tier)
                            : Color.gray(0.5)
                        }
                      />
                      <StatusBadge
                        label={`BYO: ${
                          selectedStatus.byo?.enabled ? 'enabled' : 'disabled'
                        }`}
                        color={
                          selectedStatus.byo?.enabled
                            ? Color.green()
                            : Color.gray(0.5)
                        }
                      />
                    </div>
                    {selectedStatus.byo ? (
                      <div
                        className={css`
                          font-size: 1.18rem;
                          opacity: 0.78;
                        `}
                      >
                        BYO source: {selectedStatus.byo.source}
                        {selectedStatus.byo.assignment?.reason
                          ? ` • ${selectedStatus.byo.assignment.reason}`
                          : ''}
                      </div>
                    ) : null}

                    {selectedStatus.usage && (
                      <div
                        className={css`
                          border: 1px solid var(--border-gray);
                          border-radius: 0.6rem;
                          padding: 0.7rem;
                          background: ${Color.gray(0.03)};
                          display: grid;
                          grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                          gap: 0.65rem;
                        `}
                      >
                        <UsageMetric
                          label={`Tokens (${selectedStatus.usage.lookbackDays}d)`}
                          value={formatCount(selectedStatus.usage.totalTokens)}
                          detail={`Copilot ${formatCount(
                            selectedStatus.usage.copilotTotalTokens
                          )} • API ${formatCount(selectedStatus.usage.apiTotalTokens)}`}
                        />
                        <UsageMetric
                          label="Actual Cost (USD)"
                          value={formatUsd(selectedStatus.usage.totalCostUsd)}
                          detail={`Copilot ${formatUsd(
                            selectedStatus.usage.copilotCostUsd
                          )} • API ${formatUsd(selectedStatus.usage.apiCostUsd)}`}
                        />
                        <UsageMetric
                          label="Copilot Requests"
                          value={formatCount(selectedStatus.usage.copilotRequests)}
                          detail={`Paid ${formatCount(
                            selectedStatus.usage.copilotPaidRequests
                          )} • Coins ${formatCount(
                            selectedStatus.usage.copilotCoinSpent
                          )}`}
                        />
                        <UsageMetric
                          label="Cached Input Tokens"
                          value={formatCount(
                            selectedStatus.usage.copilotCachedInputTokens
                          )}
                          detail={`Unpriced ${formatCount(
                            selectedStatus.usage.copilotUnpricedTokens
                          )}`}
                        />
                      </div>
                    )}

                    <div
                      className={css`
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.45rem;
                      `}
                    >
                      {TIER_OPTIONS.map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleSetTier(tier)}
                          disabled={savingTierAction}
                          className={css`
                            border: 1px solid var(--border-gray);
                            border-radius: 999px;
                            background: ${
                              selectedStatus.assignment?.tier === tier
                                ? resolveTierColor(tier)
                                : '#fff'
                            };
                            color: ${
                              selectedStatus.assignment?.tier === tier
                                ? '#fff'
                                : 'var(--text-gray)'
                            };
                            font-size: 1.2rem;
                            font-weight: 700;
                            padding: 0.32rem 0.72rem;
                            cursor: pointer;
                            text-transform: uppercase;
                            letter-spacing: 0.02em;
                            opacity: ${savingTierAction ? 0.7 : 1};
                          `}
                        >
                          Set {tier}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleClearTier}
                        disabled={savingTierAction || !selectedStatus.assignment}
                        className={css`
                          border: 1px solid ${Color.rose(0.4)};
                          border-radius: 999px;
                          background: #fff;
                          color: ${Color.rose()};
                          font-size: 1.2rem;
                          font-weight: 700;
                          padding: 0.32rem 0.72rem;
                          cursor: pointer;
                          opacity: ${
                            savingTierAction || !selectedStatus.assignment ? 0.6 : 1
                          };
                        `}
                      >
                        Clear override
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetByo(true)}
                        disabled={savingTierAction || selectedStatus.byo?.enabled}
                        className={css`
                          border: 1px solid ${Color.green(0.55)};
                          border-radius: 999px;
                          background: #fff;
                          color: ${Color.green(0.95)};
                          font-size: 1.2rem;
                          font-weight: 700;
                          padding: 0.32rem 0.72rem;
                          cursor: pointer;
                          opacity: ${savingTierAction || selectedStatus.byo?.enabled
                            ? 0.6
                            : 1};
                        `}
                      >
                        Enable BYO
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetByo(false)}
                        disabled={
                          savingTierAction || !selectedStatus.byo?.enabled
                        }
                        className={css`
                          border: 1px solid ${Color.orange(0.45)};
                          border-radius: 999px;
                          background: #fff;
                          color: ${Color.orange(0.95)};
                          font-size: 1.2rem;
                          font-weight: 700;
                          padding: 0.32rem 0.72rem;
                          cursor: pointer;
                          opacity: ${
                            savingTierAction || !selectedStatus.byo?.enabled
                              ? 0.6
                              : 1
                          };
                        `}
                      >
                        Disable BYO
                      </button>
                      <button
                        type="button"
                        onClick={handleClearByo}
                        disabled={
                          savingTierAction ||
                          !selectedStatus.byo ||
                          selectedStatus.byo.source !== 'override'
                        }
                        className={css`
                          border: 1px solid var(--border-gray);
                          border-radius: 999px;
                          background: #fff;
                          color: var(--text-gray);
                          font-size: 1.2rem;
                          font-weight: 700;
                          padding: 0.32rem 0.72rem;
                          cursor: pointer;
                          opacity: ${
                            savingTierAction ||
                            !selectedStatus.byo ||
                            selectedStatus.byo.source !== 'override'
                              ? 0.6
                              : 1
                          };
                        `}
                      >
                        Clear BYO override
                      </button>
                    </div>

                    <input
                      value={actionReason}
                      onChange={(event) => setActionReason(event.target.value)}
                      placeholder="Optional reason for change"
                      maxLength={180}
                      className={css`
                        padding: 0.5rem 0.6rem;
                        border-radius: 0.55rem;
                        border: 1px solid var(--border-gray);
                        font-size: 1.3rem;
                      `}
                    />

                    {actionError ? (
                      <div
                        className={css`
                          color: ${Color.rose()};
                          font-size: 1.25rem;
                        `}
                      >
                        {actionError}
                      </div>
                    ) : null}
                    {actionSuccess ? (
                      <div
                        className={css`
                          color: ${Color.green()};
                          font-size: 1.25rem;
                        `}
                      >
                        {actionSuccess}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {overridesError ? (
          <div
            className={css`
              color: ${Color.rose()};
              margin-bottom: 1rem;
            `}
          >
            {overridesError}
          </div>
        ) : null}

        <Table
          color={tableHeaderColor}
          headerFontSize="1.5rem"
          columns={`
            minmax(14rem, 1.5fr)
            minmax(10rem, 0.9fr)
            minmax(14rem, 1.2fr)
            minmax(14rem, 1.2fr)
            minmax(16rem, 1.2fr)
          `}
        >
          <thead>
            <tr>
              <th>User</th>
              <th style={{ textAlign: 'center' }}>Tier</th>
              <th>Assigned By</th>
              <th>Usage</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {overrides.map((entry) => (
              <tr
                key={entry.userId}
                onClick={() =>
                  handleSelectUser({
                    id: entry.userId,
                    username: entry.username || `user-${entry.userId}`
                  })
                }
                className={css`
                  cursor: pointer;
                `}
              >
                <td>
                  <div
                    className={css`
                      font-weight: 700;
                      font-size: 1.45rem;
                    `}
                  >
                    {entry.username || `(user ${entry.userId})`}
                  </div>
                  <div
                    className={css`
                      font-size: 1.2rem;
                      opacity: 0.75;
                    `}
                  >
                    id: {entry.userId}
                  </div>
                  {entry.reason ? (
                    <div
                      className={css`
                        margin-top: 0.25rem;
                        font-size: 1.2rem;
                        opacity: 0.82;
                      `}
                    >
                      Reason: {entry.reason}
                    </div>
                  ) : null}
                  {entry.byo ? (
                    <div
                      className={css`
                        margin-top: 0.2rem;
                        font-size: 1.16rem;
                        opacity: 0.78;
                      `}
                    >
                      BYO: {entry.byo.enabled ? 'enabled' : 'disabled'} (
                      {entry.byo.source})
                    </div>
                  ) : null}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <StatusBadge
                    label={entry.tier}
                    color={resolveTierColor(entry.tier)}
                    compact
                  />
                </td>
                <td>
                  {entry.assignedByUsername || 'Unknown'}
                  {entry.assignedByUserId ? ` (${entry.assignedByUserId})` : ''}
                </td>
                <td>
                  {entry.usage ? (
                    <div
                      className={css`
                        display: flex;
                        flex-direction: column;
                        gap: 0.2rem;
                        font-size: 1.18rem;
                      `}
                    >
                      <div>
                        {formatCount(entry.usage.totalTokens)} tokens
                      </div>
                      <div>{formatUsd(entry.usage.totalCostUsd)}</div>
                      <div
                        className={css`
                          opacity: 0.72;
                        `}
                      >
                        {formatCount(entry.usage.copilotRequests)} req •{' '}
                        {formatCount(entry.usage.copilotCoinSpent)} coins
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{formatDateTime(entry.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </SectionPanel>
    </ErrorBoundary>
  );

  async function refreshOverrides() {
    setLoadingOverrides(true);
    setOverridesError('');
    try {
      const payload = await loadBuildTierOverrides(120);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setOverrides(items);
    } catch (error: any) {
      setOverridesError(
        error?.message || error?.response?.data?.error || 'Failed to load tiers'
      );
    } finally {
      setLoadingOverrides(false);
      setLoaded(true);
    }
  }

  async function handleSearchUsers() {
    const query = String(searchQuery || '').trim();
    if (!query) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    setSearchingUsers(true);
    setSearchError('');
    try {
      const users = await searchUsers(query);
      const normalized = Array.isArray(users)
        ? users
            .map((user) => ({
              id: Number(user?.id || user?.userId),
              username: String(user?.username || '')
            }))
            .filter((user) => Number.isFinite(user.id) && user.id > 0 && user.username)
            .slice(0, 15)
        : [];
      setSearchResults(normalized);
      if (normalized.length === 0) {
        setSearchError('No users found for that query.');
      }
    } catch (error: any) {
      setSearchError(error?.message || 'Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  }

  async function handleSelectUser(user: UserSearchResult) {
    setSelectedUser(user);
    selectedUserRef.current = user;
    setSelectedStatus(null);
    setActionReason('');
    setActionError('');
    setActionSuccess('');
    await handleLoadSelectedUserTier(user);
  }

  async function handleLoadSelectedUserTier(user: UserSearchResult) {
    const requestId = selectedUserStatusRequestRef.current + 1;
    selectedUserStatusRequestRef.current = requestId;
    setLoadingSelectedStatus(true);
    setActionError('');
    try {
      const payload = await loadBuildTierForUser(user.id);
      if (
        requestId !== selectedUserStatusRequestRef.current ||
        selectedUserRef.current?.id !== user.id
      ) {
        return;
      }
      setSelectedStatus(payload || null);
      setActionReason(payload?.assignment?.reason || '');
    } catch (error: any) {
      if (
        requestId !== selectedUserStatusRequestRef.current ||
        selectedUserRef.current?.id !== user.id
      ) {
        return;
      }
      setActionError(error?.message || 'Failed to load user Build tier');
    } finally {
      if (
        requestId !== selectedUserStatusRequestRef.current ||
        selectedUserRef.current?.id !== user.id
      ) {
        return;
      }
      setLoadingSelectedStatus(false);
    }
  }

  async function handleSetTier(tier: BuildPlanTier) {
    if (!selectedUser) return;
    selectedUserStatusRequestRef.current += 1;
    setSavingTierAction(true);
    setActionError('');
    setActionSuccess('');
    try {
      const payload = await setBuildTierForUser({
        userId: selectedUser.id,
        tier,
        reason: actionReason
      });
      setSelectedStatus((prev) =>
        payload
          ? {
              ...payload,
              usage: payload.usage ?? prev?.usage ?? null,
              byo: payload.byo ?? prev?.byo ?? null
            }
          : prev
      );
      setActionSuccess(
        `Set ${selectedUser.username} (${selectedUser.id}) to ${tier}.`
      );
      await refreshOverrides();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to set Build tier override');
    } finally {
      setSavingTierAction(false);
    }
  }

  async function handleClearTier() {
    if (!selectedUser) return;
    selectedUserStatusRequestRef.current += 1;
    setSavingTierAction(true);
    setActionError('');
    setActionSuccess('');
    try {
      const payload = await clearBuildTierForUser(selectedUser.id);
      setSelectedStatus((prev) =>
        prev
          ? {
              ...prev,
              assignment: null,
              assignedTier: payload?.assignedTier || prev.assignedTier,
              effectiveTier: payload?.effectiveTier || prev.effectiveTier,
              byo: payload?.byo ?? prev.byo
            }
          : prev
      );
      setActionReason('');
      setActionSuccess(
        `Cleared override for ${selectedUser.username} (${selectedUser.id}).`
      );
      await refreshOverrides();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to clear Build tier override');
    } finally {
      setSavingTierAction(false);
    }
  }

  async function handleSetByo(enabled: boolean) {
    if (!selectedUser) return;
    selectedUserStatusRequestRef.current += 1;
    setSavingTierAction(true);
    setActionError('');
    setActionSuccess('');
    try {
      const payload = await setBuildByoForUser({
        userId: selectedUser.id,
        enabled,
        reason: actionReason
      });
      setSelectedStatus((prev) =>
        prev
          ? {
              ...prev,
              assignedTier: payload?.assignedTier || prev.assignedTier,
              effectiveTier: payload?.effectiveTier || prev.effectiveTier,
              byo: payload?.byo ?? prev.byo
            }
          : prev
      );
      setActionSuccess(
        `${enabled ? 'Enabled' : 'Disabled'} BYO for ${selectedUser.username} (${selectedUser.id}).`
      );
      await refreshOverrides();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to update BYO status');
    } finally {
      setSavingTierAction(false);
    }
  }

  async function handleClearByo() {
    if (!selectedUser) return;
    selectedUserStatusRequestRef.current += 1;
    setSavingTierAction(true);
    setActionError('');
    setActionSuccess('');
    try {
      const payload = await clearBuildByoForUser(selectedUser.id);
      setSelectedStatus((prev) =>
        prev
          ? {
              ...prev,
              assignedTier: payload?.assignedTier || prev.assignedTier,
              effectiveTier: payload?.effectiveTier || prev.effectiveTier,
              byo: payload?.byo ?? prev.byo
            }
          : prev
      );
      setActionSuccess(
        `Cleared BYO override for ${selectedUser.username} (${selectedUser.id}).`
      );
      await refreshOverrides();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to clear BYO override');
    } finally {
      setSavingTierAction(false);
    }
  }
}

function StatusBadge({
  label,
  color,
  compact = false
}: {
  label: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        border: 1px solid ${color};
        background: ${color};
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        font-weight: 700;
        font-size: ${compact ? '1rem' : '1.05rem'};
        padding: ${compact ? '0.2rem 0.55rem' : '0.25rem 0.6rem'};
      `}
    >
      {label}
    </span>
  );
}

function UsageMetric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div
      className={css`
        border: 1px solid var(--border-gray);
        border-radius: 0.55rem;
        background: #fff;
        padding: 0.55rem;
        display: flex;
        flex-direction: column;
        gap: 0.22rem;
      `}
    >
      <div
        className={css`
          font-size: 1.05rem;
          opacity: 0.72;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-weight: 700;
        `}
      >
        {label}
      </div>
      <div
        className={css`
          font-size: 1.45rem;
          font-weight: 800;
        `}
      >
        {value}
      </div>
      {detail ? (
        <div
          className={css`
            font-size: 1.13rem;
            opacity: 0.8;
          `}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
}

function resolveTierColor(tier: BuildPlanTier) {
  if (tier === 'premium') return Color.orange();
  if (tier === 'pro') return Color.logoBlue();
  return Color.gray(0.8);
}

function formatDateTime(unixTime: number) {
  if (!Number.isFinite(unixTime) || unixTime <= 0) return '-';
  const date = new Date(unixTime * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCount(value: number) {
  const normalized = Number(value || 0);
  if (!Number.isFinite(normalized)) return '0';
  return normalized.toLocaleString('en-US');
}

function formatUsd(value: number) {
  const normalized = Number(value || 0);
  if (!Number.isFinite(normalized)) return '$0.00';
  return normalized.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
}
