// Every word the lite host shows, one dictionary per language (Korean for a
// Korean browser, as on the parent pages).
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

export const LITE_HOST_TEXT = {
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
    signIn: '트윈클로 로그인',
    signOut: '로그아웃',
    signedInAs: (name: string) => `${name}(으)로 로그인됨`,
    signInTitle: '진행 상황 저장하기',
    signInBody: (title: string) =>
      `무료 트윈클 계정으로 진행 상황을 저장하고 순위표에 이름을 올려 보세요. ${title}은(는) 트윈클에서 만들어졌어요.`,
    signInCta: '트윈클로 계속하기',
    notNow: '게스트로 계속하기',
    neverPassword: '로그인과 가입은 twin-kle.com에서 해요. 트윈클은 앱 안에서 비밀번호를 묻지 않아요.',
    guestHint: '게스트로 플레이 중이에요. 로그인하면 진행 상황이 저장돼요.',
    guestHintCta: '로그인',
    carriedOver: '게스트로 플레이한 진행 상황을 계정에 저장했어요.',
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

export type LiteHostText = (typeof LITE_HOST_TEXT)['en'];
