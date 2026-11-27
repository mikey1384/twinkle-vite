// Coins on a Lumine app's own address. The shared bridge (useHostBridge +
// helpers/buildRuntimeCoins.ts) quotes the server, opens Twinkle's own Coins
// box (useHostConfirmations) and only then sends the spend. Here the spend
// also needs the server's record of that tap: right after the box returns
// confirmed, the host asks POST /build/:id/app-session/coin-confirmation for
// a one-time nonce bound to the exact operation and body, and sends the spend
// with it (x-lumine-coin-confirmation). A spend with no fresh confirmation
// from this page's own box is never sent.
import { coinRequestError } from '~/containers/Build/PreviewPanel/helpers/buildRuntimeCoins';
import type { CoinConfirmRequest } from '~/components/Build/Coins/coinConfirmText';

// twinkle-api controllers/build/services/coinOperations.ts COIN_WRITE_OPERATIONS
export const LITE_COIN_WRITE_OPERATIONS: ReadonlySet<string> = new Set([
  'charge',
  'make-offer',
  'respond-offer',
  'takeover',
  'withdraw-offer'
]);

export const CUSTOM_DOMAIN_COINS_UNAVAILABLE_CODE =
  'coins_unavailable_on_custom_domain';
export const CUSTOM_DOMAIN_COINS_UNAVAILABLE_MESSAGE =
  'Spending Coins isn’t available on a custom domain. Open this app on Twinkle to spend Coins.';

// Custom-domain sessions intentionally omit `coins:charge` (appSession.ts).
// Refuse spend bridge requests before opening Twinkle's Coins confirmation box
// so players never confirm a spend that the server will reject (audit G13).
export function isCustomDomainCoinSpendBlocked(
  messageType: string,
  surface: 'address' | 'domain' | null | undefined
) {
  if (surface !== 'domain') return false;
  if (!String(messageType || '').startsWith('coins:')) return false;
  return LITE_COIN_WRITE_OPERATIONS.has(String(messageType).slice('coins:'.length));
}

// The spend follows the box at once (buildRuntimeCoins.ts); a confirmation
// older than this is never used.
export const LITE_COIN_CONFIRM_WINDOW_MS = 60_000;

export interface LiteCoinRequestArgs {
  buildId: number;
  operation: string;
  payload: unknown;
  [key: string]: unknown;
}

export function createLiteCoinGate({
  createConfirmation,
  now = Date.now
}: {
  createConfirmation: (input: {
    buildId: number;
    operation: string;
    payload: unknown;
  }) => Promise<{ nonce: string }>;
  now?: () => number;
}) {
  let confirmedAt = 0;
  return {
    wrapConfirm(
      inner: () => ((request: CoinConfirmRequest) => Promise<boolean>) | null
    ) {
      return async (request: CoinConfirmRequest) => {
        confirmedAt = 0;
        const confirm = inner();
        if (!confirm) return false;
        const confirmed = await confirm(request);
        if (confirmed) confirmedAt = now();
        return confirmed;
      };
    },
    wrapRequest(base: () => (args: any) => Promise<any>) {
      return async (args: LiteCoinRequestArgs) => {
        if (!LITE_COIN_WRITE_OPERATIONS.has(String(args?.operation))) {
          return base()(args);
        }
        const fresh =
          confirmedAt > 0 && now() - confirmedAt < LITE_COIN_CONFIRM_WINDOW_MS;
        // One box, one spend.
        confirmedAt = 0;
        if (!fresh) {
          throw coinRequestError(
            'The player did not confirm.',
            'build_coin_cancelled'
          );
        }
        const { nonce } = await createConfirmation({
          buildId: args.buildId,
          operation: args.operation,
          payload: args.payload ?? {}
        });
        if (!nonce) {
          throw coinRequestError(
            'Coins confirmation is unavailable.',
            'build_coin_confirmation_unavailable'
          );
        }
        return base()({ ...args, coinConfirmation: nonce });
      };
    }
  };
}
