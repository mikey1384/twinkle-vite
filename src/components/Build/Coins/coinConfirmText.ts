// Words of the website's own Coins confirmation box (Twinkle.coins). Built
// from the server's quote and kept plain for kids: what you get, what it
// costs, where the Coins go. appTitle is the app's name as approved with its
// prices (the server's snapshot), shown in fixed wording and set apart in
// quotes, never leading the box. The item key is the one piece of text the
// app chooses (e.g. "main:12:-4"), so it never appears in the bold first line
// or the title: it gets its own muted line, marked as coming from the app and
// cut to COIN_KEY_SHOWN_CHARS (round-2 review N8).

export interface CoinQuoteBuilder {
  userId: number;
  username?: string | null;
  units: number;
  coins: number;
}
export type CoinConfirmRequest =
  | {
      kind: 'charge';
      appTitle: string;
      title: string;
      key?: string | null;
      coins: number;
      priceCoins: number;
      destination: 'removed' | 'owner';
      ownerName?: string | null;
      builders: CoinQuoteBuilder[];
      balance: number;
      preview?: boolean;
    }
  | {
      kind: 'offer';
      appTitle: string;
      title: string;
      key: string;
      coins: number;
      holderName?: string | null;
      balance: number;
      // The offer rule's days from the server (COIN_OFFER_RULE); lapseAfterDays
      // null when offers never lapse.
      takeoverAfterDays?: number;
      lapseAfterDays?: number | null;
      reofferCooldownDays?: number;
    }
  | {
      kind: 'withdraw';
      appTitle: string;
      title: string;
      key: string;
      coins: number;
      holderName?: string | null;
      reofferCooldownDays?: number;
    }
  | {
      kind: 'keep';
      appTitle: string;
      title: string;
      key: string;
      coins: number;
      offererName?: string | null;
    }
  | {
      kind: 'sell';
      appTitle: string;
      title: string;
      key: string;
      coins: number;
      offererName?: string | null;
    }
  | {
      kind: 'takeover';
      appTitle: string;
      title: string;
      key: string;
      coins: number;
      holderName?: string | null;
      balance: number;
    };

export const COIN_KEY_SHOWN_CHARS = 24;
const n = (value: number) => Number(value || 0).toLocaleString();
// The app's own name for the item, shown apart from Twinkle's words.
export function coinKeyNote(key?: string | null) {
  if (!key) return null;
  const shown = key.length > COIN_KEY_SHOWN_CHARS ? `${key.slice(0, COIN_KEY_SHOWN_CHARS)}…` : key;
  return `Item name from the app: ${shown}`;
}
function nameList(names: string[]) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
function inApp(appTitle: string) {
  return appTitle ? `in the app “${appTitle}”` : 'in this app';
}

// Where the Coins go, in one sentence.
export function coinDestinationSentence(request: Extract<CoinConfirmRequest, { kind: 'charge' }>) {
  const builders = request.builders.filter((builder) => builder.coins > 0);
  const builderNames = nameList(
    builders.length > 1
      ? builders.map((builder) => `${builder.username || 'a player'} (${n(builder.coins)})`)
      : builders.map((builder) => builder.username || 'a player')
  );
  const builderTotal = builders.reduce((sum, builder) => sum + builder.coins, 0);
  const base =
    request.priceCoins <= 0
      ? ''
      : request.destination === 'owner'
        ? `${builders.length ? `${n(request.priceCoins)} Coins go` : 'The Coins go'} to ${request.ownerName || 'the app owner'}, who made this app`
        : `${builders.length ? `${n(request.priceCoins)} Coins are` : 'The Coins are'} removed, so nobody gets them`;
  if (base && builders.length) return `${base}, and ${n(builderTotal)} go to ${builderNames}, who built here.`;
  if (builders.length) return `The Coins go to ${builderNames}, who built here.`;
  return base ? `${base}.` : 'It is free.';
}

export function coinConfirmText(request: CoinConfirmRequest) {
  if (request.kind === 'charge') {
    return {
      title: request.coins > 0 ? `Buy ${request.title}?` : `Get ${request.title}?`,
      lines: [
        `You are about to ${request.coins > 0 ? 'buy' : 'get'} ${request.title} ${inApp(request.appTitle)}.`,
        request.coins > 0
          ? `Price: ${n(request.coins)} Coins. You have ${n(request.balance)}.`
          : 'Price: free.',
        coinDestinationSentence(request),
        ...(request.preview ? ['Preview: nothing will be charged.'] : [])
      ],
      appNote: coinKeyNote(request.key),
      confirmLabel: request.coins > 0 ? `Buy for ${n(request.coins)} Coins` : 'Get it'
    };
  }
  if (request.kind === 'offer') {
    const holder = request.holderName || 'the player who has it';
    const takeover = request.takeoverAfterDays ?? 30;
    // The lapse is one server constant (Mikey is deciding whether to keep it):
    // the box names its days whenever it is on.
    const lapse = request.lapseAfterDays === undefined ? 44 : request.lapseAfterDays;
    return {
      title: `Offer ${n(request.coins)} Coins for ${request.title}?`,
      lines: [
        `${holder} has ${request.title} ${inApp(request.appTitle)}.`,
        `If ${holder} sells, ${n(request.coins)} Coins leave your balance right away and go to ${holder}. You have ${n(request.balance)}.`,
        lapse
          ? `If ${holder} does not answer in ${takeover} days, you can buy it for your ${n(request.coins)} Coins between day ${takeover} and day ${lapse}. After day ${lapse} your offer ends.`
          : `If ${holder} does not answer in ${takeover} days, you can buy it for your ${n(request.coins)} Coins.`,
        `Until you buy, ${holder} can still keep it, even after day ${takeover}. Nothing is taken from you now.`
      ],
      appNote: coinKeyNote(request.key),
      confirmLabel: 'Make offer'
    };
  }
  if (request.kind === 'withdraw') {
    const holder = request.holderName || 'the player who has it';
    const wait = request.reofferCooldownDays ?? 7;
    return {
      title: `Withdraw your offer for ${request.title}?`,
      lines: [
        `You offered ${n(request.coins)} Coins to ${holder} for ${request.title} ${inApp(request.appTitle)}.`,
        `If you withdraw it, the offer ends and its 30-day wait is lost. You cannot offer on it again for ${wait} days.`
      ],
      appNote: coinKeyNote(request.key),
      confirmLabel: 'Withdraw offer'
    };
  }
  if (request.kind === 'keep') {
    const offerer = request.offererName || 'The other player';
    return {
      title: `Keep ${request.title}?`,
      lines: [
        `${offerer} offered ${n(request.coins)} Coins for ${request.title}.`,
        `If you keep it, nothing changes and ${offerer} cannot offer on it again for 7 days.`
      ],
      appNote: coinKeyNote(request.key),
      confirmLabel: 'Keep it'
    };
  }
  if (request.kind === 'sell') {
    const offerer = request.offererName || 'The other player';
    return {
      title: `Sell ${request.title} for ${n(request.coins)} Coins?`,
      lines: [
        `${offerer} gets ${request.title} and you get ${n(request.coins)} Coins.`,
        'You cannot take this back.'
      ],
      appNote: coinKeyNote(request.key),
      confirmLabel: 'Sell'
    };
  }
  const holder = request.holderName || 'The player who had it';
  return {
    title: `Buy ${request.title} for ${n(request.coins)} Coins?`,
    lines: [
      `${holder} did not answer your offer for 30 days.`,
      `The ${n(request.coins)} Coins go to ${holder}, and ${request.title} becomes yours. You have ${n(request.balance)}.`
    ],
    appNote: coinKeyNote(request.key),
    confirmLabel: `Buy for ${n(request.coins)} Coins`
  };
}
