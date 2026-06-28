import React from 'react';
import { Color } from '~/constants/css';
import { metricCardClass } from './AiCosts/styles';

export default function MetricCard({
  label,
  value,
  detail,
  color
}: {
  label: string;
  value: string;
  detail?: string;
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
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}
