/**
 * Get email thread/conversation
 */

import { z } from "zod";
import { getThread } from "../lib/imap-client.js";

export const name = "get_email_thread";

export const description = "Get full email thread/conversation by message ID or thread ID";

export const parameters = z.object({
  account_id: {
    type: "string",
    description: "Email account ID",
  },
  message_id: {
    type: "string",
    description: "Message ID to get thread for",
  },
  include_body: {
    type: "boolean",
    description: "Include full email body (default: true)",
    default: true,
  },
}).shape);

export async function execute(args: z.infer<typeof parameters>) {
  const accountId = args.account_id as string;
  const messageId = args.message_id as string;
  const includeBody = args.include_body !== false;

  try {
    const thread = await getThread(accountId, messageId, includeBody);
    return {
      success: true,
      thread,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to get thread: ${err instanceof Error ? err.message : err}`,
    };
  }
}