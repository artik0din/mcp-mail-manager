/**
 * List emails from inbox
 */

import { z } from "zod";
import { getEmails } from "../lib/imap-client.js";

export const name = "list_emails";

export const description = "List emails from an account's inbox. Returns subject, from, date, and preview.";

export const parameters = z.object({
  account_id: {
    type: "string",
    description: "Email account ID (use list_email_accounts to get IDs)",
  },
  folder: {
    type: "string",
    description: "Folder to list (default: INBOX)",
    default: "INBOX",
  },
  limit: {
    type: "number",
    description: "Maximum emails to return (default: 20)",
    default: 20,
  },
  unread_only: {
    type: "boolean",
    description: "Only return unread emails",
    default: false,
  },
}).shape);

export async function execute(args: z.infer<typeof parameters>) {
  const accountId = args.account_id as string;
  const folder = (args.folder as string) || "INBOX";
  const limit = (args.limit as number) || 20;
  const unreadOnly = (args.unread_only as boolean) || false;

  try {
    const emails = await getEmails(accountId, { folder, limit, unreadOnly });
    return {
      success: true,
      emails,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to list emails: ${err instanceof Error ? err.message : err}`,
    };
  }
}