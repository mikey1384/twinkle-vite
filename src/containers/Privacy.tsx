import React, { useRef } from 'react';
import { css } from '@emotion/css';
import { borderRadius } from '~/constants/css';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';
import { SITE_FULL_NAME, SITE_URL_LABEL } from '~/constants/siteBrand';

export default function Privacy() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useScrollAnchorRestoration({
    anchorKey: 'privacy',
    containerRef,
    initialScroll: { type: 'top' },
    itemsReady: true
  });

  return (
    <div
      ref={containerRef}
      className={css`
        padding: 2rem;
        margin: 2rem auto;
        max-width: 800px;
        background: #ffffff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-family:
          'Inter',
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          sans-serif;
        color: #333333;
        line-height: 1.6;

        @media (max-width: 768px) {
          border: none;
          padding: 1.5rem;
          margin: 1rem auto;
          padding-bottom: 12rem;
        }
      `}
    >
      <h1
        className={css`
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          color: #2c3e50;
          font-weight: 700;
        `}
      >
        Privacy Policy
      </h1>

      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
          font-weight: 600;
        `}
      >
        Effective Date: January 23, 2019
      </p>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
          font-weight: 600;
        `}
      >
        Last Updated: September 27, 2026
      </p>

      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        {`${SITE_FULL_NAME} ("we," "us," or "our") is a personal project created and
        operated by Mikey Lee. The website, https://${SITE_URL_LABEL} (the
        "Service"), is managed and developed independently by Mikey Lee. Twinkle
        English Academy, a language institution in Korea, supports the Service
        by funding the server, owning the domain, and covering the OpenAI API
        costs. However, they do not own the website or have any involvement in
        its development.`}
      </p>

      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        The Service began as a communication tool and homework platform for
        Twinkle English Academy students and teachers, who join through a
        passphrase-protected sign-up. People outside the academy can also join,
        but only by invitation: after playing with a Twinkle user in a private
        room of one of our apps, or after a moderator of our Minecraft server
        vouches for them. Every sign-up requires a verified email address. By
        creating an account and using the Service, users (and, for younger
        users, their parents or guardians) consent to data collection and use as
        outlined in this policy.
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Information Collection and Use
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        We collect and use the following types of data to operate and improve
        the Service:
      </p>

      <h3
        className={css`
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #34495e;
          font-weight: 600;
        `}
      >
        Personal Data
      </h3>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        We may collect personally identifiable information, such as email
        address, first and last name, and Cookies and Usage Data. This data may
        be used to communicate with you about Service updates, educational
        materials, and activities related to the Service and Twinkle English
        Academy.
      </p>

      <h3
        className={css`
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #34495e;
          font-weight: 600;
        `}
      >
        Invitations and Linked Accounts
      </h3>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        {`When you join by invitation, we permanently record who invited you
        (their account, or for a Minecraft vouch, the voucher's Minecraft
        account). This keeps invitations accountable and lets us credit
        inviters, for example with a count on their profile. If you join
        through a Minecraft vouch, your Minecraft username and account ID are
        linked to your Twinkle account. While you play our apps as a guest
        before signing up, we record limited play-session data (a random guest
        ID, the room, and time played together) to issue invitations and
        prevent abuse.`}
      </p>

      <h3
        className={css`
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #34495e;
          font-weight: 600;
        `}
      >
        Usage Data
      </h3>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        We collect data on how the Service is accessed and used, including IP
        address, browser type, and pages visited. This data helps us understand
        user behavior and improve the Service.
      </p>

      <h3
        className={css`
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #34495e;
          font-weight: 600;
        `}
      >
        Tracking & Cookies Data
      </h3>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        We use cookies and similar technologies to track activity on the
        Service. You can manage your cookie preferences through your browser
        settings.
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Children’s Privacy
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        {`Given that the Service is used by students, we take special
        precautions to protect the privacy of users under 13. For academy
        students, consent is established through the passphrase-protected
        sign-up. Users under 14 who join by invitation need a parent or
        guardian's consent: we email the parent or guardian, and the account is
        created only after they approve. We keep a record of that consent. We
        encourage parents and guardians to monitor their children's use of the
        Service. If we inadvertently collect data from children under 13
        without proper safeguards, we will take steps to delete it promptly.`}
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Chat Feature and Communication
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        {`The Service includes a chat feature for its members. Replies from our AI
        helpers and the Service's public posts are reviewed every day, and chats
        between members are reviewed when a member reports them. Your chat
        history is part of your story on Twinkle, so we keep your messages,
        when they were sent, and who sent them for as long as your account
        exists, and you can look back on them years later. You can delete your
        own messages: a deleted message disappears from the chat for everyone,
        but it stays in our records. When a message is reported, we keep a copy
        of it for our safety review. If a report involves a child's safety, we
        preserve the whole conversation and both members' account records,
        including anything deleted or edited afterwards, until our review is
        complete.`}
      </p>

      <h3
        className={css`
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #34495e;
          font-weight: 600;
        `}
      >
        Parental Involvement
      </h3>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        Parents are encouraged to oversee their children’s use of the chat
        feature and can request access to or deletion of their child’s chat data
        by emailing us from the address they used to give consent. We handle
        each request ourselves.
      </p>

      <h3
        className={css`
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #34495e;
          font-weight: 600;
        `}
      >
        Monitoring and Safety Measures
      </h3>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        {`Members can report another member's chat message from that message's
        menu, choosing a reason and optionally adding a note. When a message is
        reported, we keep a copy of it and of a few messages around it so our
        team can review it; the reported member is not told about the report.
        Members can also block another member from that member's profile or
        from their direct chat. Direct messages between the two then stop in
        both directions, and the blocked member's messages in group chats are
        hidden for the member who blocked them. The blocked member is not notified, and a block can
        be removed at any time, including from Settings.`}
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Data Use and Security
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        Your data is used to operate and improve the Service, communicate
        updates, and ensure compliance with legal obligations and Service
        guidelines. We share information with police or other authorities when
        the law requires it, or when it is needed to protect a child from
        serious harm. Your data may be transferred to servers located in Japan.
        We take reasonable precautions to protect your data, but no security
        measures are foolproof.
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Your Rights
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        As a user (or parent of a user), you have rights regarding your data:
        access, rectification, erasure, restriction, objection, data
        portability, and withdrawal of consent. Contact us to exercise these
        rights and we will handle your request ourselves. Information under a
        child-safety review is kept until that review is complete, where the law
        allows.
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Service Providers
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        We may use third-party providers to process your data, such as for
        analytics or payment processing. These providers have access to your
        data only to perform specific tasks on our behalf and are required to
        protect it.
      </p>

      <h3
        className={css`
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #34495e;
          font-weight: 600;
        `}
      >
        Google Analytics
      </h3>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        We use Google Analytics to understand how the Service is used. You can
        opt out by using the Google Analytics opt-out browser add-on.
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Changes to This Privacy Policy
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        We may update this Privacy Policy periodically. Significant changes will
        be communicated via email or a prominent notice on the Service.
      </p>

      <h2
        className={css`
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #2c3e50;
          font-weight: 600;
        `}
      >
        Contact Us
      </h2>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        `}
      >
        If you have any questions about this Privacy Policy, please contact us:
      </p>
      <ul
        className={css`
          list-style-type: none;
          padding-left: 0;
          margin-bottom: 1.25rem;
        `}
      >
        <li
          className={css`
            margin-bottom: 0.5rem;
          `}
        >
          By email: mikey@twin-kle.com
        </li>
      </ul>
    </div>
  );
}
