// Every word the lite host shows. Sign-in, sign-up, guest and account
// words are English only (Mikey 11-25: Korean is for parent-facing pages);
// the badge menu and the report box follow the browser's language.
export type LiteHostLang = 'en' | 'ko';

export function liteHostLang(): LiteHostLang {
  const languages =
    typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  return languages.some((value) => /^ko\b/i.test(String(value || ''))) ? 'ko' : 'en';
}

const BASE_TEXT = {
  en: {
    madeWith: 'Made with Lumine',
    onTwinkle: 'on Twinkle',
    badgeMenuTitle: (title: string) => title,
    by: (owner: string) => `by ${owner}`,
    openOnTwinkle: 'Open on Twinkle',
    makeYourOwn: 'Make your own app',
    report: 'Report this app',
    signIn: 'Sign in with Twinkle',
    signOut: 'Sign out',
    signedInAs: (name: string) => `Signed in as ${name}`,
    signInTitle: 'Save your progress',
    signInBody: (title: string) =>
      `Save your progress and get on the leaderboard with a free Twinkle account. Twinkle is where ${title} was made.`,
    signInCta: 'Continue with Twinkle',
    notNow: 'Keep playing as a guest',
    neverPassword: 'You’ll sign in or sign up on twin-kle.com. Twinkle never asks for your password inside an app.',
    guestHint: 'Playing as a guest. Sign in to save your progress.',
    guestHintCta: 'Sign in',
    carriedOver: 'Your guest progress was saved to your account.',
    // app accounts (an app on its own accounts): the app's own words only
    accountSignInTitle: (title: string) => `Sign in to ${title}`,
    accountSignUpTitle: (title: string) => `Create a ${title} account`,
    accountSignInBody: 'Save your progress and get on the leaderboard.',
    accountUsername: 'Username',
    accountPassword: 'Password',
    accountSignIn: 'Sign in',
    accountSigningIn: 'Signing in…',
    accountNew: 'New here? Create an account',
    accountHave: 'Have an account? Sign in',
    accountBirth: 'When were you born?',
    accountBirthNote: 'Under 14? A parent or guardian says yes first.',
    accountMonth: 'Month',
    accountYear: 'Year',
    accountMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    accountNext: 'Next',
    accountBack: 'Back',
    accountUsernameHint: '3 to 19 letters, numbers or _',
    accountPasswordHint: 'At least 5 characters',
    accountCreate: 'Create account',
    accountCreating: 'Creating your account…',
    accountApprovedNext: 'Next, pick a username and password.',
    accountFailed: 'That didn’t work. Please try again.',
    accountOr: 'or',
    accountTwinkle: 'Continue with Twinkle',
    accountPrivacy: 'Privacy policy',
    linkTwinkle: 'Link a Twinkle account',
    linkedTwinkle: 'Twinkle account linked: you can earn Coins and XP here now.',
    linkFailed: 'Couldn’t link that Twinkle account.',
    linkTitle: (host: string) => `Open ${host}?`,
    linkBody: 'This link leaves the app and opens another website in a new tab.',
    linkOpen: 'Open',
    linkCancel: 'Cancel',
    linkBlocked: 'Twinkle has blocked this site.',
    unsupported: 'This part of the app works on Twinkle.',
    reportTitle: 'Report this app',
    reportReasons: {
      scary: 'Scary or upsetting',
      rude: 'Rude or mean',
      scam: 'Asks for passwords or money',
      pretends: 'Pretends to be someone else',
      broken: 'Doesn’t work',
      other: 'Something else'
    } as Record<string, string>,
    reportDetails: 'Tell us more (optional)',
    reportSend: 'Send report',
    reportThanks: 'Thanks. Twinkle will take a look.',
    close: 'Close'
  },
  ko: {
    madeWith: 'Lumine으로 만든 앱',
    onTwinkle: '트윈클',
    badgeMenuTitle: (title: string) => title,
    by: (owner: string) => `만든 사람: ${owner}`,
    openOnTwinkle: '트윈클에서 열기',
    makeYourOwn: '나만의 앱 만들기',
    report: '이 앱 신고하기',
    linkTitle: (host: string) => `${host}을(를) 열까요?`,
    linkBody: '이 링크는 앱을 떠나 새 탭에서 다른 웹사이트를 열어요.',
    linkOpen: '열기',
    linkCancel: '취소',
    linkBlocked: '트윈클이 차단한 사이트예요.',
    unsupported: '이 기능은 트윈클에서 사용할 수 있어요.',
    reportTitle: '이 앱 신고하기',
    reportReasons: {
      scary: '무섭거나 불쾌해요',
      rude: '무례하거나 못됐어요',
      scam: '비밀번호나 돈을 요구해요',
      pretends: '다른 사람인 척해요',
      broken: '작동하지 않아요',
      other: '기타'
    } as Record<string, string>,
    reportDetails: '자세히 알려 주세요 (선택)',
    reportSend: '신고 보내기',
    reportThanks: '고마워요. 트윈클이 확인할게요.',
    close: '닫기'
  }
};

// English for every sign-in and account word, in every language
const SIGN_IN_KEYS = ['signIn', 'signOut', 'signedInAs', 'signInTitle', 'signInBody', 'signInCta', 'notNow', 'neverPassword', 'guestHint', 'guestHintCta', 'carriedOver', 'accountSignInTitle', 'accountSignUpTitle', 'accountSignInBody', 'accountUsername', 'accountPassword', 'accountSignIn', 'accountSigningIn', 'accountNew', 'accountHave', 'accountBirth', 'accountBirthNote', 'accountMonth', 'accountYear', 'accountMonths', 'accountNext', 'accountBack', 'accountUsernameHint', 'accountPasswordHint', 'accountCreate', 'accountCreating', 'accountApprovedNext', 'accountFailed', 'accountOr', 'accountTwinkle', 'accountPrivacy', 'linkTwinkle', 'linkedTwinkle', 'linkFailed'] as const;
const englishSignIn = Object.fromEntries(
  SIGN_IN_KEYS.map((key) => [key, BASE_TEXT.en[key]])
) as Pick<(typeof BASE_TEXT)['en'], (typeof SIGN_IN_KEYS)[number]>;

export const LITE_HOST_TEXT = {
  en: BASE_TEXT.en,
  ko: { ...BASE_TEXT.ko, ...englishSignIn }
};

export type LiteHostText = (typeof LITE_HOST_TEXT)['en'];
