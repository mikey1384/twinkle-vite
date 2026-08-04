import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { shouldRenderRichTextLiterally } from '../src/components/Texts/RichText/helpers/renderMode';

test('incomplete rich-text streams stay literal until their terminal snapshot', () => {
  assert.equal(
    shouldRenderRichTextLiterally({
      isStreaming: true,
      tooLongNonUrlToken: false
    }),
    true
  );
  assert.equal(
    shouldRenderRichTextLiterally({
      isStreaming: false,
      tooLongNonUrlToken: false
    }),
    false
  );
});

test('every live rich-text stream declares its streaming boundary', () => {
  const consumerPaths = [
    'src/components/Buttons/ZeroButton/ZeroModal/Rewrite/index.tsx',
    'src/containers/Build/Editor/ChatPanel/AssistantMessage.tsx',
    'src/containers/Chat/Message/MessageBody/TextMessage/index.tsx',
    'src/containers/Home/AIStoriesModal/Game/Reading/ContentContainer/Story.tsx',
    'src/containers/MissionPage/Main/MissionModule/SystemPrompt/Preview.tsx',
    'src/containers/MissionPage/WorkshopPage/PromptWorkshop.tsx'
  ];

  for (const consumerPath of consumerPaths) {
    assert.match(
      readFileSync(consumerPath, 'utf8'),
      /\bisStreaming=/,
      `${consumerPath} must keep incomplete rich text in literal mode`
    );
  }
});
