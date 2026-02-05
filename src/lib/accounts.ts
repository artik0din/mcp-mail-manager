/**
 * Email Account Management
 * 
 * Supports all major email providers:
 * - Gmail (OAuth2 or App Password)
 * - Outlook/Microsoft 365 (OAuth2)
 * - Yahoo
 * - iCloud
 * - ProtonMail (Bridge)
 * - Any IMAP/SMTP server
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { encrypt, decrypt, isEncrypted } from "./crypto.js";

// Sensitive fields that must be encrypted
const SENSITIVE_AUTH_FIELDS = ["password", "accessToken", "refreshToken", "clientSecret"];

export type EmailProvider = 
  | "gmail" 
  | "outlook" 
  | "yahoo" 
  | "icloud" 
  | "protonmail"
  | "fastmail"
  | "zoho"
  | "aol"
  | "gmx"
  | "mailru"
  | "yandex"
  | "custom";

export interface EmailAccount {
  id: string;
  email: string;
  name?: string; // Display name
  provider: EmailProvider;
  enabled: boolean;
  imap: {
    host: string;
    port: number;
    tls: boolean;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
  auth: {
    type: "password" | "oauth2" | "xoauth2";
    user: string;
    password?: string;
    // OAuth2 fields
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    tokenExpiry?: number;
  };
  // Sync settings
  sync?: {
    folders?: string[]; // Folders to sync (default: INBOX, Sent)
    maxAge?: number; // Max age in days to sync
  };
}

const CONFIG_DIR = join(homedir(), ".mcp-mail-manager");
const ACCOUNTS_FILE = join(CONFIG_DIR, "accounts.json");

// Provider presets - all major email providers
const PROVIDER_PRESETS: Record<EmailProvider, Partial<EmailAccount>> = {
  gmail: {
    provider: "gmail",
    imap: { host: "imap.gmail.com", port: 993, tls: true },
    smtp: { host: "smtp.gmail.com", port: 587, secure: false },
  },
  outlook: {
    provider: "outlook",
    imap: { host: "outlook.office365.com", port: 993, tls: true },
    smtp: { host: "smtp.office365.com", port: 587, secure: false },
  },
  yahoo: {
    provider: "yahoo",
    imap: { host: "imap.mail.yahoo.com", port: 993, tls: true },
    smtp: { host: "smtp.mail.yahoo.com", port: 587, secure: false },
  },
  icloud: {
    provider: "icloud",
    imap: { host: "imap.mail.me.com", port: 993, tls: true },
    smtp: { host: "smtp.mail.me.com", port: 587, secure: false },
  },
  protonmail: {
    provider: "protonmail",
    // ProtonMail Bridge runs locally
    imap: { host: "127.0.0.1", port: 1143, tls: false },
    smtp: { host: "127.0.0.1", port: 1025, secure: false },
  },
  fastmail: {
    provider: "fastmail",
    imap: { host: "imap.fastmail.com", port: 993, tls: true },
    smtp: { host: "smtp.fastmail.com", port: 587, secure: false },
  },
  zoho: {
    provider: "zoho",
    imap: { host: "imap.zoho.com", port: 993, tls: true },
    smtp: { host: "smtp.zoho.com", port: 587, secure: false },
  },
  aol: {
    provider: "aol",
    imap: { host: "imap.aol.com", port: 993, tls: true },
    smtp: { host: "smtp.aol.com", port: 587, secure: false },
  },
  gmx: {
    provider: "gmx",
    imap: { host: "imap.gmx.com", port: 993, tls: true },
    smtp: { host: "mail.gmx.com", port: 587, secure: false },
  },
  mailru: {
    provider: "mailru",
    imap: { host: "imap.mail.ru", port: 993, tls: true },
    smtp: { host: "smtp.mail.ru", port: 587, secure: false },
  },
  yandex: {
    provider: "yandex",
    imap: { host: "imap.yandex.com", port: 993, tls: true },
    smtp: { host: "smtp.yandex.com", port: 587, secure: false },
  },
  custom: {
    provider: "custom",
    imap: { host: "", port: 993, tls: true },
    smtp: { host: "", port: 587, secure: false },
  },
};

/**
 * Auto-detect provider from email address
 */
export function detectProvider(email: string): EmailProvider {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return "custom";

  const domainMap: Record<string, EmailProvider> = {
    "gmail.com": "gmail",
    "googlemail.com": "gmail",
    "outlook.com": "outlook",
    "hotmail.com": "outlook",
    "live.com": "outlook",
    "msn.com": "outlook",
    "yahoo.com": "yahoo",
    "yahoo.fr": "yahoo",
    "yahoo.co.uk": "yahoo",
    "ymail.com": "yahoo",
    "icloud.com": "icloud",
    "me.com": "icloud",
    "mac.com": "icloud",
    "protonmail.com": "protonmail",
    "proton.me": "protonmail",
    "pm.me": "protonmail",
    "fastmail.com": "fastmail",
    "fastmail.fm": "fastmail",
    "zoho.com": "zoho",
    "aol.com": "aol",
    "gmx.com": "gmx",
    "gmx.fr": "gmx",
    "gmx.de": "gmx",
    "mail.ru": "mailru",
    "yandex.ru": "yandex",
    "yandex.com": "yandex",
  };

  return domainMap[domain] ?? "custom";
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Decrypt sensitive fields in an account's auth object
 */
async function decryptAccount(account: EmailAccount): Promise<EmailAccount> {
  const decryptedAuth = { ...account.auth };
  
  for (const field of SENSITIVE_AUTH_FIELDS) {
    const value = (decryptedAuth as any)[field];
    if (value && typeof value === "string" && isEncrypted(value)) {
      try {
        (decryptedAuth as any)[field] = await decrypt(value);
      } catch (err) {
        console.error(`[accounts] Failed to decrypt ${field} for ${account.email}`);
      }
    }
  }
  
  return { ...account, auth: decryptedAuth };
}

/**
 * Encrypt sensitive fields in an account's auth object
 */
async function encryptAccount(account: EmailAccount): Promise<EmailAccount> {
  const encryptedAuth = { ...account.auth };
  
  for (const field of SENSITIVE_AUTH_FIELDS) {
    const value = (encryptedAuth as any)[field];
    if (value && typeof value === "string" && !isEncrypted(value)) {
      (encryptedAuth as any)[field] = await encrypt(value);
    }
  }
  
  return { ...account, auth: encryptedAuth };
}

export async function getAccounts(): Promise<EmailAccount[]> {
  ensureConfigDir();
  
  if (!existsSync(ACCOUNTS_FILE)) {
    return [];
  }

  try {
    const data = readFileSync(ACCOUNTS_FILE, "utf-8");
    const accounts: EmailAccount[] = JSON.parse(data);
    
    // Decrypt sensitive fields before returning
    return Promise.all(accounts.map(decryptAccount));
  } catch {
    return [];
  }
}

export async function getAccount(id: string): Promise<EmailAccount | null> {
  const accounts = await getAccounts();
  return accounts.find((a) => a.id === id) ?? null;
}

export async function addAccount(account: EmailAccount): Promise<void> {
  ensureConfigDir();
  
  // Get raw accounts (still encrypted on disk)
  let rawAccounts: EmailAccount[] = [];
  if (existsSync(ACCOUNTS_FILE)) {
    try {
      rawAccounts = JSON.parse(readFileSync(ACCOUNTS_FILE, "utf-8"));
    } catch {
      rawAccounts = [];
    }
  }
  
  // Apply provider preset if specified
  if (account.provider && PROVIDER_PRESETS[account.provider]) {
    const preset = PROVIDER_PRESETS[account.provider];
    account = { ...preset, ...account } as EmailAccount;
  }
  
  // Encrypt sensitive fields before saving
  const encryptedAccount = await encryptAccount(account);
  
  // Check for duplicate ID
  const existingIndex = rawAccounts.findIndex((a) => a.id === account.id);
  if (existingIndex >= 0) {
    rawAccounts[existingIndex] = encryptedAccount;
  } else {
    rawAccounts.push(encryptedAccount);
  }
  
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(rawAccounts, null, 2));
  console.error(`[accounts] Saved account ${account.email} (credentials encrypted)`);
}

export async function removeAccount(id: string): Promise<boolean> {
  if (!existsSync(ACCOUNTS_FILE)) {
    return false;
  }
  
  let rawAccounts: EmailAccount[] = [];
  try {
    rawAccounts = JSON.parse(readFileSync(ACCOUNTS_FILE, "utf-8"));
  } catch {
    return false;
  }
  
  const filtered = rawAccounts.filter((a) => a.id !== id);
  
  if (filtered.length === rawAccounts.length) {
    return false; // Not found
  }
  
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(filtered, null, 2));
  console.error(`[accounts] Removed account ${id}`);
  return true;
}