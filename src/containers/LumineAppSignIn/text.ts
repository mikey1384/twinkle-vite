// Every word of twin-kle.com's app sign-in window (/lumine-app/signin), in
// English and Korean by the browser's language (Mikey 11-25: sign-in and
// sign-up follow standard localization; Twinkle itself defaults to English).
// The Korean is written to read naturally, not as a translation.
// Most people who see it have never heard of Twinkle: it says what Twinkle is
// in one line and keeps the rest short.
export type SignInLang = 'en' | 'ko';

export function signInLang(): SignInLang {
  try {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    return languages.some((value) => /^ko\b/i.test(String(value || ''))) ? 'ko' : 'en';
  } catch {
    return 'en';
  }
}

export const SIGNIN_TEXT = {
  en: {
    titleFor: (app: string) => `Sign in to ${app}`,
    title: 'Sign in with Twinkle',
    saveTitle: (app: string) => `Save your progress in ${app}`,
    by: (owner: string, host: string) => `by ${owner} · ${host}`,
    wrongOrigin: 'This sign-in didn’t come from the app’s own address.',
    newHere: (app: string) =>
      `Save your progress and get on the leaderboard with a free Twinkle account. Twinkle is where ${app} was made: a place where people make and share their own games and apps.`,
    createAccount: 'Create a free account',
    haveAccount: 'I already have a Twinkle account',
    backToApp: 'Back to the app',
    sees: 'It will see your username and picture.',
    saves: 'It can save your progress and play with friends in this app.',
    coins: 'It can ask you to spend Coins. You confirm each one.',
    cant: 'It can’t see your messages or change your account.',
    continueAs: (name: string) => `Continue as ${name}`,
    cancel: 'Cancel',
    signInFirst: 'Sign in to Twinkle',
    // "Link Twinkle" from an app account
    linkTitle: (app: string) => `Link Twinkle to ${app}`,
    linkIntro: (app: string) =>
      `Your ${app} account keeps all its progress. With your Twinkle account linked, you can also earn Coins and XP there from now on.`,
    linkContinueAs: (name: string) => `Link ${name}`,
    // sign-up
    birthTitle: 'When were you born?',
    birthBody: 'If you’re under 14, we’ll ask a parent or guardian to say yes first.',
    month: 'Month',
    year: 'Year',
    chooseMonth: 'Choose a month',
    chooseYear: 'Choose a year',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    futureBirth: 'That month hasn’t happened yet. Please check the year.',
    birthNote: 'We only use this to know whether a parent or guardian needs to approve.',
    next: 'Next',
    back: 'Back',
    accountTitle: 'Pick a username and password',
    accountBody: (app: string) => `You’ll use these to sign in to ${app} and Twinkle.`,
    username: 'Username',
    usernameHint: '3 to 19 letters, numbers or _',
    password: 'Password',
    passwordHint: 'At least 5 characters',
    showPassword: 'Show',
    hidePassword: 'Hide',
    create: 'Create account',
    creating: 'Creating your account…',
    guardianApproved: 'Next, pick a username and password.',
    badUsername: 'Usernames use 3 to 19 letters, numbers or _.',
    shortPassword: 'Passwords need at least 5 characters.',
    failed: 'That didn’t work. Please try again.',
    passFailed: 'Sign-up isn’t available for this app right now.',
    terms: 'By creating an account you agree to Twinkle’s privacy policy.',
    privacy: 'privacy policy'
  },
  ko: {
    titleFor: (app: string) => `${app}에 로그인`,
    title: '트윈클로 로그인',
    saveTitle: (app: string) => `${app} 진행 상황 저장하기`,
    by: (owner: string, host: string) => `만든 사람: ${owner} · ${host}`,
    wrongOrigin: '앱의 원래 주소에서 온 로그인 요청이 아니에요.',
    newHere: (app: string) =>
      `무료 트윈클 계정을 만들면 진행 상황이 저장되고 순위표에도 이름이 올라가요. ${app}은(는) 트윈클에서 만든 게임이에요. 트윈클은 누구나 게임과 앱을 직접 만들고 함께 즐기는 곳이에요.`,
    createAccount: '무료 계정 만들기',
    haveAccount: '트윈클 계정이 있어요',
    backToApp: '앱으로 돌아가기',
    sees: '내 아이디와 프로필 사진을 볼 수 있어요.',
    saves: '이 앱에서 진행 상황을 저장하고 친구와 같이 놀 수 있어요.',
    coins: '코인을 쓰자고 할 수는 있지만, 쓸 때마다 내가 직접 확인해요.',
    cant: '내 메시지를 보거나 계정을 바꿀 수는 없어요.',
    continueAs: (name: string) => `${name}(으)로 계속하기`,
    cancel: '취소',
    signInFirst: '트윈클에 로그인하기',
    linkTitle: (app: string) => `${app}에 트윈클 연결하기`,
    linkIntro: (app: string) =>
      `${app} 계정의 진행 상황은 그대로예요. 트윈클 계정을 연결하면 이제부터 거기서도 코인과 XP를 받을 수 있어요.`,
    linkContinueAs: (name: string) => `${name} 연결하기`,
    birthTitle: '생년월을 알려 주세요',
    birthBody: '만 14세 미만이면 먼저 부모님이나 보호자께 동의를 받아요.',
    month: '월',
    year: '연도',
    chooseMonth: '월을 골라 주세요',
    chooseYear: '연도를 골라 주세요',
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    futureBirth: '아직 오지 않은 달이에요. 연도를 다시 확인해 주세요.',
    birthNote: '부모님 동의가 필요한지 확인할 때만 써요.',
    next: '다음',
    back: '이전',
    accountTitle: '아이디와 비밀번호 정하기',
    accountBody: (app: string) => `${app}과(와) 트윈클에 로그인할 때 써요.`,
    username: '아이디',
    usernameHint: '영문, 숫자, _ 3~19자',
    password: '비밀번호',
    passwordHint: '5자 이상',
    showPassword: '보기',
    hidePassword: '숨기기',
    create: '계정 만들기',
    creating: '계정을 만드는 중…',
    guardianApproved: '이제 아이디와 비밀번호를 정해 주세요.',
    badUsername: '아이디는 영문, 숫자, _ 3~19자로 정해 주세요.',
    shortPassword: '비밀번호는 5자 이상으로 정해 주세요.',
    failed: '잘 안 됐어요. 다시 해 볼까요?',
    passFailed: '지금은 이 앱에서 가입할 수 없어요.',
    terms: '계정을 만들면 트윈클의 개인정보 처리방침에 동의하게 돼요.',
    privacy: '개인정보 처리방침'
  }
};

export type SignInText = (typeof SIGNIN_TEXT)['en'];
