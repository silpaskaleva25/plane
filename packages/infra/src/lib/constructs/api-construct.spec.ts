import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VPC_PREFIX } from '../constants';
import { TestEnvVariables } from '../utils/test-helper';
import { ApiConstruct, ApiConstructProps } from './api-construct';

// Mock the VPC lookup functions to return actual VPCs instead of doing lookups
jest.mock('../utils/vpc-lookup', () => {
  const actual = jest.requireActual<typeof import('../utils/vpc-lookup')>(
    '../utils/vpc-lookup'
  );
  return {
    ...actual,
    lookupVpcByEnv: jest.fn((scope, id, vpcPrefix) => {
      const { Stack } = require('aws-cdk-lib');
      const { Vpc } = require('aws-cdk-lib/aws-ec2');
      const stack = Stack.of(scope);
      return new Vpc(stack, `${id}Vpc`, {
        vpcName: `${vpcPrefix}_vpc`,
      });
    }),
    subnetByEnvAndNameFilter: jest.fn(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (subnets: any[]) => subnets;
    }),
  };
});

// Mock SecurityGroup.fromLookupByName to return actual security groups
jest.mock('aws-cdk-lib/aws-ec2', () => {
  const actualEc2 = jest.requireActual('aws-cdk-lib/aws-ec2');
  const SecurityGroupClass = actualEc2.SecurityGroup;
  return {
    ...actualEc2,
    SecurityGroup: class extends SecurityGroupClass {
      static fromLookupByName(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scope: any,
        id: string,
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vpc: any
      ): InstanceType<typeof SecurityGroupClass> {
        const { Stack } = require('aws-cdk-lib');
        const stack = Stack.of(scope);
        return new SecurityGroupClass(stack, `${id}SecurityGroup`, {
          vpc,
          securityGroupName: name,
        });
      }
    },
  };
});

describe('ApiConstruct', () => {
  const {
    AWS_ACCOUNT_ID: account,
    AWS_REGION: region,
    ENV_PREFIX: envPrefix,
    PROJECT_NAME: projectName,
  } = TestEnvVariables;

  // Helper to create ApiConstruct with default props and optional overrides
  const createApiConstruct = (
    stack: Stack,
    overrides: Partial<ApiConstructProps> = {}
  ) => {
    const defaultProps = {
      envPrefix,
      projectName,
      vpcPrefix: VPC_PREFIX.DEV,
      containerPort: 8080,
    };

    // prettier-ignore
    new ApiConstruct(stack, 'TestApi', { // NOSONAR Typescript:S1848 - Construct instantiation has side effects (registers resources)
      ...defaultProps,
      ...overrides,
    });

    return Template.fromStack(stack);
  };

  it('should create ECS cluster with correct name', () => {
    const stack = new Stack(undefined, 'TestStack', {
      env: {
        account,
        region,
      },
    });
    const template = createApiConstruct(stack, {
      repositoryName: `${envPrefix}-${projectName}-ecr`,
    });

    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: `${envPrefix}-${projectName}-api-cluster`,
    });
  });

  it('should create ECS cluster without envPrefix', () => {
    const stack = new Stack(undefined, 'TestStack', {
      env: {
        account,
        region,
      },
    });
    const template = createApiConstruct(stack, {
      envPrefix: '',
      repositoryName: `${projectName}-ecr`,
    });

    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: `${projectName}-api-cluster`,
    });
  });

  it('should create ApiContainerConstruct', () => {
    const stack = new Stack(undefined, 'TestStack', {
      env: {
        account,
        region,
      },
    });
    const template = createApiConstruct(stack);

    // Verify that ECS Service is created (from ApiContainerConstruct)
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: `${envPrefix}-${projectName}-api`,
    });
  });

  it('should create API Gateway with proxy integration', () => {
    const stack = new Stack(undefined, 'TestStack', {
      env: {
        account,
        region,
      },
    });
    const template = createApiConstruct(stack, {
      repositoryName: `${envPrefix}-${projectName}-ecr`,
      apiGatewayProps: {
        apiName: 'api-gateway',
        envPrefix,
        projectName,
      },
    });

    // Verify API Gateway is created
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: `${envPrefix}-${projectName}-api-gateway`,
    });

    // Verify Route (HTTP API uses routes instead of resources/methods)
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'ANY /{proxy+}',
    });
  });

  it('should create ECR repository with security defaults', () => {
    const stack = new Stack(undefined, 'TestStack', {
      env: {
        account,
        region,
      },
    });
    const template = createApiConstruct(stack, {
      repositoryName: `${envPrefix}-${projectName}-ecr`,
    });

    // Verify repository name
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: `${envPrefix}-${projectName}-ecr`,
      ImageScanningConfiguration: {
        ScanOnPush: true,
      },
    });

    // Verify retention policy
    template.hasResource('AWS::ECR::Repository', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });
});
