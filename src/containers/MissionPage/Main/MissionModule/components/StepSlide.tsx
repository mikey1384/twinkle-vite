import React from 'react';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function StepSlide({
  children,
  title,
  style,
  index = 0,
  innerRef
}: {
  children?: any;
  title: string | React.ReactNode;
  style?: React.CSSProperties;
  index?: number;
  innerRef?: React.RefObject<any>;
}) {
  return (
    <div
      ref={innerRef}
      style={style}
      className={css`
        width: 100%;
        min-height: 10rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        h1 {
          font-size: 2rem;
          line-height: 1.7;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        }
        h2 {
          font-weight: bold;
          font-size: 1.7rem;
          line-height: 1.7;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        }
        p {
          font-size: 1.7rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        }
      `}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div>
          <h1>{index + 1}. </h1>
        </div>
        <div style={{ marginLeft: '0.7rem' }}>
          <h1
            className={css`
              margin-bottom: 3rem;
            `}
          >
            {title}
          </h1>
        </div>
      </div>
      {children}
    </div>
  );
}
