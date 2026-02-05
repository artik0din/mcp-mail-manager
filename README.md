# MCP Mail Manager

[![npm version](https://badge.fury.io/js/@artik0din/mcp-mail-manager.svg)](https://www.npmjs.com/package/@artik0din/mcp-mail-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for email management. Supports all major email providers with secure credential encryption and multi-account management.

## 🚀 Features

- **📧 Universal Email Support** - Gmail, Outlook, Yahoo, iCloud, ProtonMail, and any IMAP/SMTP server
- **🔐 Secure Authentication** - Password and OAuth2 support with encrypted credential storage
- **👥 Multi-Account Management** - Manage multiple email accounts simultaneously
- **🔍 Advanced Search** - Search emails by sender, date, content, attachments
- **📨 Send & Receive** - Full email composition and thread management
- **🔒 End-to-End Encryption** - Local AES-256-GCM encryption for stored credentials
- **🌍 Provider Auto-Detection** - Automatic configuration for major email providers
- **⚡ High Performance** - Efficient IMAP/SMTP connections with connection pooling

## 📦 Quick Start

### Install and Run

```bash
# Install globally
npm install -g @artik0din/mcp-mail-manager

# Or run directly with npx
npx @artik0din/mcp-mail-manager
```

### Basic Setup (Password Authentication)

Most email providers support password or app-password authentication:

```bash
# Add a Gmail account (use App Password, not regular password)
add_email_account email="user@gmail.com" password="YOUR_APP_PASSWORD_HERE" name="Personal Gmail"

# Add any other provider (auto-detected)
add_email_account email="user@yahoo.com" password="YOUR_PASSWORD_HERE" name="Yahoo Mail"
```

### Advanced Setup (OAuth2)

For advanced Gmail/Outlook integration, set up OAuth2:

```bash
export GMAIL_CLIENT_ID="your_oauth_client_id"
export GMAIL_CLIENT_SECRET="YOUR_OAUTH_CLIENT_SECRET"
```

## 🛠️ MCP Client Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mail-manager": {
      "command": "npx",
      "args": ["@artik0din/mcp-mail-manager"],
      "env": {
        "MCP_MASTER_KEY": "your_encryption_key"
      }
    }
  }
}
```

### Other MCP Clients

The server communicates via stdio and follows the MCP protocol. Configure according to your client's requirements.

## 📋 Available Tools

### 🔑 Account Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `add_email_account` | Add new email account | `email`, `password`, `name?`, `provider?`, `imap_host?`, `imap_port?`, `smtp_host?`, `smtp_port?`, `test_connection?` |
| `list_email_accounts` | List configured accounts | None |
| `remove_email_account` | Remove an account | `account_id`, `confirm` |

### 📧 Email Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_emails` | List emails from inbox | `account_id`, `folder?`, `limit?`, `unread_only?` |
| `search_emails` | Search emails with filters | `account_id`, `query?`, `from?`, `to?`, `since?`, `before?`, `has_attachment?`, `limit?` |
| `get_email_thread` | Get full email conversation | `account_id`, `message_id`, `include_body?` |
| `send_email` | Send or draft email | `account_id`, `to[]`, `subject`, `body`, `cc?`, `bcc?`, `html?`, `reply_to_message_id?`, `draft?` |

## 🌐 Supported Email Providers

### Major Providers (Auto-Configured)

| Provider | Domains | Auth Methods | Notes |
|----------|---------|--------------|--------|
| **Gmail** | gmail.com, googlemail.com | Password (App Password), OAuth2 | Requires 2FA + App Password |
| **Outlook** | outlook.com, hotmail.com, live.com | Password, OAuth2 | Microsoft 365 supported |
| **Yahoo** | yahoo.com, ymail.com | Password | App Password recommended |
| **iCloud** | icloud.com, me.com, mac.com | Password | App Password required |
| **ProtonMail** | protonmail.com, proton.me | Password | Requires ProtonMail Bridge |
| **Fastmail** | fastmail.com, fastmail.fm | Password | App Password supported |
| **Zoho** | zoho.com | Password | Business accounts supported |
| **AOL** | aol.com | Password | App Password recommended |

### Custom IMAP/SMTP

Any email provider with IMAP/SMTP access:

```bash
add_email_account email="user@example.com" password="YOUR_PASSWORD_HERE" provider="custom" imap_host="mail.example.com" smtp_host="mail.example.com"
```

## 💡 Usage Examples

### Account Setup

```bash
# Gmail with App Password
add_email_account email="user@gmail.com" password="XXXX_XXXX_XXXX_XXXX" name="Work Gmail"

# Custom business email
add_email_account email="user@yourcompany.com" password="YOUR_PASSWORD_HERE" provider="custom" imap_host="mail.company.com" smtp_host="mail.company.com"

# List all accounts
list_email_accounts
```

### Email Management

```bash
# List recent emails
list_emails account_id="you-gmail-com"

# List only unread emails
list_emails account_id="you-gmail-com" unread_only=true

# Search for emails from a specific sender
search_emails account_id="you-gmail-com" from="boss@company.com"

# Search by keyword and date range
search_emails account_id="you-gmail-com" query="project alpha" since="2024-01-01" limit=50
```

### Sending Emails

```bash
# Simple email
send_email account_id="you-gmail-com" to=["colleague@company.com"] subject="Project Update" body="Here's the latest status..."

# Email with CC and HTML
send_email account_id="you-gmail-com" to=["client@company.com"] cc=["manager@company.com"] subject="Proposal" body="Please see attached proposal." html="<p>Please see <strong>attached</strong> proposal.</p>"

# Reply to an email (preserves threading)
send_email account_id="you-gmail-com" to=["original@sender.com"] subject="Re: Original Subject" body="Thanks for your email!" reply_to_message_id="<original-message-id>"
```

## 🔒 Security & Privacy

- **Local Credential Storage**: All credentials encrypted and stored locally in `~/.mcp-mail-manager/`
- **AES-256-GCM Encryption**: Military-grade encryption for sensitive data
- **No Cloud Dependencies**: All data stays on your machine
- **App Password Support**: Secure authentication for 2FA-enabled accounts
- **Minimal Permissions**: Only requests necessary IMAP/SMTP access

### Setting Up App Passwords

- **Gmail**: Enable 2FA → Google Account → Security → App passwords
- **Yahoo**: Account Info → Account security → Generate app password
- **iCloud**: Sign-In and Security → App-Specific Passwords

## 🏗️ Development

```bash
# Clone and setup
git clone https://github.com/artik0din/mcp-mail-manager.git
cd mcp-mail-manager
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

## 📄 License

MIT © 2026 Kevin Valfin

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines and submit PRs to the main branch.

## 🐛 Issues

Found a bug? Please file an issue on [GitHub](https://github.com/artik0din/mcp-mail-manager/issues) with:
- Node.js version
- Email provider
- Error messages/logs
- Steps to reproduce

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/desktop)
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [ProtonMail Bridge](https://proton.me/mail/bridge)