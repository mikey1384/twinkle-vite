// Every word on /parents, one dictionary per language, so Mikey can review
// them side by side. English follows the approved "Twinkle for Parents" doc
// (2026-09-27); the Korean is written for Korean parents, not translated line
// by line. The academy is "트윈클 어학원".

export type ParentsLang = 'ko' | 'en';

export interface ParentsSkill {
  key: 'make' | 'think' | 'read' | 'write' | 'grammar';
  title: string;
  body: string;
  tags: string[];
}

export interface ParentsPoint {
  title: string;
  body: string;
}

export interface ParentsText {
  pageTitle: string;
  eyebrow: string;
  heroTitle: string;
  heroSubhead: string;
  heroLead: string;
  ctaLearn: string;
  ctaLoop: string;
  learnTitle: string;
  learnIntro: string;
  skills: ParentsSkill[];
  whyTitle: string;
  whyIntro: string;
  why: ParentsPoint[];
  loopTitle: string;
  todayLabel: string;
  today: ParentsPoint[];
  nextLabel: string;
  nextBadge: string;
  nextNote: string;
  next: string[];
  nextSignIn: string;
  safetyTitle: string;
  safety: ParentsPoint[];
  dataTitle: string;
  dataBody: string;
  privacyLink: string;
  lawTitle: string;
  lawBody: string;
  contactLead: string;
  askTitle: string;
  askIntro: string;
  askOursTitle: string;
  askOursBody: string;
  askYoursTitle: string;
  askYoursBody: string;
  askSameFacts: string;
  askBoxTitle: string;
  askBoxSub: string;
  askPlaceholder: string;
  askSend: string;
  askSuggestions: string[];
  askThinking: string;
  askNote: string;
  askGuideLink: string;
  askCopy: string;
  askCopied: string;
  askRemaining: (count: number) => string;
  askErrors: Record<
    'visitor' | 'ip' | 'burst' | 'global' | 'busy' | 'failed' | 'too_long',
    string
  >;
  askYou: string;
  askAssistant: string;
  buildTitle: string;
  buildBadge: string;
  buildIntro: string;
  buildBody: string;
  buildWhen: string;
  footerLine: string;
  screenshotNote: string;
  shots: {
    mathLab: string;
    grammarbles: string;
    typing: string;
  };
}

export const PARENTS_TEXT: Record<ParentsLang, ParentsText> = {
  en: {
    pageTitle: 'Twinkle for parents',
    eyebrow: 'For parents and guardians',
    heroTitle: 'Your child is going to play games. Let the hours count.',
    heroSubhead:
      'Twinkle is a video game platform where parents actually have control, and where screen time turns into things your child made, problems they solved and words other people read.',
    heroLead:
      'Twinkle began in 2016 as a community for students of Twinkle English Academy in Seoul, and it has grown into a place where members from primary school to adult build games with AI, solve reasoning puzzles, write for a real audience and build together in Minecraft. It feels like a game, because it is one. But at the end of an hour, your child has something to show for it.',
    ctaLearn: 'See what they learn',
    ctaLoop: 'How you stay in the loop',
    learnTitle: 'What your child learns here',
    learnIntro:
      'Five skills that matter more every year, each practised through something that feels like play.',
    skills: [
      {
        key: 'make',
        title: 'Making things with AI, not being replaced by it',
        body: "In Twinkle Build, your child describes a game or app in their own words and builds it with Lumine, our AI builder: testing it, fixing it, publishing it for others to play. Teams review and merge each other's work. The skill of this decade is directing AI toward something real, and here they practise it every day.",
        tags: ['Twinkle Build', 'Lumine', 'Teams']
      },
      {
        key: 'think',
        title: 'Thinking a problem through',
        body: 'Math Lab gives one reasoning puzzle a day at your child’s school grade (elementary 1 to high school 3, following the Korean curriculum). Each puzzle uses only what they have been taught; the challenge is the thinking, not the formula. Stuck? A hint, and after the first answer, a step-by-step visual lesson. Chess puzzles climb from beginner to expert, with timed promotion trials.',
        tags: ['Math Lab', 'Chess puzzles']
      },
      {
        key: 'read',
        title: 'Reading and understanding English',
        body: 'AI Stories offer reading and listening passages at five levels, from early reader to advanced, each followed by comprehension questions. After a reading story, a short word quiz adds the words they get right to their own collection, and long posts and comments on the site can be read aloud.',
        tags: ['AI Stories', 'Word Master', 'Read aloud']
      },
      {
        key: 'write',
        title: 'Writing with something to say',
        body: 'Each day brings a personal reflection question. Answers are written in one sitting and get warm written feedback, and pasted or AI-written answers are caught. Posts and comments are read, answered and rewarded by real members, so writing well actually matters.',
        tags: ["Today's question", 'Posts and comments']
      },
      {
        key: 'grammar',
        title: 'Grammar, spelling and speed',
        body: 'Grammarbles is a daily grammar game. A child who thinks a question is wrong can challenge it and be taken seriously: the question is checked carefully, fixed if they were right, and given a written explanation. Wordle builds spelling and deduction. Arcade Typing turns typing practice into a space shooter where accuracy, not key-mashing, earns the score and the stars.',
        tags: ['Grammarbles', 'Wordle', 'Arcade Typing']
      }
    ],
    whyTitle: 'Why it works: the pull of a game, pointed somewhere good',
    whyIntro:
      "Children don't need to be dragged to games. Twinkle uses the same pull (levels, streaks, rewards, friends) but ties it to effort that is real.",
    why: [
      {
        title: 'Rewards are earned, and checked.',
        body: "Experience points and coins come from solving, writing, building and finishing. The important ones are verified on our servers, so they can't be faked."
      },
      {
        title: 'Real people are on the other side.',
        body: 'A game your child publishes gets played. A post gets answered. A Minecraft build gets seen by the whole server. That is what makes young people care about doing something well.'
      },
      {
        title: 'They grow here over years.',
        body: 'Members join as young students and stay into their teens and beyond, levelling up and taking on more responsibility as they go.'
      },
      {
        title: 'Nothing costs money.',
        body: 'Coins and points can only be earned, never bought. There is nothing for your child to spend real money on.'
      }
    ],
    loopTitle: 'You stay in the loop',
    todayLabel: 'Today',
    today: [
      {
        title: 'Nobody joins by accident.',
        body: 'Outside our academy, Twinkle is invitation-only: a member has to play with your child first, or a moderator on our Minecraft server has to vouch for them. Every account needs a verified email.'
      },
      {
        title: 'You decide for under-14s.',
        body: 'If your child is under 14 and joins by invitation, we email you before an account exists. Nothing is created until you approve.'
      },
      {
        title: 'We keep a record',
        body: 'of who invited your child and when you gave consent.'
      }
    ],
    nextLabel: 'Coming next: your parent view',
    nextBadge: 'Not built yet',
    nextNote: "These are what we're building next. None of them is available today.",
    next: [
      'A weekly summary in plain words: “This week Minjun learned 42 new words, solved 5 Math Lab puzzles and published his first game.”',
      'A card for each skill (reading, vocabulary, reasoning, writing, making) showing progress over time, with real examples.',
      'Time spent each day, and a daily limit you set.'
    ],
    nextSignIn:
      'It will sign you in with a link to the same email you approved with. No extra password.',
    safetyTitle: 'Safety, plainly',
    safety: [
      {
        title: 'A community, reviewed every day.',
        body: "Every reply from our AI helpers, Zero and Ciel, and the site's public posts are reviewed daily by our moderation system, and anything worrying reaches a person. Experienced members act as moderators."
      },
      {
        title: 'Report and block, built in.',
        body: 'Your child can report any message or block any member from the chat. A blocked member can no longer message them.'
      },
      {
        title: 'AI helpers that coach.',
        body: 'In games and puzzles, Zero and Ciel help your child think a problem through rather than handing over the answer, and they never help anyone win a game against another person.'
      },
      {
        title: 'No real money.',
        body: 'Nothing on Twinkle can be bought with real money.'
      }
    ],
    dataTitle: 'Your data.',
    dataBody:
      "We collect your child's name, email and how they use the site, and nothing more than we need. You can ask us to see or delete it at any time:",
    privacyLink: 'Privacy Policy',
    lawTitle: 'When the law requires it.',
    lawBody:
      'We share information with the police or other authorities when the law requires it, or to protect a child from serious harm.',
    contactLead: 'Questions? Write to Mikey, who built Twinkle and still runs it:',
    askTitle: 'Ask an AI about Twinkle',
    askIntro:
      'Not sure a feature is right for your child? Ask an AI, ours or your own.',
    askOursTitle: "Ask Twinkle's assistant",
    askOursBody:
      'on this page: it explains any feature, its benefits and its drawbacks, in plain words and in your language, and in light of what children will need to know in the years ahead.',
    askYoursTitle: 'Or ask your own AI',
    askYoursBody:
      '(ChatGPT, Claude, Gemini or any other): copy our parent guide link into it and ask it anything. The guide is written for AI assistants to read, and lists the honest drawbacks alongside the benefits.',
    askSameFacts:
      "Both answer from the same facts, published openly, so the answer doesn't depend on who you ask.",
    askBoxTitle: 'Ask about Twinkle',
    askBoxSub: 'Answers only from our parent guide, pros and cons included.',
    askPlaceholder: 'Ask anything about Twinkle for your child',
    askSend: 'Ask',
    askSuggestions: [
      'Can strangers message my child?',
      'Are AI Cards educational?',
      'How does Twinkle help my child in the age of AI?'
    ],
    askThinking: 'Reading the parent guide…',
    askNote: 'Answers come from our published parent guide. For your own AI:',
    askGuideLink: 'twin-kle.com/parents/guide',
    askCopy: 'Copy link',
    askCopied: 'Copied',
    askRemaining: (count) =>
      count === 1
        ? '1 question left today'
        : `${count} questions left today`,
    askErrors: {
      visitor:
        "That's today's 10 questions. Please come back tomorrow, or give the guide link to your own AI.",
      ip: 'Too many questions from this network today. Please try again tomorrow.',
      burst: 'One moment, please. Try again in a minute.',
      global:
        'The assistant has answered all it can for today. The parent guide has every answer it uses.',
      busy: 'The assistant is busy. Please try again in a moment.',
      failed: "Sorry, that didn't work. Please try again.",
      too_long: 'Please shorten your question.'
    },
    askYou: 'You',
    askAssistant: 'Twinkle',
    buildTitle: 'Build together with your child',
    buildBadge: 'Coming soon',
    buildIntro:
      'Already pay for an AI assistant like ChatGPT, Claude or Gemini? Soon you can put it to work on your child’s projects.',
    buildBody:
      'You will work on your own copy of a project (a branch), and your child stays the owner: they look at what you and your AI suggest and decide what goes into their game. You help, they lead, and they learn the most valuable skill of all, directing AI and judging its work.',
    buildWhen: 'This opens together with parent accounts, which are not ready yet.',
    footerLine: 'Twinkle · since 2016 · Seoul',
    screenshotNote: 'Real screens from Twinkle',
    shots: {
      mathLab: 'Math Lab: pick your grade, then take on the day\u2019s puzzle',
      grammarbles: 'Grammarbles: a daily grammar game',
      typing: 'Arcade Typing: a typing game built on Twinkle'
    }
  },
  ko: {
    pageTitle: 'Twinkle 부모님 안내',
    eyebrow: '부모님과 보호자를 위한 안내',
    heroTitle: '아이는 오늘도 게임을 할 거예요. 그 시간이 헛되지 않도록.',
    heroSubhead:
      'Twinkle은 부모님이 실제로 관리할 수 있는 게임 플랫폼입니다. 화면 앞에서 보낸 시간이 아이가 직접 만든 것, 스스로 푼 문제, 다른 사람들이 읽는 글로 남습니다.',
    heroLead:
      'Twinkle은 2016년 서울 트윈클 어학원 학생들의 커뮤니티로 시작했습니다. 지금은 초등학생부터 어른까지 AI와 함께 게임을 만들고, 사고력 퍼즐을 풀고, 진짜 독자를 위해 글을 쓰고, 마인크래프트에서 함께 건축하는 곳으로 자랐습니다. 게임처럼 느껴지는 건 실제로 게임이기 때문입니다. 다만 한 시간이 지나면, 아이에게는 보여 줄 무언가가 남습니다.',
    ctaLearn: '무엇을 배우는지 보기',
    ctaLoop: '부모님이 함께하는 방법',
    learnTitle: '아이가 여기서 배우는 것',
    learnIntro:
      '해마다 더 중요해지는 다섯 가지 능력을, 놀이처럼 느껴지는 활동으로 연습합니다.',
    skills: [
      {
        key: 'make',
        title: 'AI에 밀려나지 않고, AI로 만들어 내는 힘',
        body: 'Twinkle Build에서 아이는 만들고 싶은 게임이나 앱을 자기 말로 설명하고, AI 빌더 Lumine과 함께 만들어 갑니다. 직접 해 보고, 고치고, 다른 사람들이 즐길 수 있게 공개하지요. 팀원끼리 서로의 작업을 검토하고 합치기도 합니다. 지금 시대에 가장 중요한 능력은 AI를 이끌어 실제로 쓸모 있는 것을 만드는 일이고, 아이들은 여기서 그것을 매일 연습합니다.',
        tags: ['Twinkle Build', 'Lumine', '팀 작업']
      },
      {
        key: 'think',
        title: '문제를 끝까지 생각하는 힘',
        body: 'Math Lab은 하루 한 문제, 아이의 학년에 맞는 사고력 퍼즐을 냅니다(초등 1학년부터 고등 3학년까지, 한국 교육과정 기준). 이미 배운 내용만으로 풀 수 있어서, 어려운 건 공식이 아니라 생각하는 과정입니다. 막히면 힌트가 있고, 첫 답을 낸 뒤에는 단계별 그림 풀이가 열립니다. 체스 퍼즐은 입문부터 고수까지 단계가 올라가며, 시간 제한이 있는 승급 시험도 있습니다.',
        tags: ['Math Lab', '체스 퍼즐']
      },
      {
        key: 'read',
        title: '영어를 읽고 이해하는 힘',
        body: 'AI 스토리는 읽기와 듣기 지문을 다섯 단계로 제공합니다. 이제 막 읽기 시작한 아이부터 상급 학습자까지, 지문마다 이해력 문제가 이어집니다. 읽기 지문을 마치면 짧은 단어 퀴즈가 나오고, 맞힌 단어는 나만의 단어 모음에 쌓입니다. 사이트의 긴 게시물과 댓글은 소리 내어 읽어 주는 기능으로 들을 수도 있습니다.',
        tags: ['AI 스토리', 'Word Master', '읽어 주기']
      },
      {
        key: 'write',
        title: '하고 싶은 말이 있는 글쓰기',
        body: '매일 스스로를 돌아보는 질문이 하나씩 주어집니다. 답은 한자리에서 끝까지 쓰고, 따뜻한 글 피드백을 받습니다. 붙여 넣거나 AI가 쓴 답은 걸러집니다. 게시물과 댓글은 실제 회원들이 읽고, 답하고, 보상해 주기 때문에 잘 쓰는 일이 정말로 의미가 있습니다.',
        tags: ['오늘의 질문', '게시물과 댓글']
      },
      {
        key: 'grammar',
        title: '문법, 철자, 그리고 속도',
        body: 'Grammarbles는 매일 하는 문법 게임입니다. 문제가 틀렸다고 생각하면 이의를 제기할 수 있고, 그 이의는 진지하게 다뤄집니다. 문제를 꼼꼼히 다시 확인해, 아이 말이 맞으면 문제를 고치고 해설을 붙입니다. Wordle로 철자와 추론을 기르고, Arcade Typing은 타자 연습을 우주 슈팅 게임으로 바꿔, 마구 두드리기보다 정확하게 쳐야 점수와 별을 얻습니다.',
        tags: ['Grammarbles', 'Wordle', 'Arcade Typing']
      }
    ],
    whyTitle: '효과가 있는 이유: 게임의 끌림을 좋은 쪽으로',
    whyIntro:
      '아이들을 게임 앞으로 억지로 데려갈 필요는 없습니다. Twinkle은 똑같은 끌림(레벨, 연속 기록, 보상, 친구)을 쓰되, 그것을 진짜 노력과 연결합니다.',
    why: [
      {
        title: '보상은 노력으로 얻고, 확인을 거칩니다.',
        body: '경험치(XP)와 코인은 문제를 풀고, 글을 쓰고, 만들고, 끝까지 해낼 때 얻습니다. 중요한 보상은 저희 서버에서 확인하기 때문에 꾸며 낼 수 없습니다.'
      },
      {
        title: '반대편에 진짜 사람이 있습니다.',
        body: '아이가 공개한 게임은 누군가 플레이하고, 게시물에는 답이 달리고, 마인크래프트 건축물은 서버 전체가 봅니다. 그래서 아이들은 무언가를 잘 해내는 데 마음을 씁니다.'
      },
      {
        title: '여러 해에 걸쳐 함께 자랍니다.',
        body: '어린 학생으로 들어온 회원들이 10대가 되고 그 이후까지 머물며, 레벨을 올리고 점점 더 많은 역할을 맡습니다.'
      },
      {
        title: '돈이 들지 않습니다.',
        body: '코인과 포인트는 얻을 수만 있고 살 수는 없습니다. 아이가 실제 돈을 쓸 곳이 없습니다.'
      }
    ],
    loopTitle: '부모님이 늘 알고 계실 수 있도록',
    todayLabel: '지금',
    today: [
      {
        title: '아무나 들어올 수 없습니다.',
        body: '저희 어학원 밖에서는 초대로만 가입할 수 있습니다. 회원이 먼저 자녀와 함께 놀아 보았거나, 저희 마인크래프트 서버의 운영자가 추천해야 합니다. 모든 계정에는 인증된 이메일이 필요합니다.'
      },
      {
        title: '만 14세 미만은 부모님이 결정하십니다.',
        body: '만 14세 미만 자녀가 초대를 받아 가입하는 경우, 계정이 만들어지기 전에 부모님께 이메일을 드립니다. 동의하시기 전에는 아무것도 만들어지지 않습니다.'
      },
      {
        title: '기록을 남겨 둡니다.',
        body: '누가 자녀를 초대했는지, 언제 동의하셨는지 저희가 기록해 둡니다.'
      }
    ],
    nextLabel: '다음 단계: 부모님 화면',
    nextBadge: '아직 준비 중',
    nextNote: '지금 만들고 있는 기능입니다. 아래 내용은 아직 이용하실 수 없습니다.',
    next: [
      '쉬운 말로 쓴 주간 요약: “이번 주 민준이는 새 단어 42개를 익히고, Math Lab 퍼즐 5개를 풀고, 처음으로 게임을 공개했어요.”',
      '읽기, 어휘, 사고력, 글쓰기, 만들기 등 능력별 카드로 시간에 따른 성장을 실제 예시와 함께 보여 드립니다.',
      '하루 이용 시간, 그리고 부모님이 정하시는 하루 이용 한도.'
    ],
    nextSignIn:
      '로그인은 동의하실 때 쓰신 이메일로 받는 링크로 합니다. 비밀번호를 따로 만드실 필요가 없습니다.',
    safetyTitle: '안전에 대해, 있는 그대로',
    safety: [
      {
        title: '매일 살펴보는 커뮤니티.',
        body: '저희 AI 도우미 Zero와 Ciel의 모든 답변, 그리고 사이트의 공개 게시물을 저희 검토 시스템이 매일 살펴보고, 걱정되는 내용은 사람에게 전달됩니다. 경험 많은 회원들이 운영진으로 활동합니다.'
      },
      {
        title: '신고와 차단 기능.',
        body: '자녀는 채팅에서 어떤 메시지든 신고하고, 어떤 회원이든 차단할 수 있습니다. 차단된 회원은 더 이상 메시지를 보낼 수 없습니다.'
      },
      {
        title: '답을 주기보다 이끌어 주는 AI 도우미.',
        body: '게임과 퍼즐에서 Zero와 Ciel은 답을 바로 알려 주기보다 아이가 스스로 생각해 풀도록 돕고, 다른 사람과의 대결에서 누군가를 이기게 돕는 일은 하지 않습니다.'
      },
      {
        title: '실제 돈은 쓰이지 않습니다.',
        body: 'Twinkle에서는 무엇도 실제 돈으로 살 수 없습니다.'
      }
    ],
    dataTitle: '자녀분의 정보.',
    dataBody:
      '자녀분의 이름, 이메일, 사이트 이용 기록을 수집하며, 필요한 것 이상은 모으지 않습니다. 언제든 열람이나 삭제를 요청하실 수 있습니다:',
    privacyLink: '개인정보 처리방침(영문)',
    lawTitle: '법이 요구할 때.',
    lawBody:
      '법이 요구하거나 아이를 심각한 위험에서 보호해야 할 때에는 경찰 등 관계 기관에 정보를 제공합니다.',
    contactLead:
      '궁금한 점은 Twinkle을 만들고 지금도 직접 운영하는 Mikey에게 보내 주세요:',
    askTitle: 'Twinkle에 대해 AI에게 물어보세요',
    askIntro:
      '이 기능이 우리 아이에게 맞을지 고민되시나요? 저희 AI에게도, 평소 쓰시는 AI에게도 물어보실 수 있습니다.',
    askOursTitle: '이 페이지의 Twinkle 도우미',
    askOursBody:
      '는 어떤 기능이든 장점과 단점을 쉬운 말로, 부모님의 언어로, 그리고 아이들이 앞으로 갖춰야 할 능력의 관점에서 설명해 드립니다.',
    askYoursTitle: '또는 평소 쓰시는 AI',
    askYoursBody:
      '(ChatGPT, Claude, Gemini 등)에 부모님 안내서 링크를 붙여 넣고 무엇이든 물어보세요. 이 안내서는 AI가 읽도록 쓰였고, 장점과 함께 솔직한 단점도 담았습니다.',
    askSameFacts:
      '두 방법 모두 공개된 같은 사실에서 답하기 때문에, 누구에게 묻든 답이 달라지지 않습니다.',
    askBoxTitle: 'Twinkle에 대해 물어보기',
    askBoxSub: '부모님 안내서에 있는 내용으로만, 장단점을 함께 답합니다.',
    askPlaceholder: '자녀와 관련해 Twinkle에 대해 무엇이든 물어보세요',
    askSend: '묻기',
    askSuggestions: [
      '모르는 사람이 우리 아이에게 메시지를 보낼 수 있나요?',
      'AI 카드는 교육적인가요?',
      'AI 시대에 Twinkle이 아이에게 어떤 도움이 되나요?'
    ],
    askThinking: '부모님 안내서를 읽고 있습니다…',
    askNote: '답변은 공개된 부모님 안내서를 바탕으로 합니다. 평소 쓰시는 AI에게는:',
    askGuideLink: 'twin-kle.com/parents/guide',
    askCopy: '링크 복사',
    askCopied: '복사했습니다',
    askRemaining: (count) => `오늘 ${count}번 더 물어보실 수 있습니다`,
    askErrors: {
      visitor:
        '오늘 물어보실 수 있는 10번을 모두 쓰셨습니다. 내일 다시 오시거나, 안내서 링크를 평소 쓰시는 AI에게 주세요.',
      ip: '오늘 이 네트워크에서 질문이 너무 많았습니다. 내일 다시 시도해 주세요.',
      burst: '잠시만요. 1분 뒤에 다시 물어봐 주세요.',
      global:
        '도우미가 오늘 답할 수 있는 만큼 모두 답했습니다. 도우미가 쓰는 모든 내용은 부모님 안내서에 있습니다.',
      busy: '도우미가 바쁩니다. 잠시 후 다시 시도해 주세요.',
      failed: '죄송합니다. 답을 가져오지 못했습니다. 다시 시도해 주세요.',
      too_long: '질문을 조금 줄여 주세요.'
    },
    askYou: '나',
    askAssistant: 'Twinkle',
    buildTitle: '자녀와 함께 만들기',
    buildBadge: '곧 제공',
    buildIntro:
      'ChatGPT, Claude, Gemini 같은 AI를 이미 쓰고 계신가요? 곧 그 AI로 자녀의 프로젝트를 도와주실 수 있습니다.',
    buildBody:
      '부모님은 프로젝트의 내 사본(브랜치)에서 작업하시고, 자녀는 계속 주인으로 남습니다. 부모님과 AI가 제안한 것을 아이가 직접 보고, 무엇을 게임에 넣을지 스스로 정합니다. 부모님은 돕고 아이는 이끌며, AI에게 방향을 주고 그 결과를 판단하는, 가장 값진 능력을 배웁니다.',
    buildWhen: '아직 준비 중인 부모님 계정과 함께 열립니다.',
    footerLine: 'Twinkle · 2016년부터 · 서울',
    screenshotNote: 'Twinkle의 실제 화면',
    shots: {
      mathLab: 'Math Lab: 학년을 고르고 오늘의 퍼즐에 도전합니다',
      grammarbles: 'Grammarbles: 매일 하는 문법 게임',
      typing: 'Arcade Typing: Twinkle에서 만든 타자 게임'
    }
  }
};
