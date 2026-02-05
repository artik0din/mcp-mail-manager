/**
 * List configured email accounts
 */

import { z } from "zod";
import { getAccounts } from "../lib/accounts.js";

export const name = "list_email_accounts";

export const description = "List all configured email accounts";

export const parameters = z.object({});

export async function execute(args: z.infer<typeof parameters>) {
  const accounts = await getAccounts();
  return accounts.map(a => ({
    id: a.id,
    email: a.email,
    provider: a.provider,
    enabled: a.enabled,
  }));
}