# Security Policy

## Supported Versions

OmniSaber is under active development and does not yet follow a formal semantic versioning or long-term support policy.

| Version / branch | Support status |
| --- | --- |
| `main` and the latest project version | Supported with security fixes |
| Older versions | Best effort; support is not guaranteed |
| Third-party forks | Not supported by the OmniSaber maintainers |

Security fixes are primarily applied to `main` and the latest version of the project. This section will be updated when formal, versioned releases are adopted.

## Reporting a Vulnerability

Please do not disclose suspected vulnerabilities publicly through GitHub Issues, pull requests, or other public channels before they have been investigated and corrected.

If GitHub Private Vulnerability Reporting is enabled for this repository, please use it as the preferred reporting channel. If it is not enabled, use a private channel previously provided by the repository maintainer.

> **TODO:** No private maintainer contact channel is currently configured in this repository. The maintainers should enable GitHub Private Vulnerability Reporting or publish a private reporting channel before relying on this policy.

Please include as much of the following information as possible:

- Description of the vulnerability
- Expected or potential impact
- Clear steps to reproduce the issue
- Affected environment, component, route, or configuration
- Evidence or a proof of concept, when applicable
- Suggested fix or mitigation, if available

We aim to acknowledge receipt of a vulnerability report within 7 days. We will provide status updates as the investigation progresses. The correction timeline depends on severity, exploitability, affected users, and the complexity of the fix.

### Handling Process

1. Receive the private report.
2. Triage the report and confirm the affected component.
3. Validate and reproduce the finding when possible.
4. Classify severity and risk.
5. Develop and test a correction.
6. Coordinate disclosure and publish relevant information after mitigation is available.

## Responsible Disclosure

Researchers should avoid actions that could harm users, the project, or its availability. In particular, please avoid:

- Accessing or exposing data belonging to other users
- Destroying, modifying, or exfiltrating production data
- Intentionally making the service unavailable
- Accessing systems, accounts, or records beyond what is necessary to validate the finding
- Publishing vulnerability details, exploit code, or private report contents before coordinated disclosure

Stop testing and report the issue privately as soon as the vulnerability is sufficiently demonstrated.

## Scope

Reports may cover security issues involving:

- Frontend
- Backend
- Authentication
- Supabase configuration or integration
- Row Level Security (RLS) policies
- APIs and RPCs
- Database access
- Access control
- File uploads
- Session handling
- Roles and permissions

## Out of Scope

The following are outside the intended scope of this policy unless they demonstrate a concrete security impact on OmniSaber:

- Social engineering or phishing of maintainers, users, or schools
- Spam, abusive traffic, or content moderation complaints
- Physical attacks or access to facilities and devices
- Deliberate denial-of-service or resource-exhaustion attacks
- Vulnerabilities in dependencies already fixed upstream, when no impact on OmniSaber is confirmed

## Safe Harbor

Security research conducted in good faith, within the scope of this policy, and without causing harm will be handled collaboratively. We will work with researchers who follow these guidelines and will not treat compliant research as hostile activity.
