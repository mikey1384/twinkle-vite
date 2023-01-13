import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function CardSearchPanel() {
  return (
    <div
      className={css`
        font-size: 1.7rem;
        width: 100%;
        padding: 1rem;
        background: #fff;
        border: 1px solid ${Color.borderGray()};
      `}
    >
      <div>search panel</div>
    </div>
  );
}
