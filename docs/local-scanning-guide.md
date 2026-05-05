# Local Code Scanning Guide

This guide helps developers run comprehensive code quality and security scans during development. The repository includes several scripts that invoke scanning tools to ensure code quality, security compliance, and consistent formatting across the codebase. It also includes convenience pnpm commands to run them.

## Overview

The local scanning system provides multiple layers of protection:

- **Security**: Vulnerability scanning for dependencies and secrets
- **Quality**: Code formatting, linting, and SonarQube analysis
- **Functionality**: Unit tests to prevent regressions
- **Compliance**: Automated checks for coding standards

All scans can be run individually during development or together before creating pull requests.

## Quick Start

The following tools must be installed before these scans can be run:

- **pnpm** See [How to use npm audit](https://internal-wiki.atlassian.net/wiki/spaces/STARTER/pages/4207607932/How+to+use+npm+audit+locally+play)
- **Node.js** See [How to use nx code quality checking](https://internal-wiki.atlassian.net/wiki/spaces/STARTER/pages/4242735172/How+to+use+nx+code+quality+checking+play)
- **Trivy**: Install from [Trivy Installation and User Guide](https://internal-wiki.atlassian.net/wiki/spaces/STARTER/pages/4186603602/Trivy+Installation+and+User+Guide)
- **SonarQube** See [How to work locally with SonarQube](https://internal-wiki.atlassian.net/wiki/spaces/STARTER/pages/4176838806/How+to+work+locally+with+SonarQube+Play)
- **Bash shell**: See [Git Bash](https://gitforwindows.org/)

### Environment Setup

#### For SonarQube Scanning

Create `.env.local` in the project root:

```bash
SONAR_HOST_URL=http://your-sonar-server:9000
SONAR_TOKEN=your-sonar-token-here
```

### Commands

Run all scans, at least once before creating a PR:

```bash
pnpm local-scan-full
```

Run individual scans as needed:

```bash
# Security vulnerability scan
pnpm local-scan-audit

# Code formatting check
pnpm local-scan-format

# Code linting check
pnpm local-scan-lint

# Unit tests
pnpm local-scan-test

# Container/filesystem vulnerability scan
pnpm local-scan-trivy

# SonarQube code quality analysis
pnpm local-scan-sonar
```

## Individual Scan Commands

### 🔍 **Full Scan** - `pnpm local-scan-full`

Runs all scans in sequence. **Required before creating a PR. Recommended to be run at intervals during development.**

- Stops on first failure
- Shows which scan failed
- Most comprehensive security and quality check

### 🔒 **Security Audit** - `pnpm local-scan-audit`

Scans npm dependencies for known security vulnerabilities.

- Uses `pnpm audit` to check package dependencies
- Blocks on any HIGH or CRITICAL vulnerabilities
- **Script**: `scripts/local-scan-audit.sh`

### 🎨 **Code Formatting** - `pnpm local-scan-format`

Checks if code follows project formatting standards.

- Uses Prettier to validate formatting
- Compares against `main` branch changes only
- **Script**: `scripts/local-scan-format.sh`

### ✨ **Code Linting** - `pnpm local-scan-lint`

Analyzes code for potential errors and style violations.

- Uses ESLint on TypeScript/JavaScript files
- Runs across all projects with lint targets
- **Script**: `scripts/local-scan-lint.sh`

### 🧪 **Unit Tests** - `pnpm local-scan-test`

Executes project unit tests to verify functionality.

- Runs Jest tests across the workspace
- Ensures code changes don't break existing functionality
- **Script**: `scripts/local-scan-test.sh`

### 🛡️ **Vulnerability Scan** - `pnpm local-scan-trivy`

Scans filesystem for security vulnerabilities and secrets.

- Uses Trivy to scan source code and dependencies
- Detects known CVEs and security issues
- **Script**: `scripts/local-scan-trivy.sh`

### 📊 **Code Quality** - `pnpm local-scan-sonar`

Performs comprehensive code quality analysis.

- Uses SonarQube for technical debt analysis
- Checks code smells, bugs, and security hotspots
- **Requires**: `.env.local` with `SONAR_TOKEN` and `SONAR_HOST_URL`
- **Script**: `scripts/local-scan-sonar.sh`

## Fixing Common Issues

### Security Vulnerabilities (`local-scan-audit`)

- Update vulnerable packages in package.json
- For packages that can't be updated directly, add overrides in package.json

It is recommended that teams create separate PRs whose sole purpose is to address the current vulnerabilities found. These PRs should be prioritized. Once a PR with a vulnerability fix is merged to main all team members should be notified so that they can update from main. This ensures the fix is distributed promptly to all.

### Formatting Issues (`local-scan-format`)

Check why files are not formatting correctly when being edited. The VS Code setting `Format on Save` should be used, and it should use the `prettier` formatter with the provided `.prettierrc` file. The following commands can be used to correct existing issues but should not be needed once the formatting is correctly set up in VS Code.

```bash
# Auto-fix formatting issues
nx format:write
```

### Linting Issues (`local-scan-lint`)

Examine each error listed. Resolve based on the code compliance guidelines for the project.

### Test Failures (`local-scan-test`)

Determine which tests have failed, resolve the issues, and rerun each test.

### Sonar Scan Issues

Review the scan results in the SonarQube instance. Determine if the recommendations should be followed. If not, discuss with your team what the correct steps are. Consult the platform team for direction.

## Performance Tips

- **Use individual scans** during development for faster feedback
- **Run full scan** only before committing or pushing
- **Format and lint** can be run together for style-related fixes
- **Tests** can be run in watch mode during active development

## Troubleshooting

### Scan Hanging or Slow

- Check VS Code terminal vs external terminal performance
- Clear Nx cache: `nx reset`

### Permission Issues

- Ensure bash is available in PATH

### Environment Variable Issues

- Verify `.env.local` exists for SonarQube scans
- Check that the `cross-env` package is installed

For more help, check the individual script files in the `scripts/` directory and refer to the setup guides listed above.

