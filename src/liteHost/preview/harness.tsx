// Dev-only preview harness (not part of any build): renders the real
// app-address views with sample data, one screen per ?screen=…, for the
// screenshot preview. Prices come from the API's pricing rule
// (helpers/build/appHosting/domainPricing.ts) with the estimated reseller
// costs; the Ask button here is a stand-in with the same look, because the
// real AskAgentButton needs the signed-in website.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ADDRESS_TEXT } from '~/components/Build/AppAddress/text';
import {
  AddressCardView,
  ConnectView,
  FindView,
  IntroView,
  MessageView,
  ParentRequestView,
  type DomainIdeaView
} from '~/components/Build/AppAddress/views';
import ParentConsentView from '~/containers/DomainParentConsent/ParentConsentView';
import SignInCardView from '~/containers/LumineAppSignIn/SignInCardView';
import AppSignUp from '~/containers/LumineAppSignIn/AppSignUp';
import { SIGNIN_TEXT, signInLang } from '~/containers/LumineAppSignIn/text';
import { LiteHostProviders } from '../react/LiteHost';
import { askSignIn, mountBadge, showGuestHint } from '../ui';
import { LITE_HOST_TEXT } from '../text';
import AppAccountSheet from '../react/AppAccountSheet';
import AppPlayers from '~/components/Build/AppAddress/AppPlayers';
import '../host.css';

// Stand-ins for the requests the sign-up window makes (nothing leaves the page).
const FAKE_REQUESTS: any = {
  loadAppSignupPass: async () => ({ token: 'a_preview.preview', expiresAt: Math.floor(Date.now() / 1000) + 86400 }),
  signupFromApp: async () => ({ id: 1, username: 'lily' }),
  requestGuardianConsent: async ({ guardianEmail }: any) => ({ consentId: 1, secret: 's', guardianEmail, expiresAt: 0 }),
  getGuardianConsentStatus: async () => ({ status: params.get('consent') || 'pending', expiresAt: 0 })
};
const SITE_CONFIG: any = { buildId: 2, title: 'The Adventure of a Red Square', owner: { id: 1, username: 'mikey' }, thumbnailUrl: null, siteOrigin: 'https://www.twin-kle.com' };

const params = new URLSearchParams(window.location.search);
const screen = params.get('screen') || 'card';
const lang = params.get('lang') === 'ko' ? 'ko' : 'en';
const t = ADDRESS_TEXT[lang];

const idea = (domain: string, reg: number, card: number, tw: number, total: number, krw: number): DomainIdeaView => ({
  domain,
  priceCents: total,
  breakdown: { registryCents: reg, cardFeeCents: card, twinkleCents: tw },
  approxKrw: krw
});
const IDEAS = [
  idea('starcatcher.com', 1121, 92, 186, 1399, 20000),
  idea('starcatcher.app', 1495, 109, 195, 1799, 26000),
  idea('playstarcatcher.com', 1121, 92, 186, 1399, 20000),
  idea('starcatcher.net', 1261, 96, 142, 1499, 22000),
  idea('starcatcherhq.com', 1121, 92, 186, 1399, 20000)
];

function AskStandIn({ label }: { label?: string }) {
  return (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        border: 0,
        borderRadius: 999,
        padding: '0.6rem 1.05rem 0.6rem 0.6rem',
        background: '#e8f1ff',
        color: '#0b5cad',
        font: 'inherit',
        fontWeight: 700,
        fontSize: '1rem',
        boxShadow: '0 2px 0 rgba(11,92,173,0.18)'
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #9fd0ff, #2b7bd6)', display: 'inline-block' }} />
      {label || (lang === 'ko' ? 'Zero에게 묻기' : 'Ask Zero')}
    </button>
  );
}

function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div style={{ padding: '24px 16px 40px', maxWidth: wide ? 980 : 640, margin: '0 auto' }}>{children}</div>;
}

function AppPageHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 6px 24px rgba(20,20,40,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'radial-gradient(circle at 20% 10%, #3a2a8f, #07061a)', display: 'grid', placeItems: 'center', fontSize: 28 }}>⭐</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>Star Catcher</div>
          <div style={{ color: '#5d5d6e' }}>by mikey · <span style={{ color: '#118a55', fontWeight: 700 }}>✓ Live</span></div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Harness() {
  const [query, setQuery] = useState('Star Catcher');
  const noop = () => {};
  switch (screen) {
    case 'card':
      return (
        <Page>
          <AppPageHeader>
            <AddressCardView t={t} url="https://star-catcher.lumine.app" domains={params.get('domain') ? [params.get('domain')!] : []} isOwner copied={false} onCopy={noop} onShare={noop} onGetOwn={noop} />
          </AppPageHeader>
        </Page>
      );
    case 'card-wording':
      return (
        <Page wide>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {[t.getOwn, t.getOwnAlt, lang === 'ko' ? '내 .com 연결하기' : 'Use my own .com'].map((label) => (
              <div key={label}>
                <div style={{ color: '#5d5d6e', marginBottom: 6 }}>“{label}”</div>
                <AddressCardView t={t} url="https://star-catcher.lumine.app" domains={[]} isOwner copied={false} onCopy={noop} onShare={noop} onGetOwn={noop} getOwnLabel={label} />
              </div>
            ))}
          </div>
        </Page>
      );
    case 'intro':
      return (
        <Page>
          <IntroView t={t} freeHost="star-catcher.lumine.app" onFind={noop} onHaveOne={noop} ask={<AskStandIn />} />
        </Page>
      );
    case 'find':
      return (
        <Page>
          <FindView t={t} query={query} ideas={IDEAS} loading={false} openBreakdownFor={params.get('open') || undefined} onQuery={setQuery} onSearch={noop} onBuy={noop} onUseOwn={noop} onMoreIdeas={noop} ask={<AskStandIn label={t.askIdeas} />} showAdvanced={params.get('advanced') === '1'} />
        </Page>
      );
    case 'parent-request':
      return (
        <Page>
          <ParentRequestView t={t} idea={IDEAS[0]} email="mom@example.com" sending={false} onEmail={noop} onSend={noop} onBack={noop} />
        </Page>
      );
    case 'sent':
      return (
        <Page>
          <MessageView title={t.sentTitle} body={t.sentBody('starcatcher.com')} primaryLabel={t.done} onPrimary={noop} />
        </Page>
      );
    case 'parent-consent':
      return (
        <Page>
          <ParentConsentView
            order={{ domain: 'starcatcher.com', appTitle: 'Star Catcher', childUsername: 'mikey', priceCents: 1399, breakdown: IDEAS[0].breakdown, approxKrw: 20000, status: 'awaiting_parent' }}
            mode={(params.get('mode') as any) || 'ko'}
            onMode={noop}
            submitting=""
            onApprove={noop}
            onDecline={noop}
            initialRegistrant={params.get('filled') ? { firstName: '민아', lastName: '김', email: 'mina.kim@example.com', phone: '+82.1012345678', address1: '서울특별시 마포구 월드컵북로 1', city: '서울', zip: '03900', country: 'KR' } : undefined}
          />
        </Page>
      );
    case 'checkout':
      return (
        <div style={{ minHeight: '100vh', background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div style={{ background: '#f7f7f9', padding: '40px 32px' }}>
            <div style={{ display: 'inline-block', background: '#ffde92', color: '#6b4500', fontSize: 13, fontWeight: 700, borderRadius: 6, padding: '2px 8px', marginBottom: 18 }}>TEST MODE · mock of Stripe Checkout</div>
            <div style={{ color: '#6b7280' }}>Twinkle</div>
            <div style={{ fontSize: 15, marginTop: 18, color: '#374151' }}>Subscribe to starcatcher.com</div>
            <div style={{ fontSize: 36, fontWeight: 700, margin: '4px 0' }}>$13.99 <span style={{ fontSize: 15, color: '#6b7280', fontWeight: 400 }}>per year</span></div>
            <div style={{ color: '#6b7280', fontSize: 14, maxWidth: 360 }}>Web address for Star Catcher on Twinkle, renews yearly at the same price</div>
          </div>
          <div style={{ padding: '40px 32px', maxWidth: 420 }}>
            {['Email', 'Card information', 'Cardholder name', 'Country or region'].map((label, i) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>{label}</div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px', color: '#9ca3af' }}>{['mina.kim@example.com', '4242 4242 4242 4242   12/34   123', 'Mina Kim', 'South Korea'][i]}</div>
              </div>
            ))}
            <button type="button" style={{ width: '100%', border: 0, borderRadius: 6, padding: '12px', background: '#0570de', color: '#fff', fontWeight: 600, fontSize: 16 }}>Subscribe</button>
          </div>
        </div>
      );
    case 'live':
      return (
        <Page>
          <MessageView title={t.liveTitle('starcatcher.com')} body={t.liveBody} primaryLabel={t.openIt} onPrimary={noop} secondaryLabel={t.done} onSecondary={noop} celebrate />
        </Page>
      );
    case 'connect-enter':
      return (
        <Page>
          <ConnectView t={t} hostname="starcatcher.games" onHostname={noop} onConnect={noop} stage="enter" providerName={null} providerSteps={[]} domainConnectUrl={null} records={[]} status="waiting" onCheck={noop} ask={<AskStandIn label={t.askHelp} />} />
        </Page>
      );
    case 'connect-dc':
      return (
        <Page>
          <ConnectView t={t} hostname="starcatcher.games" onHostname={noop} onConnect={noop} stage="setup" providerName="Cloudflare" providerSteps={[]} domainConnectUrl="#approve-at-cloudflare" records={RECORDS} status="waiting" onCheck={noop} ask={<AskStandIn label={t.askHelp} />} showRecords={params.get('advanced') === '1'} />
        </Page>
      );
    case 'connect-steps':
      return (
        <Page>
          <ConnectView t={t} hostname="starcatcher.games" onHostname={noop} onConnect={noop} stage="setup" providerName="Namecheap" providerSteps={NAMECHEAP_STEPS} domainConnectUrl={null} records={RECORDS} status={(params.get('status') as any) || 'waiting'} onCheck={noop} ask={<AskStandIn label={t.askHelp} />} />
        </Page>
      );
    case 'signin':
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
          <SignInCardView app={{ title: 'The Adventure of a Red Square', ownerUsername: 'mikey', thumbnailUrl: null }} host="the-adventure-of-a-red-square.lumine.app" originAllowed error="" userId={1} username="lily" busy={false} allow={noop} handBack={noop} onOpenSigninModal={noop} />
        </LiteHostProviders>
      );
    case 'signin-new':
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
        <SignInCardView app={{ title: 'The Adventure of a Red Square', ownerUsername: 'mikey', thumbnailUrl: null }} host="the-adventure-of-a-red-square.lumine.app" originAllowed error="" userId={null} username={null} busy={false} allow={noop} handBack={noop} onOpenSigninModal={noop} onCreateAccount={() => { window.location.search = window.location.search.replace('signin-new', 'signup'); }} />
        </LiteHostProviders>
      );
    case 'signup': {
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
          <SignInCardView
            app={{ title: 'The Adventure of a Red Square', ownerUsername: 'mikey', thumbnailUrl: null }}
            host="the-adventure-of-a-red-square.lumine.app"
            originAllowed
            error=""
            userId={null}
            username={null}
            busy={false}
            allow={noop}
            handBack={noop}
            onOpenSigninModal={noop}
            signUp={<AppSignUp buildId={2} origin="https://the-adventure-of-a-red-square.lumine.app" appTitle="The Adventure of a Red Square" lang={signInLang()} t={SIGNIN_TEXT[signInLang()]} onBack={noop} onCreated={() => { document.body.dataset.created = '1'; }} />}
          />
        </LiteHostProviders>
      );
    }
    case 'account-app':
    case 'account-both':
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
          <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(#5aa9e6, #9fd7ff 60%, #6bbf59 60%)' }} />
          <AppAccountSheet
            config={{ ...SITE_CONFIG, apiOrigin: '', siteOrigin: 'https://www.twin-kle.com' } as any}
            t={LITE_HOST_TEXT[lang]}
            lang={lang}
            session={{ post: async () => ({ token: 'a_preview.preview', expiresAt: Math.floor(Date.now() / 1000) + 86400 }), signInAppAccount: async () => null, signUpAppAccount: async () => null, signIn: async () => null } as any}
            twinkleToo={screen === 'account-both'}
            onClose={noop}
          />
        </LiteHostProviders>
      );
    case 'link':
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
        <SignInCardView app={{ title: 'Star Catcher', ownerUsername: 'mikey', thumbnailUrl: null }} host="star-catcher.lumine.app" originAllowed error="" userId={1} username="lily" busy={false} allow={noop} handBack={noop} onOpenSigninModal={noop} link />
        </LiteHostProviders>
      );
    case 'players':
      return (
        <LiteHostProviders
          requestHelpers={{
            loadAppPlayers: async () => ({
              accountMode: 'both',
              players: [
                { id: 4, kind: 'app', name: 'speedy_sam', linkedTo: null, createdAt: 1764000000, lastSeenAt: 1764050000, disabled: false, guardianApproved: true },
                { id: 3, kind: 'app', name: 'nova7', linkedTo: 'nova_builds', createdAt: 1763900000, lastSeenAt: 1764040000, disabled: false, guardianApproved: false },
                { id: 2, kind: 'twinkle', name: 'lily', linkedTo: null, createdAt: 1763800000, lastSeenAt: 1764030000, disabled: false, guardianApproved: false },
                { id: 1, kind: 'app', name: 'trollface', linkedTo: null, createdAt: 1763700000, lastSeenAt: 1763710000, disabled: true, guardianApproved: false }
              ]
            }),
            setAppAccountMode: async ({ mode }: any) => ({ accountMode: mode }),
            setAppPlayerDisabled: async ({ disabled }: any) => ({ disabled })
          }}
          viewer={null}
          onOpenSignin={noop}
        >
          <Page>
            <AppPlayers buildId={2} lang={lang} initialMode="both" />
          </Page>
        </LiteHostProviders>
      );
    case 'menu':
      return <BadgeMenu />;
    case 'host-sheet':
    case 'host-hint':
      return <HostSheet hint={screen === 'host-hint'} />;
    default:
      return <Page>Unknown screen</Page>;
  }
}

// The lite host's own sheet and guest bar over a stand-in game.
function HostSheet({ hint }: { hint: boolean }) {
  React.useEffect(() => {
    const t = LITE_HOST_TEXT[lang];
    if (hint) showGuestHint({ t, onSignIn: () => {} });
    else void askSignIn({ config: SITE_CONFIG, t, session: { signIn: async () => null } as any });
  }, [hint]);
  return <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(#5aa9e6, #9fd7ff 60%, #6bbf59 60%)' }} />;
}

// The ✦ badge and its menu over a game (the shoot script paints the game).
function BadgeMenu() {
  React.useEffect(() => {
    const signed = params.get('signed') === '1';
    const kind = params.get('kind') || 'twinkle';
    const fakeSession: any = {
      get: () =>
        signed
          ? { user: { id: 5, username: kind === 'app' ? 'speedy_sam' : 'lily' }, appPlayer: { id: 3, kind: kind === 'app' ? 'app' : 'twinkle', linked: false } }
          : null,
      signIn: async () => null,
      signOut: async () => {}
    };
    const config = {
      ...SITE_CONFIG,
      thumbnailUrl: params.get('thumb') || null,
      owner: { id: 1, username: 'mikey' }
    };
    const badge = mountBadge({
      config,
      t: LITE_HOST_TEXT[lang],
      session: fakeSession,
      onReport: () => {}
    });
    if (params.get('open') !== '0') window.setTimeout(() => badge.click(), 50);
  }, []);
  return null;
}

const RECORDS = [
  { type: 'ALIAS', host: '@', fullName: 'starcatcher.games', value: 'connect.lumine.app', note: null },
  { type: 'TXT', host: '_lumine-verify', fullName: '_lumine-verify.starcatcher.games', value: 'lumine-verify=8f3c1a9b2d7e4f60a1b2c3d4e5f60718', note: null }
];
const NAMECHEAP_STEPS = [
  'Sign in to Namecheap and open Domain List.',
  'Next to your domain, tap Manage, then the Advanced DNS tab.',
  'Tap Add New Record for each record below (for the first one pick “ALIAS Record”).',
  'Tap the green check to save each one.'
];

document.documentElement.lang = lang;
// the website's 10px root (src/styles.css), which the sign-up steps' shared
// styles are sized for
if (['signup', 'signin-new', 'account-app', 'account-both', 'players'].includes(screen)) {
  document.documentElement.style.fontSize = '10px';
}
createRoot(document.getElementById('root')!).render(<Harness />);
