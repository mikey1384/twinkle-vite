import React from 'react';
import { css, cx } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { homePanelClass } from '~/theme/homePanels';
import { useHomePanelVars } from '~/theme/useHomePanelVars';

export default function HomeSectionHeader({
  title,
  children,
  className,
  style,
  headingStyle
}: {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  headingStyle?: React.CSSProperties;
}) {
  const { panelVars } = useHomePanelVars(0.08, { neutralSurface: true });

  return (
    <div
      className={cx(
        homePanelClass,
        className,
        css`
          --home-panel-border: var(--ui-border);
          --home-panel-mobile-padding: 1.4rem 1.6rem;
          --home-panel-color: ${Color.darkerGray()};
          --home-panel-heading: ${Color.black()};
          padding: 1.6rem 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            border-top: none;
          }
        `
      )}
      style={{
        ...panelVars,
        ...style
      }}
    >
      <p
        className={css`
          font-size: 2rem;
          font-weight: bold;
          line-height: 1.5;
        `}
        style={{ fontWeight: 'bold', fontSize: '2.5rem', ...headingStyle }}
      >
        {title || children}
      </p>
    </div>
  );
}
