import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import RiskGroupDetail from './RiskGroupDetail';
import { DataTable, EmptyMessage, PaginationFooter } from './DataTable';
import {
  formatAccountName,
  formatBillingPolicy,
  formatCompact,
  formatNumber,
  formatProviderModel,
  formatProviderName,
  formatTime,
  formatTokenLabel,
  formatUsd,
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
  onCreateBucket,
  onCreateBucketFromRow,
  onRefresh,
  onDisableManualIdentityRule,
  onSelectBucket,
  onAddEmailToBucket,
  onAddEventRowToBucket,
  onAddRiskGroupToBucket,
  onAddRawSignalToBucket,
  onAddUserToBucket,
  onRiskGroupSelect,
  onSelectDays,
  onCloseRiskGroup,
  report,
  bucketDraftLabel,
  bucketRecommendations,
  identityBuckets,
  manualIdentityError,
  manualIdentitySavingKey,
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
  onCreateBucket: () => void;
  onCreateBucketFromRow: (row: AiCostRow) => void;
  onRefresh: () => void;
  onDisableManualIdentityRule: (rule: AiEnergyManualIdentityRule) => void;
  onSelectBucket: (bucketId: number) => void;
  onAddEmailToBucket: (row: AiCostRow) => void;
  onAddEventRowToBucket: (row: AiCostRow) => void;
  onAddRiskGroupToBucket: (row: AiCostRow) => void;
  onAddRawSignalToBucket: (signal: AiEnergyManualIdentityRawSignal) => void;
  onAddUserToBucket: (row: AiCostRow) => void;
  onRiskGroupSelect: (row: AiCostRow) => void;
  onSelectDays: (days: RangeOption) => void;
  onCloseRiskGroup: () => void;
  report: AiCostReport | null;
  bucketDraftLabel: string;
  bucketRecommendations: AiEnergyManualIdentityRecommendations;
  identityBuckets: AiEnergyManualIdentityBucket[];
  manualIdentityError: string;
  manualIdentitySavingKey: string;
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
          {identityBuckets.map((bucket) => (
            <button
              key={bucket.id}
              type="button"
              className={bucket.id === selectedBucketId ? 'active' : ''}
              onClick={() => onSelectBucket(bucket.id)}
            >
              {bucket.label}
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
          </section>

          <Panel
            title="Selected Identity Bucket"
            note={selectedBucket ? selectedBucket.label : 'Create a bucket'}
          >
            {selectedBucket ? (
              <>
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
                            onClick={() => onAddUserToBucket(row)}
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
                            onClick={() => onAddEmailToBucket(row)}
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
                          onClick={() => onAddEmailToBucket(row)}
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
                          onClick={() => onAddRiskGroupToBucket(row)}
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
                            !selectedBucketId ||
                            !row.userId ||
                            manualIdentitySavingKey === getAddUserSavingKey(row)
                          }
                          onClick={() => onAddUserToBucket(row)}
                        >
                          Add User
                        </button>
                        <button
                          type="button"
                          className={inlineActionClass}
                          disabled={
                            !selectedBucketId ||
                            !getRowEmail(row) ||
                            manualIdentitySavingKey ===
                              getAddEmailSavingKey(row)
                          }
                          onClick={() => onAddEmailToBucket(row)}
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
                          !selectedBucketId ||
                          !row.riskKeyType ||
                          !row.riskKeyHash ||
                          manualIdentitySavingKey === getAddRiskSavingKey(row)
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddRiskGroupToBucket(row);
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
                onAddEmail={onAddEmailToBucket}
                onAddRawSignal={onAddRawSignalToBucket}
                onAddUser={onAddUserToBucket}
                eventsError={riskGroupEventsError}
                manualIdentitySavingKey={manualIdentitySavingKey}
                selectedBucketId={selectedBucketId}
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
                      selectedBucketId={selectedBucketId}
                      onAddEventRow={onAddEventRowToBucket}
                      onCreateBucketFromRow={onCreateBucketFromRow}
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
                      selectedBucketId={selectedBucketId}
                      onAddRawSignal={onAddRawSignalToBucket}
                    />
                  )
                }
              ]}
              rows={report.recentSessionEvidence || []}
            />
          </Panel>
        </>
      ) : null}
    </div>
  );
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
  selectedBucketId,
  onAddRawSignal
}: {
  row: AiCostRow;
  manualIdentitySavingKey: string;
  selectedBucketId: number;
  onAddRawSignal: (signal: AiEnergyManualIdentityRawSignal) => void;
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
            !selectedBucketId ||
            manualIdentitySavingKey ===
              `raw-risk:${signal.riskKeyType}:${signal.riskKeyValue}`
          }
          onClick={() => onAddRawSignal(signal)}
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
  selectedBucketId,
  onAddEventRow,
  onCreateBucketFromRow
}: {
  row: AiCostRow;
  manualIdentitySavingKey: string;
  selectedBucketId: number;
  onAddEventRow: (row: AiCostRow) => void;
  onCreateBucketFromRow: (row: AiCostRow) => void;
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
          manualIdentitySavingKey === `event-bucket:${actionKey}`
        }
        onClick={() => onCreateBucketFromRow(row)}
      >
        New Bucket
      </button>
      <button
        type="button"
        className={inlineActionClass}
        disabled={
          !selectedBucketId ||
          !hasEvidence ||
          manualIdentitySavingKey === `event-row:${actionKey}`
        }
        onClick={() => onAddEventRow(row)}
      >
        Add Row
      </button>
    </div>
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

function getRuleMatchLabel(row: AiCostRow) {
  if (row.matchType === 'email') return `Email: ${row.matchValue || ''}`;
  if (row.matchType === 'user') return `User: ${row.matchValue || ''}`;
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
