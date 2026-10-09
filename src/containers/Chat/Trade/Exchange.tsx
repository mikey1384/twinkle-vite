import React from 'react';
import Icon from '~/components/Icon';
import AssetList from './AssetList';
import { hasTradeAssets, summarizeBundle } from './helpers/terms';
import { exchangeGrid, panelClass } from './styles';
import type { TradeTerms } from './types';

export default function Exchange({
  terms,
  partnerName,
  groupObjs,
  onInspectCard,
  showcase = false,
  gift = false,
  settled = false,
  cancelled = false
}: {
  terms: TradeTerms;
  partnerName: string;
  groupObjs: Record<number, any>;
  onInspectCard: (id: number) => void;
  showcase?: boolean;
  gift?: boolean;
  settled?: boolean;
  cancelled?: boolean;
}) {
  const sides = showcase ? (['give'] as const) : (['give', 'receive'] as const);
  return (
    <div
      className={exchangeGrid}
      style={showcase ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined}
    >
      {sides.map((side) => (
        <section
          key={side}
          className={panelClass}
          data-side={side}
          aria-label={
            showcase
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
                  showcase ? 'eye' : side === 'give' ? 'arrow-up' : 'arrow-down'
                }
              />
            </span>
            <div>
              <h3>
                {showcase
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
                {showcase
                  ? 'Nothing changes owners'
                  : `${side === 'give' ? 'To' : 'From'} ${partnerName}`}
              </div>
            </div>
          </header>
          <div className="inventory">
            {hasTradeAssets(terms[side]) ? (
              <>
                <p
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    margin: '0 0 1rem'
                  }}
                >
                  {summarizeBundle(terms[side])}
                </p>
                <AssetList
                  bundle={terms[side]}
                  groupObjs={groupObjs}
                  onInspectCard={onInspectCard}
                  showOwnership={!showcase}
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
      ))}
    </div>
  );
}
