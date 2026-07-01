import React from 'react';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { css, cx } from '@emotion/css';

export default function InvalidContent({
  bare,
  style
}: {
  bare?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className={cx(invalidContentClass, bare && 'bare')}>
      <Icon icon="ban" />
      <span>Invalid Content</span>
    </div>
  );
}

const invalidContentClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 8rem;
  padding: 1.5rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  color: ${Color.darkGray()};
  text-align: center;

  svg {
    font-size: 2.2rem;
  }

  span {
    font-size: 1.3rem;
    font-weight: 700;
  }

  &.bare {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 1rem;
    border: 0;
    border-radius: 0;
  }
`;
