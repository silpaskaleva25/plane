#!/usr/bin/env node
const { execAwsCli, execContainerRuntime } = require('./shell-utils');
const {
  getEcrConfig,
  ecrExists,
  getContainerRuntime,
} = require('./ecr-helper');

const config = getEcrConfig();
const containerRuntime = getContainerRuntime();

console.log(`Using container runtime: ${containerRuntime}`);
console.log(`Checking ECR repository: ${config.repoName}...`);

if (!ecrExists(config.repoName, config.region)) {
  console.error(
    'Repository not found. It will be created by CDK during first deployment.'
  );
  process.exit(1);
}

console.log('ECR exists. Logging in...');
// Get login password and pipe it to container runtime login
const loginPassword = execAwsCli([
  'ecr',
  'get-login-password',
  '--region',
  config.region,
]);

// Login to ECR
execContainerRuntime(
  containerRuntime,
  [
    'login',
    '--username',
    'AWS',
    '--password-stdin',
    `${config.account}.dkr.ecr.${config.region}.amazonaws.com`,
  ],
  { input: loginPassword, stdio: ['pipe', 'inherit', 'inherit'] }
);

console.log(`Pushing image to ECR repository: ${config.repoName}`);
execContainerRuntime(containerRuntime, ['push', config.ecrUrl]);
