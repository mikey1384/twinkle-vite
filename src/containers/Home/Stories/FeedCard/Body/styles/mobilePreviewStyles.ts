import { Color, mobileMaxWidth } from '~/constants/css';

export const mobilePreviewStyles = `
  @media (max-width: ${mobileMaxWidth}) {
    .home-feed-card__panel-preview {
      height: max(19rem, 190px);
    }
    .home-feed-card__panel-preview--has-attachment,
    .home-feed-card__panel-preview--build,
    .home-feed-card__panel-preview--daily-goals,
    .home-feed-card__panel-preview--pass,
    .home-feed-card__panel-preview--reflection,
    .home-feed-card__panel-preview--shared-topic,
    .home-feed-card__panel-preview--url,
    .home-feed-card__panel-preview--video {
      height: max(20rem, 200px);
    }
    .home-feed-card__panel-preview--rich-embed {
      height: max(25rem, 250px);
    }
    .home-feed-card__panel-preview--reflection {
      height: max(32rem, 320px);
    }
    .home-feed-card__panel-preview--reflection-compact {
      height: max(18rem, 270px);
    }
    .home-feed-card__panel-preview--subject {
      height: max(30rem, 300px);
    }
    .home-feed-card__panel-preview--subject-media-compact {
      height: max(20rem, 200px);
    }
    .home-feed-card__panel-preview--secret {
      height: max(11rem, 110px);
    }
    .home-feed-card__panel-preview--build {
      height: max(14rem, 140px);
    }
    .home-feed-card__panel-preview--text-compact {
      height: max(10rem, 100px);
    }
    .home-feed-card__panel-preview--text-tall {
      height: max(30rem, 300px);
    }
    .home-feed-card__panel-preview--reflection-tight {
      height: max(21rem, 210px);
    }
    .home-feed-card__panel-preview--size-attachment-only {
      height: max(11rem, 110px);
    }
    .home-feed-card__panel-preview--size-ai-story-listening {
      height: max(17rem, 170px);
    }
    .home-feed-card__panel-preview--size-ai-story-reading {
      height: max(19rem, 190px);
    }
    .home-feed-card__ai-story-story {
      max-height: max(7.17rem, 71.7px);
      -webkit-line-clamp: 3;
    }
    .home-feed-card__ai-story-preview--has-image .home-feed-card__ai-story-main {
      grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 34%);
      gap: 0.7rem;
    }
    .home-feed-card__ai-story-preview--has-image h3 {
      font-size: max(1.5rem, 15px);
      max-height: 2.84em;
    }
    .home-feed-card__ai-story-preview--has-image .home-feed-card__ai-story-story {
      font-size: max(1.22rem, 12.2px);
      line-height: 1.35;
      max-height: 4.05em;
    }
    .home-feed-card__panel-preview--size-build {
      height: max(14rem, 140px);
    }
    .home-feed-card__panel-preview--size-compact {
      height: max(10rem, 100px);
    }
    .home-feed-card__panel-preview--size-compact-desktop {
      height: max(19rem, 190px);
    }
    .home-feed-card__panel-preview--size-fallback {
      height: max(19rem, 190px);
    }
    .home-feed-card__panel-preview--size-media {
      height: max(20rem, 200px);
    }
    .home-feed-card__panel-preview--size-media-attachment {
      height: max(25rem, 250px);
    }
    .home-feed-card__panel-preview--size-media-attachment-with-text {
      height: max(31rem, 310px);
    }
    .home-feed-card__panel-preview--pass,
    .home-feed-card__panel-preview--size-pass {
      height: max(17.5rem, 175px);
    }
    .home-feed-card__panel-preview--size-profile {
      height: max(23rem, 230px);
    }
    .home-feed-card__panel-preview--size-reflection {
      height: max(27rem, 270px);
    }
    .home-feed-card__panel-preview--size-reflection-tall {
      height: max(32rem, 320px);
    }
    .home-feed-card__panel-preview--size-reflection-tight {
      height: max(21rem, 210px);
    }
    .home-feed-card__panel-preview--size-rich-embed {
      height: max(25rem, 250px);
    }
    .home-feed-card__panel-preview--size-rich-embed-compact {
      height: max(20rem, 200px);
    }
    .home-feed-card__panel-preview--size-secret {
      height: max(11rem, 110px);
    }
    .home-feed-card__panel-preview--size-standard {
      height: max(19rem, 190px);
    }
    .home-feed-card__panel-preview--size-subject-media {
      height: max(20rem, 200px);
    }
    .home-feed-card__panel-preview--size-subject-minimal {
      height: max(11rem, 110px);
    }
    .home-feed-card__panel-preview--size-subject-locked {
      height: max(15.5rem, 155px);
    }
    .home-feed-card__panel-preview--size-subject-root {
      height: max(15.5rem, 155px);
    }
    .home-feed-card__panel-preview--size-subject-root-text {
      height: max(27rem, 270px);
    }
    .home-feed-card__panel-preview--size-subject-rich-embed {
      height: max(32rem, 320px);
    }
    .home-feed-card__panel-preview--size-subject-secret-compact {
      height: max(18.5rem, 185px);
    }
    .home-feed-card__panel-preview--size-subject-secret-preview {
      height: max(22rem, 220px);
    }
    .home-feed-card__panel-preview--size-subject-secret-media {
      height: max(24rem, 240px);
    }
    .home-feed-card__panel-preview--size-subject-tall,
    .home-feed-card__panel-preview--size-tall {
      height: max(30rem, 300px);
    }
    .home-feed-card__target-preview--size-compact {
      height: max(8.5rem, 85px);
    }
    .home-feed-card__target-preview--size-fallback,
    .home-feed-card__target-preview--size-standard {
      height: max(12rem, 120px);
    }
    .home-feed-card__panel-preview,
    .home-feed-card__target-preview {
      border-left: 0;
      border-right: 0;
      border-radius: 0;
    }
      .home-feed-card__text-copy
        > div.home-feed-card__primary-preview-text,
      .home-feed-card__subject-copy
        > .home-feed-card__subject-description,
      .home-feed-card__rich-embed-copy
        > div.home-feed-card__primary-preview-text,
      .home-feed-card__system-prompt-box
        > div.home-feed-card__primary-preview-text {
        line-height: 1.36;
      }
      .home-feed-card__panel-preview--profile-panel {
        height: max(23rem, 230px);
      }
      .home-feed-card__text-preview--with-attachment,
      .home-feed-card__subject-main--with-attachment,
      .home-feed-card__rich-embed-preview--with-text,
      .home-feed-card__target-content.has-media,
      .home-feed-card__target-video.has-media,
      .home-feed-card__build-preview,
      .home-feed-card__url-preview {
        grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 34%);
        gap: 0.7rem;
        padding: 0.85rem 1rem;
      }
      .home-feed-card__text-preview--with-media-attachment {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto auto;
      }
      .home-feed-card__video-preview {
        grid-template-columns: minmax(8rem, 44%) minmax(0, 1fr);
        gap: 0.7rem;
        padding: 0.85rem 1rem;
      }
      .home-feed-card__target-achievement.has-media,
      .home-feed-card__target-daily-goals.has-media {
        grid-template-columns: minmax(5.8rem, 30%) minmax(0, 1fr);
      }
      .home-feed-card__target-mission {
        grid-template-columns: 4.8rem minmax(0, 1fr);
      }
      .home-feed-card__target-mission-icon {
        width: 4rem;
        height: 4rem;
        font-size: 1.65rem;
      }
      .home-feed-card__target-comment {
        grid-template-columns: 6.8rem minmax(0, 1fr);
        padding: 0.75rem;
      }
      .home-feed-card__target-comment-content.has-embed {
        grid-template-columns: minmax(0, 1fr) minmax(7.2rem, 34%);
      }
      .home-feed-card__mini-profile-header {
        grid-template-columns: 6.9rem minmax(0, 1fr) minmax(9.4rem, 34%);
        align-items: center;
        gap: 0.65rem;
      }
      .home-feed-card__mini-profile-bio-panel {
        grid-column: auto;
        height: 100%;
        min-height: 0;
        padding-left: 0.65rem;
        padding-top: 0;
        border-left: 1px solid ${Color.borderGray()};
        border-top: 0;
      }
      .home-feed-card__mini-profile-avatar {
        width: 6.5rem;
      }
      .home-feed-card__mini-profile-details h4 {
        font-size: 1.65rem;
      }
      .home-feed-card__mini-profile-title-row {
        gap: 0.35rem;
      }
      .home-feed-card__mini-profile-bio {
        gap: 0.32rem;
        font-size: max(1.18rem, 11.8px);
        line-height: 1.24;
      }
      .home-feed-card__mini-profile-bio > div {
        grid-template-columns: 0.55rem minmax(0, 1fr);
        gap: 0.32rem;
      }
      .home-feed-card__mini-profile-empty-bio {
        font-size: max(1.18rem, 11.8px);
        line-height: 1.24;
      }
      .home-feed-card__daily-goals-preview {
        grid-template-columns: 6.8rem minmax(0, 1fr);
        gap: 0.6rem;
      padding: 0.85rem 1rem;
    }
    h3 {
      font-size: 1.5rem;
    }
    .home-feed-card__subject-preview
      .home-feed-card__subject-copy
      > h3.home-feed-card__primary-preview-text,
    .home-feed-card__target-subject .home-feed-card__target-copy > h4 {
      font-size: 1.9rem;
      line-height: 1.24;
    }
    .home-feed-card__target-subject .home-feed-card__target-copy > h4 {
      min-height: max(2.36rem, 23.6px);
    }
  }
`;
