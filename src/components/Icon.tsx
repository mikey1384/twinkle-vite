import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExecutionEnvironment from 'exenv';

export default function Icon({
  icon,
  size,
  ...props
}: {
  [key: string]: any;
}): JSX.Element | null {
  return ExecutionEnvironment.canUseDOM ? (
    <FontAwesomeIcon icon={icon} size={size} {...props} />
  ) : null;
}
