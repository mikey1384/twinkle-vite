import React, { useEffect, useState } from 'react';
import InvalidPage from '~/components/InvalidPage';
import { useAppContext, useKeyContext } from '~/contexts';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import Content from './Content';
import {
  AiCostEventPage,
  AiCostReport,
  AiCostRiskGroupDetail,
  AiCostRow,
  RangeOption
} from './types';

export default function AiCosts() {
  const [days, setDays] = useState<RangeOption>(7);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState<AiCostReport | null>(null);
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
      onCloseRiskGroup={() => setSelectedRiskGroup(null)}
      onDownloadCSV={handleDownloadCSV}
      onLoadMoreEvents={handleLoadMoreEvents}
      onLoadMoreRiskGroupEvents={handleLoadMoreRiskGroupEvents}
      onRefresh={handleRefresh}
      onRiskGroupSelect={handleRiskGroupSelect}
      onSelectDays={setDays}
      report={report}
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
}
