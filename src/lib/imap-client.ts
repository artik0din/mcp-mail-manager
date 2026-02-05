/**
 * IMAP Client for reading emails
 */

import Imap from "imap";
import { simpleParser } from "mailparser";
import type { ParsedMail } from "mailparser";
import { getAccount } from "./accounts.js";

export interface Email {
  id: string;
  messageId: string;
  subject: string;
  from: { name?: string; address: string }[];
  to: { name?: string; address: string }[];
  date: string;
  preview: string;
  isRead: boolean;
  hasAttachments: boolean;
  labels?: string[];
}

export interface EmailFull extends Email {
  body: string;
  html?: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export interface ListOptions {
  folder: string;
  limit: number;
  unreadOnly: boolean;
}

export interface SearchOptions {
  query?: string;
  from?: string;
  to?: string;
  since?: string;
  before?: string;
  hasAttachment?: boolean;
  limit: number;
}

function createImapConnection(account: NonNullable<Awaited<ReturnType<typeof getAccount>>>): Imap {
  return new Imap({
    user: account.auth.user,
    password: account.auth.password!,
    host: account.imap.host,
    port: account.imap.port,
    tls: account.imap.tls,
    tlsOptions: { rejectUnauthorized: false },
  });
}

function parseAddress(addr: any): { name?: string; address: string }[] {
  if (!addr) return [];
  return addr.value?.map((a: any) => ({
    name: a.name || undefined,
    address: a.address,
  })) ?? [];
}

async function fetchMessages(
  imap: Imap,
  uids: number[],
  includeBody: boolean
): Promise<EmailFull[]> {
  return new Promise((resolve, reject) => {
    if (uids.length === 0) {
      resolve([]);
      return;
    }

    const emails: EmailFull[] = [];
    const fetch = imap.fetch(uids, {
      bodies: includeBody ? "" : "HEADER",
      struct: true,
    });

    fetch.on("message", (msg, seqno) => {
      let buffer = "";
      let attrs: any;

      msg.on("body", (stream) => {
        stream.on("data", (chunk) => {
          buffer += chunk.toString("utf8");
        });
      });

      msg.on("attributes", (a) => {
        attrs = a;
      });

      msg.on("end", async () => {
        try {
          const parsed = await simpleParser(buffer);
          emails.push({
            id: String(attrs.uid),
            messageId: parsed.messageId || "",
            subject: parsed.subject || "(no subject)",
            from: parseAddress(parsed.from),
            to: parseAddress(parsed.to),
            date: parsed.date?.toISOString() || "",
            preview: parsed.text?.substring(0, 200) || "",
            isRead: !attrs.flags?.includes("\\Seen"),
            hasAttachments: (parsed.attachments?.length ?? 0) > 0,
            body: parsed.text || "",
            html: parsed.html || undefined,
            attachments: parsed.attachments?.map((a) => ({
              filename: a.filename || "attachment",
              contentType: a.contentType,
              size: a.size,
            })) ?? [],
          });
        } catch (err) {
          console.error("Parse error:", err);
        }
      });
    });

    fetch.on("error", reject);
    fetch.on("end", () => resolve(emails));
  });
}

export async function getEmails(
  accountId: string,
  options: ListOptions
): Promise<Email[]> {
  const account = await getAccount(accountId);
  if (!account) throw new Error(`Account not found: ${accountId}`);

  return new Promise((resolve, reject) => {
    const imap = createImapConnection(account);

    imap.once("ready", () => {
      imap.openBox(options.folder, true, (err, box) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        const criteria = options.unreadOnly ? ["UNSEEN"] : ["ALL"];
        
        imap.search(criteria, async (err, uids) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          // Get latest N emails
          const latestUids = uids.slice(-options.limit).reverse();
          
          try {
            const emails = await fetchMessages(imap, latestUids, false);
            imap.end();
            resolve(emails);
          } catch (err) {
            imap.end();
            reject(err);
          }
        });
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}

export async function searchEmails(
  accountId: string,
  options: SearchOptions
): Promise<Email[]> {
  const account = await getAccount(accountId);
  if (!account) throw new Error(`Account not found: ${accountId}`);

  return new Promise((resolve, reject) => {
    const imap = createImapConnection(account);

    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        // Build search criteria
        const criteria: any[] = [];
        
        if (options.query) {
          criteria.push(["OR", ["SUBJECT", options.query], ["BODY", options.query]]);
        }
        if (options.from) {
          criteria.push(["FROM", options.from]);
        }
        if (options.to) {
          criteria.push(["TO", options.to]);
        }
        if (options.since) {
          criteria.push(["SINCE", new Date(options.since)]);
        }
        if (options.before) {
          criteria.push(["BEFORE", new Date(options.before)]);
        }
        
        if (criteria.length === 0) {
          criteria.push("ALL");
        }

        imap.search(criteria, async (err, uids) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          const latestUids = uids.slice(-options.limit).reverse();
          
          try {
            const emails = await fetchMessages(imap, latestUids, false);
            imap.end();
            resolve(emails);
          } catch (err) {
            imap.end();
            reject(err);
          }
        });
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}

export async function getThread(
  accountId: string,
  messageId: string,
  includeBody: boolean
): Promise<EmailFull[]> {
  const account = await getAccount(accountId);
  if (!account) throw new Error(`Account not found: ${accountId}`);

  return new Promise((resolve, reject) => {
    const imap = createImapConnection(account);

    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        // Search for messages in the thread by References or In-Reply-To
        imap.search([["HEADER", "Message-ID", messageId]], async (err, uids) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          try {
            const emails = await fetchMessages(imap, uids, includeBody);
            imap.end();
            resolve(emails);
          } catch (err) {
            imap.end();
            reject(err);
          }
        });
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}