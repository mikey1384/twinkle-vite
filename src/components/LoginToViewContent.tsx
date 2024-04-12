import React from 'react';
import { borderRadius, Color, desktopMinWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const mustLogInToViewContentLabel = localize('mustLogInToViewContent');

export default function LoginToViewContent({
  className
}: {
  className?: string;
}) {
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );

  return (
    <div
      onClick={onOpenSigninModal}
      className={`${className} ${css`
        width: CALC(100% - 2rem);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 1rem;
        padding: 1rem;
        font-size: 1.7rem;
        border-radius: ${borderRadius};
        border: 1px solid ${Color.black()};
      `}`}
    >
      <span
        className={css`
          @media (min-width: ${desktopMinWidth}) {
            &:hover {
              text-decoration: underline;
            }
          }
        `}
      >
        {mustLogInToViewContentLabel}
      </span>
    </div>
  );
}
