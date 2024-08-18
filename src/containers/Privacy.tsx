import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';

export default function Privacy() {
  return (
    <div
      className={css`
        padding: 2rem;
        margin: 2rem auto;
        max-width: 800px;
        background: #ffffff;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
          'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
          'Helvetica Neue', sans-serif;
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
          font-size: 1rem;
          font-weight: 600;
        `}
      >
        Effective Date: January 23, 2019
      </p>
      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1rem;
          font-weight: 600;
        `}
      >
        Last Updated: August 17, 2024
      </p>

      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1rem;
        `}
      >
        {`Twinkle Network ("we," "us," or "our") is a personal project created and
        operated by Mikey Lee. The website, https://www.twin-kle.com (the
        "Service"), is managed and developed independently by Mikey Lee. Twinkle
        English Academy, a language institution in Korea, supports the Service
        by funding the server, owning the domain, and covering the OpenAI API
        costs. However, they do not own the website or have any involvement in
        its development.`}
      </p>

      <p
        className={css`
          margin-bottom: 1.25rem;
          font-size: 1rem;
        `}
      >
        The Service is exclusively accessible to Twinkle English Academy
        students through a passphrase-protected login. It serves as a
        communication tool and homework platform for students and teachers. By
        accessing the Service, users (students and their parents) have provided
        implicit consent for data collection and use as outlined in this policy.
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
          font-size: 1rem;
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
          font-size: 1rem;
        `}
      >
        We may collect personally identifiable information, such as email
        address, first and last name, and Cookies and Usage Data. This data may
        be used to communicate with you about Service updates, educational
        materials, and activities related to Twinkle English Academy.
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
          font-size: 1rem;
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
          font-size: 1rem;
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
          font-size: 1rem;
        `}
      >
        {`Given that the Service is designed for students, we take special
        precautions to protect the privacy of users under 13. Although consent
        for participation is implicitly established by the use of the
        passphrase-protected platform, we encourage parents and guardians to
        monitor their children's use of the Service. If we inadvertently collect
        data from children under 13 without proper safeguards, we will take
        steps to delete it promptly.`}
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
          font-size: 1rem;
        `}
      >
        The Service includes a chat feature for students and teachers. We
        monitor this feature to ensure it complies with our guidelines and to
        maintain a safe environment. Chat data, including messages, timestamps,
        and user IDs, may be retained temporarily to ensure safety and
        compliance.
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
          font-size: 1rem;
        `}
      >
        Parents are encouraged to oversee their children’s use of the chat
        feature and can request access to or deletion of their child’s chat
        data.
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
          font-size: 1rem;
        `}
      >
        We may use automated tools to monitor chats for inappropriate content.
        Users can report any concerns directly within the chat feature.
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
          font-size: 1rem;
        `}
      >
        Your data is used to operate and improve the Service, communicate
        updates, and ensure compliance with legal obligations and Service
        guidelines. Your data may be transferred to servers located in Japan. We
        take reasonable precautions to protect your data, but no security
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
          font-size: 1rem;
        `}
      >
        As a user (or parent of a user), you have rights regarding your data:
        access, rectification, erasure, restriction, objection, data
        portability, and withdrawal of consent. Contact us to exercise these
        rights.
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
          font-size: 1rem;
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
          font-size: 1rem;
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
          font-size: 1rem;
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
          font-size: 1rem;
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
