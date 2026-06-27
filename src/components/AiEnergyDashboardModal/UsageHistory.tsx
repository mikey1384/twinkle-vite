import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import {
  emptyInlineStateCls,
  sectionStackCls,
  subtleLabelCls,
  surfaceCardCls,
  surfaceDescriptionCls,
  surfaceTitleCls
} from './styles';
import {
  formatBatteryUnits,
  getAiUsageSurfaceLabel,
  getAiUsageTargetLabel
} from './helpers';
import type { AiUsageHistoryEvent } from './types';

const FALLBACK_FULL_BATTERY_UNITS = 1_000_000;

export default function UsageHistory({
  accentColor,
  accentSoft,
  energyUsedToday,
  energyPercent
}: {
  accentColor: string;
  accentSoft: string;
  energyUsedToday: number | null;
  energyPercent: number | null;
}) {
  const loadAiUsageHistory = useAppContext(
    (v) => v.requestHelpers.loadAiUsageHistory
  );
  const [events, setEvents] = useState<AiUsageHistoryEvent[]>([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [fullBatteryUnits, setFullBatteryUnits] = useState(
    FALLBACK_FULL_BATTERY_UNITS
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const usedTodayLabel =
    typeof energyUsedToday === 'number'
      ? formatBatteryUnits(energyUsedToday, fullBatteryUnits)
      : '—';
  const batteryLeftLabel =
    typeof energyPercent === 'number'
      ? `${Math.max(0, Math.min(100, Math.round(energyPercent)))} / 100`
      : '—';

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const result = await loadAiUsageHistory();
        setEvents(result?.events || []);
        setLoadMoreShown(!!result?.loadMoreShown);
        if (result?.fullBatteryUnits) {
          setFullBatteryUnits(Number(result.fullBatteryUnits));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={sectionStackCls}>
      <div className={summaryGridCls}>
        <div className={summaryCellCls}>
          <div className={subtleLabelCls}>Used today</div>
          <div className={summaryValueCls} style={{ color: accentColor }}>
            {usedTodayLabel}
          </div>
        </div>
        <div className={summaryCellCls}>
          <div className={subtleLabelCls}>Battery left</div>
          <div className={summaryValueCls} style={{ color: Color.black() }}>
            {batteryLeftLabel}
          </div>
        </div>
      </div>

      <section className={surfaceCardCls}>
        <div className={surfaceTitleCls}>Today&apos;s usage</div>
        <p className={surfaceDescriptionCls}>
          Each item shows how much energy a request used &mdash; 100 is a full
          battery&apos;s worth.
        </p>
        {loading ? (
          <Loading style={{ height: '12rem' }} />
        ) : events.length > 0 ? (
          <div className={listCls}>
            {events.map((event) => {
              const isLiteMode = event.energyMode === 'low_energy';
              const wentOver =
                !isLiteMode &&
                event.energyOverflowUnits > 0 &&
                event.energyChargedUnits < event.energyUnits;
              const targetLabel = getAiUsageTargetLabel(event.targetType);
              return (
                <div key={event.id} className={rowCls}>
                  <div className={rowMainCls}>
                    <div className={rowTitleCls}>
                      {getAiUsageSurfaceLabel(event.aiUsername)}
                    </div>
                    <div className={rowMetaCls}>
                      {moment.unix(event.createdAt).format('LT')}
                      {targetLabel ? ` · ${targetLabel}` : ''}
                      {event.model ? ` · ${event.model}` : ''}
                      {isLiteMode
                        ? ' · lite mode'
                        : wentOver
                          ? ' · over battery'
                          : ''}
                    </div>
                  </div>
                  <div
                    className={rowAmountCls}
                    style={{ color: accentColor, background: accentSoft }}
                  >
                    <Icon icon="bolt" />
                    <span>
                      {formatBatteryUnits(event.energyUnits, fullBatteryUnits)}
                    </span>
                  </div>
                </div>
              );
            })}
            {loadMoreShown && (
              <LoadMoreButton
                filled
                style={{ width: '100%', marginTop: '1rem' }}
                loading={loadingMore}
                onClick={handleLoadMore}
              />
            )}
          </div>
        ) : (
          <div className={emptyInlineStateCls}>
            No AI battery usage yet today.
          </div>
        )}
      </section>
    </div>
  );

  async function handleLoadMore() {
    if (loadingMoreRef.current || !events.length) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const lastId = events[events.length - 1].id;
      const result = await loadAiUsageHistory(lastId);
      setEvents((currentEvents) => [
        ...currentEvents,
        ...(result?.events || [])
      ]);
      setLoadMoreShown(!!result?.loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }
}

const summaryGridCls = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
`;

const summaryCellCls = css`
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  padding: 1rem;
  min-height: 5.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  justify-content: center;
`;

const summaryValueCls = css`
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1.1;
`;

const listCls = css`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const rowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 0.8rem 0.95rem;
  background: rgba(255, 255, 255, 0.94);
`;

const rowMainCls = css`
  min-width: 0;
`;

const rowTitleCls = css`
  font-size: 1.15rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.3;
`;

const rowMetaCls = css`
  margin-top: 0.25rem;
  font-size: 1.1rem;
  line-height: 1.4;
  color: ${Color.darkGray()};
  word-break: break-word;
`;

const rowAmountCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
`;
