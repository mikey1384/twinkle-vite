import React, { ReactNode } from 'react';
import {
  batteryMeterCls,
  batteryMeterMetaCls,
  batteryMeterMetaItemCls,
  batteryMeterModeCls,
  batteryMeterTitleCls,
  batteryMeterTopRowCls,
  batterySegmentCls,
  batterySegmentFillCls,
  batterySegmentsCls
} from './styles';

interface Props {
  accentColor: string;
  accentSoft: string;
  energyPercent: number;
  energyPercentLabel?: string;
  modeLabel: string;
  segmentLabel?: string;
  segments: number;
  title?: ReactNode;
}

export default function BatteryMeter({
  accentColor,
  accentSoft,
  energyPercent,
  energyPercentLabel,
  modeLabel,
  segmentLabel,
  segments,
  title
}: Props) {
  const safeSegmentCount = Math.max(1, segments);
  const safePercent = Math.max(0, Math.min(100, energyPercent));
  const visualSegmentFill = (safePercent / 100) * safeSegmentCount;
  const hasMeta = !!energyPercentLabel || !!segmentLabel;
  const hasTopRow = !!title || !!modeLabel;

  return (
    <div className={batteryMeterCls}>
      {hasTopRow && (
        <div
          className={batteryMeterTopRowCls}
          style={{
            justifyContent: title ? 'space-between' : 'flex-end'
          }}
        >
          {title && <div className={batteryMeterTitleCls}>{title}</div>}
          {!!modeLabel && (
            <div
              className={batteryMeterModeCls}
              style={{
                color: accentColor,
                background: accentSoft
              }}
            >
              {modeLabel}
            </div>
          )}
        </div>
      )}
      <div
        className={batterySegmentsCls}
        style={{
          marginTop: hasTopRow ? undefined : 0,
          gridTemplateColumns: `repeat(${safeSegmentCount}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: safeSegmentCount }).map((_, index) => {
          const fillRatio = Math.max(0, Math.min(1, visualSegmentFill - index));

          return (
            <div
              key={index}
              className={batterySegmentCls}
              style={{
                borderColor: fillRatio > 0 ? accentSoft : 'var(--ui-border)'
              }}
            >
              {fillRatio > 0 && (
                <span
                  className={batterySegmentFillCls}
                  style={{
                    width: `${fillRatio * 100}%`,
                    background: accentColor
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {hasMeta && (
        <div className={batteryMeterMetaCls}>
          {energyPercentLabel && (
            <div className={batteryMeterMetaItemCls}>{energyPercentLabel}</div>
          )}
          {segmentLabel && (
            <div className={batteryMeterMetaItemCls}>{segmentLabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
