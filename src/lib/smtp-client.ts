/**
 * SMTP Client for sending emails
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getAccount, type EmailAccount } from "./accounts.js";

export interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  replyToMessageId?: string;
  draft?: boolean;
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

function createTransport(account: EmailAccount): Transporter {
  return nodemailer.createTransporter({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.auth.user,
      pass: account.auth.password,
    },
  });
}

export async function sendEmail(
  accountId: string,
  options: SendEmailOptions
): Promise<SendResult> {
  const account = await getAccount(accountId);
  if (!account) throw new Error(`Account not found: ${accountId}`);

  if (options.draft) {
    // TODO: Save to Drafts folder via IMAP APPEND
    // For now, just return a mock result
    return {
      messageId: `draft-${Date.now()}`,
      accepted: options.to,
      rejected: [],
    };
  }

  const transporter = createTransport(account);

  const mailOptions: nodemailer.SendMailOptions = {
    from: account.email,
    to: options.to.join(", "),
    cc: options.cc?.join(", "),
    bcc: options.bcc?.join(", "),
    subject: options.subject,
    text: options.body,
    html: options.html,
  };

  // Add threading headers if replying
  if (options.replyToMessageId) {
    mailOptions.inReplyTo = options.replyToMessageId;
    mailOptions.references = options.replyToMessageId;
  }

  const result = await transporter.sendMail(mailOptions);

  return {
    messageId: result.messageId,
    accepted: result.accepted as string[],
    rejected: result.rejected as string[],
  };
}

/**
 * Verify SMTP connection for an account
 */
export async function verifyConnection(accountId: string): Promise<boolean> {
  const account = await getAccount(accountId);
  if (!account) throw new Error(`Account not found: ${accountId}`);

  const transporter = createTransport(account);
  
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}