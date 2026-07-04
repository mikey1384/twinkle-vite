import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { getThemeStyles } from '~/constants/css';
import { useKeyContext } from '~/contexts';

const mainProjectButtonClass = css`
  justify-self: start;
  width: max-content;
  max-width: 100%;
  border: 1px solid var(--main-btn-border, #285a9c);
  border-radius: 999px;
  background: var(--main-btn-bg, #418ceb);
  color: var(--main-btn-text, #fff);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.56rem 0.85rem;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.18);
  white-space: nowrap;
  &:hover {
    background: var(--main-btn-hover, #357abd);
  }
`;

export default function MainProjectButton({
  className,
  onClick
}: {
  className?: string;
  onClick?: () => void;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themedStyle = useMemo(() => {
    const themed = getThemeStyles(profileTheme || 'logoBlue', 1);
    return {
      '--main-btn-bg': themed.bg,
      '--main-btn-hover': themed.hoverBg,
      '--main-btn-border': themed.border,
      '--main-btn-text': themed.text
    } as React.CSSProperties;
  }, [profileTheme]);

  return (
    <button
      type="button"
      className={
        className ? `${mainProjectButtonClass} ${className}` : mainProjectButtonClass
      }
      style={themedStyle}
      onClick={onClick}
    >
      <Icon icon="home" />
      <span>Main</span>
    </button>
  );
}
