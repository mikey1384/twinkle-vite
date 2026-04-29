import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import type { BuildCapabilitySnapshot } from '../capabilityTypes';

const PROJECT_FILE_LINE_LIMIT = 500;

interface AgentManualPaneProps {
  capabilitySnapshot: BuildCapabilitySnapshot | null;
}

interface GuideSection {
  title: string;
  items: string[];
}

const guideSections: GuideSection[] = [
  {
    title: 'Workspace workflow',
    items: [
      'Use the Code tab to edit project files directly. The app preview runs from the saved project files.',
      'Keep /index.html or /index.htm as the entry file. Split CSS and JavaScript into supporting files before a file approaches the server line limit.',
      `The current project-file limit is ${PROJECT_FILE_LINE_LIMIT} lines per file. If save fails for size, split the file and save again.`,
      'Use project assets for bundled images/audio. Use Twinkle.files for user-selected runtime uploads that need Twinkle-hosted storage.',
      'Save files before relying on Preview, Publish, or Download zip.'
    ]
  },
  {
    title: 'Agent rules',
    items: [
      'Do not use Lumine when the user asked for manual/external-agent work.',
      'Use the labeled file controls and code editor; they are exposed for browser automation.',
      'Read Twinkle.capabilities.get() in app code before using gated SDK calls.',
      'Treat uploaded user images and generated outputs as sensitive user data.',
      'Do not store raw file bytes in DB records. Store asset references or small app data.'
    ]
  },
  {
    title: 'Runtime model',
    items: [
      'Build apps run in a sandboxed iframe with window.Twinkle injected.',
      'Build apps do not have app-local backend routes. Do not create or fetch /api/* endpoints from the iframe.',
      'Local project paths should be relative, such as ./src/app.js or /src/app.js from /index.html.',
      'The SDK methods proxy through the parent app and backend. Signed-in and owner-only checks are enforced outside the iframe.',
      'Do not use sessionStorage. Use Twinkle.privateDb for default private persistence, Twinkle.sharedDb for shared data, Twinkle.userDb only for advanced private SQLite needs, or plain in-memory state for temporary UI state.',
      'When an SDK call returns aiUsagePolicy, update the app UI from that returned policy instead of guessing battery state.'
    ]
  }
];

const sdkSections: GuideSection[] = [
  {
    title: 'Twinkle.capabilities',
    items: [
      'await Twinkle.capabilities.get() returns the live capability snapshot.',
      'await Twinkle.capabilities.can("Twinkle.ai.generateImage") checks a specific action.'
    ]
  },
  {
    title: 'Twinkle.ai',
    items: [
      'await Twinkle.ai.generateImage({ prompt, referenceImageB64, engine: "openai", quality: "high", requestId, onStatus }) generates or edits an image.',
      'await Twinkle.ai.chat({ message, history, systemPrompt, onText, onStatus }) generates text with the default Lumine text model and streams accumulated text through onText when provided.',
      'Use Twinkle.ai.chat for in-app AI replies instead of creating or fetching app-local endpoints such as /api/chat.',
      'Use systemPrompt to define the app AI personality, tone, role, or response rules.',
      'Image onStatus receives stages such as prompt_ready, in_progress, generating, partial_image, completed, and error; text onStatus receives thinking, completed, or error.',
      'Use status.partialImageB64 for progressive preview UI while the final imageUrl is still generating.',
      'For text chat UIs, use onText to render the assistant response as it arrives, then use the resolved result for the final text and aiUsagePolicy.',
      'Twinkle.ai.onImageGenerationStatus(listener) returns an unsubscribe function for shared streaming UI.',
      'Pass a unique requestId to correlate iframe logs, parent bridge logs, and backend stream logs for one generation.',
      'Signed-in viewers only. Each successful image or text generation consumes AI Energy from the signed-in viewer.',
      'The prompt, message, optional history, and optional reference image are sent to the configured AI provider.'
    ]
  },
  {
    title: 'Twinkle.files',
    items: [
      'For simple same-origin downloads, a normal <a href={imageUrl} download="file.png"> is fine.',
      'await Twinkle.files.saveAs({ fileName, url, dataUrl, blob, bytes, text, json, mimeType }) downloads generated or remote files through the parent frame without opening a popup.',
      'await Twinkle.files.uploadGenerated({ fileName, dataUrl, mimeType }) uploads an app-generated image/file to Twinkle storage without opening a picker.',
      'await Twinkle.files.pickAndUpload({ accept: "image/*", multiple: true }) opens a viewer file picker and uploads to Twinkle storage.',
      'Store returned asset references in Twinkle.privateDb for private refs, Twinkle.sharedDb for shared refs, or Twinkle.userDb only when the app already needs advanced private SQLite.',
      "await Twinkle.files.list({ limit: 20 }) lists this viewer's runtime uploads for the build.",
      "await Twinkle.files.delete(assetId) deletes one of the viewer's uploaded runtime files."
    ]
  },
  {
    title: 'Databases',
    items: [
      'Twinkle.privateDb is the default private per-user store for preferences, drafts, settings, and small JSON state.',
      'Twinkle.userDb is advanced private per-user SQLite for tables, indexes, many rows, filtered queries, or aggregates.',
      'Twinkle.sharedDb stores shared build data when the capability allows it.',
      'Twinkle.sharedDb.getEntries(topic, { limit }) returns newest entries first by default and includes cursor and hasMore for pagination.',
      'Use limit or pageSize to choose how many entries appear per page. Default is 20, max is 100.',
      'Use Twinkle.sharedDb.loadMoreEntries(topic, { limit, cursor }) for Load more buttons.',
      "Pass order: 'asc' or order: 'oldest' for oldest-first chronological reads. sort and direction are accepted aliases.",
      'Do not use sessionStorage for runtime state or persistence.'
    ]
  },
  {
    title: 'Preview and viewer',
    items: [
      'Twinkle.viewer.get() returns the current viewer identity and guest/signed-in state.',
      'Twinkle.preview.reserveInsets(...) reserves host UI space for games and fixed controls.',
      'Twinkle.preview.setPlayfield(...) and reportGameplayState(...) expose game bounds for preview diagnostics.',
      'Twinkle.preview.subscribe(listener, { immediate: true }) reacts to host layout changes.'
    ]
  },
  {
    title: 'Other namespaces',
    items: [
      'Twinkle.chat, Twinkle.reminders, Twinkle.reflections, Twinkle.subjects, Twinkle.users, and Twinkle.profileComments are available only when capabilities permit them.',
      'Prefer capability checks and small, explicit SDK calls over guessing method names.'
    ]
  }
];

export default function AgentManualPane({
  capabilitySnapshot
}: AgentManualPaneProps) {
  const [copied, setCopied] = useState(false);
  const manualText = useMemo(
    () => buildManualText(capabilitySnapshot),
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
              Workspace instructions and SDK reference for browser-based
              coding agents.
            </div>
          </div>
        </div>
        <button
          type="button"
          className={copyButtonClass}
          onClick={handleCopyManual}
          disabled={
            typeof navigator === 'undefined' || !navigator.clipboard
          }
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
            <h3 className={manualSectionTitleClass}>SDK Quick Reference</h3>
            <div className={sectionGridClass}>
              {sdkSections.map((section) => (
                <GuideBlock key={section.title} section={section} />
              ))}
            </div>
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

function buildManualText(capabilitySnapshot: BuildCapabilitySnapshot | null) {
  const lines = [
    '# Twinkle Build Agent Manual',
    '',
    'Use this manual when editing a Build project through the browser workspace without repository source access.',
    '',
    '## Workspace Workflow',
    ...formatSections(guideSections),
    '',
    '## SDK Quick Reference',
    ...formatSections(sdkSections),
    '',
    '## Current Capability Snapshot',
    ...formatCapabilitySnapshot(capabilitySnapshot),
    '',
    '## Browser Automation Anchors',
    '- Code editor: data-testid="build-code-editor", aria-label starts with "Code editor for".',
    '- New file path input: data-testid="build-new-project-file-path".',
    '- Active file path input: data-testid="build-active-file-path".',
    '- Manual text: data-testid="build-agent-manual".',
    '- Copy manual button: data-testid="build-agent-manual-copy".'
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
    '### Namespaces',
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
  font-size: 1.05rem;
  line-height: 1.2;
  font-weight: 900;
  color: #111827;
`;

const manualSubtitleClass = css`
  margin-top: 0.18rem;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.35;
`;

const copyButtonClass = css`
  border: 1px solid #475569;
  border-radius: 8px;
  background: #64748b;
  color: #ffffff;
  padding: 0.58rem 0.78rem;
  font-size: 0.82rem;
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
    grid-template-rows: minmax(0, 1fr) auto;
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
  font-size: 0.82rem;
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
    font-size: 0.9rem;
    line-height: 1.25;
    color: #111827;
  }
  ul {
    margin: 0;
    padding-left: 1rem;
    color: #334155;
    font-size: 0.8rem;
    line-height: 1.48;
  }
  li + li {
    margin-top: 0.32rem;
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
  font-size: 0.78rem;
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
  font-size: 0.75rem;
  color: #334155;
  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  strong {
    color: #0f766e;
    font-size: 0.68rem;
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
  font-size: 0.72rem;
  line-height: 1.5;
  white-space: pre-wrap;
`;
