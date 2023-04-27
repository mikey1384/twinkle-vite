import React from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export default function Check({ checked }: { checked: boolean }) {
  return checked ? (
    <Icon icon="check" style={{ color: Color.green() }} />
  ) : (
    <Icon icon="minus" />
  );
}
