/**
 * Search emails
 */

import { z } from "zod";
import { searchEmails } from "../lib/imap-client.js";

export const name = "search_emails";

export const description = "Search emails by query, sender, date range, or other criteria";

export const parameters = z.object({
  account_id: {
    type: "string",
    description: "Email account ID",
  },
  query: {
    type: "string",
    description: "Search query (searches subject and body)",
  },
  from: {
    type: "string",
    description: "Filter by sender email/name",
  },
  to: {
    type: "string",
    description: "Filter by recipient",
  },
  since: {
    type: "string",
    description: "Emails since date (ISO format)",
  },
  before: {
    type: "string",
    description: "Emails before date (ISO format)",
  },
  has_attachment: {
    type: "boolean",
    description: "Only emails with attachments",
  },
  limit: {
    type: "number",
    description: "Maximum results (default: 20)",
    default: 20,
  },
}).shape);

export async function execute(args: z.infer<typeof parameters>) {
  const accountId = args.account_id as string;

  try {
    const results = await searchEmails(accountId, {
      query: args.query as string | undefined,
      from: args.from as string | undefined,
      to: args.to as string | undefined,
      since: args.since as string | undefined,
      before: args.before as string | undefined,
      hasAttachment: args.has_attachment as boolean | undefined,
      limit: (args.limit as number) || 20,
    });
    return {
      success: true,
      results,
    };
  } catch (err) {
    return {
      success: false,
      error: `Search failed: ${err instanceof Error ? err.message : err}`,
    };
  }
}