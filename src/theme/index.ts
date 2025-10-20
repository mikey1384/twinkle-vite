export type ThemeName =
  | 'logoBlue'
  | 'green'
  | 'orange'
  | 'rose'
  | 'pink'
  | 'purple'
  | 'black'
  | 'red'
  | 'darkBlue'
  | 'vantaBlack'
  | 'gold';

export interface GeneralPack {
  bg: string;
  disabledBg: string;
  hoverBg: string;
  text: string;
  border: string;
  disabledBorder: string;
  rewardStatusBg: string;
  rewardStatusGradient: string;
  perfectStarColor: string;
}

export interface ChatPack {
  bg: string;
  titleBg: string;
  hoverBg: string;
  hoverTitleBg: string;
  text: string;
  border: string;
}

export interface PagePack {
  bg: string; // body/page background
}

export interface ThemeTokens {
  general: GeneralPack;
  chat: ChatPack;
  page: PagePack;
}

export interface RoleToken {
  color?: string;
  opacity?: number;
  shadow?: string;
}

export type RoleTokens = Record<string, RoleToken>;

// Theme registry: centralized tokens for each theme
export const strongColors = ['rose', 'red', 'purple'] as const;
const strongColorSet = new Set<string>(strongColors);

function isStrongColor(color: ThemeName): boolean {
  return strongColorSet.has(color);
}

export const themeRegistry: Record<ThemeName, ThemeTokens> = {
  logoBlue: {
    general: {
      bg: 'rgba(65, 140, 235, 1)',
      disabledBg: 'rgba(65, 140, 235, 0.5)',
      hoverBg: 'rgba(53, 122, 189, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(40, 90, 156, 1)',
      disabledBorder: 'rgba(48, 102, 190, 0.5)',
      rewardStatusBg: 'rgba(5, 75, 160, 0.5)',
      rewardStatusGradient: 'rgba(205, 210, 255, 0.1)',
      perfectStarColor: 'rgba(255, 215, 0, 1)'
    },
    chat: {
      bg: 'rgba(229, 239, 255, 0.1)',
      titleBg: 'rgba(229, 239, 255, 0.5)',
      hoverBg: 'rgba(229, 239, 255, 0.2)',
      hoverTitleBg: 'rgba(229, 239, 255, 1)',
      text: 'rgba(50, 50, 50, 1)',
      border: 'rgba(179, 194, 255, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  green: {
    general: {
      bg: 'rgba(40, 182, 44, 1)',
      disabledBg: 'rgba(40, 182, 44, 0.5)',
      hoverBg: 'rgba(35, 138, 38, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(26, 109, 26, 1)',
      disabledBorder: 'rgba(31, 126, 29, 0.5)',
      rewardStatusBg: 'rgba(35, 138, 38, 0.5)',
      rewardStatusGradient: 'rgba(205, 255, 210, 0.1)',
      perfectStarColor: 'rgba(255, 215, 0, 1)'
    },
    chat: {
      bg: 'rgba(233, 245, 233, 0.1)',
      titleBg: 'rgba(233, 245, 233, 0.5)',
      hoverBg: 'rgba(233, 245, 233, 0.2)',
      hoverTitleBg: 'rgba(233, 245, 233, 1)',
      text: 'rgba(50, 50, 50, 1)',
      border: 'rgba(183, 205, 183, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  orange: {
    general: {
      bg: 'rgba(255, 140, 0, 1)',
      disabledBg: 'rgba(255, 140, 0, 0.5)',
      hoverBg: 'rgba(230, 126, 0, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(184, 96, 0, 1)',
      disabledBorder: 'rgba(204, 112, 0, 0.5)',
      rewardStatusBg: 'rgba(204, 102, 0, 0.5)',
      rewardStatusGradient: 'rgba(255, 235, 210, 0.12)',
      perfectStarColor: 'rgba(255, 236, 61, 1)'
    },
    chat: {
      bg: 'rgba(255, 243, 224, 0.1)',
      titleBg: 'rgba(255, 243, 224, 0.5)',
      hoverBg: 'rgba(255, 243, 224, 0.2)',
      hoverTitleBg: 'rgba(255, 243, 224, 1)',
      text: 'rgba(102, 60, 0, 1)',
      border: 'rgba(255, 220, 160, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  rose: {
    general: {
      bg: 'rgba(255, 0, 127, 1)',
      disabledBg: 'rgba(255, 0, 127, 0.5)',
      hoverBg: 'rgba(230, 0, 115, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(204, 0, 102, 1)',
      disabledBorder: 'rgba(230, 0, 115, 0.5)',
      rewardStatusBg: 'rgba(230, 0, 115, 0.5)',
      rewardStatusGradient: 'rgba(255, 255, 255, 0.1)',
      perfectStarColor: 'rgba(255, 236, 61, 1)'
    },
    chat: {
      bg: 'rgba(255, 230, 240, 0.1)',
      titleBg: 'rgba(255, 230, 240, 0.5)',
      hoverBg: 'rgba(255, 230, 240, 0.2)',
      hoverTitleBg: 'rgba(255, 230, 240, 1)',
      text: 'rgba(70, 0, 20, 1)',
      border: 'rgba(255, 180, 200, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  pink: {
    general: {
      bg: 'rgba(255, 105, 180, 1)',
      disabledBg: 'rgba(255, 105, 180, 0.5)',
      hoverBg: 'rgba(255, 92, 161, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(255, 76, 139, 1)',
      disabledBorder: 'rgba(255, 92, 161, 0.5)',
      rewardStatusBg: 'rgba(255, 92, 161, 0.5)',
      rewardStatusGradient: 'rgba(255, 255, 255, 0.1)',
      perfectStarColor: 'rgba(255, 236, 61, 1)'
    },
    chat: {
      bg: 'rgba(255, 235, 245, 0.1)',
      titleBg: 'rgba(255, 235, 245, 0.5)',
      hoverBg: 'rgba(255, 235, 245, 0.2)',
      hoverTitleBg: 'rgba(255, 235, 245, 1)',
      text: 'rgba(156, 39, 176, 1)',
      border: 'rgba(255, 215, 225, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  purple: {
    general: {
      bg: 'rgba(128, 0, 128, 1)',
      disabledBg: 'rgba(128, 0, 128, 0.5)',
      hoverBg: 'rgba(115, 0, 115, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(102, 0, 102, 1)',
      disabledBorder: 'rgba(115, 0, 115, 0.5)',
      rewardStatusBg: 'rgba(115, 0, 115, 0.5)',
      rewardStatusGradient: 'rgba(255, 255, 255, 0.1)',
      perfectStarColor: 'rgba(255, 236, 61, 1)'
    },
    chat: {
      bg: 'rgba(237, 224, 255, 0.1)',
      titleBg: 'rgba(237, 224, 255, 0.5)',
      hoverBg: 'rgba(237, 224, 255, 0.2)',
      hoverTitleBg: 'rgba(237, 224, 255, 1)',
      text: 'rgba(74, 20, 140, 1)',
      border: 'rgba(217, 204, 255, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  black: {
    general: {
      bg: 'rgba(0, 0, 0, 1)',
      disabledBg: 'rgba(0, 0, 0, 0.5)',
      hoverBg: 'rgba(51, 51, 51, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(44, 44, 44, 1)',
      disabledBorder: 'rgba(51, 51, 51, 0.5)',
      rewardStatusBg: 'rgba(51, 51, 51, 0.5)',
      rewardStatusGradient: 'rgba(255, 255, 255, 0.1)',
      perfectStarColor: 'rgba(255, 215, 0, 1)'
    },
    chat: {
      bg: 'rgba(232, 232, 232, 0.1)',
      titleBg: 'rgba(232, 232, 232, 0.5)',
      hoverBg: 'rgba(232, 232, 232, 0.2)',
      hoverTitleBg: 'rgba(232, 232, 232, 1)',
      text: 'rgba(38, 38, 38, 1)',
      border: 'rgba(192, 192, 192, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  red: {
    general: {
      bg: 'rgba(240, 100, 70, 1)',
      disabledBg: 'rgba(240, 100, 70, 0.5)',
      hoverBg: 'rgba(240, 50, 0, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(204, 0, 0, 1)',
      disabledBorder: 'rgba(229, 0, 0, 0.5)',
      rewardStatusBg: 'rgba(204, 0, 0, 0.5)',
      rewardStatusGradient: 'rgba(255, 255, 255, 0.1)',
      perfectStarColor: 'rgba(255, 236, 61, 1)'
    },
    chat: {
      bg: 'rgba(255, 204, 204, 0.1)',
      titleBg: 'rgba(255, 204, 204, 0.5)',
      hoverBg: 'rgba(255, 204, 204, 0.2)',
      hoverTitleBg: 'rgba(255, 204, 204, 1)',
      text: 'rgba(50, 50, 50, 1)',
      border: 'rgba(255, 164, 164, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  darkBlue: {
    general: {
      bg: 'rgba(0, 0, 139, 1)',
      disabledBg: 'rgba(0, 0, 139, 0.5)',
      hoverBg: 'rgba(0, 0, 119, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(0, 0, 102, 1)',
      disabledBorder: 'rgba(0, 0, 119, 0.5)',
      rewardStatusBg: 'rgba(0, 51, 153, 0.5)',
      rewardStatusGradient: 'rgba(205, 225, 255, 0.1)',
      perfectStarColor: 'rgba(255, 215, 0, 1)'
    },
    chat: {
      bg: 'rgba(224, 232, 255, 0.1)',
      titleBg: 'rgba(224, 232, 255, 0.5)',
      hoverBg: 'rgba(224, 232, 255, 0.2)',
      hoverTitleBg: 'rgba(224, 232, 255, 1)',
      text: 'rgba(50, 50, 50, 1)',
      border: 'rgba(184, 192, 255, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  vantaBlack: {
    general: {
      // Premium ultra‑black accents (not dark mode overall)
      bg: 'rgba(0, 0, 0, 1)',
      disabledBg: 'rgba(0, 0, 0, 0.5)',
      hoverBg: 'rgba(16, 16, 16, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(20, 20, 20, 1)',
      disabledBorder: 'rgba(32, 32, 32, 0.5)',
      rewardStatusBg: 'rgba(0, 0, 0, 0.7)',
      rewardStatusGradient: 'rgba(255, 255, 255, 0.08)',
      perfectStarColor: 'rgba(255, 215, 0, 1)'
    },
    chat: {
      bg: 'rgba(232, 232, 232, 0.1)',
      titleBg: 'rgba(232, 232, 232, 0.5)',
      hoverBg: 'rgba(232, 232, 232, 0.2)',
      hoverTitleBg: 'rgba(232, 232, 232, 1)',
      text: 'rgba(38, 38, 38, 1)',
      border: 'rgba(192, 192, 192, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  },
  gold: {
    general: {
      bg: 'rgba(255, 215, 0, 1)',
      disabledBg: 'rgba(255, 215, 0, 0.5)',
      hoverBg: 'rgba(230, 195, 0, 1)',
      text: 'rgba(255, 255, 255, 1)',
      border: 'rgba(204, 163, 0, 1)',
      disabledBorder: 'rgba(230, 195, 0, 0.5)',
      rewardStatusBg: 'rgba(204, 163, 0, 0.5)',
      rewardStatusGradient: 'rgba(255, 248, 220, 0.15)',
      perfectStarColor: 'rgba(255, 240, 0, 1)'
    },
    chat: {
      bg: 'rgba(255, 248, 224, 0.1)',
      titleBg: 'rgba(255, 248, 224, 0.5)',
      hoverBg: 'rgba(255, 248, 224, 0.2)',
      hoverTitleBg: 'rgba(255, 248, 224, 1)',
      text: 'rgba(178, 134, 0, 1)',
      border: 'rgba(209, 170, 0, 1)'
    },
    page: { bg: 'rgba(255, 255, 255, 1)' }
  }
};

function buildThemeRoles(color: ThemeName): RoleTokens {
  const pickColor = (options: Record<string, string>, fallback: string) =>
    options[color] ?? fallback;
  const pickNumber = (options: Record<string, number>, fallback: number) =>
    options[color] ?? fallback;

  return {
    abort: { color: 'darkerGray' },
    action: {
      color: pickColor(
        {
          green: 'logoBlue',
          orange: 'pinkOrange',
          rose: 'cranberry',
          purple: 'purple',
          black: 'darkOceanBlue',
          red: 'magenta',
          darkBlue: 'armyGreen',
          vantaBlack: 'vantaBlack'
        },
        'green'
      )
    },
    active: { color: pickColor({ green: 'pinkOrange' }, 'green') },
    alert: { color: 'gold' },
    alreadyPostedByOtherUser: { color: 'red' },
    alreadyPostedByThisUser: { color: 'blue' },
    background: { color: pickColor({ gold: 'whiteBlueGray' }, 'whiteGray') },
    button: { color: pickColor({ gold: 'brownOrange', vantaBlack: 'vantaBlack' }, color) },
    buttonHovered: { color: pickColor({ gold: 'gold' }, color) },
    byUserIndicator: {
      color: pickColor({ gold: 'darkGold' }, color),
      opacity: isStrongColor(color) ? 0.7 : 0.9
    },
    byUserIndicatorText: {
      color: 'white',
      shadow: pickColor({ gold: 'orange' }, '')
    },
    carousel: { color },
    carouselProgress: { color: 'logoBlue' },
    carouselProgressComplete: { color: 'blue' },
    chatFlatButton: {
      color: pickColor({ gold: 'brownOrange' }, color),
      opacity: pickNumber({ gold: 1 }, 0.8)
    },
    chatFlatButtonHovered: {
      color: pickColor({ gold: 'gold' }, color)
    },
    chatFlatButtonText: {
      color: 'white',
      shadow: pickColor({ gold: 'darkBrownOrange' }, '')
    },
    chatGroup: { color: pickColor({ gold: 'pinkOrange' }, 'logoBlue') },
    chatInvitation: { color: pickColor({ gold: 'darkGold' }, color) },
    chatTopic: { color: pickColor({ gold: 'brownOrange' }, color) },
    chatUnread: {
      color: pickColor(
        {
          green: 'lightYellowGreen',
          rose: 'cranberry',
          red: 'redOrange',
          black: 'darkerGray',
          vantaBlack: 'black',
          gold: 'logoBlue'
        },
        color
      )
    },
    content: {
      color: pickColor(
        {
          green: 'logoBlue',
          orange: 'pinkOrange',
          rose: 'cranberry',
          pink: 'passionFruit',
          purple: 'purple',
          black: 'darkOceanBlue',
          red: 'magenta',
          darkBlue: 'armyGreen',
          vantaBlack: 'vantaBlack'
        },
        'green'
      )
    },
    cover: { color },
    coverText: { color: 'white', shadow: pickColor({ gold: 'darkBrownOrange' }, '') },
    todayProgressText: {
      color,
      shadow: pickColor({ gold: 'darkGold' }, '')
    },
    danger: {
      color: pickColor(
        {
          red: 'darkRed',
          vantaBlack: 'black',
          gold: 'magenta'
        },
        'rose'
      )
    },
    done: { color: 'blue' },
    draw: { color: 'logoBlue' },
    fail: { color: 'black' },
    filter: {
      color: pickColor({ gold: 'brownOrange' }, color),
      opacity: pickNumber({ gold: 1 }, 0.7)
    },
    filterText: {
      color: 'white',
      shadow: pickColor({ gold: 'darkBrownOrange' }, '')
    },
    invertedFilterActive: { color },
    filterActive: { color: pickColor({ gold: 'darkGold', vantaBlack: 'vantaBlack' }, color) },
    generalChat: {
      color: pickColor({ black: 'darkBlue', vantaBlack: 'darkBlue', gold: 'logoBlue' }, color)
    },
    grammarGameScorePerfect: { color: 'brownOrange' },
    grammarGameScoreS: { color: 'gold' },
    grammarGameScoreA: { color: 'magenta' },
    grammarGameScoreB: { color: 'orange' },
    grammarGameScoreC: { color: 'pink' },
    grammarGameScoreD: { color: 'logoBlue' },
    grammarGameScoreF: { color: 'gray' },
    header: { color: 'white' },
    homeMenuItemActive: { color: pickColor({ vantaBlack: 'vantaBlack' }, color) },
    info: {
      color: pickColor(
        {
          green: 'yellowGreen',
          orange: 'lightOrange',
          rose: 'pastelPink',
          pink: 'pink',
          purple: 'lightPurple',
          black: 'logoBlue',
          red: 'lightRed',
          darkBlue: 'oceanBlue',
          vantaBlack: 'oceanBlue',
          gold: 'lightOrange'
        },
        'lightOceanBlue'
      )
    },
    itemSelected: {
      color,
      opacity: isStrongColor(color) ? 0.7 : 0.8
    },
    level1: { color: 'logoBlue' },
    level2: { color: 'pink' },
    level3: { color: 'orange' },
    level4: { color: 'fuchsia' },
    level5: { color: 'gold' },
    likeButton: {
      color: pickColor(
        {
          green: 'yellowGreen',
          rose: 'skyBlue',
          red: 'pinkOrange',
          gold: 'lightOceanBlue'
        },
        'lightBlue'
      )
    },
    likeButtonPressed: {
      color: pickColor(
        {
          green: 'darkYellowGreen',
          rose: 'oceanBlue',
          red: 'passionFruit'
        },
        'logoBlue'
      )
    },
    link: {
      color: pickColor(
        {
          green: 'fernGreen',
          orange: 'darkOceanBlue',
          rose: 'darkOceanBlue',
          pink: 'oceanBlue',
          black: 'blueGray',
          vantaBlack: 'darkerOceanBlue',
          gold: 'oceanBlue'
        },
        'blue'
      )
    },
    listItemMarker: { color: 'darkerGray' },
    loadMoreButton: {
      color: pickColor(
        {
          green: 'lightYellowGreen',
          orange: 'lighterOrange',
          rose: 'passionFruit',
          pink: 'pastelPink',
          purple: 'lightPurple',
          black: 'darkGray',
          red: 'lightRed',
          darkBlue: 'lightOceanBlue',
          vantaBlack: 'black',
          gold: 'lightOceanBlue'
        },
        'lightBlue'
      )
    },
    login: { color: 'green' },
    logoTwin: { color: 'logoBlue' },
    logoKle: { color: pickColor({ gold: 'darkGold' }, 'logoGreen') },
    mention: {
      color: pickColor({ pink: 'orange', gold: 'magenta' }, 'passionFruit')
    },
    mission: { color: 'orange' },
    myCollection: { color, shadow: pickColor({ gold: 'darkBrownOrange' }, '') },
    profilePanel: { color },
    progressBar: { color: pickColor({ green: 'yellowGreen', vantaBlack: 'vantaBlack' }, color) },
    reactionButton: { color, opacity: 0.2 },
    recommendation: { color: pickColor({ gold: 'passionFruit' }, 'brownOrange') },
    reward: {
      color: pickColor(
        {
          green: 'pinkOrange',
          orange: 'pastelPink',
          pink: 'strongPink',
          red: 'strongPink',
          rose: 'strongPink',
          purple: 'strongPink',
          darkBlue: 'strongPink'
        },
        'pink'
      )
    },
    rewardLevelForm: { color, opacity: isStrongColor(color) ? 0.9 : 1 },
    rewardableRecommendation: { color, opacity: 0.1 },
    search: { color, shadow: pickColor({ gold: 'darkBrownOrange' }, '') },
    sectionPanel: { color },
    sectionPanelText: {
      color: pickColor({ gold: 'darkGold' }, color),
      shadow: pickColor({ gold: 'darkBrownOrange' }, '')
    },
    showMeAnotherSubjectButton: { color: 'green' },
    showMeAnotherPostButton: { color: 'green' },
    skeuomorphicDisabled: { color, opacity: 0.2 },
    spinner: { color },
    statusMsgLink: {
      color: pickColor(
        { orange: 'yellow', red: 'yellow' },
        'gold'
      )
    },
    statusMsgListItemMarker: {
      color: pickColor({ ivory: 'darkerGray' }, 'white')
    },
    success: { color: 'green' },
    switch: { color },
    topicText: {
      color,
      shadow: pickColor({ gold: 'darkBrownOrange' }, '')
    },
    tableHeader: { color },
    userLink: {
      color: pickColor(
        {
          green: 'blueGreen',
          orange: 'darkBrownOrange',
          rose: 'passionFruit',
          pink: 'strongPink',
          gold: 'darkGold'
        },
        color
      )
    },
    verifyEmail: {
      color: pickColor({ green: 'green' }, color)
    },
    victory: { color: 'brownOrange' },
    warning: { color: 'redOrange' },
    xpNumber: { color: 'logoGreen' }
  };
}

const roleCache: Partial<Record<ThemeName, RoleTokens>> = {};

export function getThemeRoles(color: ThemeName): RoleTokens {
  if (!roleCache[color]) {
    roleCache[color] = buildThemeRoles(color);
  }
  return roleCache[color] as RoleTokens;
}

// Apply CSS variables for the current theme on :root
export function applyThemeVars(theme: ThemeName) {
  const tokens = themeRegistry[theme] || themeRegistry.logoBlue;
  const root = document.documentElement;
  const setAlpha = (rgba: string, a: number) => {
    const m = rgba.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
    if (!m) return rgba;
    const [_, r, g, b] = m;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
  };
  // General pack
  root.style.setProperty('--theme-bg', tokens.general.bg);
  root.style.setProperty('--theme-hover-bg', tokens.general.hoverBg);
  root.style.setProperty('--theme-text', tokens.general.text);
  root.style.setProperty('--theme-border', tokens.general.border);
  // Central app borders derived from theme border
  root.style.setProperty('--ui-border', tokens.general.border);
  root.style.setProperty('--ui-border-weak', setAlpha(tokens.general.border, 0.35));
  root.style.setProperty('--ui-border-strong', setAlpha(tokens.general.border, 0.8));
  root.style.setProperty('--theme-disabled-bg', tokens.general.disabledBg);
  root.style.setProperty(
    '--theme-disabled-border',
    tokens.general.disabledBorder
  );
  root.style.setProperty('--reward-status-bg', tokens.general.rewardStatusBg);
  root.style.setProperty(
    '--reward-status-gradient',
    tokens.general.rewardStatusGradient
  );
  root.style.setProperty(
    '--perfect-star-color',
    tokens.general.perfectStarColor
  );

  // Chat pack
  root.style.setProperty('--chat-bg', tokens.chat.bg);
  root.style.setProperty('--chat-title-bg', tokens.chat.titleBg);
  root.style.setProperty('--chat-hover-bg', tokens.chat.hoverBg);
  root.style.setProperty('--chat-hover-title-bg', tokens.chat.hoverTitleBg);
  root.style.setProperty('--chat-text', tokens.chat.text);
  root.style.setProperty('--chat-border', tokens.chat.border);

  // Page pack
  root.style.setProperty('--page-bg', tokens.page.bg);
  // App bg mirrors page bg for simplicity
  root.style.setProperty('--app-bg', tokens.page.bg);
}

export function getScopedThemeVars(theme: ThemeName): Record<string, string> {
  const t = themeRegistry[theme] || themeRegistry.logoBlue;
  const setAlpha = (rgba: string, a: number) => {
    const m = rgba.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
    if (!m) return rgba;
    const [_, r, g, b] = m;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
  };
  return {
    ['--theme-bg']: t.general.bg,
    ['--theme-hover-bg']: t.general.hoverBg,
    ['--theme-text']: t.general.text,
    ['--theme-border']: t.general.border,
    ['--ui-border']: t.general.border,
    ['--ui-border-weak']: setAlpha(t.general.border, 0.35),
    ['--ui-border-strong']: setAlpha(t.general.border, 0.8),
    ['--theme-disabled-bg']: t.general.disabledBg,
    ['--theme-disabled-border']: t.general.disabledBorder,
    ['--reward-status-bg']: t.general.rewardStatusBg,
    ['--reward-status-gradient']: t.general.rewardStatusGradient,
    ['--perfect-star-color']: t.general.perfectStarColor,
    ['--chat-bg']: t.chat.bg,
    ['--chat-title-bg']: t.chat.titleBg,
    ['--chat-hover-bg']: t.chat.hoverBg,
    ['--chat-hover-title-bg']: t.chat.hoverTitleBg,
    ['--chat-text']: t.chat.text,
    ['--chat-border']: t.chat.border,
    ['--page-bg']: t.page.bg,
    ['--app-bg']: t.page.bg
  };
}
