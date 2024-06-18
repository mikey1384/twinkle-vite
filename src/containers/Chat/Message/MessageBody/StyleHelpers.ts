export const getThemeStyles = (theme: string, opacity?: number) => {
  const fadedOpacity = opacity || 0.2;
  const appliedOpacity = opacity || 0.5;
  const themeColors: Record<string, any> = {
    logoBlue: {
      bg: `rgba(229, 239, 255, ${fadedOpacity})`,
      titleBg: `rgba(229, 239, 255, ${appliedOpacity})`,
      hoverBg: `rgba(229, 239, 255, ${appliedOpacity})`,
      hoverTitleBg: `rgba(229, 239, 255)`,
      text: `rgba(50, 50, 50)`,
      border: `rgba(179, 194, 255)`
    },
    green: {
      bg: `rgba(233, 245, 233, ${fadedOpacity})`,
      titleBg: `rgba(233, 245, 233, ${appliedOpacity})`,
      hoverBg: `rgba(233, 245, 233, ${appliedOpacity})`,
      hoverTitleBg: `rgba(213, 235, 213)`,
      text: `rgba(50, 50, 50)`,
      border: `rgba(183, 205, 183)`
    },
    orange: {
      bg: `rgba(255, 243, 224, ${fadedOpacity})`,
      titleBg: `rgba(255, 243, 224, ${appliedOpacity})`,
      hoverBg: `rgba(255, 243, 224, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 236, 204)`,
      text: `rgba(102, 60, 0)`,
      border: `rgba(255, 220, 160)`
    },
    rose: {
      bg: `rgba(255, 230, 240, ${fadedOpacity})`,
      titleBg: `rgba(255, 230, 240, ${appliedOpacity})`,
      hoverBg: `rgba(255, 230, 240, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 210, 220)`,
      text: `rgba(70, 0, 20)`,
      border: `rgba(255, 180, 200)`
    },
    pink: {
      bg: `rgba(255, 235, 245, ${fadedOpacity})`,
      titleBg: `rgba(255, 235, 245, ${appliedOpacity})`,
      hoverBg: `rgba(255, 235, 245, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 225, 235)`,
      text: `rgba(156, 39, 176)`,
      border: `rgba(255, 215, 225)`
    },
    purple: {
      bg: `rgba(237, 224, 255, ${fadedOpacity})`,
      titleBg: `rgba(237, 224, 255, ${appliedOpacity})`,
      hoverBg: `rgba(237, 224, 255, ${appliedOpacity})`,
      hoverTitleBg: `rgba(227, 214, 255)`,
      text: `rgba(74, 20, 140)`,
      border: `rgba(217, 204, 255)`
    },
    black: {
      bg: `rgba(232, 232, 232, ${fadedOpacity})`,
      titleBg: `rgba(232, 232, 232, ${appliedOpacity})`,
      hoverBg: `rgba(232, 232, 232, ${appliedOpacity})`,
      hoverTitleBg: `rgba(212, 212, 212)`,
      text: `rgba(38, 38, 38)`,
      border: `rgba(192, 192, 192)`
    },
    red: {
      bg: `rgba(255, 204, 204, ${fadedOpacity})`,
      titleBg: `rgba(255, 204, 204, ${appliedOpacity})`,
      hoverBg: `rgba(255, 204, 204, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 184, 184)`,
      text: `rgba(50, 50, 50)`,
      border: `rgba(255, 164, 164)`
    },
    darkBlue: {
      bg: `rgba(224, 232, 255, ${fadedOpacity})`,
      titleBg: `rgba(224, 232, 255, ${appliedOpacity})`,
      hoverBg: `rgba(224, 232, 255, ${appliedOpacity})`,
      hoverTitleBg: `rgba(204, 212, 255)`,
      text: `rgba(50, 50, 50)`,
      border: `rgba(184, 192, 255)`
    },
    vantaBlack: {
      bg: `rgba(232, 232, 232, ${fadedOpacity})`,
      titleBg: `rgba(232, 232, 232, ${appliedOpacity})`,
      hoverBg: `rgba(232, 232, 232, ${appliedOpacity})`,
      hoverTitleBg: `rgba(212, 212, 212)`,
      text: `rgba(38, 38, 38)`,
      border: `rgba(192, 192, 192)`
    },
    gold: {
      bg: `rgba(255, 248, 224, ${fadedOpacity})`,
      titleBg: `rgba(255, 248, 224, ${appliedOpacity})`,
      hoverBg: `rgba(255, 248, 224, ${appliedOpacity})`,
      hoverTitleBg: `rgba(255, 245, 204)`,
      text: `rgba(178, 134, 0)`,
      border: `rgba(209, 170, 0)`
    }
  };
  return (
    themeColors[theme] || {
      bg: `rgba(245, 245, 245, ${fadedOpacity})`,
      titleBg: `rgba(245, 245, 245, ${appliedOpacity})`,
      hoverBg: `rgba(245, 245, 245, ${appliedOpacity})`,
      hoverTitleBg: `rgba(235, 235, 235)`,
      text: `rgba(50, 50, 50)`,
      border: `rgba(215, 215, 215)`
    }
  );
};
