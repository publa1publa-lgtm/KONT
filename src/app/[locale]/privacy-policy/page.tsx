import "./privacy-policy.css";

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <div className="privacy-page__backdrop" aria-hidden="true" />
      <div className="privacy-page__content">
        <div className="privacy-page__panel">
          <h1 className="privacy-page__title">Privacy Policy — Kont</h1>
          <p className="privacy-page__subtitle">Last updated: May 31, 2026</p>

          <article className="privacy-page__article">
            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">1. Introduction</h2>
              <p className="privacy-page__text">
                Welcome to Kont (“we”, “us”, or “our”). We are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform at <a href="https://www.kontme.com">www.kontme.com</a>.
              </p>
              <p className="privacy-page__text">
                By using Kont, you agree to the collection and use of information in accordance with this policy. We may update this policy from time to time and will notify you of any significant changes.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">2. Information We Collect</h2>
              <p className="privacy-page__text">We collect the following information when you register and use our platform:</p>
              <ul className="privacy-page__list">
                <li className="privacy-page__list-item"><strong>Name</strong> (if provided)</li>
                <li className="privacy-page__list-item"><strong>Email address</strong></li>
                <li className="privacy-page__list-item"><strong>Social media profile information</strong> (such as your Instagram or Pinterest account details, accessed via official APIs)</li>
                <li className="privacy-page__list-item"><strong>Content you create or schedule</strong> through our platform</li>
              </ul>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">3. How We Use Your Information</h2>
              <p className="privacy-page__text">We use the information we collect to:</p>
              <ul className="privacy-page__list">
                <li className="privacy-page__list-item">Create and manage your account</li>
                <li className="privacy-page__list-item">Allow you to schedule and publish content to your connected social media platforms</li>
                <li className="privacy-page__list-item">Send you platform-related emails (such as account notifications and updates)</li>
                <li className="privacy-page__list-item">Improve and maintain our platform</li>
              </ul>
              <p className="privacy-page__text">
                We do <strong>not</strong> use your data for advertising purposes. We do <strong>not</strong> sell your data to third parties.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">4. Social Media Integrations and Permissions</h2>
              <p className="privacy-page__text">
                Kont integrates with third-party platforms such as Pinterest and Instagram via their official APIs. When you connect your social media accounts, you are presented with a clear permissions screen that lists exactly what access we are requesting.
              </p>
              <p className="privacy-page__text"><strong>You are in control:</strong></p>
              <ul className="privacy-page__list">
                <li className="privacy-page__list-item">All permissions are shown transparently before any connection is made</li>
                <li className="privacy-page__list-item">Permissions are pre-selected by default for the best experience, but you may deselect any permission you are not comfortable with</li>
                <li className="privacy-page__list-item">If certain permissions are not granted, some features of the platform may not be available, and you will be informed accordingly</li>
                <li className="privacy-page__list-item">You can disconnect your social media accounts at any time from your account settings</li>
              </ul>
              <p className="privacy-page__text">
                We access only the data you explicitly authorize. We handle your social media data in accordance with the terms and policies of each respective platform.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">5. Email Communications</h2>
              <p className="privacy-page__text">
                By creating an account, you agree to receive emails from us related to your account and platform activity. You may opt out of non-essential emails at any time by contacting us at the email below.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">6. Data Storage and Security</h2>
              <p className="privacy-page__text">
                We take reasonable measures to protect your personal information from unauthorized access, loss, or misuse. Your data is stored securely and accessed only by authorized personnel.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">7. Cookies and Analytics</h2>
              <p className="privacy-page__text">
                We may use cookies to improve your experience on our platform. In the future, we may integrate analytics tools such as Google Analytics to better understand how our platform is used. This policy will be updated accordingly when such changes are made.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">8. Your Rights</h2>
              <p className="privacy-page__text">You have the right to:</p>
              <ul className="privacy-page__list">
                <li className="privacy-page__list-item">Access the personal data we hold about you</li>
                <li className="privacy-page__list-item">Request correction or deletion of your data</li>
                <li className="privacy-page__list-item">Withdraw consent at any time</li>
              </ul>
              <p className="privacy-page__text">
                To exercise any of these rights, please contact us at: <a href="mailto:hello@kontme.com">hello@kontme.com</a>
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">9. Children’s Privacy</h2>
              <p className="privacy-page__text">
                Our platform is not intended for users under the age of 13. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">10. Changes to This Policy</h2>
              <p className="privacy-page__text">
                We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with an updated date. Continued use of the platform after changes constitutes acceptance of the new policy.
              </p>
            </section>

            <section className="privacy-page__section">
              <h2 className="privacy-page__section-title">11. Contact Us</h2>
              <p className="privacy-page__text">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <p className="privacy-page__text">
                <strong>Email:</strong> <a href="mailto:support@kontme.com">support@kontme.com</a><br />
                <strong>Website:</strong> <a href="https://www.kontme.com">www.kontme.com</a>
              </p>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
