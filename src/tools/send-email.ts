/**
 * Send email
 */

import { z } from "zod";
import { sendEmail } from "../lib/smtp-client.js";

export const name = "send_email";

export const description = "Send an email from a configured account";

export const parameters = z.object({
  account_id: {
    type: "string",
    description: "Email account ID to send from",
  },
  to: {
    type: "array",
    items: { type: "string" },
    description: "Recipient email addresses",
  },
  cc: {
    type: "array",
    items: { type: "string" },
    description: "CC recipients",
  },
  bcc: {
    type: "array",
    items: { type: "string" },
    description: "BCC recipients",
  },
  subject: {
    type: "string",
    description: "Email subject",
  },
  body: {
    type: "string",
    description: "Email body (plain text)",
  },
  html: {
    type: "string",
    description: "Email body (HTML)",
  },
  reply_to_message_id: {
    type: "string",
    description: "Message ID to reply to (for threading)",
  },
  draft: {
    type: "boolean",
    description: "Save as draft instead of sending",
    default: false,
  },
}).shape);

export async function execute(args: z.infer<typeof parameters>) {
  const accountId = args.account_id as string;
  const isDraft = args.draft === true;

  try {
    const result = await sendEmail(accountId, {
      to: args.to as string[],
      cc: args.cc as string[] | undefined,
      bcc: args.bcc as string[] | undefined,
      subject: args.subject as string,
      body: args.body as string,
      html: args.html as string | undefined,
      replyToMessageId: args.reply_to_message_id as string | undefined,
      draft: isDraft,
    });

    if (isDraft) {
      return {
        success: true,
        message: `Draft saved: ${result.messageId}`,
      };
    }
    return {
      success: true,
      message: `Email sent successfully. Message ID: ${result.messageId}`,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to send email: ${err instanceof Error ? err.message : err}`,
    };
  }
}