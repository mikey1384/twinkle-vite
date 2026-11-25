// Every word of twin-kle.com's app sign-in window (/lumine-app/signin).
// English only (Mikey 11-25: Korean is for parent-facing pages; the
// guardian email and the parent's page keep theirs). Most people who see it
// have never heard of Twinkle: it says what Twinkle is in one line and keeps
// the rest short.
export const SIGNIN_TEXT = {
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
};

export type SignInText = typeof SIGNIN_TEXT;
