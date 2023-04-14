import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import TextareaAutosize from 'react-textarea-autosize';

export default function Textarea({
  className,
  innerRef,
  maxRows = 20,
  ...props
}: {
  className?: string;
  innerRef?: any;
  maxRows?: number;
  [key: string]: any;
}) {
  return (
    <TextareaAutosize
      {...props}
      maxRows={maxRows}
      ref={innerRef}
      className={`${className} ${css`
        font-family: 'Noto Sans', Helvetica, sans-serif, Arial;
        width: 100%;
        position: relative;
        font-size: 1.7rem;
        padding: 1rem;
        border: 1px solid ${Color.darkerBorderGray()};
        &:focus {
          outline: none;
          border: 1px solid ${Color.logoBlue()};
          box-shadow: 0px 0px 3px ${Color.logoBlue(0.8)};
          ::placeholder {
            color: ${Color.lighterGray()};
          }
        }
        ::placeholder {
          color: ${Color.gray()};
        }
        @media (max-width: ${mobileMaxWidth}) {
          line-height: 1.6;
          font-size: 1.5rem;
        }
      `}`}
    />
  );
}
