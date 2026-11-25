// Every word of twin-kle.com's app sign-in window (/lumine-app/signin), in
// English and Korean (Korean for a Korean browser, as on the parent pages).
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
    wrongOrigin: '이 로그인 요청은 앱의 주소에서 온 것이 아니에요.',
    newHere: (app: string) =>
      `무료 트윈클 계정으로 진행 상황을 저장하고 순위표에 이름을 올려 보세요. ${app}은(는) 트윈클에서 만들어졌어요. 트윈클은 직접 게임과 앱을 만들고 함께 나누는 곳이에요.`,
    createAccount: '무료 계정 만들기',
    haveAccount: '트윈클 계정이 있어요',
    backToApp: '앱으로 돌아가기',
    sees: '내 아이디와 프로필 사진을 볼 수 있어요.',
    saves: '이 앱에서 진행 상황을 저장하고 친구와 함께할 수 있어요.',
    coins: '코인 사용을 요청할 수 있어요. 쓸 때마다 내가 직접 확인해요.',
    cant: '내 메시지를 보거나 계정을 바꿀 수는 없어요.',
    continueAs: (name: string) => `${name}(으)로 계속하기`,
    cancel: '취소',
    signInFirst: '트윈클에 로그인하기',
    birthTitle: '언제 태어났나요?',
    birthBody: '만 14세 미만이면 먼저 부모님이나 보호자의 동의를 받아요.',
    month: '월',
    year: '년',
    chooseMonth: '월 선택',
    chooseYear: '년도 선택',
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    futureBirth: '아직 오지 않은 달이에요. 년도를 확인해 주세요.',
    birthNote: '부모님 동의가 필요한지 알기 위해서만 사용해요.',
    next: '다음',
    back: '뒤로',
    accountTitle: '아이디와 비밀번호 정하기',
    accountBody: (app: string) => `${app}과(와) 트윈클에 로그인할 때 사용해요.`,
    username: '아이디',
    usernameHint: '영문, 숫자, _ 로 3~19자',
    password: '비밀번호',
    passwordHint: '5자 이상',
    showPassword: '보기',
    hidePassword: '숨기기',
    create: '계정 만들기',
    creating: '계정을 만드는 중…',
    guardianApproved: '이제 아이디와 비밀번호를 정해 주세요.',
    badUsername: '아이디는 영문, 숫자, _ 로 3~19자예요.',
    shortPassword: '비밀번호는 5자 이상이어야 해요.',
    failed: '잘 되지 않았어요. 다시 시도해 주세요.',
    passFailed: '지금은 이 앱에서 가입할 수 없어요.',
    terms: '계정을 만들면 트윈클의 개인정보 처리방침에 동의하게 돼요.',
    privacy: '개인정보 처리방침'
  }
};

export type SignInText = (typeof SIGNIN_TEXT)['en'];
