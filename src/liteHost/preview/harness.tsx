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
  AddressMenuView,
  ConnectView,
  FindView,
  IntroView,
  MessageView,
  LiveView,
  OrderStatusView,
  OwnerDetailsView,
  ParentRequestView,
  emptyOwnerDetails,
  type DomainIdeaView,
  type OwnerDetails
} from '~/components/Build/AppAddress/views';
import ParentConsentView from '~/containers/DomainParentConsent/ParentConsentView';
import SignInCardView from '~/containers/LumineAppSignIn/SignInCardView';
import { MemoryRouter } from 'react-router-dom';
import WandCard from '~/components/SponsoredHelp/WandCard';
import { AppContext } from '~/contexts/AppContext';
import { KeyContext } from '~/contexts/KeyContext';
import { ChatContext } from '~/contexts/Chat';
import type { SponsoredHelpCardView, SponsoredHelpObjectiveView } from '~/helpers/sponsoredHelp';
import AppSignUp from '~/containers/LumineAppSignIn/AppSignUp';
import { SIGNIN_TEXT, signInLang } from '~/containers/LumineAppSignIn/text';
import { LiteHostProviders } from '../react/LiteHost';
import { askSignIn, mountBadge, showAiBanner, showGuestHint } from '../ui';
import { LITE_HOST_TEXT } from '../text';
import AppAccountSheet from '../react/AppAccountSheet';
import AppPlayers from '~/components/Build/AppAddress/AppPlayers';
import { draftFromPhone, type PhoneDraft } from '~/components/Build/AppAddress/checkout/phone';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGlobe } from '@fortawesome/pro-solid-svg-icons/faGlobe';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import { faExternalLinkAlt } from '@fortawesome/pro-solid-svg-icons/faExternalLinkAlt';
import { faCopy } from '@fortawesome/pro-solid-svg-icons/faCopy';
import { faShare } from '@fortawesome/pro-solid-svg-icons/faShare';
import { faPencilAlt } from '@fortawesome/pro-solid-svg-icons/faPencilAlt';
import { faTrashAlt } from '@fortawesome/pro-solid-svg-icons/faTrashAlt';
import { faUsers } from '@fortawesome/pro-solid-svg-icons/faUsers';
import { faClock } from '@fortawesome/pro-solid-svg-icons/faClock';
import '../host.css';

// Stand-ins for the requests the sign-up window makes (nothing leaves the page).
const FAKE_REQUESTS: any = {
  loadAppSignupPass: async () => ({ token: 'a_preview.preview', expiresAt: Math.floor(Date.now() / 1000) + 86400 }),
  signupFromApp: async () => ({ id: 1, username: 'lily' }),
  requestGuardianConsent: async ({ guardianEmail }: any) => ({ consentId: 1, secret: 's', guardianEmail, expiresAt: 0 }),
  getGuardianConsentStatus: async () => ({ status: params.get('consent') || 'pending', expiresAt: 0 })
};
const RED_SQUARE_THUMB = 'https://d3jvoamd2k4p0s.cloudfront.net/thumbs/builds/5/2/9522c935-6f41-4c67-abd5-e745e7ee2eca.png';
const SITE_CONFIG: any = { buildId: 2, title: 'The Adventure of a Red Square', owner: { id: 1, username: 'mikey' }, thumbnailUrl: RED_SQUARE_THUMB, siteOrigin: 'https://www.twin-kle.com' };

// The icons the website's header chips and menus use (main.tsx registers
// them for the website; this entry point has its own registration).
library.add(faGlobe, faChevronDown, faExternalLinkAlt, faCopy, faShare, faPencilAlt, faTrashAlt, faUsers, faClock);

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
            <AddressMenuView t={t} primaryUrl={params.get('domain') ? `https://${params.get('domain')}/` : 'https://star-catcher.lumine.app/'} freeUrl="https://star-catcher.lumine.app/" domains={params.get('domain') ? [params.get('domain')!] : []} canGetOwn copied={false} onCopy={noop} onShare={noop} onGetOwn={noop} onRename={noop} />
          </AppPageHeader>
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
          <FindView t={t} freeHost="star-catcher.lumine.app" query={query} ideas={IDEAS} loading={false} openBreakdownFor={params.get('open') || undefined} onQuery={setQuery} onSearch={noop} onBuy={noop} onUseOwn={noop} onMoreIdeas={noop} ask={<AskStandIn label={t.askIdeas('Zero')} />} showAdvanced={params.get('advanced') === '1'} />
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
          <MessageView t={t} title={t.sentTitle} tip={t.tipSent} body={t.sentBody('starcatcher.com')} primaryLabel={t.done} onPrimary={noop} />
        </Page>
      );
    case 'parent-consent':
      return (
        <Page>
          <ParentConsentView
            order={{ domain: 'starcatcher.com', appTitle: 'Star Catcher', childUsername: 'mikey', priceCents: 1399, breakdown: IDEAS[0].breakdown, approxKrw: 20000, status: 'awaiting_parent' }}
            mode={(params.get('mode') as any) || 'ko'}
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
          <LiveView t={t} domain="starcatcher.com" onOpen={noop} onShare={noop} onDone={noop} />
        </Page>
      );
    case 'wand-sent':
    case 'wand-plan':
    case 'wand-done':
      return (
        <Page>
          <WandHarness stage={screen.slice(5)} />
        </Page>
      );
    case 'wand-plan-zero':
      return (
        <Page>
          <WandHarness stage="plan" place="assistant" />
        </Page>
      );
    case 'owner':
    case 'owner-filled':
      return (
        <Page>
          <OwnerHarness filled={screen === 'owner-filled'} />
        </Page>
      );
    case 'order-setting-up':
    case 'order-registered':
    case 'order-live':
    case 'order-refunded':
    case 'order-not-paid': {
      const status = { 'order-setting-up': 'registering', 'order-registered': 'registered', 'order-live': 'live', 'order-refunded': 'refunded', 'order-not-paid': 'cancelled' }[screen]!;
      const stage = ({ registering: 'setting_up', registered: 'setting_up', live: 'live', refunded: 'refunded', cancelled: 'stopped' } as const)[status as 'live'];
      return (
        <Page>
          <OrderStatusView t={t} order={{ domain: 'redsquaregame.com', priceCents: 1399, status, stage, failureReason: screen === 'order-refunded' ? 'taken' : null }} onOpen={noop} onTryAgain={noop} onClose={noop} />
        </Page>
      );
    }
    case 'connect-enter':
      return (
        <Page>
          <ConnectView t={t} hostname="starcatcher.games" onHostname={noop} onConnect={noop} stage="enter" providerName={null} providerSteps={[]} domainConnectUrl={null} records={[]} status="waiting" onCheck={noop} ask={<AskStandIn label={t.askHelp('Zero')} />} />
        </Page>
      );
    case 'connect-dc':
      return (
        <Page>
          <ConnectView t={t} hostname="starcatcher.games" onHostname={noop} onConnect={noop} stage="setup" providerName="Cloudflare" providerSteps={[]} domainConnectUrl="#approve-at-cloudflare" records={RECORDS} status="waiting" onCheck={noop} ask={<AskStandIn label={t.askHelp('Zero')} />} showRecords={params.get('advanced') === '1'} />
        </Page>
      );
    case 'connect-steps':
      return (
        <Page>
          <ConnectView t={t} hostname="starcatcher.games" onHostname={noop} onConnect={noop} stage="setup" providerName="Namecheap" providerSteps={NAMECHEAP_STEPS} domainConnectUrl={null} records={RECORDS} status={(params.get('status') as any) || 'waiting'} onCheck={noop} ask={<AskStandIn label={t.askHelp('Zero')} />} />
        </Page>
      );
    case 'signin':
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
          <SignInCardView app={{ title: 'The Adventure of a Red Square', ownerUsername: 'mikey', thumbnailUrl: RED_SQUARE_THUMB }} host="red-square.lumine.app" originAllowed error="" userId={1} username="lily" busy={false} allow={noop} handBack={noop} onOpenSigninModal={noop} />
        </LiteHostProviders>
      );
    case 'signin-new':
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
        <SignInCardView app={{ title: 'The Adventure of a Red Square', ownerUsername: 'mikey', thumbnailUrl: RED_SQUARE_THUMB }} host="red-square.lumine.app" originAllowed error="" userId={null} username={null} busy={false} allow={noop} handBack={noop} onOpenSigninModal={noop} onCreateAccount={() => { window.location.search = window.location.search.replace('signin-new', 'signup'); }} />
        </LiteHostProviders>
      );
    case 'signup': {
      return (
        <LiteHostProviders requestHelpers={FAKE_REQUESTS} viewer={null} onOpenSignin={noop}>
          <SignInCardView
            app={{ title: 'The Adventure of a Red Square', ownerUsername: 'mikey', thumbnailUrl: RED_SQUARE_THUMB }}
            host="red-square.lumine.app"
            originAllowed
            error=""
            userId={null}
            username={null}
            busy={false}
            allow={noop}
            handBack={noop}
            onOpenSigninModal={noop}
            signUp={<AppSignUp buildId={2} origin="https://red-square.lumine.app" appTitle="The Adventure of a Red Square" lang={signInLang()} t={SIGNIN_TEXT[signInLang()]} onBack={noop} onCreated={() => { document.body.dataset.created = '1'; }} />}
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
              accountMode: params.get('mode') || 'both',
              usesAi: params.get('ai') === '1',
              players: [
                { id: 4, kind: 'app', name: 'speedy_sam', linkedTo: null, createdAt: 1764000000, lastSeenAt: 1764050000, disabled: false, guardianApproved: true },
                { id: 3, kind: 'app', name: 'nova7', linkedTo: 'nova_builds', createdAt: 1763900000, lastSeenAt: 1764040000, disabled: false, guardianApproved: false },
                { id: 2, kind: 'twinkle', name: 'lily', linkedTo: null, createdAt: 1763800000, lastSeenAt: 1764030000, disabled: false, guardianApproved: false },
                { id: 1, kind: 'app', name: 'trollface', linkedTo: null, createdAt: 1763700000, lastSeenAt: 1763710000, disabled: true, guardianApproved: false }
              ],
              makerAi: {
                settings: { on: true, dailyCoins: 20000, playerDailyCoins: 2000 },
                today: { dayKey: '2026-11-26', coins: 3417, players: { 4: { coins: 1830, requests: 6 } } }
              }
            }),
            setMakerAi: async (input: any) => ({ settings: { on: input.on, dailyCoins: input.dailyCoins, playerDailyCoins: input.playerDailyCoins }, today: { coins: 3417, players: {} } }),
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
      thumbnailUrl: params.get('thumb') === '0' ? null : RED_SQUARE_THUMB,
      owner: { id: 1, username: 'mikey' }
    };
    const badge = mountBadge({
      config,
      t: LITE_HOST_TEXT[lang],
      session: fakeSession,
      onReport: () => {},
      onSignIn: () => {},
      playerKindLabel: () => {
        const t = LITE_HOST_TEXT[lang];
        if (!signed) return null;
        return kind === 'app' ? t.kindApp : kind === 'linked' ? t.kindLinked : t.kindMember;
      },
      extraItems: () => {
        const t = LITE_HOST_TEXT[lang];
        if (!signed || (kind !== 'app' && kind !== 'linked')) return [];
        const email = { iconName: 'mail' as const, label: t.menuResetEmail, sub: t.menuResetEmailSub, onClick: () => {} };
        return kind === 'linked'
          ? [email, { iconName: 'unlink' as const, label: t.unlinkTwinkle, sub: t.unlinkTwinkleSub, onClick: () => {} }]
          : [email, { iconName: 'link' as const, label: t.linkTwinkle, sub: t.linkTwinkleSub, onClick: () => {} }];
      }
    });
    if (params.get('open') !== '0') window.setTimeout(() => badge.click(), 50);
    // ?ai=1: the AI banner a guest (or an app-only player) sees
    if (params.get('ai') === '1') {
      const t = LITE_HOST_TEXT[lang];
      const note = params.get('note') === '1'; // an app on its own accounts only
      showAiBanner({
        t,
        buildId: 2,
        cta: note ? null : signed && kind === 'app' ? t.aiBannerLinkCta : t.aiBannerCta,
        text: note ? t.aiUnavailableHere : undefined,
        force: true,
        onAction: () => {}
      });
    }
  }, []);
  return null;
}

const RECORDS = [
  { type: 'ALIAS', host: '@', fullName: 'starcatcher.games', value: 'connect.lumine.app', note: null },
  { type: 'TXT', host: '_lumine-verify', fullName: '_lumine-verify.starcatcher.games', value: 'lumine-verify=8f3c1a9b2d7e4f60a1b2c3d4e5f60718', note: null },
  { type: 'TXT', host: '_cf-challenge', fullName: '_cf-challenge.starcatcher.games', value: 'd242u2zbv0mtzc.cloudfront.net', note: 'Lets our web host make the secure (https) certificate for your main address.' }
];
const RED_SQUARE: DomainIdeaView = { domain: 'redsquaregame.com', priceCents: 1399, breakdown: { registryCents: 1121, cardFeeCents: 92, twinkleCents: 186 }, approxKrw: 20000 };
const FILLED_OWNER: OwnerDetails = { firstName: 'Mikey', lastName: 'Lee', email: 'mikey@example.com', phone: '+82 10 1234 5678', address1: '1 Sejong-daero, Jung-gu', city: 'Seoul', state: 'Seoul', zip: '04524', country: 'KR' };

// The wand card Mikey sends ("get a domain for my app"), as the member sees
// it in chat: waiting, Zero's plan to confirm, and done (the real WandCard,
// with request stubs).
const LILY = 42;
function wandCard(stage: string): SponsoredHelpCardView {
  const steps = [
    { action: 'start_chat_session' as const, opening_message: 'Help me pick a good web address for my game The Adventure of a Red Square' },
    { action: 'open_app_address' as const, build_id: 2, screen: 'buy' as const, domain: 'redsquaregame.com' }
  ];
  const objective: SponsoredHelpObjectiveView = {
    index: 0,
    text: 'Help you get your own .com for The Adventure of a Red Square',
    requestId: 901,
    status: stage === 'sent' ? 'sent' : stage === 'plan' ? 'awaiting_confirm' : 'completed',
    state: stage === 'sent' ? 'pending' : stage === 'plan' ? 'deciding' : 'done',
    energyPercent: 8,
    attempts: stage === 'sent' ? 0 : 1,
    isAgain: false,
    ...(stage !== 'sent'
      ? {
          summary:
            'mikey asked me to help you get your own web address. First we’ll pick a name together in this chat, and I’ll check real prices. Then I’ll open the buy screen for redsquaregame.com on your app. Other sites like Cloudflare are often cheaper, and you type your own details and pay yourself.',
          steps,
          cannotDo: [],
          planHash: 'x',
          planRevision: 1,
          changesLeft: 2
        }
      : {}),
    ...(stage === 'done'
      ? { result: { path: '/app/2?appAddress=buy&domain=redsquaregame.com', appAddress: { buildId: 2, title: 'The Adventure of a Red Square', screen: 'buy', domain: 'redsquaregame.com' } } }
      : {})
  };
  return {
    cardId: 77,
    surface: 'dm',
    persona: 'zero',
    senderId: 5,
    senderUsername: 'mikey',
    recipientId: LILY,
    recipientUsername: 'lily',
    createdAt: Math.floor(Date.now() / 1000) - 600,
    expiresAt: Math.floor(Date.now() / 1000) + 6 * 86400,
    energyPercent: 8,
    objectives: [objective],
    viewer: 'recipient'
  };
}

function WandHarness({ stage, place = 'dm' }: { stage: string; place?: 'dm' | 'assistant' }) {
  const card = wandCard(stage);
  const stub = async () => ({ card });
  const appValue = React.useMemo(
    () => ({
      user: { state: {}, actions: {} },
      requestHelpers: new Proxy({}, { get: () => stub })
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage]
  );
  return (
    <MemoryRouter>
      <AppContext.Provider value={appValue}>
        <KeyContext.Provider value={{ myState: { userId: LILY, username: 'lily' }, theme: {}, helpers: {} } as any}>
          <ChatContext.Provider value={{ state: { zeroChannelId: 0, cielChannelId: 0 }, actions: {} } as any}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 16, boxShadow: '0 6px 24px rgba(20,20,40,0.06)' }}>
            <div style={{ color: '#5d5d6e', fontSize: 14, marginBottom: 8 }}>{place === 'dm' ? 'Chat with mikey' : 'Chat with Zero'}</div>
            {place === 'dm' && (
              <div style={{ background: '#f1f1f6', borderRadius: 14, padding: '10px 12px', marginBottom: 12, maxWidth: 420 }}>
                Here you go: press it and Zero will help you get your own web address for your game.
              </div>
            )}
            <WandCard card={card} place={place} />
          </div>
          </ChatContext.Provider>
        </KeyContext.Provider>
      </AppContext.Provider>
    </MemoryRouter>
  );
}

function OwnerHarness({ filled }: { filled: boolean }) {
  const [details, setDetails] = useState<OwnerDetails>(filled ? FILLED_OWNER : emptyOwnerDetails('KR'));
  const [agreed, setAgreed] = useState(filled);
  const [phone, setPhone] = useState<PhoneDraft>(() => draftFromPhone(details.phone, 'KR'));
  return <OwnerDetailsView t={t} idea={RED_SQUARE} details={details} phoneDraft={phone} onPhoneDraft={setPhone} agreed={agreed} renews={false} busy={false} problem="" onDetails={setDetails} onAgree={setAgreed} onPay={() => {}} onBack={() => {}} startPage={filled ? 3 : 0} />;
}
const NAMECHEAP_STEPS = [
  'Sign in to Namecheap and open Domain List.',
  'Next to your domain, tap Manage, then the Advanced DNS tab.',
  'Tap Add New Record for each record below (for the first one pick “ALIAS Record”).',
  'Tap the green check to save each one.'
];

document.documentElement.lang = lang;
// the website's 10px root (src/styles.css), which the sign-up steps' shared
// styles are sized for
// twin-kle.com's own global styles for the website's components (the
// owner's Players modal is drawn on twin-kle.com, not on the lite host):
// box-sizing, the root size and the --px design unit, as in production
const WEBSITE_SCREENS = ['signup', 'signin-new', 'account-app', 'account-both', 'players'];
const render = () => createRoot(document.getElementById('root')!).render(<Harness />);
if (WEBSITE_SCREENS.includes(screen)) {
  document.documentElement.style.fontSize = '10px';
  void import('~/styles.css').then(render, render);
} else {
  render();
}
