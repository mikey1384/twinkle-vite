import { css } from '@emotion/css';

// Only size these controls; Button owns their original dark-gray/white styling.
// Keep the footprint equal to the surface so adjacent controls stay close.
export const messageControlClass = css`
  && {
    position: relative;
    width: 30px;
    min-width: 30px;
    height: 30px;
    min-height: 30px;
    flex-shrink: 0;
    padding: 0;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1;
  }

  svg {
    vertical-align: middle;
  }
`;
