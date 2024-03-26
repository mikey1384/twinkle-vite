export const getThemeStyles = (theme: string, opacity?: number) => {
  const fadedOpacity = opacity || 0.3;
  const appliedOpacity = opacity || 1;
  const themeColors: Record<string, any> = {
    logoBlue: {
      bg: `rgba(229, 239, 255, ${fadedOpacity})`,
      hoverBg: `rgba(229, 239, 255, ${appliedOpacity})`,
      hoverTitleBg: `rgba(209, 224, 255, ${appliedOpacity})`,
      text: `rgba(50, 50, 50, ${appliedOpacity})`,
      border: `rgba(199, 214, 255, ${appliedOpacity})`,
      hoverBorder: `rgba(179, 194, 255, ${appliedOpacity})`
    },
    green: {
      bg: `rgba(233, 245, 233, ${fadedOpacity})`,
      hoverBg: `rgba(233, 245, 233, ${appliedOpacity})`,
      hoverTitleBg: `rgba(213, 235, 213, ${appliedOpacity})`,
      text: `rgba(50, 50, 50, ${appliedOpacity})`,
      border: `rgba(203, 225, 203, ${appliedOpacity})`,
      hoverBorder: `rgba(183, 205, 183, ${appliedOpacity})`
    },
    orange: {
      bg: `rgba(255, 243, 224, ${fadedOpacity})`,
      hoverBg: `rgba(255, 243, 224, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 236, 204, ${appliedOpacity})`,
      text: `rgba(102, 60, 0, ${appliedOpacity})`,
      border: `rgba(255, 230, 184, ${appliedOpacity})`,
      hoverBorder: `rgba(255, 220, 160, ${appliedOpacity})`
    },
    rose: {
      bg: `rgba(255, 230, 240, ${fadedOpacity})`,
      hoverBg: `rgba(255, 230, 240, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 210, 220, ${appliedOpacity})`,
      text: `rgba(70, 0, 20, ${appliedOpacity})`,
      border: `rgba(255, 200, 215, ${appliedOpacity})`,
      hoverBorder: `rgba(255, 180, 200, ${appliedOpacity})`
    },
    pink: {
      bg: `rgba(255, 235, 245, ${fadedOpacity})`,
      hoverBg: `rgba(255, 235, 245, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 225, 235, ${appliedOpacity})`,
      text: `rgba(156, 39, 176, ${appliedOpacity})`,
      border: `rgba(255, 225, 235, ${appliedOpacity})`,
      hoverBorder: `rgba(255, 215, 225, ${appliedOpacity})`
    },
    purple: {
      bg: `rgba(237, 224, 255, ${fadedOpacity})`,
      hoverBg: `rgba(237, 224, 255, ${appliedOpacity})`,
      hoverTitleBg: `rgba(227, 214, 255, ${appliedOpacity})`,
      text: `rgba(74, 20, 140, ${appliedOpacity})`,
      border: `rgba(227, 214, 255, ${appliedOpacity})`,
      hoverBorder: `rgba(217, 204, 255, ${appliedOpacity})`
    },
    black: {
      bg: `rgba(232, 232, 232, ${fadedOpacity})`,
      hoverBg: `rgba(232, 232, 232, ${appliedOpacity})`,
      hoverTitleBg: `rgba(212, 212, 212, ${appliedOpacity})`,
      text: `rgba(38, 38, 38, ${appliedOpacity})`,
      border: `rgba(212, 212, 212, ${appliedOpacity})`,
      hoverBorder: `rgba(192, 192, 192, ${appliedOpacity})`
    },
    red: {
      bg: `rgba(255, 204, 204, ${fadedOpacity})`,
      hoverBg: `rgba(255, 204, 204, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 184, 184, ${appliedOpacity})`,
      text: `rgba(50, 50, 50, ${appliedOpacity})`,
      border: `rgba(255, 184, 184, ${appliedOpacity})`,
      hoverBorder: `rgba(255, 164, 164, ${appliedOpacity})`
    },
    darkBlue: {
      bg: `rgba(224, 232, 255, ${fadedOpacity})`,
      hoverBg: `rgba(224, 232, 255, ${appliedOpacity})`,
      hoverTitleBg: `rgba(204, 212, 255, ${appliedOpacity})`,
      text: `rgba(50, 50, 50, ${appliedOpacity})`,
      border: `rgba(204, 212, 255, ${appliedOpacity})`,
      hoverBorder: `rgba(184, 192, 255, ${appliedOpacity})`
    },
    vantaBlack: {
      bg: `rgba(232, 232, 232, ${fadedOpacity})`,
      hoverBg: `rgba(232, 232, 232, ${appliedOpacity})`,
      hoverTitleBg: `rgba(212, 212, 212, ${appliedOpacity})`,
      text: `rgba(38, 38, 38, ${appliedOpacity})`,
      border: `rgba(212, 212, 212, ${appliedOpacity})`,
      hoverBorder: `rgba(192, 192, 192, ${appliedOpacity})`
    },
    gold: {
      bg: `rgba(255, 248, 224, ${fadedOpacity})`,
      hoverBg: `rgba(255, 248, 224, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 245, 204, ${appliedOpacity})`,
      text: `rgba(178, 134, 0, ${appliedOpacity})`,
      border: `rgba(229, 190, 1, ${appliedOpacity})`,
      hoverBorder: `rgba(209, 170, 0, ${appliedOpacity})`
    }
  };
  return (
    themeColors[theme] || {
      bg: `rgba(245, 245, 245, ${fadedOpacity})`,
      hoverBg: `rgba(245, 245, 245, ${appliedOpacity})`,
      hoverTitleBg: `rgba(235, 235, 235, ${appliedOpacity})`,
      text: `rgba(50, 50, 50, ${appliedOpacity})`,
      border: `rgba(225, 225, 225, ${appliedOpacity})`,
      hoverBorder: `rgba(215, 215, 215, ${appliedOpacity})`
    }
  );
};
