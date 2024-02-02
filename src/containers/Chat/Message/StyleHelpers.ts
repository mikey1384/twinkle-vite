export const getThemeStyles = (theme: string, opacity: number = 1) => {
  const themeColors: Record<string, any> = {
    logoBlue: {
      bg: `rgba(229, 239, 255, ${opacity})`,
      hoverBg: `rgba(209, 224, 255, ${opacity})`,
      text: `rgba(50, 50, 50, ${opacity})`,
      border: `rgba(199, 214, 255, ${opacity})`,
      hoverBorder: `rgba(179, 194, 255, ${opacity})`
    },
    green: {
      bg: `rgba(233, 245, 233, ${opacity})`,
      hoverBg: `rgba(213, 235, 213, ${opacity})`,
      text: `rgba(50, 50, 50, ${opacity})`,
      border: `rgba(203, 225, 203, ${opacity})`,
      hoverBorder: `rgba(183, 205, 183, ${opacity})`
    },
    orange: {
      bg: `rgba(255, 243, 224, ${opacity})`,
      hoverBg: `rgba(255, 236, 204, ${opacity})`,
      text: `rgba(102, 60, 0, ${opacity})`,
      border: `rgba(255, 230, 184, ${opacity})`,
      hoverBorder: `rgba(255, 220, 160, ${opacity})`
    },
    rose: {
      bg: `rgba(255, 230, 240, ${opacity})`,
      hoverBg: `rgba(255, 210, 220, ${opacity})`,
      text: `rgba(70, 0, 20, ${opacity})`,
      border: `rgba(255, 200, 215, ${opacity})`,
      hoverBorder: `rgba(255, 180, 200, ${opacity})`
    },
    pink: {
      bg: `rgba(255, 235, 245, ${opacity})`,
      hoverBg: `rgba(255, 225, 235, ${opacity})`,
      text: `rgba(156, 39, 176, ${opacity})`,
      border: `rgba(255, 225, 235, ${opacity})`,
      hoverBorder: `rgba(255, 215, 225, ${opacity})`
    },
    purple: {
      bg: `rgba(237, 224, 255, ${opacity})`,
      hoverBg: `rgba(227, 214, 255, ${opacity})`,
      text: `rgba(74, 20, 140, ${opacity})`,
      border: `rgba(227, 214, 255, ${opacity})`,
      hoverBorder: `rgba(217, 204, 255, ${opacity})`
    },
    black: {
      bg: `rgba(232, 232, 232, ${opacity})`,
      hoverBg: `rgba(212, 212, 212, ${opacity})`,
      text: `rgba(38, 38, 38, ${opacity})`,
      border: `rgba(212, 212, 212, ${opacity})`,
      hoverBorder: `rgba(192, 192, 192, ${opacity})`
    },
    red: {
      bg: `rgba(255, 204, 204, ${opacity})`,
      hoverBg: `rgba(255, 184, 184, ${opacity})`,
      text: `rgba(50, 50, 50, ${opacity})`,
      border: `rgba(255, 184, 184, ${opacity})`,
      hoverBorder: `rgba(255, 164, 164, ${opacity})`
    },
    darkBlue: {
      bg: `rgba(224, 232, 255, ${opacity})`,
      hoverBg: `rgba(204, 212, 255, ${opacity})`,
      text: `rgba(50, 50, 50, ${opacity})`,
      border: `rgba(204, 212, 255, ${opacity})`,
      hoverBorder: `rgba(184, 192, 255, ${opacity})`
    },
    vantaBlack: {
      bg: `rgba(232, 232, 232, ${opacity})`,
      hoverBg: `rgba(212, 212, 212, ${opacity})`,
      text: `rgba(38, 38, 38, ${opacity})`,
      border: `rgba(212, 212, 212, ${opacity})`,
      hoverBorder: `rgba(192, 192, 192, ${opacity})`
    },
    gold: {
      bg: `rgba(255, 248, 224, ${opacity})`,
      hoverBg: `rgba(255, 245, 204, ${opacity})`,
      text: `rgba(178, 134, 0, ${opacity})`,
      border: `rgba(229, 190, 1, ${opacity})`,
      hoverBorder: `rgba(209, 170, 0, ${opacity})`
    }
  };
  return (
    themeColors[theme] || {
      bg: `rgba(245, 245, 245, ${opacity})`,
      hoverBg: `rgba(235, 235, 235, ${opacity})`,
      text: `rgba(50, 50, 50, ${opacity})`,
      border: `rgba(225, 225, 225, ${opacity})`,
      hoverBorder: `rgba(215, 215, 215, ${opacity})`
    }
  );
};
