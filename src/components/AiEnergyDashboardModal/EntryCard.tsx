import React from 'react';
import Icon from '~/components/Icon';
import { withAlpha } from './helpers';
import {
  entryCardCls,
  entryCardDetailCls,
  entryCardIconCls,
  entryCardStatusCls,
  entryCardTitleCls,
  entryCardValueCls
} from './styles';

interface Props {
  accentColor: string;
  detail: string;
  icon: string;
  onClick: () => void;
  status?: string;
  title: string;
  value: React.ReactNode;
}

export default function EntryCard({
  accentColor,
  detail,
  icon,
  onClick,
  status,
  title,
  value
}: Props) {
  return (
    <button
      type="button"
      className={entryCardCls}
      onClick={onClick}
      style={{
        borderColor: accentColor
      }}
    >
      <div
        className={entryCardIconCls}
        style={{
          color: accentColor,
          background: withAlpha(accentColor, 0.11)
        }}
      >
        <Icon icon={icon} />
      </div>
      {status ? (
        <div
          className={entryCardStatusCls}
          style={{
            color: accentColor,
            background: withAlpha(accentColor, 0.1)
          }}
        >
          {status}
        </div>
      ) : null}
      <div className={entryCardTitleCls}>{title}</div>
      <div className={entryCardValueCls}>{value}</div>
      <div className={entryCardDetailCls}>{detail}</div>
    </button>
  );
}
