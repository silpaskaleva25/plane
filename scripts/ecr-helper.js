#!/usr/bin/env node
const { execAwsCli, execContainerRuntime } = require('./shell-utils');

/**
 * Detect available container runtime (docker or podman)
 * @returns {string} 'docker' or 'podman'
 */
function getContainerRuntime() {
  // Try podman first (common in local dev)
  try {
    execContainerRuntime('podman', ['--version'], { stdio: 'ignore' });
    return 'podman';
  } catch {
    // Fall back to docker
    try {
      execContainerRuntime('docker', ['--version'], { stdio: 'ignore' });
      return 'docker';
    } catch {
      throw new Error('Neither podman nor docker found. Please install one.');
    }
  }
}

/**
 * Get ECR configuration from environment variables or AWS CLI
 * Environment variables loaded by Nx from .env.local (local dev) or CI/CD environment
 * Always uses 'latest' tag
 * @returns {Object} Configuration object with account, region, envPrefix, projectName, repoName, imageTag, ecrUrl
 */
function getEcrConfig() {
  // Auto-detect AWS account ID
  const account =
    process.env.AWS_ACCOUNT_ID ||
    execAwsCli([
      'sts',
      'get-caller-identity',
      '--query',
      'Account',
      '--output',
      'text',
    ]);

  // Auto-detect AWS region
  const region =
    process.env.AWS_REGION ||
    (() => {
      try {
        return execAwsCli(['configure', 'get', 'region']);
      } catch {
        return 'ca-central-1';
      }
    })();

  // Construct repository name
  let envPrefix = process.env.ENV_PREFIX;
  let projectName = process.env.PROJECT_NAME;

  if (!envPrefix || typeof envPrefix !== 'string' || !envPrefix.trim()) {
    throw new Error(
      'EcrHelper: Required environment variable "ENV_PREFIX" is not set. You can set it through .env.local or pass it via CLI: -c envPrefix=<value>'
    );
  }
  envPrefix = envPrefix.trim();

  if (!projectName || typeof projectName !== 'string' || !projectName.trim()) {
    throw new Error(
      'EcrHelper: Required environment variable "PROJECT_NAME" is not set. You can set it through .env.local or pass it via CLI: -c projectName=<value>'
    );
  }
  projectName = projectName.trim();

  const repoName =
    process.env.ECR_REPOSITORY_NAME || `${envPrefix}-${projectName}-ecr`;

  // Always use 'latest' tag
  const imageTag = 'latest';

  // Construct ECR URL
  const ecrUrl = `${account}.dkr.ecr.${region}.amazonaws.com/${repoName}:${imageTag}`;

  return {
    account,
    region,
    envPrefix,
    projectName,
    repoName,
    imageTag,
    ecrUrl,
  };
}

/**
 * Check if ECR repository exists
 * @param {string} repoName - Repository name
 * @param {string} region - AWS region
 * @returns {boolean} True if repository exists
 */
function ecrExists(repoName, region) {
  try {
    execAwsCli([
      'ecr',
      'describe-repositories',
      '--repository-names',
      repoName,
      '--region',
      region,
    ]);
    return true;
  } catch {
    return false;
  }
}

module.exports = { getEcrConfig, ecrExists, getContainerRuntime };
