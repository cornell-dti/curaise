import { z } from "zod";

export const PostmarkInboundEmailBody = z.object({
  From: z.string().email(),
  FromName: z.string(),
  To: z.string().email(),
  Subject: z.string(),
  Date: z.coerce.date(), // POSSIBLE BUG
  TextBody: z.string(),
  HtmlBody: z.string(),
});

export type PostmarkInboundEmailBody = z.infer<typeof PostmarkInboundEmailBody>;
