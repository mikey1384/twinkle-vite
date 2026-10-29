import React from 'react';
import Icon from '~/components/Icon';
import AssetList from './AssetList';
import { hasTradeAssets, summarizeBundle } from './helpers/terms';
import { exchangeGrid, panelClass } from './styles';
import type { TradeBundle, TradeTerms } from './types';

export default function Exchange({
  terms,
  partnerName,
  groupObjs,
  onInspectCard,
  interest,
  showcase = false,
  gift = false,
  settled = false,
  cancelled = false
}: {
  terms: TradeTerms;
  partnerName: string;
  groupObjs: Record<number, any>;
  onInspectCard: (id: number) => void;
  interest?: TradeBundle;
  showcase?: boolean;
  gift?: boolean;
  settled?: boolean;
  cancelled?: boolean;
}) {
  const sides = interest
    ? (['interest'] as const)
    : showcase
      ? (['give'] as const)
      : (['give', 'receive'] as const);
  return (
    <div
      className={exchangeGrid}
      style={
        showcase || interest
          ? { gridTemplateColumns: 'minmax(0, 1fr)' }
          : undefined
      }
    >
      {sides.map((side) => {
        const bundle = side === 'interest' ? interest! : terms[side];
        return (
          <section
            key={side}
            className={panelClass}
            data-side={side}
            aria-label={
              interest
                ? 'Interested in'
                : showcase
                  ? 'Shown items'
                  : side === 'give'
                    ? settled
                      ? 'You gave'
                      : cancelled
                        ? 'You would give'
                        : 'You give'
                    : settled
                      ? 'You received'
                      : cancelled
                        ? 'You would receive'
                        : 'You receive'
            }
          >
            <header>
              <span className="direction">
                <Icon
                  icon={
                    showcase || interest
                      ? 'eye'
                      : side === 'give'
                        ? 'arrow-up'
                        : 'arrow-down'
                  }
                />
              </span>
              <div>
                <h3>
                  {interest
                    ? 'Interested in'
                    : showcase
                      ? 'Shown items'
                      : side === 'give'
                        ? settled
                          ? 'You gave'
                          : cancelled
                            ? 'You would give'
                            : 'You give'
                        : settled
                          ? 'You received'
                          : cancelled
                            ? 'You would receive'
                            : 'You receive'}
                </h3>
                <div className="partner">
                  {interest
                    ? 'No offer has been made'
                    : showcase
                      ? 'Nothing changes owners'
                      : `${side === 'give' ? 'To' : 'From'} ${partnerName}`}
                </div>
              </div>
            </header>
            <div className="inventory">
              {hasTradeAssets(bundle) ? (
                <>
                  <p
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      margin: '0 0 1rem'
                    }}
                  >
                    {summarizeBundle(bundle)}
                  </p>
                  <AssetList
                    bundle={bundle}
                    groupObjs={groupObjs}
                    onInspectCard={onInspectCard}
                    showOwnership={!showcase && !interest}
                    settled={settled}
                    cancelled={cancelled}
                  />
                </>
              ) : (
                <div className="empty">
                  <strong>Nothing</strong>
                  {gift
                    ? 'A gift, with nothing in return.'
                    : 'No coins or items on this side.'}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
