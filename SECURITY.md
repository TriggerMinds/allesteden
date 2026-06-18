# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please **do not** open a public issue.

Instead, send a private report to **gewoo@users.noreply.github.com** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You can expect:

- **Acknowledgement** within 48 hours
- **Initial assessment** within 5 business days
- **Fix timeline** communicated once assessment is complete

## Security Best Practices for Contributors

- Never commit `.env` files or secrets.
- API keys for admin endpoints must be hashed via SHA-256.
- Run `npm audit` before submitting PRs.
- Use parameterized SQL (`$1`, `$2`) — never concatenate user input into queries.
- All public API endpoints are rate-limited via Redis sliding window.
