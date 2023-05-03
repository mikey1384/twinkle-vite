import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExecutionEnvironment from 'exenv';

Icon.propTypes = {
  icon: PropTypes.any.isRequired,
  size: PropTypes.string
};
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
