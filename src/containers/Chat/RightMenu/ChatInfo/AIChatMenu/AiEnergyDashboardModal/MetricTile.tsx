import React from 'react';
import Icon from '~/components/Icon';
import { withAlpha } from './helpers';
import {
  metricTileCls,
  metricTileIconCls,
  metricTileLabelRowCls,
  metricTileValueCls
} from './styles';

interface Props {
  accentColor: string;
  icon: string;
  label: string;
  value: React.ReactNode;
}

export default function MetricTile({
  accentColor,
  icon,
  label,
  value
}: Props) {
  return (
    <div
      className={metricTileCls}
      style={{
        borderColor: withAlpha(accentColor, 0.18)
      }}
    >
      <div className={metricTileLabelRowCls}>
        <span
          className={metricTileIconCls}
          style={{
            color: accentColor
          }}
        >
          <Icon icon={icon} />
        </span>
        <span>{label}</span>
      </div>
      <div className={metricTileValueCls}>{value}</div>
    </div>
  );
}
