import React from 'react';
import { css } from '@emotion/css';
import OfferEditor from './OfferEditor';
import { exchangeGrid, noticeClass, panelClass } from '../../Trade/styles';
import type { TradeTerms } from '../../Trade/types';

const modesClass = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  padding: 0.5rem;
  margin-bottom: 1.6rem;
  border: 1px solid #e1e7ef;
  border-radius: 1.1rem;
  background: #f3f6fa;
  button {
    text-align: left;
    border: 1px solid transparent;
    border-radius: 0.8rem;
    padding: 1rem 1.1rem;
    background: transparent;
    cursor: pointer;
    color: #61718a;
  }
  button[aria-pressed='true'] {
    background: #fff;
    color: #244b83;
    border-color: #c5d5eb;
    box-shadow: 0 2px 5px #203c6010;
  }
  strong {
    display: block;
    font-size: 1.4rem;
  }
  span {
    display: block;
    margin-top: 0.3rem;
    font-size: 1.1rem;
    line-height: 1.4;
  }
  @media (max-width: 450px) {
    button {
      padding: 0.9rem 0.6rem;
    }
    strong {
      font-size: 1.3rem;
    }
  }
`;

export default function TransactionInitiator({
  terms,
  coinInputs,
  coinErrors,
  balance,
  isCounterPropose,
  selectedOption,
  partner,
  groupObjs,
  onSetSelectedOption,
  onCoinChange,
  onChoose,
  onRemove,
  onSetAICardModalCardId,
  coinExplanation
}: {
  terms: TradeTerms;
  coinInputs: { offer: string; want: string };
  coinErrors: { offer: string; want: string };
  balance: number;
  isCounterPropose: boolean;
  selectedOption: string;
  partner: { id: number; username: string };
  groupObjs: Record<number, any>;
  onSetSelectedOption: (option: string) => void;
  onCoinChange: (type: 'offer' | 'want', value: string) => void;
  onChoose: (type: 'offer' | 'want', kind: 'card' | 'group' | 'app') => void;
  onRemove: (
    type: 'offer' | 'want',
    kind: 'card' | 'group' | 'app',
    id: number
  ) => void;
  onSetAICardModalCardId: (id: number) => void;
  coinExplanation: string;
}) {
  return (
    <div>
      <div className={modesClass} aria-label="Transaction type">
        {[
          ['want', 'Trade', 'Exchange with each other'],
          ['send', 'Give a gift', 'Nothing in return'],
          ['offer', 'Show items', 'You keep everything']
        ].map(([value, title, subtitle]) => (
          <button
            key={value}
            aria-pressed={selectedOption === value}
            onClick={() => onSetSelectedOption(value)}
          >
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </button>
        ))}
      </div>
      {isCounterPropose && selectedOption === 'want' && (
        <p className={noticeClass}>
          <strong>Counteroffer.</strong> Adjust either side, then review your
          new offer. {partner.username} will need to accept it.
        </p>
      )}
      <div
        className={exchangeGrid}
        style={
          selectedOption === 'offer'
            ? { gridTemplateColumns: 'minmax(0, 1fr)' }
            : undefined
        }
      >
        <OfferEditor
          side="give"
          partnerName={partner.username}
          bundle={terms.give}
          balance={balance}
          coinInput={coinInputs.offer}
          coinError={coinErrors.offer}
          showcase={selectedOption === 'offer'}
          groupObjs={groupObjs}
          onCoinChange={(value) => onCoinChange('offer', value)}
          onChoose={(kind) => onChoose('offer', kind)}
          onRemove={(kind, id) => onRemove('offer', kind, id)}
          onInspectCard={onSetAICardModalCardId}
        />
        {selectedOption === 'want' && (
          <OfferEditor
            side="receive"
            partnerName={partner.username}
            bundle={terms.receive}
            coinInput={coinInputs.want}
            coinError={coinErrors.want}
            groupObjs={groupObjs}
            onCoinChange={(value) => onCoinChange('want', value)}
            onChoose={(kind) => onChoose('want', kind)}
            onRemove={(kind, id) => onRemove('want', kind, id)}
            onInspectCard={onSetAICardModalCardId}
          />
        )}
        {selectedOption === 'send' && (
          <section
            className={panelClass}
            data-side="receive"
            aria-label="You receive"
          >
            <header>
              <div>
                <h3>You receive</h3>
                <div className="partner">Nothing in return</div>
              </div>
            </header>
            <div className="inventory">
              <div className="empty">
                <strong>This is a gift</strong>
                {partner.username} receives everything on the other side. Choose
                Trade if you expect something back.
              </div>
            </div>
          </section>
        )}
      </div>
      {coinExplanation && selectedOption === 'want' && (
        <p className={noticeClass}>{coinExplanation}</p>
      )}
      <p className={noticeClass}>
        {selectedOption === 'send'
          ? 'You will review your gift before sending. Gifts transfer immediately after you confirm.'
          : selectedOption === 'offer'
            ? 'Share a showcase to start a conversation. Nothing changes owners.'
            : 'Build an offer with any mix of coins, cards, groups and apps. Nothing moves until your partner accepts.'}
      </p>
    </div>
  );
}
