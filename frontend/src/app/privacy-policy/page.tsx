export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: February 26, 2026
      </p>

      <div className="space-y-8 text-base leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
          <p>
            CURaise is a fundraising platform built for student organizations at
            Cornell University. This Privacy Policy explains how we collect,
            use, disclose, and protect your personal information when you use
            our platform at CURaise.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            2. Information We Collect
          </h2>
          <h3 className="text-lg font-medium mb-2">
            2.1 Information You Provide
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account information:</strong> When you sign in with
              Google, we receive your name and email address from your Google
              account.
            </li>
            <li>
              <strong>Organization information:</strong> If you create or manage
              an organization, we collect the organization name, description,
              logo, website URL, and Instagram username.
            </li>
            <li>
              <strong>Fundraiser information:</strong> We collect fundraiser
              details such as name, description, images, and associated Venmo
              account information provided by organizers.
            </li>
            <li>
              <strong>Order information:</strong> When you place an order, we
              collect the items purchased, quantities, and your chosen payment
              method (Venmo or other).
            </li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">
            2.2 Information Collected Automatically
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Usage data:</strong> We may collect information about how
              you interact with our platform, including pages visited and
              actions taken.
            </li>
            <li>
              <strong>Device information:</strong> We may collect browser type,
              operating system, and IP address for security and analytics
              purposes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To create and manage your account</li>
            <li>To process and track your orders</li>
            <li>
              To send transactional emails (e.g., order confirmations,
              announcements) via Mailgun
            </li>
            <li>
              To enable referral tracking so organizers can attribute sales
            </li>
            <li>
              To display your name and email to organization administrators for
              order fulfillment and pickup coordination
            </li>
            <li>
              To allow organization admins to invite members and manage their
              organizations
            </li>
            <li>To improve and maintain the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            4. How We Share Your Information
          </h2>
          <p className="mb-3">
            We do not sell your personal information. We share your information
            only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Organization administrators:</strong> When you place an
              order, your name, email, and order details are visible to the
              administrators of the fundraiser&apos;s organization for
              fulfillment purposes.
            </li>
            <li>
              <strong>Service providers:</strong> We use trusted third-party
              services including Supabase (authentication and database
              infrastructure), Mailgun (email delivery), Heroku (backend
              hosting), and Netlify (frontend hosting). These providers process
              data only as necessary to provide their services.
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose your
              information if required by law or in response to valid legal
              process.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Data Retention</h2>
          <p>
            We retain your account information and order history for as long as
            your account is active or as needed to provide you with our
            services. You may request deletion of your account and associated
            data by contacting us at the email address below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Security</h2>
          <p>
            We use industry-standard security measures including JWT-based
            authentication through Supabase and encrypted connections (HTTPS) to
            protect your personal information. However, no method of
            transmission over the Internet is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and personal data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us using the
            information in the &quot;Contact Us&quot; section below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            8. Third-Party Links and Services
          </h2>
          <p>
            Our platform may link to external services such as Venmo for payment
            processing and organization websites. We are not responsible for the
            privacy practices of these third-party services. We encourage you to
            review their privacy policies before providing any personal
            information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            9. Children&apos;s Privacy
          </h2>
          <p>
            CURaise is intended for use by college students and is not directed
            at children under the age of 13. We do not knowingly collect
            personal information from children under 13. If we become aware that
            we have inadvertently collected such information, we will delete it
            promptly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting the new policy on this page
            with an updated date. Your continued use of CURaise after any
            changes constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or your personal data, please contact the CURaise
            team at Cornell University.
          </p>
        </section>
      </div>
    </div>
  );
}
