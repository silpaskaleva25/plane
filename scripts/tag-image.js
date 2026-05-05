#!/usr/bin/env node
const { execContainerRuntime } = require('./shell-utils');
const { getEcrConfig, getContainerRuntime } = require('./ecr-helper');

const config = getEcrConfig();
const containerRuntime = getContainerRuntime();
const localImage = `${config.projectName}-api:latest`;

console.log(`Using container runtime: ${containerRuntime}`);
console.log(`Tagging local image '${localImage}' to remote ECR repository.`);
execContainerRuntime(containerRuntime, ['tag', localImage, config.ecrUrl]);
