import { ThemeName, themeRegistry, getThemeRoles, RoleTokens } from '~/theme';

export const Color: {
  [key: string]: (opacity?: number) => string;
} = {
  blue: (opacity = 1) => `rgba(5,110,178,${opacity})`,
  lightBlue: (opacity = 1) => `rgba(117,192,255,${opacity})`,
  darkBlue: (opacity = 1) => `rgba(0,70,195,${opacity})`,
  logoBlue: (opacity = 1) => `rgba(65, 140, 235,${opacity})`,
  mediumBlue: (opacity = 1) => `rgba(58, 155, 245,${opacity})`,
  skyBlue: (opacity = 1) => `rgba(63,175,255,${opacity})`,
  littleBoyBlue: (opacity = 1) => `rgba(103,163,217,${opacity})`,
  lightOceanBlue: (opacity = 1) => `rgba(87,190,255,${opacity})`,
  oceanBlue: (opacity = 1) => `rgba(36,135,235,${opacity})`,
  darkOceanBlue: (opacity = 1) => `rgba(30,110,183,${opacity})`,
  darkerOceanBlue: (opacity = 1) => `rgba(13,85,173,${opacity})`,
  black: (opacity = 1) => `rgba(51,51,51,${opacity})`,
  brown: (opacity = 1) => `rgba(139,69,19,${opacity})`,
  lightBrown: (opacity = 1) => `rgba(150,125,76,${opacity})`,
  lighterBrown: (opacity = 1) => `rgba(175,135,70,${opacity})`,
  sandyBrown: (opacity = 1) => `rgba(230,204,96,${opacity})`,
  logoGreen: (opacity = 1) => `rgba(97,226,101,${opacity})`,
  cyan: (opacity = 1) => `rgba(0,255,255,${opacity})`,
  darkCyan: (opacity = 1) => `rgba(0,139,139,${opacity})`,
  green: (opacity = 1) => `rgba(40,182,44,${opacity})`,
  lightGreen: (opacity = 1) => `rgba(37,195,50,${opacity})`,
  armyGreen: (opacity = 1) => `rgba(40,150,44,${opacity})`,
  blueGreen: (opacity = 1) => `rgba(59,150,160,${opacity})`,
  oceanGreen: (opacity = 1) => `rgba(35,166,213,${opacity})`,
  fernGreen: (opacity = 1) => `rgba(89,159,89,${opacity})`,
  limeGreen: (opacity = 1) => `rgba(34,197,94,${opacity})`,
  darkYellowGreen: (opacity = 1) => `rgba(135,180,76,${opacity})`,
  yellowGreen: (opacity = 1) => `rgba(154,204,96,${opacity})`,
  lightYellowGreen: (opacity = 1) => `rgba(175,224,96,${opacity})`,
  lightCyan: (opacity = 1) => `rgba(224,255,255,${opacity})`,
  blackGray: (opacity = 1) => `rgba(75,75,75,${opacity})`,
  darkerGray: (opacity = 1) => `rgba(85,85,85,${opacity})`,
  darkGray: (opacity = 1) => `rgba(115,115,115,${opacity})`,
  gray: (opacity = 1) => `rgba(153,153,153,${opacity})`,
  lightGray: (opacity = 1) => `rgba(165,165,165,${opacity})`,
  darkerBorderGray: (opacity = 1) => `rgba(185,188,190,${opacity})`,
  lighterGray: (opacity = 1) => `rgba(207,207,207,${opacity})`,
  extraLightGray: (opacity = 1) => `rgba(242,242,242,${opacity})`,
  blueGray: (opacity = 1) => `rgba(61,75,95,${opacity})`,
  lightBlueGray: (opacity = 1) => `rgba(91,105,125,${opacity})`,
  darkBlueGray: (opacity = 1) => `rgba(41,55,75,${opacity})`,
  lightBluerGray: (opacity = 1) => `rgba(71,105,155,${opacity})`,
  bluerGray: (opacity = 1) => `rgba(65,95,135,${opacity})`,
  darkBluerGray: (opacity = 1) => `rgba(51,65,115,${opacity})`,
  borderGray: (opacity = 1) => `rgba(204,204,204,${opacity})`,
  checkboxAreaGray: (opacity = 1) => `rgba(229,229,229,${opacity})`,
  targetGray: (opacity = 1) => `rgba(218,218,230,${opacity})`,
  wellGray: (opacity = 1) => `rgba(235,235,235,${opacity})`,
  inputGray: (opacity = 1) => `rgba(238,238,245,${opacity})`,
  highlightGray: (opacity = 1) => `rgba(242,242,242,${opacity})`,
  whiteBlueGray: (opacity = 1) => `rgba(248,248,255,${opacity})`,
  whiteGray: (opacity = 1) => `rgba(250,250,250,${opacity})`,
  ivory: (opacity = 1) => `rgba(255,255,240,${opacity})`,
  redOrange: (opacity = 1) => `rgba(240,100,70,${opacity})`,
  darkBrownOrange: (opacity = 1) => `rgba(235,160,70,${opacity})`,
  brownOrange: (opacity = 1) => `rgba(245,190,70,${opacity})`,
  orange: (opacity = 1) => `rgba(255,140,0,${opacity})`,
  mediumOrange: (opacity = 1) => `rgba(255,155,30,${opacity})`,
  lavender: (opacity = 1) => `rgba(200,200,230,${opacity})`,
  lightOrange: (opacity = 1) => `rgba(255,175,75,${opacity})`,
  lighterOrange: (opacity = 1) => `rgba(255,205,90,${opacity})`,
  pinkOrange: (opacity = 1) => `rgba(250,120,110,${opacity})`,
  passionFruit: (opacity = 1) => `rgba(243,103,123,${opacity})`,
  peach: (opacity = 1) => `rgba(255,175,150,${opacity})`,
  pink: (opacity = 1) => `rgba(255,105,180,${opacity})`,
  strongPink: (opacity = 1) => `rgba(255,85,185,${opacity})`,
  pastelPink: (opacity = 1) => `rgba(255,155,165,${opacity})`,
  bronze: (opacity = 1) => `rgba(255,190,130,${opacity})`,
  cranberry: (opacity = 1) => `rgba(230,80,112,${opacity})`,
  purple: (opacity = 1) => `rgba(152,28,235,${opacity})`,
  mediumPurple: (opacity = 1) => `rgba(185,65,245,${opacity})`,
  darkPurple: (opacity = 1) => `rgba(72,43,200,${opacity})`,
  lightPurple: (opacity = 1) => `rgba(225,105,255,${opacity})`,
  whitePurple: (opacity = 1) => `rgba(248,246,255,${opacity})`,
  lightRed: (opacity = 1) => `rgba(255,130,134,${opacity})`,
  red: (opacity = 1) => `rgba(255,65,54,${opacity})`,
  darkRed: (opacity = 1) => `rgba(235,0,60,${opacity})`,
  magenta: (opacity = 1) => `rgba(223,50,150,${opacity})`,
  fuchsia: (opacity = 1) => `rgba(190,0,255,${opacity})`,
  rose: (opacity = 1) => `rgba(223,0,102,${opacity})`,
  midnightBlack: (opacity = 1) => `rgba(10,15,50,${opacity})`,
  vantaBlack: (opacity = 1) => `rgba(0,0,0,${opacity})`,
  white: (opacity = 1) => `rgba(255,255,255,${opacity})`,
  brightGold: (opacity = 1) => `rgba(255,213,100,${opacity})`,
  gold: (opacity = 1) => `rgba(255,203,50,${opacity})`,
  darkGold: (opacity = 1) => `rgba(250,193,50,${opacity})`,
  goldOrange: (opacity = 1) => `rgba(255,185,60,${opacity})`,
  yellow: (opacity = 1) => `rgba(255,255,55,${opacity})`
};

export function Theme(color = 'logoBlue'): RoleTokens {
  return getThemeRoles((color || 'logoBlue') as ThemeName);
}

export const getThemeStyles = (theme: string, opacity: number = 1) => {
  function setAlphaExact(rgba: string, a: number) {
    const m = rgba.match(
      /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
    );
    if (!m) return rgba;
    const [_, r, g, b] = m;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function getAlpha(rgba: string) {
    const m = rgba.match(
      /rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/i
    );
    if (!m) return 1;
    return Number(m[1]);
  }

  function setAlphaMult(rgba: string, mult: number) {
    const a = getAlpha(rgba);
    return setAlphaExact(rgba, Math.max(0, Math.min(1, a * mult)));
  }

  const t = themeRegistry[theme as ThemeName] || themeRegistry.logoBlue;
  return {
    bg: setAlphaExact(t.general.bg, opacity),
    disabledBg: setAlphaExact(t.general.disabledBg, Math.min(1, 0.5 * opacity)),
    hoverBg: setAlphaExact(t.general.hoverBg, opacity),
    text: setAlphaExact(t.general.text, opacity),
    border: setAlphaExact(t.general.border, opacity),
    disabledBorder: setAlphaExact(
      t.general.disabledBorder,
      Math.min(1, 0.5 * opacity)
    ),
    rewardStatusBg: setAlphaMult(t.general.rewardStatusBg, opacity),
    rewardStatusGradient: t.general.rewardStatusGradient,
    perfectStarColor: setAlphaExact(t.general.perfectStarColor, opacity)
  };
};

export const borderRadius = '12px';
export const mediumBorderRadius = '8px';
export const liftedBoxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
export const liftedBoxShadowDarker = '0 4px 8px rgba(0, 0, 0, 0.2)';
export const liftedBoxShadowDarkest = '0 4px 8px rgba(0, 0, 0, 0.3)';
export const liftedEffect = {
  boxShadow: liftedBoxShadow,
  borderRadius: borderRadius
};
export const innerBorderRadius = '11px';
export const mobileMaxWidth = '767px';
export const tabletMaxWidth = '820px';
export const desktopMinWidth = '768px';
