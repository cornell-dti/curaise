import FormData from "form-data";
import Mailgun from "mailgun.js";
import { z } from "zod";
import {
  BasicOrderSchema,
  BasicFundraiserSchema,
  UserSchema,
  AnnouncementSchema,
  CompleteOrganizationSchema,
} from "common";
import { format } from "date-fns";

type Order = z.infer<typeof BasicOrderSchema>;

// Configuration
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "curaise.app";
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";
const CURAISE_URL = "https://www.curaise.app";
const LOGO_URL = `${CURAISE_URL}/images/curaise-icon-square.png`;

// Initialize Mailgun client
const initMailgun = async () => {
  try {
    const mailgun = new Mailgun(FormData);
    return mailgun.client({
      username: "api",
      key: MAILGUN_API_KEY,
    });
  } catch (error) {
    console.error("Failed to initialize Mailgun:", error);
    throw error;
  }
};

/**
 * Wrap email body content in a branded HTML template
 */
const wrapInTemplate = (
  content: string,
  options?: { ctaText?: string; ctaUrl?: string },
): string => {
  const ctaText = options?.ctaText || "Visit CURaise";
  const ctaUrl = options?.ctaUrl || CURAISE_URL;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CURaise</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'DM Sans', Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 32px 40px 20px 40px; background-color: #ffffff;">
              <a href="${CURAISE_URL}" target="_blank" style="text-decoration: none;">
                <img src="${LOGO_URL}" alt="CURaise" width="60" height="60" style="display: block; border: 0; outline: none;">
              </a>
            </td>
          </tr>
          <!-- Green Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 3px solid #C6DDC8; margin: 0;"></div>
            </td>
          </tr>
          <!-- Email Content -->
          <tr>
            <td style="padding: 32px 40px; color: #333333; font-size: 15px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          <!-- Green Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 3px solid #C6DDC8; margin: 0;"></div>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 28px 40px 16px 40px;">
              <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #265B34; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 6px;">${ctaText}</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 8px 40px 32px 40px;">
              <p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} <a href="${CURAISE_URL}" target="_blank" style="color: #265B34; text-decoration: none;">CURaise</a> &mdash; Your one stop platform for fundraising.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Style helpers for consistent email content elements
 */
const styles = {
  h1: `style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #265B34; font-family: 'DM Sans', Arial, Helvetica, sans-serif;"`,
  h2: `style="margin: 24px 0 12px 0; font-size: 17px; font-weight: 600; color: #265B34; font-family: 'DM Sans', Arial, Helvetica, sans-serif;"`,
  p: `style="margin: 0 0 14px 0; color: #333333; font-size: 15px; line-height: 1.6;"`,
  link: `style="color: #265B34; text-decoration: underline;"`,
  infoBox: `style="padding: 16px 20px; background-color: #f0f7f1; border-left: 4px solid #265B34; border-radius: 0 6px 6px 0; margin: 16px 0;"`,
  detailLabel: `style="font-weight: 600; color: #265B34;"`,
  muted: `style="color: #888888; font-size: 13px; margin: 16px 0 0 0;"`,
};

/**
 * Send an email using Mailgun
 */
export const sendEmail = async (options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}): Promise<any> => {
  const { to, subject, text, html, from } = options;

  try {
    const mg = await initMailgun();

    const messageData = {
      from: from || `CURaise Team <postmaster@${MAILGUN_DOMAIN}>`,
      to,
      subject,
      text: text || "",
      html: html || "",
    };

    console.log("Sending email with domain:", MAILGUN_DOMAIN);
    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);
    console.log("Email sent successfully:", result.id);
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

/**
 * Send organization invitation emails to administrators
 */
export const sendOrganizationInviteEmail = async (options: {
  organization: z.infer<typeof CompleteOrganizationSchema>;
  creator: z.infer<typeof UserSchema>;
  invitedAdmins: z.infer<typeof UserSchema>[];
}): Promise<void> => {
  const { organization, creator, invitedAdmins } = options;

  const subject = `You've Been Invited to Manage ${organization.name} on Curaise`;

  for (const admin of invitedAdmins) {
    const text = `
    Hello ${admin.name},

    ${creator.name} has invited you to be an administrator for ${
      organization.name
    } on Curaise.

    Organization Details:
    Name: ${organization.name}
    Description: ${organization.description}
    ${organization.websiteUrl ? `Website: ${organization.websiteUrl}` : ""}

    To manage this organization, please log in to your Curaise account at ${CURAISE_URL}

    Thank you,
    The Curaise Team
  `;

    const content = `
      <h1 ${styles.h1}>You've Been Invited!</h1>
      <p ${styles.p}>Hello ${admin.name},</p>
      <p ${styles.p}>${creator.name} has invited you to be an administrator for <strong>${organization.name}</strong> on CURaise.</p>
      <h2 ${styles.h2}>Organization Details</h2>
      <div ${styles.infoBox}>
        <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Name:</span> ${organization.name}</p>
        <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Description:</span> ${organization.description}</p>
        ${
          organization.websiteUrl
            ? `<p style="margin: 0;"><span ${styles.detailLabel}>Website:</span> <a href="${organization.websiteUrl}" ${styles.link}>${organization.websiteUrl}</a></p>`
            : ""
        }
      </div>
      <p ${styles.p}>Log in to your CURaise account to start managing this organization.</p>
    `;

    const html = wrapInTemplate(content, {
      ctaText: "View Organization",
      ctaUrl: `${CURAISE_URL}/seller/org/${organization.id}`,
    });

    try {
      await sendEmail({
        to: admin.email,
        subject,
        text,
        html,
      });

      console.log(`Invitation email sent to ${admin.email}`);
    } catch (error) {
      console.error(
        `Failed to send invitation email to ${admin.email}:`,
        error,
      );
      // Continue sending to other admins even if one fails
    }
  }
};

/**
 * Send organization invitation emails to pending administrators (users who don't have accounts yet)
 */
export const sendPendingAdminInviteEmail = async (options: {
  organization: z.infer<typeof CompleteOrganizationSchema>;
  creator: z.infer<typeof UserSchema>;
  pendingAdminEmails: string[];
}): Promise<void> => {
  const { organization, creator, pendingAdminEmails } = options;

  const subject = `You've Been Invited to Manage ${organization.name} on Curaise`;

  for (const email of pendingAdminEmails) {
    const text = `
    Hello,

    ${creator.name} has invited you to be an administrator for ${
      organization.name
    } on Curaise.

    Organization Details:
    Name: ${organization.name}
    Description: ${organization.description}
    ${organization.websiteUrl ? `Website: ${organization.websiteUrl}` : ""}

    To accept this invitation and manage this organization, please sign up for a Curaise account at ${CURAISE_URL}

    Once you register with this email address (${email}), you'll automatically be granted administrator access to ${
      organization.name
    }.

    Thank you,
    The Curaise Team
  `;

    const content = `
      <h1 ${styles.h1}>You've Been Invited!</h1>
      <p ${styles.p}>Hello,</p>
      <p ${styles.p}>${creator.name} has invited you to be an administrator for <strong>${organization.name}</strong> on CURaise.</p>
      <h2 ${styles.h2}>Organization Details</h2>
      <div ${styles.infoBox}>
        <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Name:</span> ${organization.name}</p>
        <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Description:</span> ${organization.description}</p>
        ${
          organization.websiteUrl
            ? `<p style="margin: 0;"><span ${styles.detailLabel}>Website:</span> <a href="${organization.websiteUrl}" ${styles.link}>${organization.websiteUrl}</a></p>`
            : ""
        }
      </div>
      <p ${styles.p}>Sign up for a CURaise account to accept this invitation.</p>
      <p ${styles.p}>Once you register with this email address (<strong>${email}</strong>), you'll automatically be granted administrator access to ${organization.name}.</p>
    `;

    const html = wrapInTemplate(content, {
      ctaText: "Sign Up for CURaise",
      ctaUrl: CURAISE_URL,
    });

    try {
      await sendEmail({
        to: email,
        subject,
        text,
        html,
      });

      console.log(`Pending admin invitation email sent to ${email}`);
    } catch (error) {
      console.error(
        `Failed to send pending admin invitation email to ${email}:`,
        error,
      );
      // Continue sending to other emails even if one fails
    }
  }
};

/**
 * Send announcement emails to multiple recipients
 */
export const sendAnnouncementEmail = async (options: {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
  announcement: z.infer<typeof AnnouncementSchema>;
  recipients: z.infer<typeof UserSchema>[];
}): Promise<void> => {
  const { fundraiser, announcement, recipients } = options;

  const subject = `New Announcement: ${fundraiser.name}`;

  // Format pickup events information
  const pickupEventsText =
    fundraiser.pickupEvents.length > 0
      ? fundraiser.pickupEvents
          .map(
            (event, index) =>
              `Event ${index + 1}: ${
                event.location
              } (${event.startsAt.toLocaleDateString()} to ${event.endsAt.toLocaleDateString()})`,
          )
          .join("\n    ")
      : "No pickup events scheduled";

  const pickupEventsHtml =
    fundraiser.pickupEvents.length > 0
      ? fundraiser.pickupEvents
          .map(
            (event, index) =>
              `<p style="margin: 0 0 8px 0;"><span ${styles.detailLabel}>Event ${index + 1}:</span> ${event.location}<br>
              <span ${styles.detailLabel}>Time:</span> ${event.startsAt.toLocaleDateString()} to ${event.endsAt.toLocaleDateString()}</p>`,
          )
          .join("")
      : `<p style="margin: 0;">No pickup events scheduled</p>`;

  const text = `
    New Announcement for ${fundraiser.name}

    ${announcement.message}

    Pickup Information:
    ${pickupEventsText}

    This is an automated message. Please do not reply.
  `;

  const content = `
    <h1 ${styles.h1}>New Announcement</h1>
    <p ${styles.p}>from <strong>${fundraiser.name}</strong></p>
    <div ${styles.infoBox}>
      <p style="margin: 0; font-size: 15px; line-height: 1.6;">${announcement.message}</p>
    </div>
    <h2 ${styles.h2}>Pickup Information</h2>
    ${pickupEventsHtml}
    <p ${styles.muted}>This is an automated message. Please do not reply.</p>
  `;

  const html = wrapInTemplate(content, {
    ctaText: "View Fundraiser",
    ctaUrl: `${CURAISE_URL}/buyer/fundraiser/${fundraiser.id}`,
  });

  // Extract unique email addresses to avoid duplicate emails
  const uniqueEmails = [...new Set(recipients.map((user) => user.email))];

  try {
    await sendEmail({
      to: uniqueEmails,
      subject,
      text,
      html,
    });

    console.log(`Announcement email sent to ${uniqueEmails.length} recipients`);
  } catch (error) {
    console.error("Failed to send announcement emails:", error);
    throw error;
  }
};

/**
 * Send Venmo email forwarding setup instructions
 */
export const sendVenmoSetupEmail = async (options: {
  venmoEmail: string;
  fundraiserName: string;
}): Promise<void> => {
  const { venmoEmail, fundraiserName } = options;

  const subject = `Action Required: Set Up Email Forwarding for ${fundraiserName}`;

  const text = `
    Hello,

    You need to set up email forwarding for your Venmo account to use it with ${fundraiserName} on CURaise.

    Open this email on a desktop browser and follow the steps to add CURaise's email address as a valid forwarding address:

    1. In the top right corner, click on Settings > See all settings, then click on the Forwarding and POP/IMAP tab.
    2. Click on the Add a forwarding address button.
    3. Enter postmaster@curaise.app
       Note: It may take a minute for postmaster@curaise.app to be auto-confirmed as a forwarding option — wait a moment and refresh if you don't see it right away.

    Prefer a video walkthrough? Watch the tutorial here.

    Now follow the steps below to create a forwarding filter just for the Venmo emails:

    1. Navigate to the Search bar, click on the filter icon on the right-hand side.
    2. Enter venmo@venmo.com in the From field.
    3. Near the bottom of that window, click on the Create filter button.
    4. Enable the Forward it to option and select postmaster@curaise.app
    5. Click Create filter and you're done. All future emails will be automatically processed and turned into transactions by CURaise.

    Questions? Contact our support team.

    Thank you,
    The CURaise Team
  `;

  const stepStyle = `style="margin: 0 0 10px 0; padding-left: 4px; line-height: 1.6; color: #333333;"`;

  const content = `
    <h1 ${styles.h1}>Action Required</h1>
    <p ${styles.p}>Set up email forwarding for your Venmo account to use it with <strong>${fundraiserName}</strong> on CURaise.</p>
    <p ${styles.p}>Open this email on a <strong>desktop browser</strong> and follow the steps below.</p>
    <p ${styles.p}>Prefer a video walkthrough? <a href="https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/verify_venmo.mov" style="color: #E74C3C;">Watch the tutorial here.</a></p>

    <h2 ${styles.h2}>Step 1: Add Forwarding Address</h2>
    <ol style="padding-left: 20px; margin: 0 0 16px 0;">
      <li ${stepStyle}>In the top right corner, click on <strong>Settings &gt; See all settings</strong>, then click on the <strong>Forwarding and POP/IMAP</strong> tab.</li>
      <li ${stepStyle}>Click on the <strong>Add a forwarding address</strong> button.</li>
      <li ${stepStyle}>Enter <strong>postmaster@curaise.app</strong></li>
    </ol>
    <p ${styles.muted}>Note: It may take a minute for <strong>postmaster@curaise.app</strong> to be auto-confirmed — if it doesn't appear right away as a forwarding option, wait a moment and refresh before continuing.</p>

    <h2 ${styles.h2}>Step 2: Create a Forwarding Filter</h2>
    <ol style="padding-left: 20px; margin: 0 0 16px 0;">
      <li ${stepStyle}>Navigate to the <strong>Search bar</strong>, click on the filter icon on the right-hand side.</li>
      <li ${stepStyle}>Enter <strong>venmo@venmo.com</strong> in the From field.</li>
      <li ${stepStyle}>Near the bottom of that window, click on the <strong>Create filter</strong> button.</li>
      <li ${stepStyle}>Enable the <strong>Forward it to</strong> option and select <strong>postmaster@curaise.app</strong></li>
      <li ${stepStyle}>Click <strong>Create filter</strong> and you're done!</li>
    </ol>

    <div ${styles.infoBox}>
      <p style="margin: 0;">All future Venmo emails will be automatically processed and turned into transactions by CURaise.</p>
    </div>
  `;

  const html = wrapInTemplate(content, {
    ctaText: "Go to CURaise",
    ctaUrl: CURAISE_URL,
  });

  try {
    await sendEmail({
      to: venmoEmail,
      subject,
      text,
      html,
    });

    console.log(`Venmo setup email sent to ${venmoEmail}`);
  } catch (error) {
    console.error(`Failed to send Venmo setup email to ${venmoEmail}:`, error);
    throw error;
  }
};

/**
 * Send payment reminder email to a buyer with an unpaid order
 */
export const sendPaymentReminderEmail = async (order: Order): Promise<any> => {
  const { buyer, fundraiser } = order;

  const subject = `Payment Reminder - ${fundraiser.name}`;

  const orderDateFormatted = format(order.createdAt, "MMMM d, yyyy");

  const text = `
    Hi ${buyer.name},

    This is a friendly reminder that your order #${order.id} for ${fundraiser.name} placed on ${orderDateFormatted} has not been paid yet.

    Please complete your payment via Venmo to finalize your order.

    If you have already paid, please disregard this email — it may take some time for us to verify your payment.

    Thank you,
    The CURaise Team
  `;

  const content = `
    <h1 ${styles.h1}>Payment Reminder</h1>
    <p ${styles.p}>Hi ${buyer.name},</p>
    <p ${styles.p}>This is a friendly reminder that your order for <strong>${fundraiser.name}</strong> placed on ${orderDateFormatted} has not been paid yet.</p>
    <div ${styles.infoBox}>
      <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Order:</span> #${order.id}</p>
      <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Fundraiser:</span> ${fundraiser.name}</p>
      <p style="margin: 0;"><span ${styles.detailLabel}>Date:</span> ${orderDateFormatted}</p>
    </div>
    <p ${styles.p}>Please complete your payment via Venmo to finalize your order.</p>
    <p ${styles.muted}>If you have already paid, please disregard this email &mdash; it may take some time for us to verify your payment.</p>
  `;

  const html = wrapInTemplate(content, {
    ctaText: "View Your Order",
    ctaUrl: `${CURAISE_URL}/buyer/order/${order.id}`,
  });

  return sendEmail({
    to: buyer.email,
    subject,
    text,
    html,
  });
};

/**
 * Send order confirmation email to a buyer
 */
export const sendOrderConfirmation = async (order: Order): Promise<any> => {
  const { buyer, fundraiser } = order;

  const subject = `Order Confirmation - ${fundraiser.name}`;

  const paymentStatusMessage = {
    UNVERIFIABLE: "Please complete your payment.",
    PENDING: "Your payment is pending verification.",
    CONFIRMED: "Your payment has been confirmed.",
  }[order.paymentStatus];

  const paymentMethodText =
    order.paymentMethod === "VENMO" ? "Venmo" : "Other payment method";

  // Format order creation date
  const orderDateFormatted = format(order.createdAt, "MMMM d, yyyy");

  // Format pickup events information
  const pickupEventsText =
    fundraiser.pickupEvents.length > 0
      ? fundraiser.pickupEvents
          .map((event, index) => {
            const startsFormatted = format(
              event.startsAt,
              "EEEE, MMMM d, yyyy, h:mm a",
            );
            const endsFormatted = format(
              event.endsAt,
              "EEEE, MMMM d, yyyy, h:mm a",
            );
            return `Event ${index + 1}: ${
              event.location
            } (${startsFormatted} to ${endsFormatted})`;
          })
          .join("\n    ")
      : "No pickup events scheduled";

  const pickupEventsHtml =
    fundraiser.pickupEvents.length > 0
      ? fundraiser.pickupEvents
          .map((event, index) => {
            const startsFormatted = format(
              event.startsAt,
              "EEEE, MMMM d, yyyy, h:mm a",
            );
            const endsFormatted = format(
              event.endsAt,
              "EEEE, MMMM d, yyyy, h:mm a",
            );
            return `<p style="margin: 0 0 8px 0;"><span ${styles.detailLabel}>Event ${index + 1}:</span> ${event.location}<br>
            <span ${styles.detailLabel}>Pickup Window:</span> ${startsFormatted} to ${endsFormatted}</p>`;
          })
          .join("")
      : `<p style="margin: 0;">No pickup events scheduled</p>`;

  const text = `
    Thank you for your order #${order.id}!

    Fundraiser: ${fundraiser.name}
    Date: ${orderDateFormatted}
    Payment Method: ${paymentMethodText}
    Status: ${paymentStatusMessage}

    Pickup Information:
    ${pickupEventsText}

    If you have any questions, please contact ${fundraiser.organization.name}.
  `;

  const content = `
    <h1 ${styles.h1}>Thank You for Your Order!</h1>
    <p ${styles.p}>Your order for <strong>${fundraiser.name}</strong> has been received.</p>
    <h2 ${styles.h2}>Order Details</h2>
    <div ${styles.infoBox}>
      <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Order:</span> #${order.id}</p>
      <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Date:</span> ${orderDateFormatted}</p>
      <p style="margin: 0 0 6px 0;"><span ${styles.detailLabel}>Payment Method:</span> ${paymentMethodText}</p>
      <p style="margin: 0;"><span ${styles.detailLabel}>Status:</span> ${paymentStatusMessage}</p>
    </div>
    <h2 ${styles.h2}>Pickup Information</h2>
    ${pickupEventsHtml}
    <p ${styles.p}>If you have any questions, please contact <strong>${fundraiser.organization.name}</strong>.</p>
  `;

  const html = wrapInTemplate(content, {
    ctaText: "View Your Order",
    ctaUrl: `${CURAISE_URL}/buyer/order/${order.id}`,
  });

  return sendEmail({
    to: buyer.email,
    subject,
    text,
    html,
  });
};
