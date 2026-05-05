#!/usr/bin/env node
/**
 * Smoke Test Script - Post-Deployment Validation
 *
 * Configuration obtained via getEcrConfig() from ecr-helper.js:
 * - envPrefix: environment prefix for resource isolation or AWS environment identification
 * - projectName: application stack identification
 *
 * Usage:
 * - Local dev (personal): ENV_PREFIX=philippe, PROJECT_NAME=starter in .env.local
 *   → Resources: philippe-starter-api-cluster, philippe-starter-alb, etc.
 *
 * - CI/CD: ENV_PREFIX and PROJECT_NAME must be set via environment variables
 *   → Resources: <envPrefix>-<projectName>-api-cluster, <envPrefix>-<projectName>-alb, etc.
 */

const { execAwsCli, execCurl } = require('./shell-utils');
const { getEcrConfig } = require('./ecr-helper');

// Get centralized configuration
const config = getEcrConfig();
const envPrefix = config.envPrefix;
const projectName = config.projectName;

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};
const CLUSTER_NAME = `${envPrefix}-${projectName}-api-cluster`;
const SERVICE_NAME = `${envPrefix}-${projectName}-api`;
const ALB_NAME = `${envPrefix}-${projectName}-alb`;
const API_GATEWAY_NAME = `${envPrefix}-${projectName}-api-gateway`;

let testsPassed = 0;
let testsWarned = 0;
let testsFailed = 0;

function pass(message) {
  console.log(`${message} ${colors.green}✓ PASS${colors.reset}`);
  testsPassed++;
}

function warn(message) {
  console.log(`${message} ${colors.yellow}⚠ WARN${colors.reset}`);
  testsWarned++;
}

function fail(message) {
  console.log(`${message} ${colors.red}✗ FAIL${colors.reset}`);
  testsFailed++;
}

/**
 * Execute AWS CLI command with error handling
 * @param {string[]} args - AWS CLI arguments
 * @returns {string|null} Command output or null on error
 */
function awsCommand(...args) {
  try {
    return execAwsCli(args);
  } catch {
    return null;
  }
}

/**
 * Execute curl command with error handling
 * @param {string[]} args - curl arguments
 * @returns {string|null} Command output or null on error
 */
function curlCommand(...args) {
  try {
    return execCurl(args).trim();
  } catch {
    return null;
  }
}

console.log('=========================================');
console.log('Smoke Test: Infrastructure Health Check');
console.log('=========================================');
console.log(`Environment Prefix: ${envPrefix}`);
console.log(`Project: ${projectName}`);
console.log('');

// Test 1: Check ECS Cluster
process.stdout.write('Checking ECS cluster... ');
const clusterStatus = awsCommand(
  'ecs',
  'describe-clusters',
  '--clusters',
  CLUSTER_NAME,
  '--query',
  'clusters[0].status',
  '--output',
  'text'
);
if (clusterStatus === 'ACTIVE') {
  pass(`ECS cluster '${CLUSTER_NAME}' is active`);
} else {
  fail(`ECS cluster '${CLUSTER_NAME}' not found or not active`);
}

// Test 2: Check ECS Service
process.stdout.write('Checking ECS service... ');
const serviceStatus = awsCommand(
  'ecs',
  'describe-services',
  '--cluster',
  CLUSTER_NAME,
  '--services',
  SERVICE_NAME,
  '--query',
  'services[0].status',
  '--output',
  'text'
);
if (serviceStatus === 'ACTIVE') {
  pass(`ECS service '${SERVICE_NAME}' is active`);
} else {
  fail(`ECS service '${SERVICE_NAME}' not found or not active`);
}

// Test 3: Check Task Counts
process.stdout.write('Checking ECS task count... ');
const serviceInfo = awsCommand(
  'ecs',
  'describe-services',
  '--cluster',
  CLUSTER_NAME,
  '--services',
  SERVICE_NAME,
  '--query',
  'services[0].{desired:desiredCount,running:runningCount,pending:pendingCount}',
  '--output',
  'json'
);

let desired = 0,
  running = 0,
  pending = 0;
if (serviceInfo) {
  const info = JSON.parse(serviceInfo);
  desired = info.desired;
  running = info.running;
  pending = info.pending;

  console.log(`desired=${desired}, running=${running}, pending=${pending}`);

  if (desired === 0) {
    warn("Service deployed with desiredCount=0 (no 'latest' image found)");
  } else if (running === desired) {
    pass(`All ${desired} desired task(s) running`);
  } else if (pending > 0) {
    warn(`Tasks still starting (pending=${pending})`);
  } else {
    fail(`Expected ${desired} running tasks, got ${running}`);
  }
}

// Test 4: Check ALB
process.stdout.write('Checking Application Load Balancer... ');
const albDns = awsCommand(
  'elbv2',
  'describe-load-balancers',
  '--names',
  ALB_NAME,
  '--query',
  'LoadBalancers[0].DNSName',
  '--output',
  'text'
);
if (albDns && albDns !== 'None') {
  pass(`ALB exists: ${albDns}`);
} else {
  fail(`ALB '${ALB_NAME}' not found`);
}

// Test 5: Check API Gateway
process.stdout.write('Checking API Gateway... ');
const apiId = awsCommand(
  'apigatewayv2',
  'get-apis',
  '--query',
  `Items[?Name=='${API_GATEWAY_NAME}'].ApiId | [0]`,
  '--output',
  'text'
);
if (apiId && apiId !== 'None') {
  const apiEndpoint = awsCommand(
    'apigatewayv2',
    'get-apis',
    '--query',
    `Items[?ApiId=='${apiId}'].ApiEndpoint | [0]`,
    '--output',
    'text'
  );
  pass(`API Gateway exists: ${apiEndpoint}`);
} else {
  fail(`API Gateway '${API_GATEWAY_NAME}' not found`);
}

// Test 6: Check VPC Link
if (apiId) {
  process.stdout.write('Checking VPC Link... ');
  const vpcLinkPattern = `${envPrefix}-${projectName}`;
  const vpcLinkId = awsCommand(
    'apigatewayv2',
    'get-vpc-links',
    '--query',
    `Items[?starts_with(Name, '${vpcLinkPattern}')].VpcLinkId | [0]`,
    '--output',
    'text'
  );

  if (vpcLinkId && vpcLinkId !== 'None') {
    const vpcLinkStatus = awsCommand(
      'apigatewayv2',
      'get-vpc-link',
      '--vpc-link-id',
      vpcLinkId,
      '--query',
      'VpcLinkStatus',
      '--output',
      'text'
    );

    if (vpcLinkStatus === 'AVAILABLE') {
      pass(`VPC Link is ${vpcLinkStatus}`);
    } else {
      warn(`VPC Link status: ${vpcLinkStatus}`);
    }
  } else {
    fail('VPC Link not found');
  }
}

// Test 7: Check Target Health (only if tasks running)
if (running > 0 && albDns) {
  process.stdout.write('Checking ALB target health... ');

  const lbArn = awsCommand(
    'elbv2',
    'describe-load-balancers',
    '--names',
    ALB_NAME,
    '--query',
    'LoadBalancers[0].LoadBalancerArn',
    '--output',
    'text'
  );

  const tgArn = awsCommand(
    'elbv2',
    'describe-target-groups',
    '--load-balancer-arn',
    lbArn,
    '--query',
    'TargetGroups[0].TargetGroupArn',
    '--output',
    'text'
  );

  const healthyCount = awsCommand(
    'elbv2',
    'describe-target-health',
    '--target-group-arn',
    tgArn,
    '--query',
    "TargetHealthDescriptions[?TargetHealth.State=='healthy'] | length(@)",
    '--output',
    'text'
  );

  if (healthyCount && Number.parseInt(healthyCount) > 0) {
    pass(`${healthyCount} healthy target(s)`);
  } else {
    warn('No healthy targets yet (tasks may still be starting)');
  }
}

// Test 8: HTTP Health Check via API Gateway (only if tasks running)
if (running > 0 && apiId) {
  process.stdout.write('Checking API Gateway health endpoint... ');

  const apiEndpoint = awsCommand(
    'apigatewayv2',
    'get-apis',
    '--query',
    `Items[?ApiId=='${apiId}'].ApiEndpoint | [0]`,
    '--output',
    'text'
  );

  if (apiEndpoint && apiEndpoint !== 'None') {
    const healthResponse = curlCommand(
      '-f',
      '-s',
      '-m',
      '10',
      `${apiEndpoint}/health`
    );

    if (healthResponse === null) {
      warn(
        `Health endpoint not yet responding. Try: curl ${apiEndpoint}/health`
      );
    } else {
      pass('API Gateway health endpoint responding');
    }
  }
}

// Test 9: CloudFormation Stack
process.stdout.write('Checking CloudFormation stack... ');
const stackName = envPrefix
  ? `${envPrefix}-${projectName}-api`
  : `${projectName}-api`;
const stackStatus = awsCommand(
  'cloudformation',
  'describe-stacks',
  '--stack-name',
  stackName,
  '--query',
  'Stacks[0].StackStatus',
  '--output',
  'text'
);

if (stackStatus && stackStatus.includes('COMPLETE')) {
  pass(`Stack status: ${stackStatus}`);
} else if (stackStatus && stackStatus.includes('IN_PROGRESS')) {
  warn(`Stack status: ${stackStatus} (deployment in progress)`);
} else {
  fail(`Stack status: ${stackStatus || 'NOT_FOUND'}`);
}

// Test 10: Load Test - Multiple Requests (detects intermittent failures)
if (running > 0 && apiId) {
  process.stdout.write('Running load test (20 requests)... ');

  const apiEndpoint = awsCommand(
    'apigatewayv2',
    'get-apis',
    '--query',
    `Items[?ApiId=='${apiId}'].ApiEndpoint | [0]`,
    '--output',
    'text'
  );

  if (apiEndpoint && apiEndpoint !== 'None') {
    let successCount = 0;

    // Run 20 requests to detect intermittent issues
    for (let i = 1; i <= 20; i++) {
      const httpCode = curlCommand(
        '-s',
        '-o',
        '/dev/null',
        '-w',
        '%{http_code}',
        '-m',
        '10',
        `${apiEndpoint}/greeting`
      );

      if (httpCode === '200') {
        successCount++;
      }
    }

    const successRate = ((successCount / 20) * 100).toFixed(0);

    if (successCount === 20) {
      pass(`20/20 requests successful (100% reliability)`);
    } else if (successCount >= 18) {
      warn(
        `${successCount}/20 requests successful (${successRate}% - minor intermittent issues)`
      );
    } else {
      fail(
        `Only ${successCount}/20 requests successful (${successRate}% - significant reliability issues)`
      );
    }
  }
}

// Summary
console.log('');
console.log('=========================================');
console.log('Smoke Test Summary');
console.log('=========================================');
console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
if (testsWarned > 0) {
  console.log(`${colors.yellow}Warnings: ${testsWarned}${colors.reset}`);
}
if (testsFailed > 0) {
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
}
console.log('');

if (desired === 0) {
  console.log(
    `${colors.yellow}Note:${colors.reset} Infrastructure deployed without running tasks`
  );
  console.log("To deploy with tasks, build and push a 'latest' image:");
  console.log('  nx run api-app:push:image');
  console.log('  nx run infra-app:deploy');
} else if (testsFailed === 0) {
  console.log(`${colors.green}✓ All tests passed${colors.reset}`);
  console.log('');
  console.log('Next steps:');
  if (apiId) {
    const apiEndpoint = awsCommand(
      'apigatewayv2',
      'get-apis',
      '--query',
      `Items[?ApiId=='${apiId}'].ApiEndpoint | [0]`,
      '--output',
      'text'
    );
    if (apiEndpoint && apiEndpoint !== 'None') {
      console.log(`  • Test API: curl ${apiEndpoint}/health`);
      console.log(`  • Test Greeting: curl ${apiEndpoint}/greeting`);
    }
  }
  console.log(`  • Monitor logs: aws logs tail /ecs/${SERVICE_NAME} --follow`);
  console.log('');
  console.log(
    'Architecture: API Gateway (HTTPS) → VPC Link (App_sg, Web tier) → ALB (App_sg, Web tier) → ECS (App_sg, App tier)'
  );
}

process.exit(testsFailed > 0 ? 1 : 0);

