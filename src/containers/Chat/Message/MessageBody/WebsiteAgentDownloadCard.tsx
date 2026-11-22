import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import { downloadTextFile } from '~/helpers/topicBrain';
import {
  buildProjectExportBaseName,
  triggerBrowserDownload
} from '~/containers/Build/PreviewPanel/helpers/previewHelpers';

export type WebsiteAgentDownloadItem =
  | { kind: 'image'; source: { kind: string; id: string } }
  | { kind: 'app_archive'; buildId: number; title: string }
  | { kind: 'topic_notes'; channelId: number; topicId: number };

// Zero/Ciel's Download card: saving to a device needs the member's own
// tap, so the assistant only offers the button. Each button uses the same
// download the website's own page uses (My Images, Build > Download,
// Topic Settings > Download).
export default function WebsiteAgentDownloadCard({
  label,
  item,
  isSomeoneElses
}: {
  label: string;
  item: WebsiteAgentDownloadItem;
  isSomeoneElses: boolean;
}) {
  const loadOwnedAssetFile = useAppContext(
    (v) => v.requestHelpers.loadOwnedAssetFile
  );
  const downloadBuildProjectArchive = useAppContext(
    (v) => v.requestHelpers.downloadBuildProjectArchive
  );
  const exportTopicBrain = useAppContext(
    (v) => v.requestHelpers.exportTopicBrain
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className={cardClass} {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}>
      <div className={labelClass}>
        <Icon icon={item.kind === 'image' ? 'image' : 'file'} />
        <span>{label}</span>
      </div>
      {isSomeoneElses ? (
        <p className={noteClass}>Only the member who asked can download this.</p>
      ) : (
        <div className={buttonRowClass}>
          <button type="button" disabled={busy} onClick={() => handleSave(false)}>
            {busy ? <Icon icon="spinner" spin /> : <Icon icon="download" />}
            <span>Download</span>
          </button>
          {canShareFiles() && (
            <button type="button" disabled={busy} onClick={() => handleSave(true)}>
              <Icon icon="share" />
              <span>Share</span>
            </button>
          )}
        </div>
      )}
      {error && <p className={noteClass}>{error}</p>}
    </div>
  );

  async function handleSave(share: boolean) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const file = await loadFile();
      if (share && canShareFile(file.file)) {
        try {
          await navigator.share({ files: [file.file], title: label });
          return;
        } catch (shareError: any) {
          if (shareError?.name === 'AbortError') return;
        }
      }
      if (file.text !== undefined) downloadTextFile(file.file.name, file.text);
      else
        triggerBrowserDownload({
          bytes: await file.file.arrayBuffer(),
          fileName: file.file.name,
          mimeType: file.file.type
        });
    } catch (err: any) {
      setError(err?.message || 'Couldn’t make the download. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function loadFile(): Promise<{ file: File; text?: string }> {
    if (item.kind === 'image') {
      const { bytes, type } = await loadOwnedAssetFile(item.source);
      const extension = type.includes('jpeg')
        ? 'jpg'
        : type.split('/')[1]?.split(';')[0] || 'png';
      return { file: new File([bytes], `picture.${extension}`, { type }) };
    }
    if (item.kind === 'app_archive') {
      const bytes = await downloadBuildProjectArchive(item.buildId);
      if (!(bytes instanceof ArrayBuffer))
        throw new Error('Failed to download the exported project zip');
      return {
        file: new File(
          [bytes],
          `${buildProjectExportBaseName(item.title, item.buildId)}.zip`,
          { type: 'application/zip' }
        )
      };
    }
    const { fileName, markdown } = await exportTopicBrain({
      channelId: item.channelId,
      topicId: item.topicId
    });
    return {
      file: new File([markdown], fileName, { type: 'text/markdown' }),
      text: markdown
    };
  }
}

function canShareFiles() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  );
}
function canShareFile(file: File) {
  try {
    return canShareFiles() && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

const cardClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.8rem;
  padding: 1rem 1.2rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  background: #f8fafc;
  color: #2f3747;
  font-size: 1.3rem;
  max-width: 36rem;
`;
const labelClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 650;
  overflow-wrap: anywhere;
`;
const buttonRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font: inherit;
    font-weight: 650;
    padding: 0.6rem 1.1rem;
    border-radius: 0.8rem;
    border: 1px solid #94a3b8;
    background: #fff;
    color: #2f3747;
    cursor: pointer;
    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }
`;
const noteClass = css`
  margin: 0;
  font-size: 1.15rem;
  color: #4c5767;
`;
