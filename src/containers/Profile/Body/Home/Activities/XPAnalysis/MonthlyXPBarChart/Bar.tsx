import React from 'react';
import { Rectangle } from 'recharts';
import { Color } from '~/constants/css';

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
