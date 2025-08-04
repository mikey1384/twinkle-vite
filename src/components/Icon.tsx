import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExecutionEnvironment from 'exenv';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';

export default function Icon({
  icon,
  size,
  ...props
}: {
  icon: any;
  size?: string;
  [key: string]: any;
}) {
  return ExecutionEnvironment.canUseDOM ? (
    <FontAwesomeIcon icon={icon} size={size as SizeProp} {...props} />
  ) : null;
}
