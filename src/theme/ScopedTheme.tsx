import React, { JSX } from 'react';
import { ThemeName } from '~/theme';
import { useScopedThemeVars } from '~/theme/useScopedThemeVars';

interface Props {
  theme: ThemeName | string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  roles?: string[];
}

export default function ScopedTheme({
  theme,
  className,
  style,
  children,
  as = 'div',
  roles
}: Props) {
  const Element = as as any;
  const { vars } = useScopedThemeVars({
    themeName: theme,
    roles
  });

  return (
    <Element
      className={className}
      style={{ ...(style || {}), ...(vars as any) }}
    >
      {children}
    </Element>
  );
}
