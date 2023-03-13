import localize from '~/constants/localize';
import { Color } from '~/constants/css';

export const clientVersion = '1.7.38';
export const defaultChatSubject = 'Welcome!';
export const defaultContentState = {
  isEditing: false,
  placeholderHeight: 0,
  rewards: [],
  comments: [],
  likes: [],
  pictures: [],
  questions: [],
  status: {},
  recommendations: [],
  subjects: [],
  tags: [],
  commentsLoadMoreButton: false,
  subjectsLoadMoreButton: false,
  rootObj: {},
  profileTheme: 'logoBlue'
};

export const cloudFrontURL = `https://${
  import.meta.env.VITE_CLOUDFRONT_KEY
}.cloudfront.net`;
export const CHAT_ID_BASE_NUMBER = import.meta.env.VITE_CHAT_ID_BASE_NUMBER;
export const DEFAULT_PROFILE_THEME = 'logoBlue';
export const DESCRIPTION_LENGTH_FOR_EXTRA_REWARD_LEVEL = 1000;
export const FILE_UPLOAD_XP_REQUIREMENT = 0;
export const GENERAL_CHAT_ID = 2;
export const GENERAL_CHAT_PATH_ID =
  Number(GENERAL_CHAT_ID) + Number(CHAT_ID_BASE_NUMBER);
export const GITHUB_APP_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
export const LAST_ONLINE_FILTER_LABEL = localize('lastOnline2');
export const RANKING_FILTER_LABEL = localize('ranking');
export const MAX_PROFILE_PIC_SIZE = 10000;
export const MAX_NUM_SUMMONS = 3;
export const S3URL = `https://${
  import.meta.env.VITE_AWS_S3_BUCKET_NAME
}.s3.amazonaws.com`;
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME;
export const TURN_PASSWORD = import.meta.env.VITE_TURN_PASSWORD;
export const REWARD_VALUE = 200;
export const SELECTED_LANGUAGE = import.meta.env.VITE_SELECTED_LANGUAGE || 'en';
export const mb = 1000;
export const VOCAB_CHAT_TYPE = 'vocabulary';
export const AI_CARD_CHAT_TYPE = 'ai-cards';
export const MODERATOR_AUTH_LEVEL = 1;
export const MIKEY_ID = 5;
export const ZERO_TWINKLE_ID = Number(import.meta.env.VITE_ZERO_TWINKLE_ID);

export const charLimit = {
  chat: {
    aiCard: 250,
    subject: 200,
    message: 3500
  },
  comment: 10000,
  interactive: {
    heading: 150,
    description: 5000,
    youtube: 300
  },
  playlist: {
    title: 200,
    description: 5000
  },
  videoQuestion: {
    title: 2000,
    choice: 2000
  },
  subject: {
    title: 300,
    description: 20000
  },
  rewardComment: 5000,
  statusMsg: 500,
  url: {
    title: 300,
    description: 20000,
    url: 1000
  },
  video: {
    title: 200,
    description: 10000,
    url: 300
  }
};

export const expectedResponseLength = (rewardLevel) => {
  if (rewardLevel === 5) {
    return 800;
  }
  if (rewardLevel === 4) {
    return 500;
  }
  if (rewardLevel === 3) {
    return 300;
  }
  if (rewardLevel === 2) {
    return 100;
  }
  return 30;
};

export const karmaPointTable = {
  aiCard: 10000,
  username: 50,
  file: {
    0: 500,
    1: 1000,
    2: 2000,
    3: 10000,
    4: 25000,
    5: 50000,
    6: 100000
  },
  profilePicture: {
    0: 1000,
    1: 1500,
    2: 2000,
    3: 3000,
    4: 4000,
    5: 5000,
    6: 6000
  },
  rewardBoost: {
    0: 100,
    1: 200,
    2: 500,
    3: 800,
    4: 1500,
    5: 2_200,
    6: 3_000,
    7: 5_000,
    8: 5_500,
    9: 8_000
  }
};

export const videoRewardHash = {
  0: {
    xp: 20,
    coin: 2
  },
  1: {
    xp: 25,
    coin: 3
  },
  2: {
    xp: 30,
    coin: 3
  },
  3: {
    xp: 35,
    coin: 5
  },
  4: {
    xp: 40,
    coin: 5
  },
  5: {
    xp: 45,
    coin: 7
  },
  6: {
    xp: 50,
    coin: 7
  },
  7: {
    xp: 55,
    coin: 7
  },
  8: {
    xp: 60,
    coin: 10
  },
  9: {
    xp: 65,
    coin: 10
  },
  10: {
    xp: 70,
    coin: 20
  }
};

export const karmaMultiplier = {
  post: 2,
  recommendation: {
    student: 10,
    teacher: 5
  }
};

export const mobileFullTextRevealShowDuration = 2000;

export const priceTable = {
  card: 100,
  chatSubject: 20,
  chatTheme: 30,
  grammarbles: 250,
  username: 10,
  recommendation: 2,
  reward: 2
};

export const reactionsObj = {
  thumb: {
    label: 'thumb',
    position: '84% 82.5%'
  },
  heart: {
    label: 'heart',
    position: '84% 72.5%'
  },
  laughing: {
    label: 'laughing',
    position: '82% 7.5%'
  },
  wave: {
    label: 'wave',
    position: '28% 95%'
  },
  surprised: {
    label: 'surprised',
    position: '84% 20%'
  },
  crying: {
    label: 'crying',
    position: '54% 32.5%'
  },
  angry: {
    label: 'angry',
    position: '84% 5%'
  }
};

export const cardProps = {
  common: [],
  superior: ['glowy'],
  rare: ['glowy', 'glossy'],
  elite: ['glowy', 'glossy', 'grad'],
  legendary: ['glowy', 'glossy', 'sparky', 'grad']
};

export const qualityProps = {
  common: {
    color: Color.vantaBlack(),
    fontWeight: 'normal'
  },
  superior: {
    color: Color.limeGreen(),
    fontWeight: 'bold'
  },
  rare: {
    color: Color.purple(),
    fontWeight: 'bold'
  },
  elite: {
    color: Color.redOrange(),
    fontWeight: 'bold'
  },
  legendary: {
    color: Color.darkGold(),
    fontWeight: 'bold'
  }
};

export const wordleGuessReaction = {
  1: 'JACKPOT',
  2: 'UNBELIEVABLE',
  3: 'BRILLIANT',
  4: 'IMPRESSIVE'
};

export const cardLevelHash = {
  1: {
    color: 'logoBlue',
    label: 'blue'
  },
  2: {
    color: 'pink',
    label: 'pink'
  },
  3: {
    color: 'orange',
    label: 'orange'
  },
  4: {
    color: 'magenta',
    label: 'magenta'
  },
  5: {
    color: 'gold',
    label: 'gold'
  }
};

export const wordLevelHash = {
  1: {
    label: 'basic',
    rewardAmount: 10,
    coinAmount: 25,
    color: 'logoBlue'
  },
  2: {
    label: 'elementary',
    rewardAmount: 25,
    coinAmount: 50,
    color: 'pink'
  },
  3: {
    label: 'intermediate',
    rewardAmount: 50,
    coinAmount: 100,
    color: 'orange'
  },
  4: {
    label: 'advanced',
    rewardAmount: 100,
    coinAmount: 250,
    color: 'red'
  },
  5: {
    label: 'epic',
    rewardAmount: 500,
    coinAmount: 1000,
    color: 'gold'
  }
};

export const rewardReasons = {
  1: {
    color: 'pink',
    icon: 'certificate',
    message: 'for being thoughtful'
  },
  2: {
    color: 'logoBlue',
    icon: 'comments',
    message: 'for posting something related to the subject'
  },
  3: {
    color: 'orange',
    icon: 'surprise',
    message: 'for posting something awesome'
  },
  4: {
    color: 'gold',
    icon: 'bolt',
    message: 'for putting in a lot of effort'
  },
  5: {
    color: 'green',
    icon: 'check-circle',
    message: 'for participating in a group project or event'
  }
};

export const returnCardBurnXP = ({ cardLevel, cardQuality }) => {
  // base XP value
  let xp = 50;

  // color probabilities
  const colorProbs = {
    1: 0.5,
    2: 0.2,
    3: 0.15,
    4: 0.1,
    5: 0.05
  };

  // adjust XP based on color
  xp *= 1 / colorProbs[cardLevel] ** 1.281774;

  // quality probabilities
  const qualityProbs = {
    common: 0.5,
    superior: 0.3,
    rare: 0.13,
    elite: 0.05,
    legendary: 0.02
  };

  // adjust XP based on quality
  xp *= 1 / qualityProbs[cardQuality] ** 1.55;

  return Math.round(xp);
};

export const returnMissionThumb = (missionType) =>
  `${cloudFrontURL}/missions/${missionType}/thumb.gif`;

export const returnMaxRewards = ({ rewardLevel }) => {
  let maxRewards = 5;
  if (rewardLevel > 0) {
    maxRewards = 10 * rewardLevel;
  }
  return maxRewards;
};

export const maxSizes = [300, 400, 500, 650, 800, 1000, 1500, 2000];

export const returnMaxUploadSize = (fileUploadLvl) => {
  return maxSizes[fileUploadLvl] * mb;
};

export function returnWordLevel({ frequency, word }) {
  const intermediateWordFrequency = 4;
  const advancedWordFrequency = 2.5;
  const epicWordFrequency = 1.6;

  if (!frequency) return 3;
  if (frequency > intermediateWordFrequency) {
    if (word.length < 7) return 1;
    return 2;
  }
  if (word.slice(-2) === 'ly') return 3;
  if (frequency > advancedWordFrequency) return 3;
  if (frequency > epicWordFrequency) return 4;
  if (frequency <= epicWordFrequency) return 5;
  return 3;
}
