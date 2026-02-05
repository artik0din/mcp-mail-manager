/**
 * Add a new email account
 */

import { z } from "zod";
import { addAccount, detectProvider, type EmailProvider } from "../lib/accounts.js";
import { verifyConnection } from "../lib/smtp-client.js";

export const name = "add_email_account";

export const description = "Add a new email account. Auto-detects provider from email address.";

export const parameters = z.object({
  email: {
    type: "string",
    description: "Email address",
  },
  password: {
    type: "string",
    description: "Password or App Password (for Gmail, use App Password)",
  },
  name: {
    type: "string",
    description: "Display name for this account",
  },
  provider: {
    type: "string",
    enum: ["gmail", "outlook", "yahoo", "icloud", "protonmail", "fastmail", "zoho", "aol", "gmx", "mailru", "yandex", "custom"],
    description: "Provider (auto-detected if not specified)",
  },
  // Custom IMAP/SMTP settings
  imap_host: {
    type: "string",
    description: "Custom IMAP host (for custom provider)",
  },
  imap_port: {
    type: "number",
    description: "Custom IMAP port (default: 993)",
  },
  smtp_host: {
    type: "string",
    description: "Custom SMTP host (for custom provider)",
  },
  smtp_port: {
    type: "number",
    description: "Custom SMTP port (default: 587)",
  },
  test_connection: {
    type: "boolean",
    description: "Test connection before saving (default: true)",
  },
}).shape);

export async function execute(args: z.infer<typeof parameters>) {
  const email = args.email as string;
  const password = args.password as string;
  const name = args.name as string | undefined;
  const testConnection = args.test_connection !== false;

  // Auto-detect or use provided provider
  const provider = (args.provider as EmailProvider) || detectProvider(email);

  // Generate account ID from email
  const id = email.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  try {
    // Build account config
    const account = {
      id,
      email,
      name: name || email.split("@")[0],
      provider,
      enabled: true,
      imap: {
        host: (args.imap_host as string) || "",
        port: (args.imap_port as number) || 993,
        tls: true,
      },
      smtp: {
        host: (args.smtp_host as string) || "",
        port: (args.smtp_port as number) || 587,
        secure: false,
      },
      auth: {
        type: "password" as const,
        user: email,
        password,
      },
    };

    // Add account (will apply provider presets)
    await addAccount(account as any);

    // Test connection if requested
    if (testConnection) {
      const isValid = await verifyConnection(id);
      if (!isValid) {
        return {
          success: true,
          warning: "Account saved but connection test failed. Check credentials.",
          account: { id, email, provider },
        };
      }
    }

    return {
      success: true,
      account: { id, email, provider },
      message: `Account added successfully. Provider: ${provider}`,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to add account: ${err instanceof Error ? err.message : err}`,
    };
  }
}