import { ThemeName, themeRegistry } from '~/theme';

export const getThemeStyles = (theme: string) => {
  const t = themeRegistry[theme as ThemeName] || themeRegistry.logoBlue;
  return {
    bg: t.chat.bg,
    titleBg: t.chat.titleBg,
    hoverBg: t.chat.hoverBg,
    hoverTitleBg: t.chat.hoverTitleBg,
    text: t.chat.text,
    border: t.chat.border
  };
};
