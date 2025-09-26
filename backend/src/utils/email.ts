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
const MAILGUN_DOMAIN =
  process.env.MAILGUN_DOMAIN ||
  "sandbox082eab5ac11d4c279f63018b4b3d8419.mailgun.org";
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";

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
      from: from || `Mailgun Sandbox <postmaster@${MAILGUN_DOMAIN}>`,
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
    
    To manage this organization, please log in to your Curaise account.
    
    Thank you,
    The Curaise Team
  `;

    const html = `
    <h1>You've Been Invited to Manage ${organization.name}</h1>
    
    <p>Hello ${admin.name},</p>
    
    <p>${creator.name} has invited you to be an administrator for <strong>${
      organization.name
    }</strong> on Curaise.</p>
    
    <h2>Organization Details</h2>
    <ul>
      <li><strong>Name:</strong> ${organization.name}</li>
      <li><strong>Description:</strong> ${organization.description}</li>
      ${
        organization.websiteUrl
          ? `<li><strong>Website:</strong> <a href="${organization.websiteUrl}">${organization.websiteUrl}</a></li>`
          : ""
      }
    </ul>
    
    <p>To manage this organization, please <a href="https://curaise.app/login">log in to your Curaise account</a>.</p>
    
    <p>Thank you,<br>
    The Curaise Team</p>
  `;

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
        error
      );
      // Continue sending to other admins even if one fails
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

  const text = `
    New Announcement for ${fundraiser.name}
    
    ${announcement.message}
    
    Pickup Information:
    Location: ${fundraiser.pickupLocation}
    Pickup Window: ${fundraiser.pickupStartsAt.toLocaleDateString()} to ${fundraiser.pickupEndsAt.toLocaleDateString()}
    
    This is an automated message. Please do not reply.
  `;

  const html = `
    <h1>New Announcement for ${fundraiser.name}</h1>
    
    <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #3498db; margin: 20px 0;">
      <p>${announcement.message}</p>
    </div>
    
    <h2>Pickup Information</h2>
    <p><strong>Location:</strong> ${fundraiser.pickupLocation}</p>
    <p><strong>Pickup Window:</strong> ${fundraiser.pickupStartsAt.toLocaleDateString()} to ${fundraiser.pickupEndsAt.toLocaleDateString()}</p>
    
    <p style="color: #777; font-size: 0.9em;">This is an automated message. Please do not reply.</p>
  `;

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

  // Format pickup dates using date-fns
  const pickupStartsFormatted = format(
    fundraiser.pickupStartsAt,
    "EEEE, MMMM d, yyyy, h:mm a"
  );

  const pickupEndsFormatted = format(
    fundraiser.pickupEndsAt,
    "EEEE, MMMM d, yyyy, h:mm a"
  );

  // Format order creation date
  const orderDateFormatted = format(order.createdAt, "MMMM d, yyyy");

  const text = `
    Thank you for your order #${order.id}!
    
    Fundraiser: ${fundraiser.name}
    Date: ${orderDateFormatted}
    Payment Method: ${paymentMethodText}
    Status: ${paymentStatusMessage}
    
    Pickup Information:
    Location: ${fundraiser.pickupLocation}
    Pickup Window: ${pickupStartsFormatted} to ${pickupEndsFormatted}
    
    If you have any questions, please contact ${fundraiser.organization.name}.
  `;

  const html = `
    <h1>Thank You for Your Order!</h1>
    <p>Your order #${order.id} for ${fundraiser.name} has been received.</p>
    
    <h2>Order Details</h2>
    <p><strong>Date:</strong> ${orderDateFormatted}</p>
    <p><strong>Payment Method:</strong> ${paymentMethodText}</p>
    <p><strong>Status:</strong> ${paymentStatusMessage}</p>
    
    <h2>Pickup Information</h2>
    <p><strong>Location:</strong> ${fundraiser.pickupLocation}</p>
    <p><strong>Pickup Window:</strong> ${pickupStartsFormatted} to ${pickupEndsFormatted}</p>
    
    <p>If you have any questions, please contact ${fundraiser.organization.name}.</p>
  `;

  return sendEmail({
    to: buyer.email,
    subject,
    text,
    html,
  });
};

/**
 * Validate if an email address is from Venmo's official domain
 */
export const isValidVenmoEmail = (emailFrom: string): boolean => {
  // Check if the email is from Venmo's official address
  const venmoEmailPattern = /^venmo@venmo\.com$/i;
  return venmoEmailPattern.test(emailFrom);
};
