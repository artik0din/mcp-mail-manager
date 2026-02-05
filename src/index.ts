#!/usr/bin/env node

/**
 * MCP Mail Manager Server
 * 
 * Universal email management supporting all major providers:
 * - Gmail, Outlook, Yahoo, iCloud, ProtonMail, etc.
 * - Any IMAP/SMTP server
 * - Password and OAuth2 authentication
 * 
 * Optional environment variables (for OAuth2 providers):
 * - GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET: Gmail OAuth2 credentials
 * - OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET: Outlook OAuth2 credentials
 * - MCP_MASTER_KEY: Master key for local encryption (optional, auto-generated)
 * 
 * For password-based auth, credentials are stored securely per account.
 */

import { createMCPServer, startMCPServer, json, ToolDefinition } from "./lib/mcp-core.js";

// Import all tools
import * as addAccount from "./tools/add-account.js";
import * as listAccounts from "./tools/list-accounts.js";
import * as removeAccount from "./tools/remove-account.js";
import * as listEmails from "./tools/list-emails.js";
import * as searchEmails from "./tools/search-emails.js";
import * as getThread from "./tools/get-thread.js";
import * as sendEmail from "./tools/send-email.js";

// Convert tool exports to ToolDefinition format
const tools: ToolDefinition[] = [
  // Account management
  {
    name: addAccount.name,
    description: addAccount.description,
    inputSchema: addAccount.parameters.shape,
    handler: async (args) => json(await addAccount.execute(args as any)),
  },
  {
    name: listAccounts.name,
    description: listAccounts.description,
    inputSchema: listAccounts.parameters.shape,
    handler: async (args) => json(await listAccounts.execute(args as any)),
  },
  {
    name: removeAccount.name,
    description: removeAccount.description,
    inputSchema: removeAccount.parameters.shape,
    handler: async (args) => json(await removeAccount.execute(args as any)),
  },
  // Email operations
  {
    name: listEmails.name,
    description: listEmails.description,
    inputSchema: listEmails.parameters.shape,
    handler: async (args) => json(await listEmails.execute(args as any)),
  },
  {
    name: searchEmails.name,
    description: searchEmails.description,
    inputSchema: searchEmails.parameters.shape,
    handler: async (args) => json(await searchEmails.execute(args as any)),
  },
  {
    name: getThread.name,
    description: getThread.description,
    inputSchema: getThread.parameters.shape,
    handler: async (args) => json(await getThread.execute(args as any)),
  },
  {
    name: sendEmail.name,
    description: sendEmail.description,
    inputSchema: sendEmail.parameters.shape,
    handler: async (args) => json(await sendEmail.execute(args as any)),
  },
];

async function main() {
  const server = createMCPServer(
    {
      name: "mcp-mail-manager", 
      version: "1.0.0",
      description: "Multi-account email management MCP server with IMAP/SMTP support",
    },
    tools
  );

  await startMCPServer(server);
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}