import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

export default function ChangePicture({ shown }: { shown: boolean }) {
  return <span aria-hidden="true" className={overlayClass} data-shown={shown}>
    <Icon icon="camera-alt" /><span>Change</span>
  </span>;
}

const overlayClass = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  background: #172033b8;
  color: #fff;
  opacity: 0;
  font-size: 12px;
  transition: opacity .15s ease;
  pointer-events: none;
  &[data-shown='true'] { opacity: 1; }
  @media (pointer: coarse) { opacity: 1; inset: auto 0 0; padding: 5px; flex-direction: row; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
