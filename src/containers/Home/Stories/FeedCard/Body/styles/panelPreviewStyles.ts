import {
  Color,
  borderRadius,
  desktopMinWidth,
  tabletMaxWidth
} from '~/constants/css';

export const panelPreviewStyles = `
  .home-feed-card__panel-preview,
  .home-feed-card__target-preview {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
    border-radius: ${borderRadius};
    background: #fff;
  }
  .home-feed-card__panel-preview {
    height: max(20rem, 200px);
    border: 0;
    background: transparent;
  }
  .home-feed-card__target-preview {
    border: 1px solid ${Color.borderGray()};
    container-type: inline-size;
  }
  .home-feed-card__target-preview[data-feed-card-interactive='true'] {
    cursor: pointer;
  }
  .home-feed-card__target-preview[data-feed-card-interactive='true']:hover {
    border-color: ${Color.logoBlue(0.34)};
  }
  .home-feed-card__target-preview[data-feed-card-interactive='true']:focus-visible {
    outline: 2px solid ${Color.logoBlue(0.42)};
    outline-offset: 2px;
  }
  .home-feed-card__panel-preview--has-attachment,
  .home-feed-card__panel-preview--build,
  .home-feed-card__panel-preview--daily-goals,
  .home-feed-card__panel-preview--pass,
  .home-feed-card__panel-preview--reflection,
  .home-feed-card__panel-preview--shared-topic,
  .home-feed-card__panel-preview--url,
  .home-feed-card__panel-preview--video {
    height: max(22rem, 220px);
  }
  .home-feed-card__panel-preview--rich-embed {
    height: max(27rem, 270px);
  }
  .home-feed-card__panel-preview--reflection {
    height: max(34rem, 340px);
  }
  .home-feed-card__panel-preview--reflection-compact {
    height: max(18rem, 270px);
  }
  .home-feed-card__panel-preview--subject {
    height: max(32rem, 320px);
  }
  .home-feed-card__panel-preview--subject-media-compact {
    height: max(21rem, 210px);
  }
  .home-feed-card__panel-preview--secret {
    height: max(12rem, 120px);
  }
  .home-feed-card__panel-preview--build {
    height: max(18rem, 180px);
  }
  .home-feed-card__panel-preview--subject-minimal {
    height: max(12rem, 120px);
  }
  .home-feed-card__panel-preview--profile-panel {
    height: max(24rem, 240px);
  }
  .home-feed-card__panel-preview--attachment-only {
    height: max(12rem, 120px);
  }
  .home-feed-card__panel-preview--text-compact {
    height: max(11rem, 110px);
  }
  .home-feed-card__panel-preview--text-tall {
    height: max(32rem, 320px);
  }
  .home-feed-card__panel-preview--reflection-tight {
    height: max(22rem, 220px);
  }
  .home-feed-card__panel-preview--size-attachment-only {
    height: max(12rem, 120px);
  }
  .home-feed-card__panel-preview--size-ai-story-listening {
    height: max(18rem, 180px);
  }
  .home-feed-card__panel-preview--size-ai-story-reading {
    height: max(20rem, 200px);
  }
  .home-feed-card__panel-preview--size-build {
    height: max(18rem, 180px);
  }
  .home-feed-card__panel-preview--size-compact {
    height: max(11rem, 110px);
  }
  .home-feed-card__panel-preview--size-compact-desktop {
    height: max(11rem, 110px);
  }
  .home-feed-card__panel-preview--size-fallback {
    height: max(20rem, 200px);
  }
  .home-feed-card__panel-preview--size-media {
    height: max(22rem, 220px);
  }
  .home-feed-card__panel-preview--url,
  .home-feed-card__panel-preview--size-url {
    height: max(25rem, 250px);
  }
  .home-feed-card__panel-preview--size-media-attachment {
    height: max(40rem, 400px);
  }
  .home-feed-card__panel-preview--size-media-attachment-with-text {
    height: max(45rem, 450px);
  }
  .home-feed-card__panel-preview--pass,
  .home-feed-card__panel-preview--size-pass {
    height: max(18.5rem, 185px);
  }
  .home-feed-card__panel-preview--size-profile {
    height: max(24rem, 240px);
  }
  .home-feed-card__panel-preview--size-reflection {
    height: max(27rem, 270px);
  }
  .home-feed-card__panel-preview--size-reflection-tall {
    height: max(34rem, 340px);
  }
  .home-feed-card__panel-preview--size-reflection-tight {
    height: max(22rem, 220px);
  }
  .home-feed-card__panel-preview--size-rich-embed {
    height: max(27rem, 270px);
  }
  .home-feed-card__panel-preview--size-rich-embed-compact {
    height: max(21rem, 210px);
  }
  .home-feed-card__panel-preview--size-secret {
    height: max(12rem, 120px);
  }
  .home-feed-card__panel-preview--size-standard {
    height: max(20rem, 200px);
  }
  .home-feed-card__panel-preview--size-subject-media {
    height: max(21rem, 210px);
  }
  .home-feed-card__panel-preview--size-subject-minimal {
    height: max(12rem, 120px);
  }
  .home-feed-card__panel-preview--size-subject-locked {
    height: max(16.5rem, 165px);
  }
  .home-feed-card__panel-preview--size-subject-root {
    height: max(15.5rem, 155px);
  }
  .home-feed-card__panel-preview--size-subject-root-text {
    height: max(29rem, 290px);
  }
  .home-feed-card__panel-preview--size-subject-comment-embed {
    height: var(--home-feed-card-comment-embed-panel-height, 100%);
  }
  .home-feed-card__panel-preview--size-subject-rich-embed {
    height: max(34rem, 340px);
  }
  .home-feed-card__panel-preview--size-subject-secret-compact {
    height: max(19rem, 190px);
  }
  .home-feed-card__panel-preview--size-subject-secret-fit {
    height: var(--home-feed-card-subject-secret-panel-height, 100%);
  }
  .home-feed-card__panel-preview--size-subject-secret-preview {
    height: max(22.5rem, 225px);
  }
  .home-feed-card__panel-preview--size-subject-secret-media {
    height: max(25rem, 250px);
  }
  .home-feed-card__panel-preview--size-subject-tall,
  .home-feed-card__panel-preview--size-tall {
    height: max(32rem, 320px);
  }
  .home-feed-card__target-preview {
    height: max(13rem, 130px);
  }
  .home-feed-card__target-preview--compact {
    height: max(8.5rem, 85px);
  }
  .home-feed-card__target-preview--size-compact {
    height: max(8.5rem, 85px);
  }
  .home-feed-card__target-preview--size-fallback,
  .home-feed-card__target-preview--size-standard {
    height: max(13rem, 130px);
  }
  .home-feed-card__target-preview--size-media-comment {
    height: max(20rem, 200px);
  }
  .home-feed-card__target-preview > * {
    pointer-events: none;
  }
  .home-feed-card__target-preview .home-feed-card__target-comment-preview,
  .home-feed-card__target-preview .compact-comment-embed__copy,
  .home-feed-card__target-preview .compact-comment-embed__meta,
  .home-feed-card__target-preview .compact-comment-embed__username,
  .home-feed-card__target-preview .compact-comment-embed__username * {
    pointer-events: auto;
  }
  @media (min-width: ${desktopMinWidth}) and (max-width: ${tabletMaxWidth}) {
    &.home-feed-card__body--tablet-media-attachment
      .home-feed-card__panel-preview--size-media-attachment-with-text {
      height: max(31rem, 310px);
    }
    &.home-feed-card__body--tablet-media-attachment
      .home-feed-card__target-preview--size-compact {
      height: max(8.5rem, 85px);
    }
    &.home-feed-card__body--tablet-media-attachment
      .home-feed-card__target-preview--size-fallback,
    &.home-feed-card__body--tablet-media-attachment
      .home-feed-card__target-preview--size-standard {
      height: max(12rem, 120px);
    }
    &.home-feed-card__body--tablet-media-attachment
      .home-feed-card__target-preview--size-media-comment {
      height: max(18rem, 180px);
    }
  }
  h3 {
    margin: 0;
    padding-bottom: 0.08em;
    color: ${Color.black()};
    font-size: max(2rem, 20px);
    font-weight: 800;
    line-height: 1.28;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
  }
  p {
    margin: 0;
  }
`;
