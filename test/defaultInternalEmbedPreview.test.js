import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const defaultComponentSource = readSource(
  'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/DefaultComponent.tsx'
);
const internalComponentSource = readSource(
  'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/index.tsx'
);
const previewPrimitivesSource = readSource(
  'src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
);

assert.match(defaultComponentSource, /getDefaultEmbedPreviewConfig/);
assert.match(defaultComponentSource, /compact-default-internal-embed__icon/);
assert.match(defaultComponentSource, /compact-default-internal-embed__description/);
assert.match(defaultComponentSource, /height: 100%;/);
assert.match(defaultComponentSource, /min-height: 8\.2rem;/);
assert.doesNotMatch(defaultComponentSource, /min-height: 6\.4rem;/);

assert.match(defaultComponentSource, /missions:[\s\S]*Browse Missions/);
assert.match(defaultComponentSource, /case 'missions':[\s\S]*kicker: 'Missions'/);
assert.match(defaultComponentSource, /case 'ai-cards':[\s\S]*kicker: 'AI Cards'/);
assert.match(
  defaultComponentSource,
  /case 'shared-prompts':[\s\S]*kicker: 'Shared Prompts'/
);
assert.match(
  defaultComponentSource,
  /case 'achievement-unlocks':[\s\S]*kicker: 'Achievements'/
);
assert.match(defaultComponentSource, /case 'app':[\s\S]*case 'builds':/);
assert.match(defaultComponentSource, /case 'comments':[\s\S]*kicker: 'Comments'/);
assert.match(
  defaultComponentSource,
  /case 'ai-stories':[\s\S]*kicker: 'AI Stories'/
);
assert.match(
  defaultComponentSource,
  /case 'daily-reflections':[\s\S]*kicker: 'Daily Reflections'/
);
assert.match(defaultComponentSource, /function getExplorePreviewConfig/);
assert.match(defaultComponentSource, /linkType === 'videos'/);
assert.match(defaultComponentSource, /linkType === 'links'/);
assert.match(defaultComponentSource, /kicker: 'Subjects'/);

assert.match(
  defaultComponentSource,
  /getDescriptionForLinkType\[appliedLinkType]\?\.\(src\) \|\|\s+getGenericTitle\(linkType\)/
);
assert.match(
  internalComponentSource,
  /if \(linkType === 'missions' && contentId\)[\s\S]*<MissionComponent/
);
assert.match(
  internalComponentSource,
  /<DefaultComponent linkType={linkType} src={src} isPreview={isPreview} \/>/
);
assert.match(previewPrimitivesSource, /home-feed-card__rich-embed-internal/);
assert.match(previewPrimitivesSource, /<InternalComponent[\s\S]*isPreview/);

console.log('Default internal embed preview guard passed.');
