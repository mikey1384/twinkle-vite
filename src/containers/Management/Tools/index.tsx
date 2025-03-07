import React, { useState, useEffect } from 'react';
import { useManagementContext } from '~/contexts';
import EditSubtitles from './EditSubtitles';
import GenerateSubtitles from './GenerateSubtitles';
import TranslationProgressArea from './TranslationProgressArea';
import MergingProgressArea from './MergingProgressArea';
import BackToTopButton from './BackToTopButton';
import FinalSubtitlesDisplay from './FinalSubtitlesDisplay';
import { SrtSegment, parseSrt, secondsToSrtTime } from './utils';
import { css } from '@emotion/css';
import Section from './Section';

// Modern design system constants
const colors = {
  primary: '#4361ee',
  primaryLight: '#4895ef',
  primaryDark: '#3a0ca3',
  secondary: '#3f37c9',
  success: '#4cc9f0',
  info: '#4895ef',
  warning: '#f72585',
  danger: '#e63946',
  light: '#f8f9fa',
  dark: '#212529',
  gray: '#6c757d',
  grayLight: '#f1f3f5',
  grayDark: '#343a40',
  white: '#ffffff'
};

// Main container styles
const containerStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

// Main title styles
const mainTitleStyles = css`
  font-size: 2.5rem;
  color: ${colors.dark};
  margin-bottom: 2rem;
  font-weight: 700;
`;

// Error styles
const errorStyles = css`
  background-color: ${colors.danger};
  color: ${colors.white};
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  font-weight: 500;
`;

// Tip styles
const tipStyles = css`
  padding: 10px;
  background-color: #e8f4f8;
  border-left: 4px solid #17a2b8;
  border-radius: 4px;
  margin-top: 15px;
`;

export default function Tools() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [translationStage, setTranslationStage] = useState<string>('');
  const [finalSrt, setFinalSrt] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('original');
  const [showOriginalText, setShowOriginalText] = useState(true);
  const [isTranslationInProgress, setIsTranslationInProgress] = useState(false);
  const [isMergingInProgress, setIsMergingInProgress] = useState(false);
  const [mergeProgress, setMergeProgress] = useState<number>(0);
  const [mergeStage, setMergeStage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // Stabilized video URL
  const [srtContent, setSrtContent] = useState<string>('');
  const [subtitles, setSubtitles] = useState<SrtSegment[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingTimes, setEditingTimes] = useState<any>({});

  const MAX_MB = 2500;

  const subtitleProgress = useManagementContext(
    (v) => v.state.subtitleTranslationProgress
  );

  const subtitleMergeProgress = useManagementContext(
    (v) => v.state.subtitleMergeProgress
  );

  useEffect(() => {
    if (subtitleProgress) {
      setTranslationProgress(subtitleProgress.progress);
      setTranslationStage(subtitleProgress.stage);

      if (subtitleProgress.progress > 0) {
        setIsTranslationInProgress(true);
      }

      if (subtitleProgress.progress === 100) {
        setTimeout(() => {
          setIsTranslationInProgress(false);
          subtitleProgress.progress = 0;
          subtitleProgress.stage = '';
        }, 2000);
      }

      if (subtitleProgress.error) {
        setError(subtitleProgress.error);
      }
    }
  }, [subtitleProgress]);

  useEffect(() => {
    if (subtitleMergeProgress) {
      setMergeProgress(subtitleMergeProgress.progress);
      setMergeStage(subtitleMergeProgress.stage);

      if (subtitleMergeProgress.progress > 0) {
        setIsMergingInProgress(true);
      }

      if (subtitleMergeProgress.progress === 100) {
        setTimeout(() => {
          setIsMergingInProgress(false);
          subtitleMergeProgress.progress = 0;
          subtitleMergeProgress.stage = '';
        }, 2000);
      }

      if (subtitleMergeProgress.error) {
        setError(subtitleMergeProgress.error);
      }
    }
  }, [subtitleMergeProgress]);

  useEffect(() => {
    if (videoFile) {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      try {
        let url: string | null = null;
        try {
          url = URL.createObjectURL(videoFile);
          setVideoUrl(url);
          setError('');
        } catch (immediateError) {
          console.error(
            'Error creating object URL immediately:',
            immediateError
          );
        }

        setTimeout(() => {
          if (!url) {
            try {
              url = URL.createObjectURL(videoFile);
              setVideoUrl(url);
              setError('');
            } catch (delayedError) {
              console.error(
                'Error creating object URL (delayed):',
                delayedError
              );
              setError(
                'Failed to load video file. Please try again with a different format.'
              );
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error in URL creation process:', error);
        setError('Failed to load video file. Please try again.');
      }

      return () => {
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
      };
    } else {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile]);

  return (
    <div
      className={containerStyles}
      style={{
        paddingTop: isTranslationInProgress ? 180 : 80
      }}
    >
      <div id="top-padding" />

      <h1 className={mainTitleStyles}>Subtitle + Translation Tools</h1>

      {error && <div className={errorStyles}>{error}</div>}

      <Section title="Generate Subtitles">
        <GenerateSubtitles
          MAX_MB={MAX_MB}
          selectedFile={selectedFile}
          targetLanguage={targetLanguage}
          showOriginalText={showOriginalText}
          loading={loading}
          onSetSelectedFile={setSelectedFile}
          onSetTargetLanguage={setTargetLanguage}
          onSetShowOriginalText={setShowOriginalText}
          onSetLoading={setLoading}
          onSetError={setError}
          onSetFinalSrt={setFinalSrt}
          onSetProgress={setProgress}
          onSetProgressStage={setProgressStage}
          onSetTranslationProgress={setTranslationProgress}
          onSetTranslationStage={setTranslationStage}
          onSetIsTranslationInProgress={setIsTranslationInProgress}
          onSetVideoFile={setVideoFile}
          onSetSrtContent={setSrtContent}
          onSetSubtitles={setSubtitles}
        />
      </Section>

      <Section title="Edit Subtitles">
        <EditSubtitles
          videoFile={videoFile}
          videoUrl={videoUrl}
          srtContent={srtContent}
          subtitles={subtitles}
          isPlaying={isPlaying}
          editingTimes={editingTimes}
          targetLanguage={targetLanguage}
          showOriginalText={showOriginalText}
          isMergingInProgress={isMergingInProgress}
          onSetEditingTimes={setEditingTimes}
          onSetVideoFile={setVideoFile}
          onSetVideoUrl={setVideoUrl}
          onSetSrtContent={setSrtContent}
          onSetSubtitles={setSubtitles}
          onSetError={setError}
          secondsToSrtTime={secondsToSrtTime}
          parseSrt={parseSrt}
          onSetIsMergingInProgress={setIsMergingInProgress}
          onSetMergeProgress={setMergeProgress}
          onSetMergeStage={setMergeStage}
          onSetIsPlaying={setIsPlaying}
          currentPlayer={currentPlayer}
          onSetCurrentPlayer={setCurrentPlayer}
        />
      </Section>

      {isTranslationInProgress && (
        <TranslationProgressArea
          progress={progress}
          progressStage={progressStage}
          translationProgress={translationProgress}
          translationStage={translationStage}
          onSetIsTranslationInProgress={setIsTranslationInProgress}
          subtitleProgress={subtitleProgress}
        />
      )}

      {isMergingInProgress && (
        <MergingProgressArea
          mergeProgress={mergeProgress}
          mergeStage={mergeStage}
          onSetIsMergingInProgress={setIsMergingInProgress}
        />
      )}

      <BackToTopButton
        showButton={subtitles.length > 0}
        onClick={() => {
          const topPadding = document.getElementById('top-padding');
          if (topPadding) {
            topPadding.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {finalSrt && !videoFile && (
        <FinalSubtitlesDisplay
          finalSrt={finalSrt}
          targetLanguage={targetLanguage}
          showOriginalText={showOriginalText}
          onSetSrtContent={setSrtContent}
          onSetSubtitles={setSubtitles}
          parseSrt={parseSrt}
          onSetError={setError}
        />
      )}
      {finalSrt && videoFile && !subtitles.length && (
        <div style={{ marginTop: 15 }}>
          <p className={tipStyles}>
            <strong>Tip:</strong> Your video and subtitles are ready for editing
            in the &ldquo;Edit Subtitles&rdquo; section below.
          </p>
        </div>
      )}
      <div style={{ height: 100 }} />
    </div>
  );
}
