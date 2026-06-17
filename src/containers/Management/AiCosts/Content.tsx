import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import { Color } from '~/constants/css';
import RiskGroupDetail from './RiskGroupDetail';
import ManagementUserSearchInput, {
  ManagementUserSearchResult
} from '../UserSearchInput';
import { DataTable, EmptyMessage, PaginationFooter } from './DataTable';
import {
  formatAccountName,
  formatBillingPolicy,
  formatCacheHitRate,
  formatCompact,
  formatNumber,
  formatProviderModel,
  formatProviderName,
  formatTime,
  formatTokenLabel,
  formatUsd,
  getBucketLabelForRow,
  getEventActionKey,
  getEventSignalLabel,
  getRiskGroupRowKey,
  getRiskGroupSelectionKey,
  getRowEmail,
  getWidthPercent,
  hasBucketEvidence,
  numberValue,
  shortenHash
} from './helpers/formatters';
import {
  actionsClass,
  barRowClass,
  bucketActionModalClass,
  barsClass,
  emptyStateClass,
  headerClass,
  inlineActionGroupClass,
  identityToolClass,
  inlineActionClass,
  metricCardClass,
  pageClass,
  panelClass,
  rangeClass,
  subsectionHeaderClass,
  summaryGridClass,
  twoColumnClass
} from './styles';
import {
  AiEnergyManualIdentityBucket,
  AiEnergyManualIdentityBucketAction,
  AiEnergyManualIdentityRecommendations,
  AiEnergyManualIdentityRawSignal,
  AiEnergyManualIdentityRule,
  AiCostReport,
  AiCostRiskGroupDetail,
  AiCostRow,
  RangeOption
} from './types';

const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Today', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 }
];

export default function Content({
  days,
  downloading,
  error,
  eventsError,
  eventsLoadingMore,
  loading,
  onDownloadCSV,
  onLoadMoreEvents,
  onLoadMoreRiskGroupEvents,
  onBucketDraftLabelChange,
  onAddPendingBucketActionToBucket,
  onCloseBucketActionModal,
  onCreateBucket,
  onCreateBucketForPendingAction,
  onRefresh,
  onDisableManualIdentityRule,
  onAddAccountToBucket,
  onAddIpSignalToBucket,
  onOpenBucketActionModal,
  onSelectBucket,
  onRiskGroupSelect,
  onSelectDays,
  onCloseRiskGroup,
  report,
  bucketDraftLabel,
  pendingBucketAction,
  bucketRecommendations,
  identityBuckets,
  manualIdentityError,
  manualIdentityLoading,
  manualIdentitySavingKey,
  onBucketTitleSave,
  selectedBucketId,
  riskGroupDetail,
  riskGroupError,
  riskGroupEventsError,
  riskGroupEventsLoadingMore,
  riskGroupLoading,
  selectedRiskGroup
}: {
  days: RangeOption;
  downloading: boolean;
  error: string;
  eventsError: string;
  eventsLoadingMore: boolean;
  loading: boolean;
  onDownloadCSV: () => void;
  onLoadMoreEvents: () => void;
  onLoadMoreRiskGroupEvents: () => void;
  onBucketDraftLabelChange: (value: string) => void;
  onAddPendingBucketActionToBucket: (bucketId: number) => void;
  onCloseBucketActionModal: () => void;
  onCreateBucket: () => void;
  onCreateBucketForPendingAction: (label: string) => void;
  onRefresh: () => void;
  onDisableManualIdentityRule: (rule: AiEnergyManualIdentityRule) => void;
  onAddAccountToBucket: (user: ManagementUserSearchResult) => void;
  onAddIpSignalToBucket: (ip: string) => void;
  onOpenBucketActionModal: (
    action: AiEnergyManualIdentityBucketAction
  ) => void;
  onSelectBucket: (bucketId: number) => void;
  onRiskGroupSelect: (row: AiCostRow) => void;
  onSelectDays: (days: RangeOption) => void;
  onCloseRiskGroup: () => void;
  report: AiCostReport | null;
  bucketDraftLabel: string;
  pendingBucketAction: AiEnergyManualIdentityBucketAction | null;
  bucketRecommendations: AiEnergyManualIdentityRecommendations;
  identityBuckets: AiEnergyManualIdentityBucket[];
  manualIdentityError: string;
  manualIdentityLoading: boolean;
  manualIdentitySavingKey: string;
  onBucketTitleSave: ({
    bucketId,
    label
  }: {
    bucketId: number;
    label: string;
  }) => void;
  selectedBucketId: number;
  riskGroupDetail: AiCostRiskGroupDetail | null;
  riskGroupError: string;
  riskGroupEventsError: string;
  riskGroupEventsLoadingMore: boolean;
  riskGroupLoading: boolean;
  selectedRiskGroup: {
    riskKeyType: string;
    riskKeyHash: string;
  } | null;
}) {
  const dayMaxCost = useMemo(() => {
    return Math.max(
      0,
      ...(report?.byDay || []).map((row) => numberValue(row.estimatedCostUsd))
    );
  }, [report]);
  const selectedBucket =
    identityBuckets.find((bucket) => bucket.id === selectedBucketId) || null;
  const [bucketTitleDraft, setBucketTitleDraft] = useState('');
  const [ipDraft, setIpDraft] = useState('');
  useEffect(() => {
    setBucketTitleDraft(selectedBucket?.label || '');
  }, [selectedBucket?.id, selectedBucket?.label]);
  const manualAddSaving =
    manualIdentitySavingKey.startsWith('manual-account:') ||
    manualIdentitySavingKey.startsWith('manual-ip:');
  const linkedRuleRows = useMemo<AiCostRow[]>(() => {
    return (selectedBucket?.rules || []).map((rule) => ({
      ...rule
    }));
  }, [selectedBucket]);
  const recommendationAccountRows = useMemo<AiCostRow[]>(() => {
    return bucketRecommendations.accounts.map((row) => ({
      ...row,
      accountVerifiedEmail: row.email
    }));
  }, [bucketRecommendations.accounts]);
  const recommendationEmailRows = useMemo<AiCostRow[]>(() => {
    return bucketRecommendations.emails.map((row) => ({
      ...row,
      verifiedEmail: row.email,
      label: row.email
    }));
  }, [bucketRecommendations.emails]);
  const recommendationRiskRows = useMemo<AiCostRow[]>(() => {
    return bucketRecommendations.riskKeys.map((row) => ({
      ...row,
      matchValue:
        row.riskKeyType && row.riskKeyHash
          ? `${row.riskKeyType}:${row.riskKeyHash}`
          : row.label
    }));
  }, [bucketRecommendations.riskKeys]);

  return (
    <div className={pageClass}>
      <header className={headerClass}>
        <div>
          <h1>AI Costs</h1>
          <p>
            Official Twinkle-paid provider spend, Energy usage, helper calls,
            and account/risk-group attribution. Dates are bucketed by UTC day.
          </p>
        </div>
        <div className={actionsClass}>
          <div className={rangeClass}>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={days === option.value ? 'active' : ''}
                onClick={() => onSelectDays(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            color="darkerGray"
            variant="outline"
            loading={downloading}
            onClick={onDownloadCSV}
          >
            <Icon icon="file-csv" />
            CSV
          </Button>
          <Button color="logoBlue" variant="solid" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </header>

      <div className={identityToolClass}>
        <div className="bucket-create-row">
          <label htmlFor="manual-ai-bucket-label">Identity Buckets</label>
          <input
            id="manual-ai-bucket-label"
            value={bucketDraftLabel}
            onChange={(event) =>
              onBucketDraftLabelChange(event.currentTarget.value)
            }
            placeholder="New bucket name"
          />
          <Button
            color="logoBlue"
            variant="solid"
            loading={manualIdentitySavingKey === 'bucket:create'}
            onClick={onCreateBucket}
          >
            Create Bucket
          </Button>
        </div>
        <div className="bucket-list-row">
          {manualIdentityLoading ? (
            <div className="bucket-loading">
              <Loading />
            </div>
          ) : null}
          {identityBuckets.map((bucket) => (
            <button
              key={bucket.id}
              type="button"
              className={bucket.id === selectedBucketId ? 'active' : ''}
              onClick={() => onSelectBucket(bucket.id)}
            >
              <strong>{bucket.label}</strong>
              <small>{formatNumber(bucket.rules.length)} items</small>
            </button>
          ))}
        </div>
        {manualIdentityError ? <span>{manualIdentityError}</span> : null}
      </div>

      {loading ? <Loading /> : null}

      {!loading && error ? (
        <div className={emptyStateClass}>
          <div>{error}</div>
          <Button color="logoBlue" variant="soft" onClick={onRefresh}>
            Try Again
          </Button>
        </div>
      ) : null}

      {!loading && !error && report ? (
        <>
          <section className={summaryGridClass}>
            <MetricCard
              label="Estimated Spend"
              value={formatUsd(report.summary.estimatedCostUsd)}
              detail={`${formatNumber(report.summary.eventCount)} events`}
              color="logoBlue"
            />
            <MetricCard
              label="Requests"
              value={formatNumber(report.summary.requestCount)}
              detail={`${formatCompact(report.summary.totalTokens)} tokens`}
              color="green"
            />
            <MetricCard
              label="Energy Charged"
              value={formatCompact(report.summary.energyChargedUnits)}
              detail={`${formatCompact(
                report.summary.energyOverflowUnits
              )} overflow`}
              color="orange"
            />
            <MetricCard
              label="Images"
              value={formatNumber(report.summary.imageCount)}
              detail="image events"
              color="rose"
            />
            <MetricCard
              label="Cache Hit Rate"
              value={formatCacheHitRate(report.summary)}
              detail={`${formatCompact(
                report.summary.cachedInputTokens
              )} cached tokens`}
              color="purple"
            />
          </section>

          <Panel
            title="Editing Bucket"
            note={selectedBucket ? selectedBucket.label : 'Create a bucket'}
          >
            {selectedBucket ? (
              <>
                <div className="bucket-title-row">
                  <label htmlFor="manual-ai-selected-bucket-title">
                    Bucket Title
                  </label>
                  <input
                    id="manual-ai-selected-bucket-title"
                    value={bucketTitleDraft}
                    onChange={(event) =>
                      setBucketTitleDraft(event.currentTarget.value)
                    }
                  />
                  <Button
                    color="logoBlue"
                    variant="solid"
                    loading={
                      manualIdentitySavingKey ===
                      `bucket:update:${selectedBucket.id}`
                    }
                    disabled={
                      !bucketTitleDraft.trim() ||
                      bucketTitleDraft.trim() === selectedBucket.label
                    }
                    onClick={() =>
                      onBucketTitleSave({
                        bucketId: selectedBucket.id,
                        label: bucketTitleDraft
                      })
                    }
                  >
                    Save Title
                  </Button>
                </div>
                <SubsectionHeader
                  title="Add to Bucket"
                  note="Search an account or add an IP"
                />
                <div className="bucket-manual-add">
                  <div className="manual-add-field">
                    <label>Account</label>
                    <ManagementUserSearchInput
                      placeholder="Search username, name, or email..."
                      onSelect={onAddAccountToBucket}
                    />
                  </div>
                  <div className="manual-add-field">
                    <label htmlFor="manual-ai-add-ip">IP Address</label>
                    <div className="manual-add-ip">
                      <input
                        id="manual-ai-add-ip"
                        value={ipDraft}
                        placeholder="Public IPv4 or IPv6 address"
                        onChange={(event) =>
                          setIpDraft(event.currentTarget.value)
                        }
                        onKeyDown={handleIpKeyDown}
                      />
                      <Button
                        color="logoBlue"
                        variant="solid"
                        loading={
                          manualIdentitySavingKey ===
                          `manual-ip:${ipDraft.trim()}`
                        }
                        disabled={!ipDraft.trim() || manualAddSaving}
                        onClick={handleAddIp}
                      >
                        Add IP Signal
                      </Button>
                    </div>
                  </div>
                  {manualAddSaving ? (
                    <div className="manual-add-status">Adding…</div>
                  ) : null}
                </div>
                <SubsectionHeader
                  title="Linked Items"
                  note={`${formatNumber(linkedRuleRows.length)} items`}
                />
                <DataTable
                  columns={[
                    {
                      key: 'matchType',
                      label: 'Type',
                      render: (value) => formatBucketItemType(value)
                    },
                    {
                      key: 'matchValue',
                      label: 'Value',
                      render: (_value, row) => getRuleMatchLabel(row)
                    },
                    { key: 'note', label: 'Note' },
                    {
                      key: 'createdAt',
                      label: 'Created',
                      render: (value) => formatTime(numberValue(value))
                    },
                    {
                      key: 'disabledAt',
                      label: 'Action',
                      render: (_value, row) => (
                        <button
                          type="button"
                          className={inlineActionClass}
                          disabled={
                            manualIdentitySavingKey ===
                            `disable:${Number(row.id || 0)}`
                          }
                          onClick={() =>
                            onDisableManualIdentityRule(
                              row as AiEnergyManualIdentityRule
                            )
                          }
                        >
                          Remove
                        </button>
                      )
                    }
                  ]}
                  rows={linkedRuleRows}
                />

                <SubsectionHeader
                  title="Suggested Accounts"
                  note={`${formatNumber(
                    recommendationAccountRows.length
                  )} matches`}
                />
                <DataTable
                  columns={[
                    {
                      key: 'username',
                      label: 'Account',
                      render: (value, row) => formatAccountName({ value, row })
                    },
                    { key: 'accountVerifiedEmail', label: 'Email' },
                    { key: 'reason', label: 'Reason' },
                    {
                      key: 'confidenceScore',
                      label: 'Confidence',
                      align: 'right',
                      render: formatNumber
                    },
                    {
                      key: 'evidenceCount',
                      label: 'Clues',
                      align: 'right',
                      render: formatNumber
                    },
                    {
                      key: 'manualIdentityKey',
                      label: 'Action',
                      render: (_value, row) => (
                        <div className={inlineActionGroupClass}>
                          <button
                            type="button"
                            className={inlineActionClass}
                            disabled={
                              !row.userId ||
                              manualIdentitySavingKey ===
                                getAddUserSavingKey(row)
                            }
                            onClick={() =>
                              onOpenBucketActionModal({
                                actionType: 'user',
                                row
                              })
                            }
                          >
                            Add User
                          </button>
                          <button
                            type="button"
                            className={inlineActionClass}
                            disabled={
                              !getRowEmail(row) ||
                              manualIdentitySavingKey ===
                                getAddEmailSavingKey(row)
                            }
                            onClick={() =>
                              onOpenBucketActionModal({
                                actionType: 'email',
                                row
                              })
                            }
                          >
                            Add Email
                          </button>
                        </div>
                      )
                    }
                  ]}
                  rows={recommendationAccountRows}
                />

                <SubsectionHeader
                  title="Suggested Emails"
                  note={`${formatNumber(
                    recommendationEmailRows.length
                  )} matches`}
                />
                <DataTable
                  columns={[
                    { key: 'label', label: 'Email' },
                    { key: 'reason', label: 'Reason' },
                    {
                      key: 'confidenceScore',
                      label: 'Confidence',
                      align: 'right',
                      render: formatNumber
                    },
                    {
                      key: 'evidenceCount',
                      label: 'Clues',
                      align: 'right',
                      render: formatNumber
                    },
                    {
                      key: 'manualIdentityKey',
                      label: 'Action',
                      render: (_value, row) => (
                        <button
                          type="button"
                          className={inlineActionClass}
                          disabled={
                            !getRowEmail(row) ||
                            manualIdentitySavingKey ===
                              getAddEmailSavingKey(row)
                          }
                          onClick={() =>
                            onOpenBucketActionModal({
                              actionType: 'email',
                              row
                            })
                          }
                        >
                          Add Email
                        </button>
                      )
                    }
                  ]}
                  rows={recommendationEmailRows}
                />

                <SubsectionHeader
                  title="Suggested Signals"
                  note={`${formatNumber(
                    recommendationRiskRows.length
                  )} matches`}
                />
                <DataTable
                  columns={[
                    { key: 'riskKeyType', label: 'Type' },
                    {
                      key: 'riskKeyHash',
                      label: 'Hash',
                      render: (value) => shortenHash(String(value || ''))
                    },
                    { key: 'reason', label: 'Reason' },
                    {
                      key: 'confidenceScore',
                      label: 'Confidence',
                      align: 'right',
                      render: formatNumber
                    },
                    {
                      key: 'evidenceCount',
                      label: 'Clues',
                      align: 'right',
                      render: formatNumber
                    },
                    {
                      key: 'manualIdentityKey',
                      label: 'Action',
                      render: (_value, row) => (
                        <button
                          type="button"
                          className={inlineActionClass}
                          disabled={
                            !row.riskKeyType ||
                            !row.riskKeyHash ||
                            manualIdentitySavingKey === getAddRiskSavingKey(row)
                          }
                          onClick={() =>
                            onOpenBucketActionModal({
                              actionType: 'risk_key',
                              row
                            })
                          }
                        >
                          Add Signal
                        </button>
                      )
                    }
                  ]}
                  rows={recommendationRiskRows}
                />
              </>
            ) : (
              <EmptyMessage />
            )}
          </Panel>

          <Panel title="Daily Spend (UTC)">
            {report.byDay.length === 0 ? (
              <EmptyMessage />
            ) : (
              <div className={barsClass}>
                {report.byDay.map((row) => (
                  <BarRow
                    key={row.dayIndex || row.dayKey}
                    label={row.dayKey || String(row.dayIndex || '')}
                    value={formatUsd(row.estimatedCostUsd)}
                    widthPercent={getWidthPercent(
                      row.estimatedCostUsd,
                      dayMaxCost
                    )}
                    detail={`${formatNumber(row.requestCount)} requests`}
                  />
                ))}
              </div>
            )}
          </Panel>

          <div className={twoColumnClass}>
            <Panel title="Top Surfaces" note="Top 100 by estimated spend.">
              <DataTable
                columns={[
                  { key: 'surface', label: 'Surface' },
                  {
                    key: 'billingPolicy',
                    label: 'Policy',
                    render: formatBillingPolicy
                  },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  },
                  {
                    key: 'requestCount',
                    label: 'Req',
                    align: 'right',
                    render: formatNumber
                  },
                  {
                    key: 'cachedInputTokens',
                    label: 'Cache',
                    align: 'right',
                    render: (_value, row) => formatCacheHitRate(row)
                  }
                ]}
                rows={report.bySurface}
              />
            </Panel>

            <Panel
              title="Top Providers"
              note="Top 100 provider/model/policy groups."
            >
              <DataTable
                columns={[
                  {
                    key: 'provider',
                    label: 'Provider',
                    render: (value, row) => formatProviderName(value, row)
                  },
                  {
                    key: 'model',
                    label: 'Model',
                    render: (value, row) => formatProviderModel(value, row)
                  },
                  {
                    key: 'billingPolicy',
                    label: 'Policy',
                    render: formatBillingPolicy
                  },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  },
                  {
                    key: 'cachedInputTokens',
                    label: 'Cache',
                    align: 'right',
                    render: (_value, row) => formatCacheHitRate(row)
                  }
                ]}
                rows={report.byProviderModel}
              />
            </Panel>
          </div>

          <div className={twoColumnClass}>
            <Panel title="Billing Policy">
              <DataTable
                columns={[
                  {
                    key: 'billingPolicy',
                    label: 'Policy',
                    render: formatBillingPolicy
                  },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  },
                  {
                    key: 'energyChargedUnits',
                    label: 'Energy',
                    align: 'right',
                    render: formatCompact
                  },
                  {
                    key: 'coinCharged',
                    label: 'Coins',
                    align: 'right',
                    render: formatNumber
                  }
                ]}
                rows={report.byBillingPolicy}
              />
            </Panel>

            <Panel title="Top Accounts" note="Top 50 by estimated spend.">
              <DataTable
                columns={[
                  {
                    key: 'username',
                    label: 'Account',
                    render: (value, row) => formatAccountName({ value, row })
                  },
                  { key: 'accountVerifiedEmail', label: 'Email' },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  },
                  {
                    key: 'requestCount',
                    label: 'Req',
                    align: 'right',
                    render: formatNumber
                  },
                  {
                    key: 'manualIdentityKey',
                    label: 'Action',
                    render: (_value, row) => (
                      <div className={inlineActionGroupClass}>
                        <button
                          type="button"
                          className={inlineActionClass}
                          disabled={
                            !row.userId ||
                            manualIdentitySavingKey === getAddUserSavingKey(row)
                          }
                          onClick={() =>
                            onOpenBucketActionModal({
                              actionType: 'user',
                              row
                            })
                          }
                        >
                          Add User
                        </button>
                        <button
                          type="button"
                          className={inlineActionClass}
                          disabled={
                            !getRowEmail(row) ||
                            manualIdentitySavingKey ===
                              getAddEmailSavingKey(row)
                          }
                          onClick={() =>
                            onOpenBucketActionModal({
                              actionType: 'email',
                              row
                            })
                          }
                        >
                          Add Email
                        </button>
                      </div>
                    )
                  }
                ]}
                rows={report.topAccounts}
              />
            </Panel>
          </div>

          <div className={twoColumnClass}>
            <Panel
              title="Top Energy Identities"
              note="Top 50 shared Energy identities by spend."
            >
              <DataTable
                columns={[
                  { key: 'identityKey', label: 'Identity' },
                  {
                    key: 'accountCount',
                    label: 'Accounts',
                    align: 'right',
                    render: formatNumber
                  },
                  { key: 'userIds', label: 'User IDs' },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  }
                ]}
                rows={report.topIdentities}
              />
            </Panel>

            <Panel
              title="Top Risk Groups"
              note="Top 50 shared device/IP/user-agent groups by spend. Click a group to inspect accounts and events."
            >
              <DataTable
                columns={[
                  { key: 'riskKeyType', label: 'Type' },
                  {
                    key: 'riskKeyHash',
                    label: 'Hash',
                    render: (value) => shortenHash(String(value || ''))
                  },
                  {
                    key: 'accountCount',
                    label: 'Accounts',
                    align: 'right',
                    render: formatNumber
                  },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  },
                  {
                    key: 'manualIdentityKey',
                    label: 'Action',
                    render: (_value, row) => (
                      <button
                        type="button"
                        className={inlineActionClass}
                        disabled={
                          !row.riskKeyType ||
                          !row.riskKeyHash ||
                          manualIdentitySavingKey === getAddRiskSavingKey(row)
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenBucketActionModal({
                            actionType: 'risk_key',
                            row
                          });
                        }}
                      >
                        Add Signal
                      </button>
                    )
                  }
                ]}
                rows={report.topRiskGroups}
                rowKey={getRiskGroupRowKey}
                activeRowKey={
                  selectedRiskGroup
                    ? getRiskGroupSelectionKey(selectedRiskGroup)
                    : ''
                }
                onRowClick={onRiskGroupSelect}
              />
            </Panel>
          </div>

          {selectedRiskGroup ? (
            <Panel
              title="Risk Group Detail"
              note={`Top 100 accounts, paginated events. ${
                selectedRiskGroup.riskKeyType
              } ${shortenHash(selectedRiskGroup.riskKeyHash)}`}
              action={
                <Button
                  color="darkerGray"
                  variant="outline"
                  onClick={onCloseRiskGroup}
                >
                  Close
                </Button>
              }
            >
              <RiskGroupDetail
                detail={riskGroupDetail}
                error={riskGroupError}
                loading={riskGroupLoading}
                loadingMore={riskGroupEventsLoadingMore}
                onLoadMore={onLoadMoreRiskGroupEvents}
                onOpenBucketActionModal={onOpenBucketActionModal}
                eventsError={riskGroupEventsError}
                manualIdentitySavingKey={manualIdentitySavingKey}
              />
            </Panel>
          ) : null}

          <Panel
            title="Spend Events"
            note={`Showing ${formatNumber(
              report.recentEvents.length
            )} loaded out of ${formatNumber(
              report.summary.eventCount
            )} events in this range. Use Load More to keep paging through the selected range.`}
          >
            <DataTable
              columns={[
                {
                  key: 'createdAt',
                  label: 'Time',
                  render: (value) => formatTime(numberValue(value))
                },
                { key: 'source', label: 'Source', render: formatTokenLabel },
                { key: 'surface', label: 'Surface' },
                { key: 'operation', label: 'Operation' },
                {
                  key: 'billingPolicy',
                  label: 'Policy',
                  render: formatBillingPolicy
                },
                {
                  key: 'username',
                  label: 'Account',
                  render: (value, row) => formatAccountName({ value, row })
                },
                {
                  key: 'sharedRiskKeyTypes',
                  label: 'Signals',
                  render: (_value, row) => getEventSignalLabel(row)
                },
                {
                  key: 'estimatedCostUsd',
                  label: 'Cost',
                  align: 'right',
                  render: formatUsd
                },
                {
                  key: 'manualIdentityKey',
                  label: 'Action',
                  render: (_value, row) => (
                    <EventBucketActions
                      row={row}
                      manualIdentitySavingKey={manualIdentitySavingKey}
                      onOpenBucketActionModal={onOpenBucketActionModal}
                    />
                  )
                }
              ]}
              rows={report.recentEvents}
            />
            <PaginationFooter
              hasMore={report.recentEventsHasMore}
              loading={eventsLoadingMore}
              error={eventsError}
              onLoadMore={onLoadMoreEvents}
            />
          </Panel>

          <Panel
            title="Recent Session Evidence"
            note="Login, signup, logout, email verification, and socket bind evidence."
          >
            <DataTable
              columns={[
                {
                  key: 'createdAt',
                  label: 'Time',
                  render: (value) => formatTime(numberValue(value))
                },
                { key: 'eventType', label: 'Event' },
                {
                  key: 'username',
                  label: 'Account',
                  render: (value, row) => formatAccountName({ value, row })
                },
                { key: 'verifiedEmail', label: 'Email' },
                {
                  key: 'reqIpPrefix',
                  label: 'IP',
                  render: (_value, row) => getEvidenceIp(row)
                },
                { key: 'deviceId', label: 'Device' },
                {
                  key: 'manualIdentityKey',
                  label: 'Action',
                  render: (_value, row) => (
                    <EvidenceSignalActions
                      row={row}
                      manualIdentitySavingKey={manualIdentitySavingKey}
                      onOpenBucketActionModal={onOpenBucketActionModal}
                    />
                  )
                }
              ]}
              rows={report.recentSessionEvidence || []}
            />
          </Panel>
        </>
      ) : null}
      {pendingBucketAction ? (
        <BucketActionModal
          key={getBucketActionKey(pendingBucketAction)}
          action={pendingBucketAction}
          buckets={identityBuckets}
          error={manualIdentityError}
          manualIdentitySavingKey={manualIdentitySavingKey}
          onAddToBucket={onAddPendingBucketActionToBucket}
          onClose={onCloseBucketActionModal}
          onCreateBucket={onCreateBucketForPendingAction}
        />
      ) : null}
    </div>
  );

  function handleAddIp() {
    const ip = ipDraft.trim();
    if (!ip) return;
    onAddIpSignalToBucket(ip);
    setIpDraft('');
  }

  function handleIpKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddIp();
    }
  }
}

function Panel({
  title,
  note,
  action,
  children
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>{title}</h2>
          {note ? <span>{note}</span> : null}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  color
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div
      className={metricCardClass}
      style={{
        borderColor: Color[color](0.35),
        background: Color[color](0.07)
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function BarRow({
  label,
  value,
  detail,
  widthPercent
}: {
  label: string;
  value: string;
  detail: string;
  widthPercent: number;
}) {
  return (
    <div className={barRowClass}>
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <div className="bar-track">
        <div style={{ width: `${widthPercent}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function EvidenceSignalActions({
  row,
  manualIdentitySavingKey,
  onOpenBucketActionModal
}: {
  row: AiCostRow;
  manualIdentitySavingKey: string;
  onOpenBucketActionModal: (
    action: AiEnergyManualIdentityBucketAction
  ) => void;
}) {
  const signals = getEvidenceRawSignals(row);
  if (signals.length === 0) return null;
  return (
    <div className={inlineActionGroupClass}>
      {signals.map((signal) => (
        <button
          key={`${signal.riskKeyType}:${signal.riskKeyValue}`}
          type="button"
          className={inlineActionClass}
          disabled={
            manualIdentitySavingKey ===
              `raw-risk:${signal.riskKeyType}:${signal.riskKeyValue}`
          }
          onClick={() =>
            onOpenBucketActionModal({
              actionType: 'raw_signal',
              signal
            })
          }
        >
          {signal.label}
        </button>
      ))}
    </div>
  );
}

function EventBucketActions({
  row,
  manualIdentitySavingKey,
  onOpenBucketActionModal
}: {
  row: AiCostRow;
  manualIdentitySavingKey: string;
  onOpenBucketActionModal: (
    action: AiEnergyManualIdentityBucketAction
  ) => void;
}) {
  const hasEvidence = hasBucketEvidence(row);
  const actionKey = getEventActionKey(row);
  return (
    <div className={inlineActionGroupClass}>
      <button
        type="button"
        className={inlineActionClass}
        disabled={
          !hasEvidence ||
          manualIdentitySavingKey === `event-row:${actionKey}`
        }
        onClick={() =>
          onOpenBucketActionModal({
            actionType: 'event_row',
            row
          })
        }
      >
        Add to Bucket
      </button>
    </div>
  );
}

function BucketActionModal({
  action,
  buckets,
  error,
  manualIdentitySavingKey,
  onAddToBucket,
  onClose,
  onCreateBucket
}: {
  action: AiEnergyManualIdentityBucketAction;
  buckets: AiEnergyManualIdentityBucket[];
  error: string;
  manualIdentitySavingKey: string;
  onAddToBucket: (bucketId: number) => void;
  onClose: () => void;
  onCreateBucket: (label: string) => void;
}) {
  const [newBucketLabel, setNewBucketLabel] = useState(
    getDefaultBucketLabelForAction(action)
  );
  const isSaving = Boolean(manualIdentitySavingKey);

  return (
    <Modal
      modalKey="AiCostBucketActionModal"
      isOpen
      onClose={onClose}
      hasHeader={false}
      bodyPadding={0}
      size="lg"
    >
      <LegacyModalLayout className={bucketActionModalClass}>
        <header>{getBucketActionTitle(action)}</header>
        <main>
          <div className="target-summary">
            <span>Target</span>
            <strong>{getBucketActionSummary(action)}</strong>
          </div>
          {isSaving ? (
            <div className="modal-saving">
              <span className="mini-spinner" />
              Saving...
            </div>
          ) : null}

          <div className="bucket-choice-section">
            <span>Existing Buckets</span>
            {buckets.length ? (
              <div className="bucket-choice-list">
                {buckets.map((bucket) => (
                  <button
                    key={bucket.id}
                    type="button"
                    disabled={isSaving}
                    onClick={() => onAddToBucket(bucket.id)}
                  >
                    <strong>{bucket.label}</strong>
                    <small>{formatNumber(bucket.rules.length)} items</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-bucket-list">No buckets yet.</div>
            )}
          </div>

          <div className="bucket-choice-section">
            <span>New Bucket</span>
            <div className="new-bucket-row">
              <input
                value={newBucketLabel}
                onChange={(event) =>
                  setNewBucketLabel(event.currentTarget.value)
                }
                placeholder="Bucket name"
              />
              <Button
                color="logoBlue"
                variant="solid"
                loading={manualIdentitySavingKey.startsWith(
                  'bucket-action-create:'
                )}
                disabled={isSaving || !newBucketLabel.trim()}
                onClick={() => onCreateBucket(newBucketLabel)}
              >
                Create and Add
              </Button>
            </div>
          </div>
          {error ? <div className="modal-error">{error}</div> : null}
        </main>
        <footer>
          <Button variant="ghost" disabled={isSaving} onClick={onClose}>
            Cancel
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );
}

function getEvidenceRawSignals(
  row: AiCostRow
): AiEnergyManualIdentityRawSignal[] {
  return [
    row.deviceId
      ? {
          riskKeyType: 'device_id',
          riskKeyValue: row.deviceId,
          label: 'Add Device'
        }
      : null,
    row.forwardedIpPrefix && !row.forwardedIpIsPrivate
      ? {
          riskKeyType: 'xff_ip_prefix',
          riskKeyValue: row.forwardedIpPrefix,
          label: 'Add Fwd IP'
        }
      : null,
    row.reqIpPrefix && !row.reqIpIsPrivate
      ? {
          riskKeyType: 'req_ip_prefix',
          riskKeyValue: row.reqIpPrefix,
          label: 'Add Req IP'
        }
      : null,
    row.socketRemoteIpPrefix && !row.socketRemoteIpIsPrivate
      ? {
          riskKeyType: 'socket_ip_prefix',
          riskKeyValue: row.socketRemoteIpPrefix,
          label: 'Add Socket IP'
        }
      : null
  ].filter(Boolean) as AiEnergyManualIdentityRawSignal[];
}

function getBucketActionKey(action: AiEnergyManualIdentityBucketAction) {
  if (action.actionType === 'event_row') {
    return `event:${getEventActionKey(action.row)}`;
  }
  if (action.actionType === 'user') {
    return `user:${Number(action.row.userId || 0)}`;
  }
  if (action.actionType === 'email') {
    return `email:${getRowEmail(action.row)}`;
  }
  if (action.actionType === 'risk_key') {
    return `risk:${action.row.riskKeyType || ''}:${action.row.riskKeyHash || ''}`;
  }
  return `raw-risk:${action.signal.riskKeyType}:${action.signal.riskKeyValue}`;
}

function getBucketActionTitle(action: AiEnergyManualIdentityBucketAction) {
  if (action.actionType === 'event_row') return 'Add Event Evidence';
  if (action.actionType === 'user') return 'Add User';
  if (action.actionType === 'email') return 'Add Email';
  return 'Add Signal';
}

function getDefaultBucketLabelForAction(
  action: AiEnergyManualIdentityBucketAction
) {
  if (action.actionType === 'raw_signal') return action.signal.label;
  return getBucketLabelForRow(action.row);
}

function getBucketActionSummary(action: AiEnergyManualIdentityBucketAction) {
  if (action.actionType === 'event_row') {
    return getBucketLabelForRow(action.row) || 'Spend event';
  }
  if (action.actionType === 'user') {
    const username = String(action.row.username || '').trim();
    const userId = Number(action.row.userId || 0);
    return username && userId ? `${username} (${userId})` : `User ${userId}`;
  }
  if (action.actionType === 'email') {
    return getRowEmail(action.row) || 'Email';
  }
  if (action.actionType === 'risk_key') {
    return `${action.row.riskKeyType || 'signal'} ${shortenHash(
      String(action.row.riskKeyHash || '')
    )}`;
  }
  return action.signal.label;
}

function getRuleMatchLabel(row: AiCostRow) {
  if (row.matchType === 'email') return `Email: ${row.matchValue || ''}`;
  if (row.matchType === 'user') {
    const username = String(row.username || '').trim();
    const userId = Number(row.userId || row.matchValue || 0);
    const email = getRowEmail(row);
    if (username) {
      return [userId ? `${username} (${userId})` : username, email || '']
        .filter(Boolean)
        .join(' · ');
    }
    return userId ? `User ${userId}` : `User: ${row.matchValue || ''}`;
  }
  if (row.matchType === 'risk_key') {
    return `${row.riskKeyType || 'risk'}:${shortenHash(
      String(row.riskKeyHash || '')
    )}`;
  }
  return row.matchValue || '';
}

function formatBucketItemType(value: unknown) {
  if (value === 'risk_key') return 'Signal';
  if (value === 'user') return 'User';
  if (value === 'email') return 'Email';
  if (value === 'ip') return 'IP';
  return String(value || '');
}

function getAddUserSavingKey(row: AiCostRow) {
  return `user:${Number(row.userId || 0)}`;
}

function getAddEmailSavingKey(row: AiCostRow) {
  return `email:${getRowEmail(row)}`;
}

function getAddRiskSavingKey(row: AiCostRow) {
  return `risk:${row.riskKeyType || ''}:${row.riskKeyHash || ''}`;
}

function getEvidenceIp(row: AiCostRow) {
  const values = [
    getEvidencePrefixLabel({
      label: 'Forwarded',
      prefix: row.forwardedIpPrefix,
      isPrivate: row.forwardedIpIsPrivate
    }),
    getEvidencePrefixLabel({
      label: 'Request',
      prefix: row.reqIpPrefix || row.reqIp,
      isPrivate: row.reqIpIsPrivate
    }),
    getEvidencePrefixLabel({
      label: 'Socket',
      prefix: row.socketRemoteIpPrefix || row.socketRemoteIp,
      isPrivate: row.socketRemoteIpIsPrivate
    })
  ].filter(Boolean);
  return values.join(' | ');
}

function getEvidencePrefixLabel({
  label,
  prefix,
  isPrivate
}: {
  label: string;
  prefix?: string;
  isPrivate?: number;
}) {
  if (!prefix) return '';
  return `${label}: ${prefix}${isPrivate ? ' (private)' : ''}`;
}

function SubsectionHeader({ title, note }: { title: string; note: string }) {
  return (
    <div className={subsectionHeaderClass}>
      <h3>{title}</h3>
      <span>{note}</span>
    </div>
  );
}
