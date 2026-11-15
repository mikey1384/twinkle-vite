import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import {
  chatTopicActionStyle,
  chatTopicActionsClass,
  chatTopicMetadataClass,
  chatTopicRowClass,
  chatTopicTitleClass
} from '~/containers/Chat/Modals/topicStyles';
import type { AIImageCollection } from '~/helpers/aiImageHistory';
import CollectionThumbs from './CollectionThumbs';

// One collection in the list, laid out like a Zero/Ciel topic row
// (TopicSelectorModal/TopicItem): "Current:" on the one in use, Settings
// (sliders) and Use (arrow) on the right.
export default function CollectionRow({
  collection,
  isCurrent,
  onSettings,
  onUse
}: {
  collection: AIImageCollection;
  isCurrent: boolean;
  onSettings: () => void;
  onUse: () => void;
}) {
  const count = collection.images.length;
  return (
    <article data-current={isCurrent} className={chatTopicRowClass}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
      >
        <CollectionThumbs images={collection.images} size={44} />
        <div style={{ minWidth: 0 }}>
          {isCurrent && (
            <b style={{ fontSize: 'calc(14 * var(--px))', color: '#334155' }}>
              Current:{' '}
            </b>
          )}
          <span className={chatTopicTitleClass}>{collection.name}</span>
          <div className={chatTopicMetadataClass}>
            <span>
              {count} {count === 1 ? 'picture' : 'pictures'}
            </span>
            {collection.note && (
              <small
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 'calc(260 * var(--px))'
                }}
              >
                {collection.note}
              </small>
            )}
          </div>
        </div>
      </div>
      <div className={chatTopicActionsClass}>
        <Button
          aria-label="Collection settings"
          color="darkerGray"
          style={chatTopicActionStyle}
          variant="ghost"
          onClick={onSettings}
        >
          <Icon icon="sliders-h" />
          {isCurrent && <span style={{ marginLeft: '0.7rem' }}>Settings</span>}
        </Button>
        {!isCurrent && (
          <Button
            aria-label={`Use ${collection.name}`}
            color="darkerGray"
            style={chatTopicActionStyle}
            variant="ghost"
            onClick={onUse}
          >
            <Icon icon="arrow-right" />
            <span style={{ marginLeft: '0.4rem' }}>Use</span>
          </Button>
        )}
      </div>
    </article>
  );
}
