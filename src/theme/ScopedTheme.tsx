import React, { JSX, useMemo } from 'react';
import { getScopedThemeVars, getThemeRoles, ThemeName } from '~/theme/themes';
import { Color } from '~/constants/css';

interface Props {
  theme: ThemeName;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  roles?: string[];
}

function resolveColor(name?: string, opacity?: number) {
  if (!name) return '';
  const colorFn = Color[name as keyof typeof Color];
  if (colorFn) {
    return typeof opacity === 'number' ? colorFn(opacity) : colorFn();
  }
  return name;
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
  const baseVars = useMemo(() => getScopedThemeVars(theme), [theme]);

  const roleVars = useMemo(() => {
    if (!roles?.length) return {} as Record<string, string>;
    const themeRoles = getThemeRoles(theme);
    const vars: Record<string, string> = {};
    roles.forEach((role) => {
      const value = themeRoles[role];
      if (!value) return;
      if ('color' in value && value.color) {
        vars[`--role-${role}-color`] = resolveColor(value.color, value.opacity);
      }
      if ('opacity' in value && typeof value.opacity === 'number') {
        vars[`--role-${role}-opacity`] = String(value.opacity);
      }
      if ('shadow' in value && value.shadow) {
        vars[`--role-${role}-shadow`] = resolveColor(value.shadow);
      }
    });
    return vars;
  }, [roles, theme]);

  const vars = useMemo(
    () => ({ ...baseVars, ...roleVars }),
    [baseVars, roleVars]
  );

  return (
    <Element
      className={className}
      style={{ ...(style || {}), ...(vars as any) }}
    >
      {children}
    </Element>
  );
}
