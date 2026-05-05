# Secure Coding Guidelines

This document outlines essential practices for writing secure code in Starter Products. These guidelines help prevent common vulnerabilities and ensure compliance with security and other standards.

## Tools and Practices

Scans will be done in both local developer environments and in automated CICD processes.
These scans include:

- Static Code Analysis
  - linting
  - SonarQube
- Software Composition Analysis (SCA)
  - dependency audit
- Static Application Security Testing
  - Trivy
- Other

  - secrets vulnerabilities w/TruffleHog
  - format check
  - unit tests

**Before ANY changes are committed to the repository,** a local secret scan MUST be run and all alerts will be addressed. See [Local Scanning Guide](local-scanning-guide.md)

**Before a Pull Request is opened for review,** a local full scan MUST be done and all alerts will be addressed. See [Local Scanning Guide](local-scanning-guide.md)

## Secrets

**Never commit secrets, API keys, or credentials.**: Use a secrets manager or environment variables

## Authentication and Authorization

Enforce least-privilege, role-based access controls

## Data Protection

- **DO NOT** log sensitive information (PII, secrets, sensitive information)
- Follow data minimization principles

## Dependency Management

- Only long-term support (LTS) packages should be used. Check when you are adding a package or tool that you are adding the LTS version

- Use exact versions in any `package.json` file for 'dependencies', 'devDependencies' or 'peerDependencies'

✅ **Correct**

- `"vite": "7.1.11",` - has exact package version

❌ **Incorrect**

- `"vite": "^7.1.11",` - package version is not exact because of the `^`
- `"vite": "~7.1.11",` - package version is not exact because of the `~`

### Overriding Packages

- The key **must** have a version specified. Use the exact version when possible. If it is not possible, use the narrowest range possible.
- The value **must** have an exact version specified

✅ **Correct**

- `"vite@7.1.5": "7.1.11",` - has exact key and value package versions
- `"node-forge@<1.3.2": "1.3.2",` - has limited key and exact value package versions

❌ **Incorrect**

- `"vite": "7.1.11",` - missing key version
- `"vite@7.1.5": "^7.1.11",` - value package version is not exact
- `"vite@7.1.5": "~7.1.11",` - value package version is not exact

## Defaults

If a default value is to be used, it should be set to the value that will be used in a Production environment. That way, if there is any misconfiguration, then it will be be set at the ‘safest’ value should that misconfiguration be deployed throughout the environments

## Input Validation

- Always validate and sanitize user inputs to prevent injection attacks (e.g., SQL injection, XSS)
- Use parameterized queries for database interactions. This may be provided by the ORM

## Error Handling

- Do not expose internal error details to users
- Implement proper exception handling to avoid information leakage

## References

- [Org Secure Coding Standards](https://internal-docs.sharepoint.com/sites/S400D27-PROJECT/Starter%20Documents/Forms/AllItems.aspx?csf=1&web=1&e=884iZR&CID=c517e5e7%2D8698%2D4d56%2Dbd14%2Ddd10112f75ad&FolderCTID=0x012000769E6CF691030F4FA24EFDD8020AD1A6&id=%2Fsites%2FS400D27%2DPROJECT%2FStarter%20Documents%2FPlatform%20and%20Data%20Team%2FSecure%20Coding%20Standards%20Draft)
- Project's [Coding Guidelines](coding-guidelines.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Microsoft Secure Coding Guidelines](https://learn.microsoft.com/en-us/dotnet/standard/security/secure-coding-guidelines)


