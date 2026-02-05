/**
 * Remove an email account
 */

import { z } from "zod";
import { removeAccount, getAccount } from "../lib/accounts.js";

export const name = "remove_email_account";

export const description = "Remove an email account from the configuration";

export const parameters = z.object({
  account_id: {
    type: "string",
    description: "Account ID to remove",
  },
  confirm: {
    type: "boolean",
    description: "Confirm deletion (required)",
  },
}).shape);

export async function execute(args: z.infer<typeof parameters>) {
  const accountId = args.account_id as string;
  const confirm = args.confirm as boolean;

  if (!confirm) {
    return {
      success: false,
      error: "Deletion not confirmed. Set confirm=true to proceed.",
    };
  }

  const account = await getAccount(accountId);
  if (!account) {
    return {
      success: false,
      error: `Account not found: ${accountId}`,
    };
  }

  const removed = await removeAccount(accountId);
  if (!removed) {
    return {
      success: false,
      error: "Failed to remove account",
    };
  }

  return {
    success: true,
    message: `Account removed: ${account.email}`,
  };
}