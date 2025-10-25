import { z } from "zod";

// https://documentation.mailgun.com/docs/mailgun/user-manual/receive-forward-store/receive-http
// NOTE: Mailgun actually sends lowercase field names despite docs showing mixed case
export const MailgunInboundEmailBody = z.object({
  recipient: z.string(),
  sender: z.string(),
  from: z.string(),
  subject: z.string().default(""),
  "body-plain": z.string().default(""),
  "stripped-text": z.string().optional(),
  "stripped-signature": z.string().optional(),
  "body-html": z.string().optional(),
  "stripped-html": z.string().optional(),
  "attachment-count": z.coerce.number().default(0),
  timestamp: z.coerce.number(),
  token: z.string(),
  signature: z.string(),
  "message-headers": z.string().optional(),
  "content-id-map": z.string().optional(),
});

export type MailgunInboundEmailBody = z.infer<typeof MailgunInboundEmailBody>;
