import type { SharedPromptStat } from '~/components/SharedPromptBlock';
import type { MyTopic } from './types';

// One stat set for every place a prompt's counts are shown.
export function getPromptStats({
  topic,
  onOpen
}: {
  topic: MyTopic;
  onOpen?: (topicId: number) => void;
}): SharedPromptStat[] {
  return [
    {
      label: Number(topic.cloneCount) === 1 ? 'clone' : 'clones',
      value: topic.cloneCount || 0
    },
    {
      label: Number(topic.messageCount) === 1 ? 'message' : 'messages',
      value: topic.messageCount || 0
    },
    {
      icon: 'comment',
      label: Number(topic.numComments) === 1 ? 'comment' : 'comments',
      ...(onOpen ? { onClick: () => onOpen(topic.id) } : {}),
      value: topic.numComments || 0
    }
  ];
}
