import React from 'react';
import Loading from '~/components/Loading';
import { DataTable, PaginationFooter } from './DataTable';
import {
  detailErrorClass,
  detailHeadingClass,
  detailSummaryClass,
  inlineActionClass,
  inlineActionGroupClass,
  subsectionHeaderClass
} from './styles';
import {
  AiEnergyManualIdentityBucketAction,
  AiCostRiskGroupDetail,
  AiCostRow,
  AiEnergyManualIdentityRawSignal
} from './types';
import {
  formatAccountName,
  formatCompact,
  formatNumber,
  formatProviderModel,
  formatTime,
  formatUsd,
  numberValue
} from './helpers/formatters';

export default function RiskGroupDetail({
  detail,
  error,
  loading,
  loadingMore,
  onLoadMore,
  onOpenBucketActionModal,
  manualIdentitySavingKey,
  eventsError
}: {
  detail: AiCostRiskGroupDetail | null;
  error: string;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onOpenBucketActionModal: (
    action: AiEnergyManualIdentityBucketAction
  ) => void;
  manualIdentitySavingKey: string;
  eventsError: string;
}) {
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className={detailErrorClass}>{error}</div>;
  }

  if (!detail) {
    return null;
  }

  return (
    <>
      <div className={detailSummaryClass}>
        <div>
          <span>Accounts</span>
          <strong>{formatNumber(detail.summary.accountCount)}</strong>
        </div>
        <div>
          <span>Events</span>
          <strong>{formatNumber(detail.summary.eventCount)}</strong>
        </div>
        <div>
          <span>Cost</span>
          <strong>{formatUsd(detail.summary.estimatedCostUsd)}</strong>
        </div>
        <div>
          <span>Energy</span>
          <strong>{formatCompact(detail.summary.energyChargedUnits)}</strong>
        </div>
      </div>

      <h3 className={detailHeadingClass}>Top Accounts</h3>
      <DataTable
        columns={[
          {
            key: 'username',
            label: 'Account',
            render: (value, row) => formatAccountName({ value, row })
          },
          { key: 'accountVerifiedEmail', label: 'Email' },
          { key: 'identities', label: 'Energy Identities' },
          {
            key: 'eventCount',
            label: 'Events',
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
            render: (_value, row) => {
              const email = getRowEmail(row);
              return (
                <div className={inlineActionGroupClass}>
                  <button
                    type="button"
                    className={inlineActionClass}
                    disabled={
                      !row.userId ||
                      manualIdentitySavingKey ===
                        `user:${Number(row.userId || 0)}`
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
                      !email ||
                      manualIdentitySavingKey === `email:${email}`
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
              );
            }
          }
        ]}
        rows={detail.accounts}
      />

      <SubsectionHeader
        title="Session Evidence"
        note={`Showing ${formatNumber(
          detail.sessionEvidence?.length || 0
        )} recent events for these accounts.`}
      />
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
        rows={detail.sessionEvidence || []}
      />

      <SubsectionHeader
        title="Recent Events"
        note={`Showing ${formatNumber(detail.events.length)} of ${formatNumber(
          detail.summary.eventCount
        )} events.`}
      />
      <DataTable
        columns={[
          {
            key: 'createdAt',
            label: 'Time',
            render: (value) => formatTime(numberValue(value))
          },
          {
            key: 'username',
            label: 'Account',
            render: (value, row) => formatAccountName({ value, row })
          },
          { key: 'surface', label: 'Surface' },
          { key: 'operation', label: 'Operation' },
          {
            key: 'model',
            label: 'Model',
            render: (value, row) => formatProviderModel(value, row)
          },
          {
            key: 'targetType',
            label: 'Target',
            render: (_value, row) =>
              row.targetType ? `${row.targetType}:${row.targetId || 0}` : '—'
          },
          {
            key: 'estimatedCostUsd',
            label: 'Cost',
            align: 'right',
            render: formatUsd
          }
        ]}
        rows={detail.events}
      />
      <PaginationFooter
        hasMore={detail.eventsHasMore}
        loading={loadingMore}
        error={eventsError}
        onLoadMore={onLoadMore}
      />
    </>
  );
}

function getRowEmail(row: AiCostRow) {
  return String(
    row.accountVerifiedEmail || row.verifiedEmail || row.email || ''
  )
    .trim()
    .toLowerCase();
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
