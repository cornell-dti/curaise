import { z } from "zod";

export const MailgunInboundEmailBody = z.object({
  recipient: z.string(),
  sender: z.string(),
  from: z.string(),
  subject: z.string(),
  "Body-plain": z.string(),
  "stripped-text": z.string().optional(),
  "stripped-signature": z.string().optional(),
  "body-html": z.string().optional(),
  "stripped-html": z.string().optional(),
  "Attachment-count": z.coerce.number().default(0),
  timestamp: z.coerce.number(),
  token: z.string(),
  signature: z.string(),
  "message-headers": z.string().optional(),
  "Content-id-map": z.string().optional(),
});

export type MailgunInboundEmailBody = z.infer<typeof MailgunInboundEmailBody>;
