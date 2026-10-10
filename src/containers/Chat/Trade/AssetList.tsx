import React from 'react';
import AICard from '~/components/AICard';
import AICardPreview from '~/components/AICardPreview';
import Icon from '~/components/Icon';
import TradeBuilds from '~/components/Build/TradeBuilds';
import SelectedGroupItem from '../SelectedGroupItem';
import { useChatContext } from '~/contexts';
import { getAICardDisplayWord } from '~/helpers/aiCardDisplay';
import { assetListClass } from './styles';
import type { TradeBundle } from './types';

export default function AssetList({
  bundle,
  groupObjs,
  onInspectCard,
  onRemove,
  showCoins = true,
  showOwnership = true,
  settled = false,
  cancelled = false
}: {
  bundle: TradeBundle;
  groupObjs: Record<number, any>;
  onInspectCard: (id: number) => void;
  onRemove?: (kind: 'card' | 'group' | 'app', id: number) => void;
  showCoins?: boolean;
  showOwnership?: boolean;
  settled?: boolean;
  cancelled?: boolean;
}) {
  const cardObj = useChatContext((v) => v.state.cardObj);
  return (
    <div className={assetListClass}>
      {showCoins && bundle.coins > 0 && (
        <div className="asset coins">
          <Icon icon="coins" />
          <span>
            {bundle.coins.toLocaleString('en-US')} <small>coins</small>
          </span>
        </div>
      )}
      {bundle.cardIds.map((id) => {
        const card = bundle.cards?.find((card) => card.id === id) ||
          cardObj[id] || { id };
        const name = getAICardDisplayWord(card) || `AI card #${id}`;
        // the same card embed the home feed uses (Mikey 10-10: a card drawn
        // from scratch here looked out of place, and players never see
        // card levels)
        return (
          <div className="asset asset--card" key={`card-${id}`}>
            <AICardPreview
              card={card}
              artwork={<AICard card={card} compact />}
              summoner={card.creator}
              density="target"
              framed={false}
              onClick={() => onInspectCard(id)}
            />
            {onRemove && (
              <div className="asset-actions">
                <button
                  className="remove"
                  aria-label={`Remove card ${name}`}
                  onClick={() => onRemove('card', id)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );
      })}
      {bundle.groupIds.map((id) => {
        const data =
          bundle.groups?.find((group) => group.id === id) || groupObjs[id];
        const group = {
          members: [],
          allMemberIds: [],
          ...data,
          id,
          channelName: data?.channelName || `Group #${id}`
        };
        return (
          <div className="asset" key={`group-${id}`}>
            <div className="asset-heading">
              <b>Group · #{id}</b>
              {onRemove && (
                <button
                  className="remove"
                  aria-label={`Remove group ${group.channelName}`}
                  onClick={() => onRemove('group', id)}
                >
                  Remove
                </button>
              )}
            </div>
            <SelectedGroupItem
              group={group}
              isLink={!onRemove}
              hideRemoveButton
              wrapTitle
              onDeselect={() => onRemove?.('group', id)}
              style={{ width: '100%', marginBottom: 0, border: 0, padding: 0 }}
            />
            {showOwnership && (
              <div className="ownership">
                Group ownership{' '}
                {cancelled
                  ? 'did not transfer'
                  : settled
                    ? 'transferred'
                    : 'transfers'}
              </div>
            )}
          </div>
        );
      })}
      {bundle.builds.map((build) => (
        <div className="asset" key={`app-${build.id}`}>
          <div className="asset-heading">
            <b>Lumine app · #{build.id}</b>
            {onRemove && (
              <button
                className="remove"
                aria-label={`Remove app ${build.title}`}
                onClick={() => onRemove('app', build.id)}
              >
                Remove
              </button>
            )}
          </div>
          <TradeBuilds builds={[build]} embedded />
          {showOwnership && (
            <div className="ownership">
              App ownership{' '}
              {cancelled
                ? 'did not transfer'
                : settled
                  ? 'transferred'
                  : 'transfers'}{' '}
              · workspace included
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
