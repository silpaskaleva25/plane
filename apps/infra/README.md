# Infrastructure Application

The infra app is a TypeScript AWS CDK application that defines and deploys the cloud infrastructure for the Starter App. It serves as the entry point for infrastructure-as-code, orchestrating the deployment of web and API stacks to AWS.

## Overview

This application uses AWS CDK to provision:

- **WebStack** - Static web hosting infrastructure (CloudFront distribution, S3 bucket)
- **ApiStack** - API hosting infrastructure (API Gateway, container-based API service)

Both stacks are provided by the `@starter/infra-components` library, which implements reusable infrastructure patterns for the Starter App.

## Features

The infra app leverages the following default features from the starter infra components library:

| Stack        | Features                                                   |
| ------------ | ---------------------------------------------------------- |
| **WebStack** | CloudFront distribution, S3 static hosting, HTTPS support  |
| **ApiStack** | API Gateway, containerized API deployment, VPC integration |

## Working with the App

For detailed instructions on building, testing, and deploying, see the [repository README](../../README.md).

### Common Commands

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `nx build infra-app`  | Build the application                     |
| `nx test infra-app`   | Run unit tests                            |
| `nx lint infra-app`   | Run linting                               |
| `nx synth infra-app`  | Synthesize CloudFormation templates       |
| `nx diff infra-app`   | Compare deployed stack with local changes |
| `nx deploy infra-app` | Deploy stacks to AWS                      |

### Required Context Variables

When running CDK commands, the following context variables must be provided:

```bash
-c envPrefix=<environment>  # e.g., dev, test, prod, philippe, adrian, etc.
-c vpcPrefix=<vpc-prefix>   # e.g., Dev, Test, Prod
-c projectName=<name>       # application stack identifier
```

## Dependencies

| Dependency                | Type     | Description                                                 |
| ------------------------- | -------- | ----------------------------------------------------------- |
| `@starter/infra-components` | Library  | Starter App infrastructure components (WebStack, ApiStack)  |
| `@starter/infra-components`   | Package  | Starter Platform shared infrastructure constructs and utilities |
| `aws-cdk-lib`             | External | AWS CDK framework                                           |

## How It Works - Api Stack

The deployment system automatically detects whether a 'latest' image exists in ECR:

- **No 'latest' image**: Deploys with `desiredCount=0` (infrastructure only)
- **'latest' image exists**: Deploys with `desiredCount=1`:
  - The ALB has cross-zone load balancing enabled (routes to healthy targets in any AZ)
  - Single task is sufficient for dev/uat with proper VPC Link configuration (Web tier subnets only)
  - ECS places the task in an availability zone automatically
  - Can be scaled up for production High Availability (multiple tasks) when needed

```bash
# 1. First-time setup: Deploy infrastructure (creates ECR, ECS, ALB, API Gateway)
nx run infra-app:deploy

# 2. All subsequent deployments: Build, push image, and re-deploy (and CDK diff)
nx run infra-app:deploy:image
```

**Note:** The first `deploy` creates infrastructure with `desiredCount=0`. After that, always use `deploy:image` which builds the container, pushes it to ECR, and deploys with `desiredCount=1`.

## Validation

### Automated Smoke Tests (Recommended)

The easiest way to validate a deployment is using the smoke test script:

```bash
nx run infra-app:smoke-test
```

This runs 10 comprehensive checks:

1. ECS cluster status
2. ECS service status
3. Task counts (validates desired vs running)
4. ALB existence
5. API Gateway existence and endpoint
6. VPC Link status
7. Target health
8. API Gateway health endpoint (end-to-end)
9. CloudFormation stack status
10. Load test (20 requests to detect intermittent failures)

The script automatically:

- Loads configuration from `.env.local` (local dev) or environment variables (CI/CD)
- Validates task and target health
- Tests end-to-end connectivity through API Gateway
- **Runs 20 consecutive requests to detect intermittent issues** (catches security group, VPC Link subnet, or routing problems)
- Provides clear pass/warn/fail results with actionable next steps

### Manual Validation

If you need to check specific components manually:

#### Check Service Status

```bash
# Load environment variables from the root of the project (if not already loaded)
source .env.local

# Get desired, running and pending instance count
aws ecs describe-services \
  --cluster $ENV_PREFIX-$PROJECT_NAME-api-cluster \
  --services $ENV_PREFIX-$PROJECT_NAME-api \
  --profile $AWS_PROFILE \
  --query 'services[0].{desired:desiredCount,running:runningCount,pending:pendingCount}'
```

#### Test API Health

```bash
# Load environment variables from the root of the project (if not already loaded)
source .env.local

# Get API Gateway URL from CloudFormation outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name $ENV_PREFIX-$PROJECT_NAME-api \
  --profile $AWS_PROFILE \
  --query 'Stacks[0].Outputs[?contains(OutputKey, `ApiGatewayUrl`)].OutputValue | [0]' \
  --output text)

curl -f ${API_URL}health
```

**Note:** The Application Load Balancer is internal-only (not internet-facing). External access is through API Gateway, which proxies requests to the internal ALB.

## Notes

- CDK deployment: ~5-10 minutes
- Task startup: ~1-3 minutes
- ALB health checks: 30 second intervals, requires 2 consecutive successes
- ECS automatically retries failed tasks with exponential backoff


