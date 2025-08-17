import { css } from '@emotion/css';
import { keyframes } from '@emotion/react';
import { Color } from '~/constants/css';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function skeletonBar({
  height = 16,
  width = '100%',
  radius = 6
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return css`
    width: ${typeof width === 'number' ? `${width}px` : width};
    height: ${typeof height === 'number' ? `${height}px` : height};
    border-radius: ${radius}px;
    background: linear-gradient(
      90deg,
      ${Color.wellGray(0.3)} 25%,
      ${Color.wellGray(0.5)} 50%,
      ${Color.wellGray(0.3)} 75%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.2s ease-in-out infinite;
  `;
}
