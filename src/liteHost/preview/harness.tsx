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
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <SignInCardView app={{ title: 'Star Catcher', ownerUsername: 'mikey', thumbnailUrl: null }} host="star-catcher.lumine.app" originAllowed error="" userId={1} username="lily" busy={false} allow={noop} handBack={noop} onOpenSigninModal={noop} />
        </div>
      );
    default:
      return <Page>Unknown screen</Page>;
  }
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
createRoot(document.getElementById('root')!).render(<Harness />);
