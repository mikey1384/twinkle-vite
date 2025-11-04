import React from 'react';
import { css, cx } from '@emotion/css';
import { Color } from '~/constants/css';

const loginPromptClass = css`
  text-align: center;
  font-size: 2.3rem;
  font-weight: bold;
  color: ${Color.black()};
  margin-top: 17vh;
`;

export default function HomeLoginPrompt({
  message = 'Please log in to view this page',
  className,
  style
}: {
  message?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cx(loginPromptClass, className)} style={style}>
      {message}
    </div>
  );
}
