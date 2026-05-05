import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { TestEnvVariables } from '../utils/test-helper';
import { ApiContainerConstruct } from './api-container';

describe('ApiContainerConstruct', () => {
  it('should create ECS Fargate service with correct configuration', () => {
    const { AWS_ACCOUNT_ID: account, AWS_REGION: region } = TestEnvVariables;
    const stack = new Stack(undefined, 'TestStack', {
      env: {
        account,
        region,
      },
    });
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    const repository = new ecr.Repository(stack, 'Repository', {
      repositoryName: 'test-repo',
    });
    const securityGroup = new ec2.SecurityGroup(stack, 'SecurityGroup', {
      vpc,
    });

    // prettier-ignore
    new ApiContainerConstruct(stack, 'TestApiContainer', { // NOSONAR Typescript:S1848 - Stack instantiation has side effects (registers with CDK app)
      serviceName: 'test-service',
      repository,
      vpc,
      cluster,
      securityGroups: [securityGroup],
      envPrefix: TestEnvVariables.ENV_PREFIX,
      projectName: TestEnvVariables.PROJECT_NAME,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: `${TestEnvVariables.ENV_PREFIX}-${TestEnvVariables.PROJECT_NAME}-test-service`,
      DesiredCount: 0,
    });
  });
});
