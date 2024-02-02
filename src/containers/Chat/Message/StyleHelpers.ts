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
      bg: `rgba(40, 182, 44, ${opacity})`,
      hoverBg: `rgba(35, 138, 38, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(31, 126, 29, ${opacity})`,
      hoverBorder: `rgba(26, 109, 26, ${opacity})`
    },
    orange: {
      bg: `rgba(255, 140, 0, ${opacity})`,
      hoverBg: `rgba(230, 126, 0, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(204, 112, 0, ${opacity})`,
      hoverBorder: `rgba(184, 96, 0, ${opacity})`
    },
    rose: {
      bg: `rgba(255, 0, 127, ${opacity})`,
      hoverBg: `rgba(230, 0, 115, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(230, 0, 115, ${opacity})`,
      hoverBorder: `rgba(204, 0, 102, ${opacity})`
    },
    pink: {
      bg: `rgba(255, 105, 180, ${opacity})`,
      hoverBg: `rgba(255, 92, 161, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(255, 92, 161, ${opacity})`,
      hoverBorder: `rgba(255, 76, 139, ${opacity})`
    },
    purple: {
      bg: `rgba(128, 0, 128, ${opacity})`,
      hoverBg: `rgba(115, 0, 115, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(115, 0, 115, ${opacity})`,
      hoverBorder: `rgba(102, 0, 102, ${opacity})`
    },
    black: {
      bg: `rgba(0, 0, 0, ${opacity})`,
      hoverBg: `rgba(51, 51, 51, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(51, 51, 51, ${opacity})`,
      hoverBorder: `rgba(44, 44, 44, ${opacity})`
    },
    red: {
      bg: `rgba(255, 0, 0, ${opacity})`,
      hoverBg: `rgba(229, 0, 0, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(229, 0, 0, ${opacity})`,
      hoverBorder: `rgba(204, 0, 0, ${opacity})`
    },
    darkBlue: {
      bg: `rgba(0, 0, 139, ${opacity})`,
      hoverBg: `rgba(0, 0, 119, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(0, 0, 119, ${opacity})`,
      hoverBorder: `rgba(0, 0, 102, ${opacity})`
    },
    vantaBlack: {
      bg: `rgba(0, 0, 0, ${opacity})`,
      hoverBg: `rgba(51, 51, 51, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(51, 51, 51, ${opacity})`,
      hoverBorder: `rgba(44, 44, 44, ${opacity})`
    },
    gold: {
      bg: `rgba(255, 215, 0, ${opacity})`,
      hoverBg: `rgba(230, 195, 0, ${opacity})`,
      text: `rgba(255, 255, 255, ${opacity})`,
      border: `rgba(230, 195, 0, ${opacity})`,
      hoverBorder: `rgba(204, 163, 0, ${opacity})`
    }
  };
  return (
    themeColors[theme] || {
      bg: `rgba(153, 153, 153, ${opacity})`,
      hoverBg: `rgba(128, 128, 128, ${opacity})`,
      text: `rgba(0, 0, 0, ${opacity})`,
      border: `rgba(128, 128, 128, ${opacity})`,
      hoverBorder: `rgba(112, 112, 112, ${opacity})`
    }
  );
};
