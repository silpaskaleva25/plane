import {
  ApiConstruct,
  TestEnvVariables,
  VPC_PREFIX,
} from '@starter/infra-components';
import { App } from 'aws-cdk-lib';
import { ApiStack } from './api-stack';

describe('ApiStack', () => {
  it('should create an instance and be properly defined', () => {
    const { AWS_ACCOUNT_ID: account, AWS_REGION: region } = TestEnvVariables;
    const mockStack = new ApiStack(new App(), 'TestApiStack', {
      env: {
        account,
        region,
      },
      vpcPrefix: VPC_PREFIX.DEV,
      projectName: TestEnvVariables.PROJECT_NAME,
      envPrefix: TestEnvVariables.ENV_PREFIX,
      containerPort: 8080,
    });

    const apiConstruct = mockStack.node.children.find(
      (child) => child instanceof ApiConstruct
    );

    expect(mockStack).toBeDefined();

    expect(apiConstruct).toBeDefined();
  });
});

