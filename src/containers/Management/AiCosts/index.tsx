import React, { useEffect, useState } from 'react';
import InvalidPage from '~/components/InvalidPage';
import { useAppContext, useKeyContext } from '~/contexts';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import Content from './Content';
import {
  getEventActionKey,
  getEventSignals,
  getRowEmail
} from './helpers/formatters';
import {
  AiEnergyManualIdentityBucket,
  AiEnergyManualIdentityBucketAction,
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
  const [manualIdentityLoading, setManualIdentityLoading] = useState(false);
  const [pendingBucketAction, setPendingBucketAction] =
    useState<AiEnergyManualIdentityBucketAction | null>(null);
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
  const updateAiEnergyManualIdentityBucket = useAppContext(
    (v) => v.requestHelpers.updateAiEnergyManualIdentityBucket
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
      setManualIdentityLoading(true);
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
      } finally {
        if (!canceled) {
          setManualIdentityLoading(false);
        }
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
      pendingBucketAction={pendingBucketAction}
      bucketRecommendations={bucketRecommendations}
      identityBuckets={identityBuckets}
      onAddPendingBucketActionToBucket={handleAddPendingBucketActionToBucket}
      onCloseRiskGroup={() => setSelectedRiskGroup(null)}
      onCloseBucketActionModal={handleCloseBucketActionModal}
      onBucketDraftLabelChange={handleBucketDraftLabelChange}
      onCreateBucket={handleCreateBucket}
      onCreateBucketForPendingAction={handleCreateBucketForPendingAction}
      onDownloadCSV={handleDownloadCSV}
      onLoadMoreEvents={handleLoadMoreEvents}
      onLoadMoreRiskGroupEvents={handleLoadMoreRiskGroupEvents}
      onRefresh={handleRefresh}
      onDisableManualIdentityRule={handleDisableManualIdentityRule}
      onOpenBucketActionModal={handleOpenBucketActionModal}
      onSelectBucket={handleSelectBucket}
      onRiskGroupSelect={handleRiskGroupSelect}
      onSelectDays={setDays}
      report={report}
      manualIdentityError={manualIdentityError}
      manualIdentityLoading={manualIdentityLoading}
      manualIdentitySavingKey={manualIdentitySavingKey}
      onBucketTitleSave={handleBucketTitleSave}
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
    setManualIdentityLoading(true);
    try {
      const data = await loadAiEnergyManualIdentityBuckets({
        days,
        bucketId
      });
      applyManualIdentityBucketData(data);
    } finally {
      setManualIdentityLoading(false);
    }
  }

  function handleOpenBucketActionModal(
    action: AiEnergyManualIdentityBucketAction
  ) {
    setPendingBucketAction(action);
    setManualIdentityError('');
  }

  function handleCloseBucketActionModal() {
    if (manualIdentitySavingKey) return;
    setPendingBucketAction(null);
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

  async function handleBucketTitleSave({
    bucketId,
    label
  }: {
    bucketId: number;
    label: string;
  }) {
    const normalizedLabel = label.trim();
    if (!bucketId || !normalizedLabel) {
      setManualIdentityError('Bucket name is required.');
      return;
    }
    const savingKey = `bucket:update:${bucketId}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await updateAiEnergyManualIdentityBucket({
        bucketId,
        label: normalizedLabel
      });
      await refreshManualIdentityBuckets(bucketId);
    } catch (saveError: any) {
      setManualIdentityError(saveError?.message || 'Failed to update bucket');
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleAddPendingBucketActionToBucket(bucketId: number) {
    if (!pendingBucketAction || !bucketId) return;
    const savingKey = getPendingBucketActionSavingKey(pendingBucketAction);
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      await addPendingActionRulesToBucket({
        bucketId,
        action: pendingBucketAction,
        notePrefix: 'Added from AI Costs'
      });
      await refreshManualIdentityBuckets(bucketId);
      setSelectedBucketId(bucketId);
      setPendingBucketAction(null);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to add item to bucket'
      );
    } finally {
      setManualIdentitySavingKey('');
    }
  }

  async function handleCreateBucketForPendingAction(label: string) {
    if (!pendingBucketAction) return;
    const normalizedLabel = label.trim();
    if (!normalizedLabel) {
      setManualIdentityError('Bucket name is required.');
      return;
    }
    const savingKey = `bucket-action-create:${getPendingBucketActionSavingKey(
      pendingBucketAction
    )}`;
    setManualIdentitySavingKey(savingKey);
    setManualIdentityError('');
    try {
      const data = await createAiEnergyManualIdentityBucket({
        label: normalizedLabel
      });
      const bucketId = Number(data?.bucket?.id || 0);
      if (!bucketId) {
        await refreshManualIdentityBuckets();
        return;
      }
      await addPendingActionRulesToBucket({
        bucketId,
        action: pendingBucketAction,
        notePrefix: 'Seeded from AI Costs'
      });
      await refreshManualIdentityBuckets(bucketId);
      setSelectedBucketId(bucketId);
      setPendingBucketAction(null);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      setManualIdentityError(
        saveError?.message || 'Failed to create bucket'
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

  async function addPendingActionRulesToBucket({
    bucketId,
    action,
    notePrefix
  }: {
    bucketId: number;
    action: AiEnergyManualIdentityBucketAction;
    notePrefix: string;
  }) {
    if (action.actionType === 'event_row') {
      await addEventRowRulesToBucket({
        bucketId,
        row: action.row,
        notePrefix: `${notePrefix} event`
      });
      return;
    }

    if (action.actionType === 'user') {
      await addUserRuleToBucket({
        bucketId,
        row: action.row,
        notePrefix
      });
      return;
    }

    if (action.actionType === 'email') {
      await addEmailRuleToBucket({
        bucketId,
        row: action.row,
        notePrefix
      });
      return;
    }

    if (action.actionType === 'risk_key') {
      await addRiskGroupRuleToBucket({
        bucketId,
        row: action.row,
        notePrefix
      });
      return;
    }

    await addRawSignalRuleToBucket({
      bucketId,
      signal: action.signal,
      notePrefix
    });
  }

  async function addUserRuleToBucket({
    bucketId,
    row,
    notePrefix
  }: {
    bucketId: number;
    row: AiCostRow;
    notePrefix: string;
  }) {
    const userId = Number(row.userId || 0);
    if (!userId) {
      const error: any = new Error('This row has no user id.');
      error.status = 400;
      throw error;
    }
    await saveAiEnergyManualIdentityRule({
      bucketId,
      matchType: 'user',
      userId,
      note: `${notePrefix} account ${userId}`
    });
  }

  async function addEmailRuleToBucket({
    bucketId,
    row,
    notePrefix
  }: {
    bucketId: number;
    row: AiCostRow;
    notePrefix: string;
  }) {
    const email = getRowEmail(row);
    if (!email) {
      const error: any = new Error('This row has no verified email.');
      error.status = 400;
      throw error;
    }
    await saveAiEnergyManualIdentityRule({
      bucketId,
      matchType: 'email',
      email,
      note: `${notePrefix} email ${row.userId || ''}`.trim()
    });
  }

  async function addRiskGroupRuleToBucket({
    bucketId,
    row,
    notePrefix
  }: {
    bucketId: number;
    row: AiCostRow;
    notePrefix: string;
  }) {
    if (!row.riskKeyType || !row.riskKeyHash) {
      const error: any = new Error('This row has no risk key.');
      error.status = 400;
      throw error;
    }
    await saveAiEnergyManualIdentityRule({
      bucketId,
      matchType: 'risk_key',
      riskKeyType: row.riskKeyType,
      riskKeyHash: row.riskKeyHash,
      note: `${notePrefix} ${row.riskKeyType}`
    });
  }

  async function addRawSignalRuleToBucket({
    bucketId,
    signal,
    notePrefix
  }: {
    bucketId: number;
    signal: AiEnergyManualIdentityRawSignal;
    notePrefix: string;
  }) {
    if (!signal.riskKeyType || !signal.riskKeyValue) {
      const error: any = new Error('This row has no signal value.');
      error.status = 400;
      throw error;
    }
    await saveAiEnergyManualIdentityRule({
      bucketId,
      matchType: 'risk_key',
      riskKeyType: signal.riskKeyType,
      riskKeyValue: signal.riskKeyValue,
      note: `${notePrefix} session evidence ${signal.label}`
    });
  }
}

function getPendingBucketActionSavingKey(
  action: AiEnergyManualIdentityBucketAction
) {
  if (action.actionType === 'event_row') {
    return `event-row:${getEventActionKey(action.row)}`;
  }
  if (action.actionType === 'user') {
    return `user:${Number(action.row.userId || 0)}`;
  }
  if (action.actionType === 'email') {
    return `email:${getRowEmail(action.row)}`;
  }
  if (action.actionType === 'risk_key') {
    return `risk:${action.row.riskKeyType}:${action.row.riskKeyHash}`;
  }
  return `raw-risk:${action.signal.riskKeyType}:${action.signal.riskKeyValue}`;
}
