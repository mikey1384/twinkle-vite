import { Color } from '~/constants/css';

export const targetPreviewStyles = `
    .home-feed-card__url-target {
      min-height: 10rem;
    }
    .home-feed-card__url-target-compact {
      min-height: 8.5rem;
    }
    .home-feed-card__url-target-compact h3 {
      font-size: max(1.32rem, 13.2px);
      line-height: 1.14;
    }
    .home-feed-card__url-target-compact p {
      font-size: max(1.02rem, 10.2px);
      line-height: 1.22;
    }
    .home-feed-card__target-content {
      box-sizing: border-box;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-items: center;
      gap: 0.8rem;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      padding: 0.85rem;
      background: #fff;
    }
    .home-feed-card__target-content.has-media {
      grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 32%);
      grid-template-rows: minmax(0, 1fr);
    }
    .home-feed-card__target-achievement.has-media,
    .home-feed-card__target-daily-goals.has-media {
      grid-template-columns: minmax(6.2rem, 28%) minmax(0, 1fr);
    }
    .home-feed-card__target-video.has-media {
      grid-template-columns: minmax(8.5rem, 32%) minmax(0, 1fr);
    }
    .home-feed-card__target-url.has-media {
      grid-template-columns: minmax(8.5rem, 32%) minmax(0, 1fr);
      align-items: stretch;
    }
    .home-feed-card__target-subject {
      align-items: stretch;
      padding: 0.65rem;
    }
    .home-feed-card__target-subject.has-build-embed-media {
      grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 28%);
    }
    .home-feed-card__target-subject .home-feed-card__target-copy {
      height: 100%;
      min-height: 0;
      justify-content: flex-start;
      gap: 0.24rem;
      overflow: hidden;
    }
    .home-feed-card__target-mission,
    .home-feed-card__target-achievement {
      border: 0;
      background: #fff;
    }
    .home-feed-card__target-mission {
      grid-template-columns: 5.7rem minmax(0, 1fr);
    }
    .home-feed-card__target-daily-reflection {
      display: grid;
      grid-template-columns: minmax(7.6rem, 34%) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) auto;
      min-width: 0;
      align-items: stretch;
      gap: 0.58rem 0.78rem;
      padding: 0.72rem 0.86rem;
      background: #fff;
    }
    .home-feed-card__target-daily-reflection--question-only {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
    }
    .home-feed-card__target-daily-reflection-question {
      grid-column: 1;
      grid-row: 1 / span 2;
      display: flex;
      min-height: 0;
      min-width: 0;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      padding: 0.62rem 0.7rem;
      border: 1px solid ${Color.borderGray()};
      border-radius: 0.7rem;
      background: ${Color.wellGray()};
    }
    .home-feed-card__target-daily-reflection--question-only .home-feed-card__target-daily-reflection-question {
      grid-column: 1;
      grid-row: 1;
    }
    .home-feed-card__target-daily-reflection-question > span {
      display: inline-flex;
      align-items: center;
      gap: 0.36rem;
      margin-bottom: 0.3rem;
      color: ${Color.darkGray()};
      font-size: 1rem;
      font-weight: 850;
      line-height: 1.1;
    }
    .home-feed-card__target-daily-reflection-question h4 {
      margin: 0;
      color: ${Color.darkerGray()};
      font-size: 1.12rem;
      font-style: italic;
      font-weight: 850;
      line-height: 1.18;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;
    }
    .home-feed-card__target-daily-reflection-answer {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      min-height: 0;
      min-width: 0;
      align-items: flex-start;
      overflow: hidden;
      padding-top: 0.15rem;
      color: ${Color.black()};
      font-size: max(1.62rem, 16.2px);
      font-weight: 400;
      line-height: 1.22;
    }
    .home-feed-card__target-daily-reflection-answer-text,
    .home-feed-card__target-daily-reflection-answer-text p {
      color: ${Color.black()};
      font-size: max(1.62rem, 16.2px);
      font-weight: 400;
      line-height: 1.22;
    }
    .home-feed-card__target-shared-topic {
      border-left: 0.35rem solid var(--home-feed-target-accent, ${Color.logoBlue()});
      background: #fff;
    }
    .home-feed-card__target-daily-goals {
      border-left: 0;
      background: #fff;
    }
    .home-feed-card__target-daily-goals.home-feed-card__daily-goals-preview--target {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-items: center;
      gap: 0.75rem;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      padding: 0.7rem 0.85rem;
    }
    .home-feed-card__target-daily-goals.home-feed-card__daily-goals-preview--target.has-media {
      grid-template-columns: minmax(5.8rem, 20%) minmax(0, 1fr);
    }
    .home-feed-card__daily-goals-preview--target .home-feed-card__daily-goals-card {
      transform: scale(0.72);
      transform-origin: center;
    }
    .home-feed-card__daily-goals-preview--target .home-feed-card__daily-goals-copy {
      justify-content: center;
      gap: 0.28rem;
      overflow: hidden;
    }
    .home-feed-card__daily-goals-preview--target .home-feed-card__reward-chips {
      gap: 0.35rem;
    }
    .home-feed-card__daily-goals-preview--target .home-feed-card__reward-chip {
      min-height: 1.65rem;
      padding: 0.26rem 0.52rem;
      font-size: 1.05rem;
    }
    .home-feed-card__daily-goals-preview--target h3 {
      margin: 0;
      padding-bottom: 0.02em;
      display: block;
      font-size: max(1.72rem, 17.2px);
      font-weight: 900;
      line-height: 1.08;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .home-feed-card__daily-goals-preview--target .home-feed-card__bonus-question {
      font-size: max(1.28rem, 12.8px);
      line-height: 1.18;
      -webkit-line-clamp: 1;
    }
    .home-feed-card__daily-goals-preview--target .home-feed-card__choice-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.3rem;
    }
    .home-feed-card__daily-goals-preview--target .home-feed-card__choice-list span {
      max-width: none;
      min-width: 0;
      padding: 0.3rem 0.45rem;
      border-radius: 0.45rem;
      font-size: max(1.08rem, 10.8px);
      line-height: 1.1;
    }
    .home-feed-card__mini-profile-panel {
      display: flex;
      height: 100%;
      min-width: 0;
      flex-direction: column;
      gap: 0.55rem;
      padding: 1rem 1.15rem 0.85rem;
      background: #fff;
    }
    .home-feed-card__mini-profile-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: #fff;
    }
    .home-feed-card__mini-profile-header {
      display: grid;
      grid-template-columns: 11rem minmax(16rem, 1fr) minmax(16rem, 36%);
      align-items: center;
      gap: 1.1rem;
      flex: 1 1 auto;
      min-height: 0;
    }
    .home-feed-card__mini-profile-avatar-wrap {
      display: flex;
      min-width: 0;
      align-items: center;
      justify-content: center;
    }
    .home-feed-card__mini-profile-avatar {
      flex-shrink: 0;
      --profile-status-dot-top: 78%;
      --profile-status-dot-left: 78%;
    }
    .home-feed-card__mini-profile-details {
      display: flex;
      min-width: 0;
      flex-direction: column;
      justify-content: center;
      gap: 0.35rem;
    }
    .home-feed-card__mini-profile-details h4 {
      margin: 0;
      overflow: hidden;
      color: ${Color.darkerGray()};
      font-size: 2.2rem;
      font-weight: 900;
      line-height: 1.08;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .home-feed-card__mini-profile-title-row {
      display: flex;
      min-width: 0;
      align-items: baseline;
      gap: 0.55rem;
      color: ${Color.gray()};
      line-height: 1.15;
    }
    .home-feed-card__mini-profile-title {
      display: inline-flex;
      min-width: 0;
      color: ${Color.darkGray()};
      font-size: 1.12rem;
      font-weight: 850;
      white-space: nowrap;
    }
    .home-feed-card__mini-profile-real-name {
      min-width: 0;
      overflow: hidden;
      color: ${Color.gray()};
      font-size: 1.12rem;
      font-weight: 750;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .home-feed-card__mini-profile-bio-panel {
      display: flex;
      min-width: 0;
      height: 100%;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      padding-left: 1rem;
      border-left: 1px solid ${Color.borderGray()};
    }
    .home-feed-card__mini-profile-bio {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 0.42rem;
      margin-top: 0.15rem;
      color: ${Color.darkerGray()};
      font-size: max(1.35rem, 13.5px);
      line-height: 1.28;
    }
    .home-feed-card__mini-profile-bio > div {
      display: grid;
      grid-template-columns: 0.7rem minmax(0, 1fr);
      align-items: start;
      gap: 0.45rem;
      min-width: 0;
      overflow: hidden;
    }
    .home-feed-card__mini-profile-bio-dot {
      color: ${Color.darkGray()};
      font-family: Arial, sans-serif;
      font-size: 1rem;
      line-height: 1.45;
    }
    .home-feed-card__mini-profile-empty-bio {
      margin-top: 0.2rem;
      overflow: hidden;
      color: ${Color.darkerGray()};
      font-size: max(1.35rem, 13.5px);
      font-weight: 750;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
    .home-feed-card__mini-profile-rank-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 0.85rem;
      min-height: 3.1rem;
      padding: 0.45rem 0.75rem;
      overflow: hidden;
      border: 1px solid ${Color.logoBlue(0.38)};
      border-radius: 0.75rem;
      background: #fff;
      color: ${Color.darkerGray()};
    }
    .home-feed-card__mini-profile-rank-strip.top-rank {
      border-color: ${Color.gold(0.7)};
      background: #000;
      color: #fff;
    }
    .home-feed-card__mini-profile-rank-left {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      min-width: 0;
      color: ${Color.darkGray()};
      font-size: 1.55rem;
    }
    .home-feed-card__mini-profile-rank-strip.top-rank
      .home-feed-card__mini-profile-rank-left {
      color: ${Color.gold()};
    }
    .home-feed-card__mini-profile-rank-left > span {
      font-size: 1.55rem;
    }
    .home-feed-card__mini-profile-rank-xp {
      min-width: 0;
      overflow: hidden;
      color: ${Color.logoGreen()};
      font-size: 1.16rem;
      font-weight: 900;
      line-height: 1;
      text-align: right;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .home-feed-card__mini-profile-rank-xp span {
      color: ${Color.gold()};
    }
    .home-feed-card__target-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 0.42rem;
      color: ${Color.darkerGray()};
      font-size: var(--home-feed-secondary-content-font-size);
      line-height: 1.34;
    }
    .home-feed-card__target-copy h4 {
      margin: 0;
      color: ${Color.black()};
      font-size: var(--home-feed-content-font-size);
      font-weight: 850;
      line-height: 1.18;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .home-feed-card__target-subject .home-feed-card__target-reward-bar,
    .home-feed-card__target-subject .home-feed-card__target-copy > h4 {
      flex: 0 0 auto;
    }
    .home-feed-card__target-subject .home-feed-card__target-copy > h4 {
      min-height: max(2.25rem, 22.5px);
    }
    .home-feed-card__target-copy h4 span {
      margin-left: 0.38rem;
      color: ${Color.darkGray()};
      font-size: 1.12rem;
      font-weight: 700;
    }
    .home-feed-card__target-subject-meta {
      display: block;
      min-width: 0;
      overflow: hidden;
      color: ${Color.gray()};
      font-size: max(1.12rem, 11.2px);
      font-weight: 700;
      line-height: 1.22;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .home-feed-card__target-subject .home-feed-card__target-subject-meta {
      flex: 0 0 auto;
      min-height: max(1.37rem, 13.7px);
    }
    .home-feed-card__target-copy p {
      margin: 0;
      color: ${Color.darkGray()};
      font-size: var(--home-feed-secondary-content-font-size);
      line-height: 1.34;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .home-feed-card__target-subject-description-slot {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }
    .home-feed-card__target-subject-description-slot > * {
      max-height: 100%;
    }
    .home-feed-card__target-subject-build-embed-preview {
      box-sizing: border-box;
      align-items: stretch;
      justify-content: stretch;
      width: 100%;
      height: 100%;
      min-height: 0;
      max-height: 100%;
      overflow: hidden;
      border: 1px solid ${Color.borderGray()};
      border-radius: 0.7rem;
      background: #fff;
    }
    .home-feed-card__target-subject-build-embed-preview > * {
      width: 100%;
      height: 100%;
      min-height: 0;
    }
    .home-feed-card__target-subject.has-media.has-reward
      .home-feed-card__target-subject-description {
      -webkit-line-clamp: 1;
    }
    .home-feed-card__target-subject-embed-slot {
      flex: 0 0 auto;
      min-height: 0;
      margin-top: 0.4rem;
    }
    .home-feed-card__target-subject-embed-slot,
    .home-feed-card__target-subject-embed-slot > *,
    .home-feed-card__target-subject-embed-slot
      .home-feed-card__target-subject-nested-embed {
      height: auto;
      max-height: none;
    }
    .home-feed-card__target-subject-embed-slot
      .home-feed-card__target-subject-nested-embed {
      display: block;
      width: 100%;
      border: 0;
      background: transparent;
    }
    .home-feed-card__target-chip {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      gap: 0.38rem;
      min-height: 1.9rem;
      padding: 0.32rem 0.58rem;
      border: 1px solid var(--home-feed-target-accent-border, ${Color.logoBlue(0.22)});
      border-radius: 999px;
      background: var(--home-feed-target-accent-soft, ${Color.logoBlue(0.1)});
      color: var(--home-feed-target-accent, ${Color.logoBlue()});
      font-size: 1.05rem;
      font-weight: 850;
      line-height: 1;
      white-space: nowrap;
    }
    .home-feed-card__target-chip.achievement,
    .home-feed-card__target-chip.mission {
      border-color: rgba(250, 193, 50, 0.36);
      background: rgba(250, 193, 50, 0.14);
      color: ${Color.gold()};
    }
    .home-feed-card__target-chip.daily-goals {
      border-color: ${Color.logoGreen(0.25)};
      background: ${Color.logoGreen(0.11)};
      color: ${Color.logoGreen()};
    }
    .home-feed-card__target-chip.reflection {
      border-color: ${Color.pink(0.24)};
      background: ${Color.pink(0.1)};
      color: ${Color.pink()};
    }
    .home-feed-card__target-chip.shared-topic {
      border-color: var(--home-feed-target-accent-border, ${Color.logoBlue(0.24)});
      background: var(--home-feed-target-accent-soft, ${Color.logoBlue(0.1)});
      color: var(--home-feed-target-accent, ${Color.logoBlue()});
    }
    .home-feed-card__target-chip.profile {
      border-color: ${Color.logoGreen(0.25)};
      background: ${Color.logoGreen(0.1)};
      color: ${Color.logoGreen()};
    }
    .home-feed-card__target-chip.url {
      border-color: ${Color.logoBlue(0.25)};
      background: ${Color.logoBlue(0.1)};
      color: ${Color.logoBlue()};
    }
    .home-feed-card__target-chip.build {
      border-color: ${Color.logoBlue(0.25)};
      background: ${Color.logoBlue(0.1)};
      color: ${Color.logoBlue()};
    }
    .home-feed-card__target-url .home-feed-card__target-copy {
      justify-content: center;
      gap: 0.16rem;
      overflow: hidden;
    }
    .home-feed-card__target-url .home-feed-card__target-copy h4 {
      padding-bottom: 0.04em;
      line-height: 1.12;
    }
    .home-feed-card__target-url .home-feed-card__target-copy p {
      font-size: max(1.62rem, 16.2px);
      line-height: 1.16;
      -webkit-line-clamp: 1;
    }
    .home-feed-card__target-site {
      display: block;
      flex: 0 0 auto;
      min-width: 0;
      min-height: 1.36rem;
      overflow: hidden;
      color: ${Color.darkGray()};
      font-size: 1.12rem;
      font-weight: 850;
      line-height: 1.18;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .home-feed-card__target-reward-bar {
      margin-bottom: 0.1rem;
      min-height: 2.4rem;
      padding: 0.36rem 0.58rem;
      border-radius: 0.65rem;
    }
    .home-feed-card__target-reward-bar .home-feed-card__compact-effort-label,
    .home-feed-card__target-reward-bar .home-feed-card__compact-effort-xp {
      font-size: 1rem;
    }
    .home-feed-card__target-reward-bar .home-feed-card__compact-effort-stars {
      font-size: 1.08rem;
    }
    .home-feed-card__target-reward-bar .home-feed-card__compact-effort-xp {
      display: none;
    }
    .home-feed-card__target-achievement-badge,
    .home-feed-card__target-mission-icon {
      display: flex;
      min-width: 0;
      align-items: center;
      justify-content: center;
    }
    .home-feed-card__target-achievement-badge > div {
      padding: 0;
    }
    .home-feed-card__target-mission-icon {
      width: 4.7rem;
      height: 4.7rem;
      justify-self: center;
      border-radius: 1.1rem;
      background: rgba(250, 193, 50, 0.2);
      color: ${Color.gold()};
      font-size: 2rem;
      box-shadow: inset 0 0 0 1px rgba(250, 193, 50, 0.28);
    }
    .home-feed-card__target-reward-row,
    .home-feed-card__target-reflection-footer {
      display: flex;
      min-width: 0;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.05rem;
    }
    .home-feed-card__target-daily-reflection .home-feed-card__target-reflection-footer {
      grid-column: 2;
      grid-row: 2;
      overflow: hidden;
    }
    .home-feed-card__target-daily-reflection--question-only .home-feed-card__target-reflection-footer {
      display: none;
    }
    .home-feed-card__target-reward-row .home-feed-card__reward-chip,
    .home-feed-card__target-reflection-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.34rem;
      min-height: 1.85rem;
      padding: 0.3rem 0.56rem;
      border-radius: 999px;
      font-size: 1.05rem;
      font-weight: 800;
      line-height: 1;
      white-space: nowrap;
    }
    .home-feed-card__target-reflection-badge--refined {
      border: 0;
      background: transparent;
      color: ${Color.gray()};
      font-style: italic;
    }
    .home-feed-card__target-reflection-badge--masterpiece {
      border: 1px solid ${Color.gold(0.34)};
      background: ${Color.gold(0.13)};
      color: ${Color.gold()};
    }
    .home-feed-card__target-reflection-badge--xp {
      gap: 0.22rem;
      border: 0;
      background: transparent;
      padding-left: 0.15rem;
      padding-right: 0.15rem;
    }
    .home-feed-card__target-reflection-xp-number {
      color: ${Color.logoGreen()};
      font-size: 1.12rem;
      font-weight: 900;
    }
    .home-feed-card__target-reflection-xp-label {
      color: ${Color.gold()};
      font-size: 1.12rem;
      font-weight: 900;
    }
    .home-feed-card__target-reflection-badge--streak {
      border: 0;
      background: transparent;
      color: var(--home-feed-target-streak-color, ${Color.orange()});
    }
    .home-feed-card__target-reflection-refined-icon,
    .home-feed-card__target-reflection-fire {
      font-size: 1.08rem;
      line-height: 1;
    }
    .home-feed-card__target-reflection-fire {
      color: var(--home-feed-target-streak-color, ${Color.orange()});
    }
    .home-feed-card__target-reward-row .home-feed-card__reward-chip svg,
    .home-feed-card__target-reflection-badge svg {
      font-size: 1rem;
    }
    .home-feed-card__target-media,
    .home-feed-card__target-media-wrap {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      max-height: 100%;
      overflow: hidden;
      border: 1px solid ${Color.borderGray()};
      border-radius: 0.7rem;
      background: ${Color.whiteGray()};
    }
    .home-feed-card__target-media img,
    .home-feed-card__target-media-wrap img {
      width: 100%;
      height: 100%;
      max-height: none;
      object-fit: contain;
    }
    .home-feed-card__target-url .home-feed-card__target-media {
      align-self: stretch;
      object-fit: cover;
    }
    .home-feed-card__target-build-card {
      box-sizing: border-box;
      grid-template-columns: minmax(0, 1fr) minmax(8rem, 13rem);
      gap: 0.72rem;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      padding: 0.74rem 0.88rem;
      border: 0;
      border-left: 0.35rem solid var(--home-feed-target-accent, ${Color.logoBlue()});
      border-radius: 0;
      background: #fff;
      box-shadow: none;
    }
    .home-feed-card__target-preview .home-feed-card__ai-story-preview--target {
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      border: 0;
      border-radius: 0;
    }
    .home-feed-card__ai-story-preview--target .home-feed-card__ai-story-topline {
      color: var(--home-feed-ai-story-color);
      font-size: 1.05rem;
    }
    .home-feed-card__ai-story-preview--target h3 {
      font-size: max(1.65rem, 16.5px);
      line-height: 1.16;
      -webkit-line-clamp: 2;
    }
    .home-feed-card__ai-story-preview--target .home-feed-card__ai-story-main {
      gap: 0.5rem;
    }
    .home-feed-card__ai-story-preview--target.home-feed-card__ai-story-preview--has-image
      .home-feed-card__ai-story-main {
      grid-template-columns: minmax(0, 1fr) minmax(6.8rem, 34%);
    }
    .home-feed-card__ai-story-preview--target .home-feed-card__ai-story-copy {
      gap: 0.5rem;
    }
    .home-feed-card__ai-story-preview--target .home-feed-card__ai-story-story {
      font-size: max(1.32rem, 13.2px);
      line-height: 1.32;
    }
    .home-feed-card__ai-story-preview--target .home-feed-card__audio-wave--small {
      justify-content: center;
      min-height: 3.25rem;
      margin: auto 0;
    }
    .home-feed-card__target-comment {
      position: relative;
      display: grid;
      grid-template-columns: 7.8rem minmax(0, 1fr);
      align-items: center;
      gap: 0.8rem;
      height: 100%;
      padding: 0.85rem;
      background: #fff;
    }
    .home-feed-card__target-comment--media-only {
      display: block;
      padding: 0.25rem;
    }
    .home-feed-card__target-comment--attachment-only {
      display: grid;
      grid-template-columns: minmax(7rem, 22%) minmax(0, 1fr);
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem;
      background: #fff;
    }
    .home-feed-card__target-comment-profile {
      display: flex;
      min-width: 0;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      color: ${Color.darkGray()};
      font-size: 1.12rem;
      font-weight: 800;
      line-height: 1.15;
      text-align: center;
    }
    .home-feed-card__target-comment--media-only
      .home-feed-card__target-comment-profile {
      position: absolute;
      top: 0.7rem;
      left: 0.7rem;
      z-index: 1;
      max-width: calc(100% - 1.4rem);
      flex-direction: row;
      padding: 0.35rem 0.55rem 0.35rem 0.35rem;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 10px 26px -22px rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
    }
    .home-feed-card__target-comment--attachment-only
      .home-feed-card__target-comment-profile {
      position: static;
      flex-direction: row;
      justify-content: center;
      max-width: none;
      padding: 0.35rem 0.5rem 0.35rem 0.35rem;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.84);
      box-shadow: none;
      backdrop-filter: none;
    }
    .home-feed-card__target-comment-profile span {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .home-feed-card__target-comment-content {
      min-width: 0;
      color: ${Color.darkerGray()};
      font-size: var(--home-feed-secondary-content-font-size);
      line-height: 1.34;
    }
    .home-feed-card__target-comment-content.has-embed {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(8rem, 34%);
      align-items: center;
      gap: 0.75rem;
      height: 100%;
    }
    .home-feed-card__target-comment--media-only
      .home-feed-card__target-comment-content.has-embed {
      display: block;
      height: 100%;
    }
    .home-feed-card__target-comment--attachment-only
      .home-feed-card__target-comment-content.has-embed {
      display: block;
      height: 100%;
    }
    .home-feed-card__target-comment-attachment {
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }
    .home-feed-card__target-comment-attachment .home-feed-card__attachment-card {
      padding: 0.55rem 0.7rem;
    }
    .home-feed-card__target-comment-attachment
      .home-feed-card__attachment-card-icon {
      width: 3.1rem;
      height: 3.1rem;
      border-radius: 0.85rem;
      font-size: 1.45rem;
    }
    .home-feed-card__target-comment-attachment
      .home-feed-card__attachment-card-copy strong {
      font-size: 1.08rem;
    }
    .home-feed-card__target-comment-content.has-embed
      .home-feed-card__target-comment-embed:first-child {
      grid-column: 1 / -1;
    }
    .home-feed-card__target-comment-preview.compact-comment-embed--target-root.compact-comment-embed--has-media,
    .home-feed-card__target-comment-preview.compact-comment-embed--target-root.compact-comment-embed--media-only {
      grid-template-columns: 4.8rem minmax(0, 1fr) minmax(15rem, 22rem);
    }
    .home-feed-card__target-comment-embed {
      width: 100%;
      height: 100%;
      min-height: 0;
      max-height: 100%;
      object-fit: contain;
      overflow: hidden;
      border-radius: 0.7rem;
      background: #fff;
    }
    .home-feed-card__target-comment:not(.home-feed-card__target-comment--media-only)
      .home-feed-card__target-comment-embed {
      border: 1px solid ${Color.borderGray()};
      background: ${Color.whiteGray()};
    }
    .home-feed-card__target-comment:not(.home-feed-card__target-comment--media-only)
      .home-feed-card__target-comment-embed.home-feed-card__rich-embed-internal {
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    .home-feed-card__target-comment-preview
      .compact-comment-embed__media-tile.ai-card
      > div {
      width: min(100%, 12.6rem) !important;
      height: min(100%, 17.6rem) !important;
      border-radius: 0.62rem !important;
      box-shadow:
        0 0 0.62rem rgba(236, 72, 153, 0.5),
        0 0.85rem 1.35rem -0.72rem rgba(15, 23, 42, 0.62);
      transform: none !important;
    }
`;
