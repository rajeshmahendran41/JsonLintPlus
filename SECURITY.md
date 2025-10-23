# Security Policy

We take security seriously and appreciate responsible disclosure of any vulnerabilities that may affect JsonlintPlus users.

## Supported Versions

We actively maintain the `main` branch and published releases. Please test and report issues against the latest commit on `main` or the most recent release.

## Reporting a Vulnerability

Do NOT open public issues or pull requests for security vulnerabilities.

Please use GitHub Security Advisories:
- Navigate to the repository’s “Security” tab
- Click “Report a vulnerability”
- Provide a clear, detailed report including:
  - Affected components/files and minimal reproducible steps
  - Impact (e.g., data exposure, DoS, privacy concerns)
  - Proof-of-concept (PoC) code or sequence, if applicable
  - Environment details (browser, OS, version)
  - Any mitigations or recommended fixes

If you cannot use GitHub Security Advisories, you may submit a private report:
- Create a new private repository and invite the maintainers OR
- Share a private gist with reproduction details and invite maintainers

We prefer GitHub Security Advisories as the canonical channel.

## Response Timeline

We aim to acknowledge new reports within 72 hours. After triage:
- Valid issues will be assigned a severity and tracked privately
- We will work to produce a fix and coordinate disclosure
- You will be notified of progress and timelines
- A public advisory will be published once a fix or mitigation is available

## Scope

JsonlintPlus is a static, client-side application with no backend. Potential security concerns typically involve:
- Cross-Site Scripting (XSS) in rendered content
- Service Worker caching or scope misconfiguration
- Content Security Policy configurations when hosted behind different servers/CDNs
- Privacy concerns in logging or data handling
- Supply-chain vulnerabilities in build dependencies

Server-side hosting issues (NGINX/Proxy/CDN) may be out-of-scope unless they arise from configuration we provide (e.g., [`deploy/nginx.conf`](deploy/nginx.conf)).

## Coordinated Disclosure

We follow responsible disclosure practices:
- Vulnerability details remain private until a fix/mitigation is released
- We credit reporters in advisories unless anonymity is requested

## Bounty Program

Currently, there is no formal bug bounty program. High-quality reports and PoCs are valued and will be credited in advisories (with permission).

## Legal

Please do not engage in actions that violate laws or terms of service. Only test against copies you control.

## Contact

Use GitHub Security Advisories as the primary contact channel. If additional coordination is required, we will provide secure communication details during the triage process.