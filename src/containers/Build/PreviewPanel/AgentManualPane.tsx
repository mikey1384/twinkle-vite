import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import type { BuildCapabilitySnapshot } from '../types/capabilityTypes';
import {
  CURRENT_THREE_VENDOR_PREFIX,
  CURRENT_THREE_VENDOR_VERSION,
  LEGACY_THREE_VENDOR_VERSION
} from '../Editor/helpers/threeVendorUpgrade';
import {
  DEFAULT_PROJECT_FILE_EFFECTIVE_LINE_LIMIT,
  PROJECT_FILE_EFFECTIVE_LINE_MAX_COLUMNS
} from './helpers/projectFileEffectiveLines';
// The platform rules, essential SDK features and the SDK reference below come
// from twinkle-api's buildSdkManifest.json through its generator, the same
// source Lumine's prompt and the Lumine CLI guide read. Never restate SDK
// methods or platform rules by hand in this file: they went stale that way.
import {
  AGENT_MANUAL_SDK,
  type AgentManualSdkNamespace
} from './agentManualSdk.generated';

const previewLayoutBoilerplate = [
  'function subscribePreviewStage(onSize) {',
  '  let frame = 0;',
  '  let lastKey = "";',
  '  function applyLayout(layout) {',
  '    window.cancelAnimationFrame(frame);',
  '    frame = window.requestAnimationFrame(() => {',
  '      const stage = layout.stage || layout.viewport;',
  '      const width = Math.max(1, Math.floor(stage.width));',
  '      const height = Math.max(1, Math.floor(stage.height));',
  '      const key = width + "x" + height;',
  '      if (key === lastKey) return;',
  '      lastKey = key;',
  '      onSize(width, height, layout);',
  '      Twinkle.preview.setPlayfield({ x: 0, y: 0, width, height });',
  '    });',
  '  }',
  '  return Twinkle.preview.subscribe(applyLayout, { immediate: true });',
  '}',
  '',
  '// Three.js example:',
  '// subscribePreviewStage((width, height) => {',
  '//   camera.aspect = width / height;',
  '//   camera.updateProjectionMatrix();',
  '//   renderer.setSize(width, height, false);',
  '//   // When using EffectComposer, also call composer.setSize(width, height).',
  '// });'
].join('\n');

const SDK_METHOD_COUNT = AGENT_MANUAL_SDK.namespaces.reduce(
  (count, namespace) => count + namespace.methods.length,
  0
);
const SDK_REFERENCE_INTRO = `Build SDK ${AGENT_MANUAL_SDK.version} (updated ${AGENT_MANUAL_SDK.updatedAt}): every namespace and method that exists, ${AGENT_MANUAL_SDK.namespaces.length} namespaces and ${SDK_METHOD_COUNT} methods. A Twinkle.* name that is not listed here does not exist. Each entry is the call, what it returns, one line on what it does, and that method's notes: its limits, error codes and the rules for using it. Read a method's notes before you use it.`;

interface AgentManualPaneProps {
  capabilitySnapshot: BuildCapabilitySnapshot | null;
}

interface GuideSection {
  title: string;
  items: string[];
}

// Website-editor guidance only. What an app may call and the rules it must
// follow inside Twinkle's frame are in the generated sections.
const guideSections: GuideSection[] = [
  {
    title: 'Workspace workflow',
    items: [
      'Use the Code tab to edit project files directly. The app preview runs from the saved project files.',
      'Keep /index.html or /index.htm as the entry file. Split CSS and JavaScript into supporting files before a file approaches the server effective-line limit.',
      `The current project-file limit is ${DEFAULT_PROJECT_FILE_EFFECTIVE_LINE_LIMIT} effective lines per file. Long physical lines count as additional effective lines every ${PROJECT_FILE_EFFECTIVE_LINE_MAX_COLUMNS} characters. If save fails for size, split the file and save again.`,
      'Follow the Platform Rules below in every change, and add the Essential SDK Features that apply without being asked.',
      'Use workspace project assets for bundled runtime media. Use Twinkle.files only for viewer-created runtime uploads after the app is running.',
      'Save files before relying on Preview, Publish, or Download zip.'
    ]
  },
  {
    title: 'Workspace project assets',
    items: [
      'Open Manage uploads, use Add generated asset, paste a file name, MIME type when needed, and base64/data URL, then copy the returned asset URL into project code.',
      'Agents that can run parent-page JavaScript may await window.TwinkleBuildAgent.assets.create({ fileName: "env.hdr", mimeType: "image/vnd.radiance", base64 }) to upload a generated media asset.',
      'The create result returns asset.url, stableUrl, and reference. Use that returned URL in project files, such as new Audio(asset.url) or an <img> src value.',
      'Use await window.TwinkleBuildAgent.assets.createMany([...]) for batches, list({ limit, cursor }) to inspect existing assets, delete(assetId) to remove one, and openManager() to open the asset manager.',
      'Project assets support images, audio, GLB/self-contained glTF models, KTX2, HDR, EXR, BIN, and DRC files for bundled app media. Video is not supported. Raw .gltf files with relative companion URIs must be converted to .glb or rewritten to absolute uploaded asset URLs first.'
    ]
  },
  {
    title: 'External CLI launch',
    items: [
      'For external agents or Codex CLI sessions, use the public Lumine CLI instead of browser automation when the user provides a Twinkle build URL.',
      'Run npx @stage5/lumine@latest for the guided flow. It logs in when needed, lets the user choose an owned or team project, saves that selection, and pulls the saved project files locally.',
      'Run npx @stage5/lumine@latest login once for explicit login. It opens the Twinkle approval page automatically and stores only a scoped CLI token locally. Use --no-open for SSH, CI, or agent-only terminals.',
      'Run npx @stage5/lumine@latest projects, select, or pull to list accessible projects, change the selected project, or refresh local project files.',
      'Pulled workspaces include AGENTS.md with Twinkle Build constraints for local coding agents and TWINKLE_BUILD_SDK.md, the complete SDK reference.',
      'After editing pulled files, run npx @stage5/lumine@latest save from the local project folder. CLI saves use the same /build/:id/project-files route as the Code tab, create a project artifact version, and mark public builds as having unpublished changes.',
      'Run npx @stage5/lumine@latest check, launch, launch --save, or save --publish after selecting a project. You can still pass a Twinkle app, build, preview, or Lumine preview URL explicitly.',
      'Saving and publishing require scoped owner permission; team projects can be selected and pulled for code access.',
      'Do not paste or ask for raw auth tokens; use the CLI login flow.'
    ]
  },
  {
    title: 'Vendor libraries',
    items: [
      'Do not use CDN imports, package imports, or pasted library bundles for project code.',
      `For Three.js, use import * as THREE from "${CURRENT_THREE_VENDOR_PREFIX}three.module.min.js"; inside a type="module" project file.`,
      `Twinkle serves the supported official Three.js ${CURRENT_THREE_VENDOR_VERSION} addon tree under ${CURRENT_THREE_VENDOR_PREFIX}addons/, including controls, loaders, CSS renderers, shaders, physics and WebXR helpers, and WebGLRenderer post-processing modules such as EffectComposer, RenderPass, SSAOPass/GTAOPass, UnrealBloomPass, and OutputPass. Example: import { EffectComposer } from "${CURRENT_THREE_VENDOR_PREFIX}addons/postprocessing/EffectComposer.js";`,
      'The project file tree does not enumerate vendor modules, so absence there is not evidence that an official addon is unavailable. Use its documented addon subpath; project validation checks the exact file and its transitive imports.',
      `WebGPU and TSL entry modules are also vendored at ${CURRENT_THREE_VENDOR_PREFIX}three.webgpu.min.js and ${CURRENT_THREE_VENDOR_PREFIX}three.tsl.min.js, but WebGL EffectComposer passes do not work with WebGPURenderer and runtime GPU support varies.`,
      "Treat addons as available tools, not defaults. Use them when they materially serve the requested experience; for continuously animated mobile builds, target about 30 FPS, cap render pixel ratio around 1–1.25, and lower expensive post-processing resolution or quality only when that preserves the requested visual behavior. Do not remove or disable a requested visual effect as a performance tradeoff without the user's explicit approval.",
      `Loader runtime assets are served too: point decoder/transcoder paths at the vendor prefix, e.g. dracoLoader.setDecoderPath("${CURRENT_THREE_VENDOR_PREFIX}addons/libs/draco/");, never at a CDN.`,
      'This vendor surface covers supported official Three.js modules, not arbitrary third-party Three.js packages. Do not paste library source into project files.',
      `Keep one Three.js version throughout a project. Projects saved with the older ${LEGACY_THREE_VENDOR_VERSION} core path keep working, but a project that needs current addons must migrate every Three.js import to ${CURRENT_THREE_VENDOR_VERSION} in one coherent change; never mix the legacy core with current addons.`,
      'Size both WebGLRenderer and EffectComposer from Twinkle.preview layout dimensions, coalesce resize work, and render with composer.render() when a composer owns the pass chain.',
      'The versioned Three.js vendor paths are stable for preview and published builds.',
      'Sound effects and music (the Groove Lab player) and math formulas (KaTeX) are served by Twinkle too: their import paths and usage are in SDK notes.'
    ]
  },
  {
    title: 'Game layout and realtime updates',
    items: [
      'Only call renderer.setSize() or canvas width/height assignment when the width or height actually changed. Use requestAnimationFrame to coalesce resize work.',
      'The plain text manual includes a copyable subscribePreviewStage helper for canvas and Three.js apps.',
      'For Twinkle.world presence, keep render/input loops local: queue only changed presence, replace an older queued snapshot with the newest one, and flush on a fixed 5–15 updates-per-second schedule with at most one request in flight.',
      'Never call or await updatePresence every animation frame, resend an unchanged snapshot, overlap requests, or build a backlog. session.send("emote", { emote: "wave" }) is for discrete actions when they happen, not polling, and actions must not be automatically retried.',
      'WORLD_EVENT_RATE_LIMITED is recoverable: drop that attempted presence/action update without an immediate retry and keep the session. Reconnect with backoff only after session.ended or Twinkle.world.isSessionEndedError(error).'
    ]
  },
  {
    title: 'Agent rules',
    items: [
      'Do not use Lumine when the user asked for manual/external-agent work.',
      'Use the labeled file controls and code editor; they are exposed for browser automation.',
      'Call only Twinkle.* methods listed in the SDK Reference. Before relying on a call that needs sign-in, ownership or a permission, read Twinkle.capabilities.get() in app code.',
      'The Capabilities list on this page covers permission-gated namespaces only. A namespace missing from it (Twinkle.app, Twinkle.social, Twinkle.coins, Twinkle.land and others) is not unavailable: the SDK Reference is the list of what exists.',
      'Treat uploaded user images and generated outputs as sensitive user data.',
      'Do not store raw file bytes in DB records. Store asset references or small app data.'
    ]
  },
  {
    title: 'Runtime model',
    items: [
      'Build apps run in a sandboxed iframe with window.Twinkle injected.',
      'Local project paths should be relative, such as ./src/app.js or /src/app.js from /index.html.',
      'The SDK methods proxy through the parent app and backend. Signed-in and owner-only checks are enforced outside the iframe.',
      'Do not use sessionStorage. Use Twinkle.privateDb for default private persistence, Twinkle.sharedDb for shared data, Twinkle.userDb only for advanced private SQLite needs, or plain in-memory state for temporary UI state.',
      'When an SDK call returns aiUsagePolicy, update the app UI from that returned policy instead of guessing battery state.'
    ]
  }
];

export default function AgentManualPane({
  capabilitySnapshot
}: AgentManualPaneProps) {
  const [copied, setCopied] = useState(false);
  const [allMethodsOpen, setAllMethodsOpen] = useState(false);
  const manualText = useMemo(
    () => buildAgentManualText(capabilitySnapshot),
    [capabilitySnapshot]
  );
  const viewerRows = buildViewerRows(capabilitySnapshot);
  const namespaceRows = buildNamespaceRows(capabilitySnapshot);

  function handleCopyManual() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(manualText).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className={manualShellClass}>
      <div className={manualHeaderClass}>
        <div className={manualTitleWrapClass}>
          <div className={manualIconClass}>
            <Icon icon="book-open" />
          </div>
          <div>
            <h2 className={manualTitleClass}>Agent manual</h2>
            <div className={manualSubtitleClass}>
              Workspace instructions and Build SDK {AGENT_MANUAL_SDK.version}{' '}
              reference for browser-based coding agents. Copy manual has all of
              it as text.
            </div>
          </div>
        </div>
        <button
          type="button"
          className={copyButtonClass}
          onClick={handleCopyManual}
          disabled={typeof navigator === 'undefined' || !navigator.clipboard}
          data-testid="build-agent-manual-copy"
          aria-label="Copy Build agent manual"
        >
          <Icon icon={copied ? 'check' : 'copy'} />
          {copied ? 'Copied' : 'Copy manual'}
        </button>
      </div>

      <div className={manualBodyClass}>
        <div className={manualContentClass}>
          <section className={manualSectionClass}>
            <h3 className={manualSectionTitleClass}>Start Here</h3>
            <div className={sectionGridClass}>
              {guideSections.map((section) => (
                <GuideBlock key={section.title} section={section} />
              ))}
            </div>
          </section>

          <section className={manualSectionClass}>
            <h3 className={manualSectionTitleClass}>Platform Rules</h3>
            <div className={guideBlockClass}>
              <p>{AGENT_MANUAL_SDK.platformRules.summary}</p>
              <ol>
                {AGENT_MANUAL_SDK.platformRules.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>
            </div>
          </section>

          <section className={manualSectionClass}>
            <h3 className={manualSectionTitleClass}>Essential SDK Features</h3>
            <div className={guideBlockClass}>
              <p>{AGENT_MANUAL_SDK.essentialSdk.summary}</p>
              <ol>
                {AGENT_MANUAL_SDK.essentialSdk.items.map((item) => (
                  <li key={item.when}>
                    <strong>When:</strong> {item.when} <strong>Use:</strong>{' '}
                    {item.use}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className={manualSectionClass}>
            <div className={sectionHeadingRowClass}>
              <h3 className={manualSectionTitleClass}>SDK Reference</h3>
              <button
                type="button"
                className={textButtonClass}
                onClick={() => setAllMethodsOpen((open) => !open)}
                data-testid="build-agent-manual-toggle-methods"
              >
                {allMethodsOpen ? 'Hide all methods' : 'Show all methods'}
              </button>
            </div>
            <p className={sectionIntroClass}>{SDK_REFERENCE_INTRO}</p>
            <div className={sectionGridClass}>
              {AGENT_MANUAL_SDK.namespaces.map((namespace) => (
                <NamespaceBlock
                  key={namespace.name}
                  namespace={namespace}
                  open={allMethodsOpen}
                />
              ))}
            </div>
          </section>

          <section className={manualSectionClass}>
            <h3 className={manualSectionTitleClass}>SDK Guidance</h3>
            <div className={sectionGridClass}>
              {AGENT_MANUAL_SDK.guidance.map((section) => (
                <GuideBlock key={section.title} section={section} />
              ))}
            </div>
            <details className={guideBlockClass}>
              <summary>SDK notes ({AGENT_MANUAL_SDK.notes.length})</summary>
              <ul>
                {AGENT_MANUAL_SDK.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>
          </section>
        </div>

        <aside className={manualAsideClass}>
          <section className={statusSectionClass}>
            <h3 className={manualSectionTitleClass}>Current Context</h3>
            <dl className={statusGridClass}>
              {viewerRows.map((row) => (
                <React.Fragment key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </React.Fragment>
              ))}
            </dl>
          </section>

          <section className={statusSectionClass}>
            <h3 className={manualSectionTitleClass}>Capabilities</h3>
            <div className={namespaceListClass}>
              {namespaceRows.map((row) => (
                <div key={row.name} className={namespaceRowClass}>
                  <span>{row.name}</span>
                  <strong>{row.status}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className={plainTextSectionClass}>
            <h3 className={manualSectionTitleClass}>Plain Text Manual</h3>
            <pre
              className={manualPreClass}
              aria-label="Build agent instruction manual"
              data-testid="build-agent-manual"
            >
              {manualText}
            </pre>
          </section>
        </aside>
      </div>
    </div>
  );
}

function GuideBlock({ section }: { section: GuideSection }) {
  return (
    <div className={guideBlockClass}>
      <h4>{section.title}</h4>
      <ul>
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function NamespaceBlock({
  namespace,
  open
}: {
  namespace: AgentManualSdkNamespace;
  open: boolean;
}) {
  const methodCount = namespace.methods.length;
  return (
    <div className={guideBlockClass}>
      <h4>{namespace.name}</h4>
      <p>{namespace.description}</p>
      <details key={open ? 'open' : 'closed'} open={open}>
        <summary>
          {methodCount} {methodCount === 1 ? 'method' : 'methods'}
        </summary>
        <ul>
          {namespace.methods.map((method) => (
            <li key={method.call}>
              <code>{method.call}</code>
              {method.summary ? ` ${method.summary}` : ''}
              {method.notes.length > 0 ? (
                <details className={methodNotesClass}>
                  <summary>
                    {method.notes.length}{' '}
                    {method.notes.length === 1 ? 'note' : 'notes'}
                  </summary>
                  <ul>
                    {method.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function buildViewerRows(capabilitySnapshot: BuildCapabilitySnapshot | null) {
  if (!capabilitySnapshot) {
    return [{ label: 'Snapshot', value: 'Not loaded' }];
  }

  return [
    {
      label: 'Route',
      value: capabilitySnapshot.routeMode
    },
    {
      label: 'Owner',
      value: capabilitySnapshot.viewer.isOwner ? 'Yes' : 'No'
    },
    {
      label: 'Signed in',
      value: capabilitySnapshot.viewer.isLoggedIn ? 'Yes' : 'No'
    },
    {
      label: 'Public build',
      value: capabilitySnapshot.build.isPublic ? 'Yes' : 'No'
    }
  ];
}

function buildNamespaceRows(
  capabilitySnapshot: BuildCapabilitySnapshot | null
) {
  if (!capabilitySnapshot) {
    return [{ name: 'Twinkle.capabilities', status: 'check at runtime' }];
  }

  return capabilitySnapshot.namespaceDetails.map((detail) => ({
    name: detail.name,
    status: detail.available ? 'available' : detail.reason || 'restricted'
  }));
}

export function buildAgentManualText(
  capabilitySnapshot: BuildCapabilitySnapshot | null
) {
  const lines = [
    '# Twinkle Build Agent Manual',
    '',
    'Use this manual when editing a Build project through the browser workspace without repository source access.',
    '',
    '## Platform Rules',
    '',
    AGENT_MANUAL_SDK.platformRules.summary,
    '',
    ...AGENT_MANUAL_SDK.platformRules.rules.map(
      (rule, index) => `${index + 1}. ${rule}`
    ),
    '',
    '## Essential SDK Features (add without being asked)',
    '',
    AGENT_MANUAL_SDK.essentialSdk.summary,
    '',
    ...AGENT_MANUAL_SDK.essentialSdk.items.map(
      (item, index) => `${index + 1}. When: ${item.when} Use: ${item.use}`
    ),
    '',
    '## Workspace Workflow',
    ...formatSections(guideSections),
    '',
    '## SDK Reference',
    '',
    SDK_REFERENCE_INTRO,
    ...formatSdkNamespaces(),
    '',
    '## SDK Guidance',
    ...formatSections(AGENT_MANUAL_SDK.guidance),
    '',
    '### SDK notes',
    ...AGENT_MANUAL_SDK.notes.map((note) => `- ${note}`),
    '',
    '## Preview Layout Boilerplate',
    '',
    'Use this helper for canvas/WebGL/Three.js/fullscreen apps instead of 100vh/100vw or raw window resize sizing:',
    '',
    '```js',
    previewLayoutBoilerplate,
    '```',
    '',
    '## Current Capability Snapshot',
    ...formatCapabilitySnapshot(capabilitySnapshot),
    '',
    '## Browser Automation Anchors',
    '- Code editor: data-testid="build-code-editor", aria-label starts with "Code editor for".',
    '- New file path input: data-testid="build-new-project-file-path".',
    '- Active file path input: data-testid="build-active-file-path".',
    '- Manual text: data-testid="build-agent-manual".',
    '- Copy manual button: data-testid="build-agent-manual-copy".',
    '- Show or hide every method list: data-testid="build-agent-manual-toggle-methods".'
  ];

  return lines.join('\n');
}

function formatSections(sections: GuideSection[]) {
  return sections.flatMap((section) => [
    '',
    `### ${section.title}`,
    ...section.items.map((item) => `- ${item}`)
  ]);
}

function formatSdkNamespaces() {
  return AGENT_MANUAL_SDK.namespaces.flatMap((namespace) => [
    '',
    `### ${namespace.name}`,
    namespace.description,
    ...namespace.methods.flatMap((method) => [
      `- ${method.call}${method.returns ? ` → ${method.returns}` : ''}`,
      ...(method.summary ? [`  ${method.summary}`] : []),
      ...method.notes.map((note) => `  - ${note}`)
    ])
  ]);
}

function formatCapabilitySnapshot(
  capabilitySnapshot: BuildCapabilitySnapshot | null
) {
  if (!capabilitySnapshot) {
    return [
      '- Snapshot is not loaded yet. In app code, call await Twinkle.capabilities.get().'
    ];
  }

  const namespaceDetails = capabilitySnapshot.namespaceDetails.map((detail) => {
    const notes =
      detail.notes.length > 0 ? ` Notes: ${detail.notes.join(' ')}` : '';
    return `- ${detail.name}: ${
      detail.available ? 'available' : detail.reason || 'restricted'
    }.${notes}`;
  });

  const blockedWriteActions =
    capabilitySnapshot.blockedWriteActions.length > 0
      ? capabilitySnapshot.blockedWriteActions
      : ['none'];

  return [
    `- Route mode: ${capabilitySnapshot.routeMode}`,
    `- Owner: ${capabilitySnapshot.viewer.isOwner ? 'yes' : 'no'}`,
    `- Signed in: ${capabilitySnapshot.viewer.isLoggedIn ? 'yes' : 'no'}`,
    `- Guest: ${capabilitySnapshot.viewer.isGuest ? 'yes' : 'no'}`,
    `- Public build: ${capabilitySnapshot.build.isPublic ? 'yes' : 'no'}`,
    `- Blocked write actions: ${blockedWriteActions.join(', ')}`,
    '',
    '### Namespaces (permission-gated ones only; the SDK Reference lists everything that exists)',
    ...namespaceDetails
  ];
}

const manualShellClass = css`
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  background: #f8fafc;
  color: #172033;
`;

const manualHeaderClass = css`
  min-height: 4.4rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #d8e0ea;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const manualTitleWrapClass = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

const manualIconClass = css`
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e9f2ff;
  color: #2563eb;
  flex-shrink: 0;
`;

const manualTitleClass = css`
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.2;
  font-weight: 900;
  color: #111827;
`;

const manualSubtitleClass = css`
  margin-top: 0.18rem;
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.35;
`;

const copyButtonClass = css`
  border: 1px solid #475569;
  border-radius: 8px;
  background: #64748b;
  color: #ffffff;
  padding: 0.58rem 0.78rem;
  font-size: 1.1rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: #475569;
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const manualBodyClass = css`
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 32%);
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    /* The plain text manual carries the whole SDK reference: cap its column
       so it scrolls inside itself instead of pushing the manual off screen. */
    grid-template-rows: minmax(0, 1fr) minmax(0, 40%);
  }
`;

const manualContentClass = css`
  min-height: 0;
  overflow: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const manualAsideClass = css`
  min-height: 0;
  overflow: auto;
  border-left: 1px solid #d8e0ea;
  background: #edf2f7;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-left: none;
    border-top: 1px solid #d8e0ea;
  }
`;

const manualSectionClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const manualSectionTitleClass = css`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const sectionGridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 0.75rem;
`;

const guideBlockClass = css`
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #ffffff;
  padding: 0.85rem;
  h4 {
    margin: 0 0 0.55rem;
    font-size: 1.1rem;
    line-height: 1.25;
    color: #111827;
  }
  ul {
    margin: 0;
    padding-left: 1rem;
    color: #334155;
    font-size: 1.1rem;
    line-height: 1.48;
  }
  li + li {
    margin-top: 0.32rem;
  }
  ol {
    margin: 0;
    padding-left: 1.4rem;
    color: #334155;
    font-size: 1.1rem;
    line-height: 1.48;
  }
  p {
    margin: 0 0 0.55rem;
    color: #334155;
    font-size: 1.1rem;
    line-height: 1.48;
    overflow-wrap: anywhere;
  }
  li {
    overflow-wrap: anywhere;
  }
  summary {
    cursor: pointer;
    color: #1d4ed8;
    font-size: 1.1rem;
    font-weight: 800;
  }
  details[open] > summary {
    margin-bottom: 0.45rem;
  }
  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 1rem;
    color: #0f172a;
    background: #eef2f7;
    border-radius: 4px;
    padding: 0.05rem 0.25rem;
  }
`;

// A method's notes stay folded under it; the card's own method list is the
// outer <details>.
const methodNotesClass = css`
  margin-top: 0.25rem;
  > summary {
    color: #475569;
    font-weight: 700;
  }
  &[open] > summary {
    margin-bottom: 0.3rem;
  }
  ul {
    border-left: 2px solid #d8e0ea;
    padding-left: 1.2rem;
    margin-left: 0.15rem;
  }
`;

const sectionHeadingRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const sectionIntroClass = css`
  margin: 0;
  color: #334155;
  font-size: 1.1rem;
  line-height: 1.48;
`;

const textButtonClass = css`
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #1d4ed8;
  padding: 0.35rem 0.65rem;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: #eff6ff;
  }
`;

const statusSectionClass = css`
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #ffffff;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const statusGridClass = css`
  display: grid;
  grid-template-columns: minmax(6rem, auto) 1fr;
  gap: 0.42rem 0.7rem;
  margin: 0;
  font-size: 1.1rem;
  dt {
    color: #64748b;
    font-weight: 800;
  }
  dd {
    margin: 0;
    color: #111827;
    font-weight: 700;
    text-align: right;
  }
`;

const namespaceListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const namespaceRowClass = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.55rem;
  border-bottom: 1px solid #e6ebf2;
  padding-bottom: 0.32rem;
  font-size: 1.1rem;
  color: #334155;
  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  strong {
    color: #0f766e;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
`;

const plainTextSectionClass = css`
  min-height: 18rem;
  display: grid;
  grid-template-rows: auto minmax(12rem, 1fr);
  gap: 0.7rem;
`;

const manualPreClass = css`
  margin: 0;
  min-height: 0;
  overflow: auto;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #111827;
  color: #dbeafe;
  padding: 0.85rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.1rem;
  line-height: 1.5;
  white-space: pre-wrap;
`;
