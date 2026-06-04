import React, { useEffect, useState } from 'react';
import InvalidPage from '~/components/InvalidPage';
import { useAppContext, useKeyContext } from '~/contexts';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import Content from './Content';
import {
  getBucketLabelForRow,
  getEventActionKey,
  getEventSignals,
  getRowEmail,
  hasBucketEvidence
} from './helpers/formatters';
import {
  AiEnergyManualIdentityBucket,
  AiEnergyManualIdentityRecommendations,
  AiEnergyManualIdentityRawSignal,
  AiEnergyManualIdentityRule,
  AiCostEventPage,
  AiCostReport,
  AiCostRiskGroupDetail,
  AiCostRow,
  RangeOption
} from './types';

function getEmptyBucketRecommendations(): AiEnergyManualIdentityRecommendations {
  return {
    accounts: [],
    emails: [],
    riskKeys: []
  };
}

export default function AiCosts() {
  const [days, setDays] = useState<RangeOption>(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState<AiCostReport | null>(null);
  const [bucketDraftLabel, setBucketDraftLabel] = useState('');
  const [identityBuckets, setIdentityBuckets] = useState<
    AiEnergyManualIdentityBucket[]
  >([]);
  const [selectedBucketId, setSelectedBucketId] = useState(0);
  const [bucketRecommendations, setBucketRecommendations] =
    useState<AiEnergyManualIdentityRecommendations>(
      getEmptyBucketRecommendations
    );
  const [manualIdentityError, setManualIdentityError] = useState('');
  const [manualIdentitySavingKey, setManualIdentitySavingKey] = useState('');
  const [selectedRiskGroup, setSelectedRiskGroup] = useState<{
    riskKeyType: string;
    riskKeyHash: string;
  } | null>(null);
  const [riskGroupDetail, setRiskGroupDetail] =
    useState<AiCostRiskGroupDetail | null>(null);
  const [riskGroupLoading, setRiskGroupLoading] = useState(false);
  const [riskGroupEventsLoadingMore, setRiskGroupEventsLoadingMore] =
    useState(false);
  const [riskGroupError, setRiskGroupError] = useState('');
  const [riskGroupEventsError, setRiskGroupEventsError] = useState('');
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const loadAiCostReport = useAppContext(
    (v) => v.requestHelpers.loadAiCostReport
  );
  const loadAiCostEvents = useAppContext(
    (v) => v.requestHelpers.loadAiCostEvents
  );
  const loadAiCostReportCSV = useAppContext(
    (v) => v.requestHelpers.loadAiCostReportCSV
  );
  const loadAiCostRiskGroup = useAppContext(
    (v) => v.requestHelpers.loadAiCostRiskGroup
  );
  const loadAiCostRiskGroupEvents = useAppContext(
    (v) => v.requestHelpers.loadAiCostRiskGroupEvents
  );
  const loadAiEnergyManualIdentityBuckets = useAppContext(
    (v) => v.requestHelpers.loadAiEnergyManualIdentityBuckets
  );
  const createAiEnergyManualIdentityBucket = useAppContext(
    (v) => v.requestHelpers.createAiEnergyManualIdentityBucket
  );
  const saveAiEnergyManualIdentityRule = useAppContext(
    (v) => v.requestHelpers.saveAiEnergyManualIdentityRule
  );
  const disableAiEnergyManualIdentityRule = useAppContext(
    (v) => v.requestHelpers.disableAiEnergyManualIdentityRule
  );
  const canView = managementLevel >= ADMIN_MANAGEMENT_LEVEL;

  useEffect(() => {
    if (!canView) return;
    let canceled = false;
    void init();

    async function init() {
      setLoading(true);
      setError('');
      setEventsError('');
      setEventsLoadingMore(false);
      try {
        const data = await loadAiCostReport(days);
        if (canceled) return;
        setReport(data);
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load AI cost report');
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, days, reloadKey]);

  useEffect(() => {
    if (!canView) return;
    let canceled = false;
    void init();

    async function init() {
      try {
        const manualBucketData = await loadAiEnergyManualIdentityBuckets({
          days,
          bucketId: selectedBucketId
        });
        if (canceled) return;
        applyManualIdentityBucketData(manualBucketData);
      } catch (loadError: any) {
        if (canceled) return;
        setManualIdentityError(
          loadError?.message || 'Failed to load manual identity buckets'
        );
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, days, reloadKey, selectedBucketId]);

  useEffect(() => {
    if (!canView || !selectedRiskGroup) {
      setRiskGroupDetail(null);
      setRiskGroupError('');
      setRiskGroupEventsError('');
      setRiskGroupLoading(false);
      setRiskGroupEventsLoadingMore(false);
      return;
    }
    const riskGroup = selectedRiskGroup;
    let canceled = false;
    void init();

    async function init() {
      setRiskGroupLoading(true);
      setRiskGroupError('');
      setRiskGroupEventsError('');
      setRiskGroupEventsLoadingMore(false);
      try {
        const data = await loadAiCostRiskGroup({
          days,
          riskKeyType: riskGroup.riskKeyType,
          riskKeyHash: riskGroup.riskKeyHash
        });
        if (canceled) return;
        setRiskGroupDetail(data);
      } catch (loadError: any) {
        if (canceled) return;
        setRiskGroupError(
          loadError?.message || 'Failed to load risk group detail'
        );
      } finally {
        if (!canceled) {
          setRiskGroupLoading(false);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canView,
    days,
    reloadKey,
    selectedRiskGroup?.riskKeyType,
    selectedRiskGroup?.riskKeyHash
  ]);

  if (!canView) {
    return (
      <InvalidPage
        title="Admins only"
        text="AI cost reporting is only available to admins."
      />
    );
  }

  return (
    <Content
      days={days}
      downloading={downloading}
      error={error}
      eventsError={eventsError}
      eventsLoadingMore={eventsLoadingMore}
      loading={loading}
      bucketDraftLabel={bucketDraftLabel}
      bucketRecommendations={bucketRecommendations}
      identityBuckets={identityBuckets}
      onCloseRiskGroup={() => setSelectedRiskGroup(null)}
      onBucketDraftLabelChange={handleBucketDraftLabelChange}
      onCreateBucket={handleCreateBucket}
      onCreateBucketFromRow={handleCreateBucketFromRow}
      onDownloadCSV={handleDownloadCSV}
      onLoadMoreEvents={handleLoadMoreEvents}
      onLoadMoreRiskGroupEvents={handleLoadMoreRiskGroupEvents}
      onRefresh={handleRefresh}
      onDisableManualIdentityRule={handleDisableManualIdentityRule}
      onSelectBucket={handleSelectBucket}
      onAddEmailToBucket={handleAddEmailToBucket}
      onAddEventRowToBucket={handleAddEventRowToBucket}
      onAddRiskGroupToBucket={handleAddRiskGroupToBucket}
      onAddRawSignalToBucket={handleAddRawSignalToBucket}
      onAddUserToBucket={handleAddUserToBucket}
      onRiskGroupSelect={handleRiskGroupSelect}
      onSelectDays={setDays}
      report={report}
      manualIdentityError={manualIdentityError}
      manualIdentitySavingKey={manualIdentitySavingKey}
      selectedBucketId={selectedBucketId}
      riskGroupDetail={riskGroupDetail}
      riskGroupError={riskGroupError}
      riskGroupEventsError={riskGroupEventsError}
      riskGroupEventsLoadingMore={riskGroupEventsLoadingMore}
      riskGroupLoading={riskGroupLoading}
      selectedRiskGroup={selectedRiskGroup}
    />
  );

  function handleRefresh() {
    setReloadKey((key) => key + 1);
  }

  function handleBucketDraftLabelChange(value: string) {
    setBucketDraftLabel(value);
    setManualIdentityError('');
  }

  function handleSelectBucket(bucketId: number) {
    if (bucketId !== selectedBucketId) {
      setBucketRecommendations(getEmptyBucketRecommendations());
    }
    setSelectedBucketId(bucketId);
    setManualIdentityError('');
  }

  function applyManualIdentityBucketData(data: any) {
    setIdentityBuckets(data?.buckets || []);
    setBucketRecommendations(
      data?.recommendations || getEmptyBucketRecommendations()
    );
    const serverSelectedBucketId = Number(data?.selectedBucketId || 0);
    if (serverSelectedBucketId && serverSelectedBucketId !== selectedBucketId) {
      setSelectedBucketId(serverSelectedBucketId);
    }
  }

  async function refreshManualIdentityBuckets(bucketId = selectedBucketId) {
    const data = await loadAiEnergyManualIdentityBuckets({
      days,
      bucketId
    });
    applyManualIdentityBucketData(data);
  }

  function getSelectedBucketId() {
    if (selectedBucketId) return selectedBucketId;
    setManualIdentityError('Create or select a bucket first.');
    return 0;
  }

  async function handleCreateBucket() {
    const label = bucketDraftLabel.trim();
    if (!label) {
      setManualIdentityError('Bucket name is required.');
      return;
    }
    const savingKey = 'bucket:create';
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      const data = await createAiEnergyManualIdentityBucket({ label });
      const bucketId = Number(data?.bucket?.id || 0);
      if (bucketId) {
        setBucketRecommendations(getEmptyBucketRecommendations());
        setSelectedBucketId(bucketId);
        await refreshManualIdentityBuckets(bucketId);
      } else {
        await refreshManualIdentityBuckets();
      }
      setBucketDraftLabel('');
    } catch (saveError: any) {
      setManualIdentityError(saveError?.message || 'Failed to create bucket');
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleCreateBucketFromRow(row: AiCostRow) {
    const label = getBucketLabelForRow(row);
    if (!label || !hasBucketEvidence(row)) {
      setManualIdentityError('This event row has no account or signal.');
      return;
    }
    const savingKey = `event-bucket:${getEventActionKey(row)}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      const data = await createAiEnergyManualIdentityBucket({ label });
      const bucketId = Number(data?.bucket?.id || 0);
      if (!bucketId) {
        await refreshManualIdentityBuckets();
        return;
      }
      setBucketRecommendations(getEmptyBucketRecommendations());
      setSelectedBucketId(bucketId);
      await addEventRowRulesToBucket({
        bucketId,
        row,
        notePrefix: 'Seeded from AI Costs event'
      });
      await refreshManualIdentityBuckets(bucketId);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to create bucket from event'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleAddEventRowToBucket(row: AiCostRow) {
    const bucketId = getSelectedBucketId();
    if (!bucketId) return;
    if (!hasBucketEvidence(row)) {
      setManualIdentityError('This event row has no account or signal.');
      return;
    }
    const savingKey = `event-row:${getEventActionKey(row)}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await addEventRowRulesToBucket({
        bucketId,
        row,
        notePrefix: 'Added from AI Costs event'
      });
      await refreshManualIdentityBuckets(bucketId);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to add event row to bucket'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleAddUserToBucket(row: AiCostRow) {
    const bucketId = getSelectedBucketId();
    if (!bucketId) return;
    const userId = Number(row.userId || 0);
    if (!userId) {
      setManualIdentityError('This row has no user id.');
      return;
    }
    const savingKey = `user:${userId}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await saveAiEnergyManualIdentityRule({
        bucketId,
        matchType: 'user',
        userId,
        note: `Added from AI Costs account ${userId}`
      });
      await refreshManualIdentityBuckets(bucketId);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to add user to bucket'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleAddEmailToBucket(row: AiCostRow) {
    const bucketId = getSelectedBucketId();
    if (!bucketId) return;
    const email = getRowEmail(row);
    if (!email) {
      setManualIdentityError('This row has no verified email.');
      return;
    }
    const savingKey = `email:${email}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await saveAiEnergyManualIdentityRule({
        bucketId,
        matchType: 'email',
        email,
        note: `Added from AI Costs account ${row.userId || ''}`.trim()
      });
      await refreshManualIdentityBuckets(bucketId);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to add email to bucket'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleAddRiskGroupToBucket(row: AiCostRow) {
    const bucketId = getSelectedBucketId();
    if (!bucketId) return;
    if (!row.riskKeyType || !row.riskKeyHash) {
      setManualIdentityError('This row has no risk key.');
      return;
    }
    const savingKey = `risk:${row.riskKeyType}:${row.riskKeyHash}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await saveAiEnergyManualIdentityRule({
        bucketId,
        matchType: 'risk_key',
        riskKeyType: row.riskKeyType,
        riskKeyHash: row.riskKeyHash,
        note: `Added from AI Costs ${row.riskKeyType}`
      });
      await refreshManualIdentityBuckets(bucketId);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to add signal to bucket'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleAddRawSignalToBucket(
    signal: AiEnergyManualIdentityRawSignal
  ) {
    const bucketId = getSelectedBucketId();
    if (!bucketId) return;
    if (!signal.riskKeyType || !signal.riskKeyValue) {
      setManualIdentityError('This row has no signal value.');
      return;
    }
    const savingKey = `raw-risk:${signal.riskKeyType}:${signal.riskKeyValue}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await saveAiEnergyManualIdentityRule({
        bucketId,
        matchType: 'risk_key',
        riskKeyType: signal.riskKeyType,
        riskKeyValue: signal.riskKeyValue,
        note: `Added from session evidence ${signal.label}`
      });
      await refreshManualIdentityBuckets(bucketId);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to add signal to bucket'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleDisableManualIdentityRule(
    rule: AiEnergyManualIdentityRule
  ) {
    if (!rule.id) return;
    const savingKey = `disable:${rule.id}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await disableAiEnergyManualIdentityRule(rule.id);
      await refreshManualIdentityBuckets(rule.bucketId || selectedBucketId);
      setReloadKey((key) => key + 1);
    } catch (disableError: any) {
      setManualIdentityError(
        disableError?.message || 'Failed to remove bucket item'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleDownloadCSV() {
    setDownloading(true);
    try {
      const response = await loadAiCostReportCSV(days);
      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai-costs-${days}d.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error downloading AI cost CSV:', downloadError);
    } finally {
      setDownloading(false);
    }
  }

  async function handleLoadMoreEvents() {
    if (!report?.recentEventsHasMore || !report.recentEventsCursor) return;
    const requestDays = days;
    const cursor = report.recentEventsCursor;
    setEventsLoadingMore(true);
    setEventsError('');
    try {
      const page = (await loadAiCostEvents({
        days: requestDays,
        cursor
      })) as AiCostEventPage;
      setReport((currentReport) => {
        if (!currentReport || currentReport.days !== requestDays) {
          return currentReport;
        }
        return {
          ...currentReport,
          recentEvents: [...currentReport.recentEvents, ...page.events],
          recentEventsCursor: page.nextCursor,
          recentEventsHasMore: page.hasMore,
          recentEventsPageSize: page.pageSize
        };
      });
    } catch (loadError: any) {
      setEventsError(loadError?.message || 'Failed to load more events');
    } finally {
      setEventsLoadingMore(false);
    }
  }

  async function handleLoadMoreRiskGroupEvents() {
    if (
      !selectedRiskGroup ||
      !riskGroupDetail?.eventsHasMore ||
      !riskGroupDetail.eventsCursor
    ) {
      return;
    }
    const requestDays = days;
    const riskGroup = selectedRiskGroup;
    const cursor = riskGroupDetail.eventsCursor;
    setRiskGroupEventsLoadingMore(true);
    setRiskGroupEventsError('');
    try {
      const page = (await loadAiCostRiskGroupEvents({
        days: requestDays,
        riskKeyType: riskGroup.riskKeyType,
        riskKeyHash: riskGroup.riskKeyHash,
        cursor
      })) as AiCostEventPage;
      setRiskGroupDetail((currentDetail) => {
        if (
          !currentDetail ||
          currentDetail.days !== requestDays ||
          currentDetail.riskKeyType !== riskGroup.riskKeyType ||
          currentDetail.riskKeyHash !== riskGroup.riskKeyHash
        ) {
          return currentDetail;
        }
        return {
          ...currentDetail,
          events: [...currentDetail.events, ...page.events],
          eventsCursor: page.nextCursor,
          eventsHasMore: page.hasMore,
          eventsPageSize: page.pageSize
        };
      });
    } catch (loadError: any) {
      setRiskGroupEventsError(
        loadError?.message || 'Failed to load more risk group events'
      );
    } finally {
      setRiskGroupEventsLoadingMore(false);
    }
  }

  function handleRiskGroupSelect(row: AiCostRow) {
    if (!row.riskKeyType || !row.riskKeyHash) return;
    setSelectedRiskGroup({
      riskKeyType: row.riskKeyType,
      riskKeyHash: row.riskKeyHash
    });
  }

  async function addEventRowRulesToBucket({
    bucketId,
    row,
    notePrefix
  }: {
    bucketId: number;
    row: AiCostRow;
    notePrefix: string;
  }) {
    const userId = Number(row.userId || 0);
    const email = getRowEmail(row);
    const signals = getEventSignals(row);
    if (userId) {
      await saveAiEnergyManualIdentityRule({
        bucketId,
        matchType: 'user',
        userId,
        note: `${notePrefix} user ${userId}`
      });
    }
    if (email) {
      await saveAiEnergyManualIdentityRule({
        bucketId,
        matchType: 'email',
        email,
        note: `${notePrefix} email`
      });
    }
    for (const signal of signals) {
      await saveAiEnergyManualIdentityRule({
        bucketId,
        matchType: 'risk_key',
        riskKeyType: signal.riskKeyType,
        riskKeyHash: signal.riskKeyHash,
        note: `${notePrefix} ${signal.riskKeyType}`
      });
    }
  }
}
