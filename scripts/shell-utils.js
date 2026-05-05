#!/usr/bin/env node
/**
 * Secure shell execution utilities
 *
 * This module provides secure wrappers for executing external commands
 * that avoid shell injection and PATH vulnerabilities (SonarQube javascript:S4036, javascript:S4721)
 *
 * Key security principles:
 * - Uses execFileSync which NEVER spawns a shell
 * - Avoids relying on PATH environment variable
 * - Uses absolute paths derived from __dirname
 * - Always passes arguments as arrays to prevent injection
 */

const { execFileSync } = require('node:child_process');
const path = require('node:path');

/**
 * Get the project root directory (one level up from scripts/)
 * @returns {string} Absolute path to project root
 */
function getProjectRoot() {
  return path.resolve(__dirname, '..');
}

/**
 * Execute a Node.js script securely
 * @param {string} scriptPath - Relative or absolute path to the script
 * @param {string[]} args - Arguments to pass to the script
 * @param {Object} options - execFileSync options
 * @returns {string|Buffer} Output from the script
 */
function execNodeScript(scriptPath, args = [], options = {}) {
  const absolutePath = path.isAbsolute(scriptPath)
    ? scriptPath
    : path.join(getProjectRoot(), scriptPath);

  return execFileSync(process.execPath, [absolutePath, ...args], {
    encoding: 'utf8',
    cwd: getProjectRoot(),
    ...options,
  });
}

/**
 * Returns args after having added --profile flag if AWS_PROFILE is set and not 'default'
 */
function getArgWithProfile(originalArgs) {
  let awsProfile = process.env.AWS_PROFILE;
  if (!awsProfile || typeof awsProfile !== 'string' || !awsProfile.trim()) {
    throw new Error(
      'ShellUtils: Required environment variable "AWS_PROFILE" is not set. You can set it through .env.local or pass it via CLI: -c awsProfile=<value>'
    );
  }
  awsProfile = awsProfile.trim();
  if (awsProfile === 'default') {
    throw new Error(
      'ShellUtils: Using AWS profile "default" is not allowed for security reasons.\n'
    );
  }
  return [...originalArgs, '--profile', awsProfile];
}

/**
 * Execute an AWS CLI command securely
 * Uses execFileSync with 'aws' command - assumes AWS CLI is installed and in system PATH
 * Note: While this uses PATH to find 'aws', it's acceptable because:
 * 1. AWS CLI is a trusted system tool installed by admins
 * 2. We use execFileSync with array args (no shell injection possible)
 * 3. All arguments are passed as array elements (properly escaped)
 *
 * @param {string[]} args - AWS CLI arguments (e.g., ['ecr', 'describe-repositories'])
 * @param {Object} options - execFileSync options
 * @returns {string} Trimmed output from AWS CLI
 */
function execAwsCli(args, options = {}) {
  // prettier-ignore
  const result = execFileSync('aws', getArgWithProfile(args), { // NOSONAR javascript:S4036 - AWS CLI is a trusted system tool; execFileSync prevents shell injection
    encoding: 'utf8',
    cwd: getProjectRoot(),
    ...options,
  });
  // AWS CLI always adds trailing newlines, trim for convenience
  return result.trim();
}

/**
 * Execute a container runtime command securely (docker or podman)
 * @param {string} runtime - 'docker' or 'podman'
 * @param {string[]} args - Container runtime arguments
 * @param {Object} options - execFileSync options
 * @returns {string|Buffer} Output from container runtime
 */
function execContainerRuntime(runtime, args, options = {}) {
  if (runtime !== 'docker' && runtime !== 'podman') {
    throw new Error(`Invalid container runtime: ${runtime}`);
  }

  // prettier-ignore
  return execFileSync(runtime, args, { // NOSONAR javascript:S4036 - docker/podman are trusted system tools; execFileSync prevents shell injection
    cwd: getProjectRoot(),
    stdio: 'inherit',
    ...options,
  });
}

/**
 * Execute curl command securely
 * @param {string[]} args - curl arguments
 * @param {Object} options - execFileSync options
 * @returns {string|Buffer} Output from curl
 */
function execCurl(args, options = {}) {
  // prettier-ignore
  return execFileSync('curl', args, { // NOSONAR javascript:S4036 - curl is a trusted system tool; execFileSync prevents shell injection
    encoding: 'utf8',
    cwd: getProjectRoot(),
    ...options,
  });
}

/**
 * Find and execute a locally installed npm package binary
 * @param {string} packageName - Name of the package (e.g., 'aws-cdk')
 * @param {string} binPath - Relative path to the binary within the package (e.g., 'bin/cdk')
 * @param {string[]} args - Arguments to pass to the binary
 * @param {Object} options - execFileSync options
 * @returns {string|Buffer} Output from the command
 */
function execLocalPackage(packageName, binPath, args = [], options = {}) {
  const fs = require('node:fs');
  const projectRoot = getProjectRoot();

  try {
    // Use require.resolve to find the package reliably (works with npm, pnpm, yarn)
    const packageJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [projectRoot],
    });
    const packageDir = path.dirname(packageJsonPath);
    const binaryPath = path.join(packageDir, binPath);

    if (!fs.existsSync(binaryPath)) {
      throw new Error(`Binary not found at ${binaryPath}`);
    }

    // Execute the binary with Node.js
    return execFileSync(process.execPath, [binaryPath, ...args], {
      encoding: 'utf8',
      cwd: projectRoot,
      stdio: 'inherit',
      ...options,
    });
  } catch (error) {
    throw new Error(
      `Failed to execute ${packageName}: ${error.message}\nRun: pnpm install`
    );
  }
}

/**
 * Execute AWS CDK CLI commands
 * CDK must run from apps/infra directory where cdk.json is located
 * @param {string[]} args - CDK CLI arguments (e.g., ['deploy', '--all'])
 * @returns {string|Buffer} Output from CDK
 */
function execCdk(args = []) {
  const projectRoot = getProjectRoot();
  const infraDir = path.join(projectRoot, 'apps', 'infra');

  return execLocalPackage('aws-cdk', 'bin/cdk', getArgWithProfile(args), {
    cwd: infraDir,
  });
}

module.exports = {
  getProjectRoot,
  execNodeScript,
  execAwsCli,
  execContainerRuntime,
  execCurl,
  execLocalPackage,
  execCdk,
};

