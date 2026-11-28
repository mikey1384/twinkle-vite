// /domains/manage: every word, Korean and English side by side. Parents read
// Korean first (korean-only-for-parents); adults who bought for their own app
// read English. Wording follows domain-renewal-wording.md: say what happens,
// when and how much; always say how to stop it; no jargon ("card", never
// "payment method").
export type ManageLang = 'ko' | 'en';

export const MANAGE_TEXT = {
  ko: {
    kicker: '트윈클 · 내 도메인',
    signInTitle: '내 도메인 관리',
    signInLead: '결제하신 도메인의 자동 갱신을 켜고 끄거나, 카드를 바꾸고 영수증을 볼 수 있어요. 결제할 때 쓰신 이메일을 적어 주세요.',
    email: '이메일',
    sendLink: '로그인 링크 보내기',
    noAccount: '트윈클 계정이 없어도 돼요. 비밀번호 없이 이메일 링크로 들어와요.',
    sentTitle: '이메일을 확인해 주세요',
    sentBody: (email: string) =>
      `${email}(으)로 도메인을 결제하신 적이 있다면, 15분 동안 쓸 수 있는 로그인 링크를 보내 드렸어요. 메일이 안 보이면 스팸함도 확인해 주세요.`,
    resend: '다시 보내기',
    useOtherEmail: '다른 이메일 쓰기',
    linkExpired: '링크가 만료되었거나 이미 사용되었어요. 새 링크를 받아 주세요.',
    signingIn: '들어가는 중…',
    listTitle: '내 도메인',
    signedInAs: (email: string) => `${email}(으)로 로그인됨`,
    signOut: '로그아웃',
    none: '이 이메일로 결제된 도메인이 없어요. 다른 이메일로 결제하셨다면 그 이메일로 다시 로그인해 주세요.',
    forChild: (child: string, app: string) => `${child}님의 앱 “${app}”`,
    forApp: (app: string) => `앱 “${app}”`,
    on: '자동 갱신 켜짐',
    onLine: (date: string | null, price: string, last4: string | null) =>
      `${date ? `${date}에 ` : '매년 '}${price}로 자동 갱신돼요${last4 ? ` (카드 끝자리 ${last4})` : ''}.`,
    turnOff: '자동 갱신 끄기',
    confirmOff: (date: string | null) => `자동 갱신을 끌까요? ${date ? `${date}까지는` : '올해는'} 바뀌는 게 없어요.`,
    confirmOffYes: '네, 끌게요',
    keepOn: '켜 둘게요',
    off: '자동 갱신 꺼짐',
    offLine: (date: string | null, free: string | null) =>
      `${date ? `${date}까지 그대로 쓸 수 있어요. ` : ''}그 뒤에는 앱이 ${free || '무료 lumine.app 주소'}로 돌아가요.`,
    turnOn: '자동 갱신 다시 켜기',
    priceTitle: '갱신 가격이 바뀌었어요',
    priceLine: (date: string | null) =>
      `도메인 회사가 가격을 올려서, 물어보지 않고 결제하지 않으려고 자동 갱신을 멈췄어요.${date ? ` ${date}까지는 그대로예요.` : ''}`,
    cardTitle: '카드 결제가 되지 않았어요',
    cardLine: (date: string | null) =>
      `결제된 금액은 없어요. 내일 다시 시도할게요.${date ? ` ${date}까지는 안전해요.` : ''} 카드를 바꾸시려면 아래 버튼을 눌러 주세요.`,
    ended: (date: string | null) => (date ? `${date}에 끝났어요.` : '기간이 끝났어요.'),
    updateCard: '카드 바꾸기 · 영수증',
    opening: '여는 중…',
    saving: '저장 중…',
    sessionEnded: '로그인 시간이 끝났어요. 이메일 링크를 다시 받아 주세요.',
    notAvailable: '아직 준비 중이에요. 조금 뒤에 다시 와 주세요.',
    failed: '잠시 문제가 생겼어요. 다시 시도해 주세요.'
  },
  en: {
    kicker: 'Twinkle · Your domains',
    signInTitle: 'Manage your domains',
    signInLead: 'Turn auto-renew on or off, change your card, or see receipts for domains you paid for. Enter the email you used when you paid.',
    email: 'Email',
    sendLink: 'Email me a sign-in link',
    noAccount: 'No Twinkle account needed. No password: you sign in with a link we email you.',
    sentTitle: 'Check your email',
    sentBody: (email: string) =>
      `If ${email} paid for a domain, we sent a sign-in link that works for 15 minutes. Can’t find it? Check your spam folder.`,
    resend: 'Send again',
    useOtherEmail: 'Use another email',
    linkExpired: 'That link has expired or was already used. Get a new one below.',
    signingIn: 'Signing you in…',
    listTitle: 'Your domains',
    signedInAs: (email: string) => `Signed in as ${email}`,
    signOut: 'Sign out',
    none: 'No domains were paid for with this email. If you paid with another email, sign in with that one.',
    forChild: (child: string, app: string) => `${child}’s app “${app}”`,
    forApp: (app: string) => `Your app “${app}”`,
    on: 'Auto-renew is on',
    onLine: (date: string | null, price: string, last4: string | null) =>
      `Renews automatically${date ? ` on ${date}` : ' each year'} for ${price}${last4 ? ` (card ending ${last4})` : ''}.`,
    turnOff: 'Turn off auto-renew',
    confirmOff: (date: string | null) => `Turn off auto-renew? ${date ? `Nothing changes until ${date}.` : 'Nothing changes this year.'}`,
    confirmOffYes: 'Yes, turn it off',
    keepOn: 'Keep it on',
    off: 'Auto-renew is off',
    offLine: (date: string | null, free: string | null) =>
      `${date ? `It stays yours until ${date}. ` : ''}After that the app goes back to ${free || 'its free lumine.app address'}.`,
    turnOn: 'Turn auto-renew back on',
    priceTitle: 'The renewal price changed',
    priceLine: (date: string | null) =>
      `The domain company raised the price, so we stopped auto-renew rather than charge you without asking.${date ? ` Nothing changes until ${date}.` : ''}`,
    cardTitle: 'Your card didn’t go through',
    cardLine: (date: string | null) =>
      `Nothing was charged. We’ll try again tomorrow.${date ? ` It’s safe until ${date}.` : ''} To use another card, tap the button below.`,
    ended: (date: string | null) => (date ? `Ended on ${date}.` : 'This domain has ended.'),
    updateCard: 'Change card · Receipts',
    opening: 'Opening…',
    saving: 'Saving…',
    sessionEnded: 'Your sign-in has ended. Get a new email link to continue.',
    notAvailable: 'This isn’t available yet. Please check back soon.',
    failed: 'Something went wrong. Please try again.'
  }
};

export type ManageText = (typeof MANAGE_TEXT)['en'];
