import React from 'react';
import PropTypes from 'prop-types';
import { Rectangle } from 'recharts';
import { Color } from '~/constants/css';

Bar.propTypes = {
  index: PropTypes.number,
  totalLength: PropTypes.number,
  fill: PropTypes.string
};

export default function Bar({
  index,
  totalLength,
  ...props
}: {
  index?: number;
  totalLength: number;
}) {
  return (
    <Rectangle
      {...props}
      fill={index === totalLength - 1 ? Color.orange() : Color.logoBlue()}
    />
  );
}
