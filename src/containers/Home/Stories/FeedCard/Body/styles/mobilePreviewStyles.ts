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
    .home-feed-card__panel-preview--url,
    .home-feed-card__panel-preview--size-url {
      height: max(23rem, 230px);
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
    .home-feed-card__target-preview--size-media-comment {
      height: max(18rem, 180px);
    }
    .home-feed-card__panel-preview,
    .home-feed-card__target-preview {
      border-left: 0;
      border-right: 0;
      border-radius: 0;
    }
    .home-feed-card__reflection-footer.daily-reflection-meta-badges--has-masterpiece.daily-reflection-meta-badges--has-progress {
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      grid-template-rows: auto auto;
      align-items: center;
      column-gap: 0.75rem;
      row-gap: 0.35rem;
      width: 100%;
      min-height: 4.7rem;
    }
    .home-feed-card__reflection-footer.daily-reflection-meta-badges--has-masterpiece.daily-reflection-meta-badges--has-progress
      .daily-reflection-meta-badges__masterpiece {
      grid-column: 1;
      grid-row: 1;
      max-width: 100%;
      overflow: hidden;
      justify-self: start;
    }
    .home-feed-card__reflection-footer.daily-reflection-meta-badges--has-masterpiece.daily-reflection-meta-badges--has-progress
      .daily-reflection-meta-badges__masterpiece-label {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .home-feed-card__reflection-footer.daily-reflection-meta-badges--has-masterpiece.daily-reflection-meta-badges--has-progress
      .daily-reflection-meta-badges__progress {
      grid-column: 1;
      grid-row: 2;
      min-width: 0;
      gap: 0.6rem;
      flex-wrap: nowrap;
    }
    .home-feed-card__reflection-footer.daily-reflection-meta-badges--has-masterpiece.daily-reflection-meta-badges--has-progress
      .daily-reflection-meta-badges__refined {
      grid-column: 2;
      grid-row: 1 / span 2;
      align-self: center;
      flex-shrink: 0;
      justify-self: end;
      min-width: max-content;
      max-width: none;
      padding-right: 0.35rem;
      overflow: visible;
      white-space: nowrap;
      word-break: keep-all;
    }
    .home-feed-card__reflection-footer.daily-reflection-meta-badges--has-masterpiece.daily-reflection-meta-badges--has-progress
      .daily-reflection-meta-badges__refined span {
      white-space: nowrap;
      word-break: keep-all;
    }
      .home-feed-card__subject-copy
        .home-feed-card__subject-description,
      .home-feed-card__subject-copy
        .home-feed-card__subject-description p {
        font-size: max(1.52rem, 15.2px);
      }
      .home-feed-card__text-copy
        > div.home-feed-card__primary-preview-text,
      .home-feed-card__subject-copy
        .home-feed-card__subject-description,
      .home-feed-card__subject-copy
        .home-feed-card__subject-description p,
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
      .home-feed-card__url-preview {
        grid-template-columns: minmax(0, 1fr) minmax(13rem, 40%);
      }
      .home-feed-card__url-copy h3 {
        font-size: max(1.8rem, 18px);
      }
      .home-feed-card__url-copy p {
        font-size: max(1.52rem, 15.2px);
      }
      .home-feed-card__url-thumb {
        width: min(100%, max(14rem, 140px));
      }
      .home-feed-card__url-meta-description {
        max-width: max(14rem, 140px);
        font-size: max(1.02rem, 10.2px);
        line-height: 1.18;
      }
      .home-feed-card__rich-embed-preview--ai-card.home-feed-card__rich-embed-preview--with-text {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.35rem;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card {
        padding: 0;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview {
        display: grid !important;
        grid-template-columns: minmax(9.4rem, 0.78fr) minmax(0, 1.28fr) minmax(
            6.3rem,
            0.54fr
          ) !important;
        align-items: center !important;
        gap: 0.36rem !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        max-height: 100% !important;
        padding: 0.45rem !important;
        border: 1px solid ${Color.borderGray()} !important;
        border-radius: 0.8rem !important;
        background: #fff !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
        .compact-ai-card-preview__details {
        display: flex !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
        .compact-ai-card-preview__card-stage {
        width: 100%;
        height: 100%;
        min-width: 0;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
        .compact-ai-card-preview__card-stage
        .compact-ai-card-thumb--static {
        width: clamp(9.2rem, 22vw, 13rem) !important;
        height: clamp(12.6rem, 30.2vw, 17.8rem) !important;
        max-width: 100%;
        max-height: 100%;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__details {
        gap: 0.24rem !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__header {
        gap: 0.28rem !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__owner--inline {
        display: none !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__word {
        font-size: max(1.35rem, 13.5px) !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__quality-line {
        font-size: max(1.18rem, 11.8px) !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__prompt {
        margin: 0.1rem 0 !important;
        font-size: max(1.1rem, 11px) !important;
        line-height: 1.28 !important;
        -webkit-line-clamp: 3 !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__meta {
        gap: 0.14rem 0.34rem !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__summoned {
        margin-top: 0.14rem !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__market {
        display: flex !important;
        gap: 0.36rem !important;
        padding-left: 0.38rem !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__stat
        > span {
        font-size: max(1rem, 10px) !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__stat
        b {
        gap: 0.16rem !important;
        font-size: max(1.1rem, 11px) !important;
      }
      .home-feed-card__rich-embed-preview--ai-card
        .compact-ai-card-preview__stat--burn
        b {
        font-size: max(1.18rem, 11.8px) !important;
      }
      .home-feed-card__subject-embed-preview.home-feed-card__rich-embed-internal--build {
        flex-basis: max(14rem, 140px);
        height: max(14rem, 140px);
        max-height: max(14rem, 140px);
      }
      .home-feed-card__text-preview--with-media-attachment {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr);
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
      .home-feed-card__daily-goals-preview.has-media:not(.home-feed-card__daily-goals-preview--target) {
        --home-feed-daily-goals-thumb-height: 15rem;
        --home-feed-daily-goals-thumb-width: 10.72rem;
        gap: 2rem;
        padding: 0.85rem 1rem;
      }
      .home-feed-card__target-daily-goals.home-feed-card__daily-goals-preview--target {
        gap: 0.55rem;
        padding: 0.62rem 0.72rem;
      }
      .home-feed-card__target-daily-goals.home-feed-card__daily-goals-preview--target.has-media {
        grid-template-columns: minmax(5.2rem, 26%) minmax(0, 1fr);
      }
      .home-feed-card__daily-goals-preview--target h3 {
        font-size: max(1.48rem, 14.8px);
      }
      .home-feed-card__daily-goals-preview--target .home-feed-card__bonus-question {
        font-size: max(1.12rem, 11.2px);
      }
      .home-feed-card__daily-goals-preview--target .home-feed-card__choice-list span {
        padding: 0.24rem 0.36rem;
        font-size: max(1.02rem, 10.2px);
      }
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
