import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import { v1 as uuidv1 } from 'uuid';
import Button from '~/components/Button';
import ProgressBar from '~/components/ProgressBar';
import { useAppContext } from '~/contexts';
import { QuestNote, questHelpClass } from './StepCard';

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
// the API's upload content types (helpers/file.ts getMimeType)
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

function videoExtension(fileName: string) {
  return (fileName.split('.').pop() || '').toLowerCase();
}

// Uploads through the site's normal S3 upload (content/sign-s3, context
// 'meetup'), then hands the key to the quest. The API only ever gives the
// crew and admins a short-lived signed link to watch it.
export default function VideoUploader({
  crewId,
  onChanged
}: {
  crewId: number;
  onChanged: () => Promise<void>;
}) {
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const submitMeetupVideo = useAppContext(
    (v) => v.requestHelpers.submitMeetupVideo
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
        <Button
          variant="soft"
          color="logoBlue"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {file ? 'Choose a different video' : 'Choose the video'}
        </Button>
        {file && (
          <Button
            color="green"
            loading={uploading}
            disabled={uploading}
            onClick={handleUpload}
          >
            Send the video
          </Button>
        )}
      </div>
      {file && (
        <span className={questHelpClass}>
          {file.name} ({Math.ceil(file.size / (1024 * 1024))} MB)
        </span>
      )}
      {uploading && <ProgressBar progress={progress} />}
      <span className={questHelpClass}>
        Only your crew and Twinkle admins can watch it. Show everyone who came
        and what you did and learned together.
      </span>
      {error && <QuestNote tone="warning">{error}</QuestNote>}
    </div>
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    event.target.value = '';
    setError('');
    if (!selected) return;
    // by extension: some browsers report no type for MKV
    if (!VIDEO_EXTENSIONS.includes(videoExtension(selected.name))) {
      setError('Choose an MP4, MOV, WebM, AVI or MKV video.');
      return;
    }
    if (selected.size > MAX_VIDEO_BYTES) {
      setError('That video is over 2 GB. A shorter clip is enough.');
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const extension = videoExtension(file.name);
      const videoKey = await uploadFile({
        context: 'meetup',
        filePath: uuidv1(),
        file,
        fileName: `meetup-video.${extension}`,
        onUploadProgress: ({ loaded, total }: { loaded: number; total: number }) =>
          setProgress(Math.min(100, Math.round((loaded / (total || 1)) * 100)))
      });
      if (!videoKey) throw new Error('The upload did not finish. Try again.');
      await submitMeetupVideo({ crewId, videoKey });
      setFile(null);
      await onChanged();
    } catch (err: any) {
      setError(err?.message || 'The upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }
}
