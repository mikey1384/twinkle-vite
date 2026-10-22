import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

// Shared with the settings dialog, whose portal sits outside the chat panel.
export const workshopThemeClass = css`
  --build-chat-accent: #2563eb;
  --build-chat-accent-strong: #1d4ed8;
  --build-chat-user-bg: #eef6ff;
  --build-chat-user-text: #1f2937;
  --build-chat-user-border: rgba(65, 140, 235, 0.28);
  --theme-bg: var(--build-chat-accent);
  --theme-hover-bg: var(--build-chat-accent-strong);
  --theme-text: #ffffff;
  --theme-border: var(--build-chat-accent);
  --ui-border: rgba(148, 163, 184, 0.28);
  --ui-border-strong: rgba(65, 140, 235, 0.52);
  --chat-bg: #f8fafc;
  --chat-title-bg: #eef4ff;
  --chat-hover-bg: #f1f6ff;
  --chat-hover-title-bg: #e2edff;
  --chat-text: #2f3747;
  --chat-border: rgba(148, 163, 184, 0.34);
  /* Reading text (messages, input, prompts) is sized close to the main site
     chat (1.6rem messages); chrome and fine print (label/meta/small/tiny)
     stay compact so the dense header/settings rows don't overflow.
     --build-workshop-font-scale is set inline by the component (desktop
     panel-width scaling); the bases must stay here in CSS so the mobile
     breakpoint below can override them. */
  --build-workshop-font-scale: 1;
  --build-workshop-title-font-size: calc(
    1.6rem * var(--build-workshop-font-scale)
  );
  --build-workshop-body-font-size: calc(
    1.4rem * var(--build-workshop-font-scale)
  );
  --build-workshop-label-font-size: calc(
    1.2rem * var(--build-workshop-font-scale)
  );
  --build-workshop-meta-font-size: calc(
    1.1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-small-font-size: calc(
    1.1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-tiny-font-size: max(
    1rem,
    1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-message-font-size: calc(
    1.5rem * var(--build-workshop-font-scale)
  );
  --build-workshop-message-meta-font-size: calc(
    1.1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-input-font-size: calc(
    1.5rem * var(--build-workshop-font-scale)
  );
  --build-workshop-prompt-font-size: calc(
    1.4rem * var(--build-workshop-font-scale)
  );
  --build-workshop-choice-font-size: calc(
    1.3rem * var(--build-workshop-font-scale)
  );
  font-size: var(--build-workshop-body-font-size);
  @media (max-width: ${mobileMaxWidth}) {
    /* The site root font drops from 10px to 8px at this breakpoint
       (styles.css), which would shrink all the sizes above by 20% on
       phones; these overrides restore roughly the same physical px sizes
       as desktop. */
    --build-workshop-title-font-size: calc(
      2rem * var(--build-workshop-font-scale)
    );
    --build-workshop-body-font-size: calc(
      1.7rem * var(--build-workshop-font-scale)
    );
    --build-workshop-label-font-size: calc(
      1.4rem * var(--build-workshop-font-scale)
    );
    --build-workshop-meta-font-size: calc(
      1.3rem * var(--build-workshop-font-scale)
    );
    --build-workshop-small-font-size: calc(
      1.3rem * var(--build-workshop-font-scale)
    );
    --build-workshop-tiny-font-size: calc(
      1.2rem * var(--build-workshop-font-scale)
    );
    --build-workshop-message-font-size: calc(
      1.8rem * var(--build-workshop-font-scale)
    );
    --build-workshop-message-meta-font-size: calc(
      1.3rem * var(--build-workshop-font-scale)
    );
    --build-workshop-input-font-size: calc(
      1.8rem * var(--build-workshop-font-scale)
    );
    --build-workshop-prompt-font-size: calc(
      1.7rem * var(--build-workshop-font-scale)
    );
    --build-workshop-choice-font-size: calc(
      1.6rem * var(--build-workshop-font-scale)
    );
  }
`;
