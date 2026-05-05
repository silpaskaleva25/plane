import { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TestEnvVariables } from '../utils/test-helper';
import { ApiGatewayConstruct } from './api-gateway';

describe('ApiGatewayConstruct', () => {
  it('should create an API Gateway with correct name', () => {
    const stack = new Stack();
    new ApiGatewayConstruct(stack, 'TestApiGateway', {
      apiName: 'test-api',
      envPrefix: TestEnvVariables.ENV_PREFIX,
      projectName: TestEnvVariables.PROJECT_NAME,
      cors: {
        allowOrigins: ['https://example.com'],
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: `${TestEnvVariables.ENV_PREFIX}-${TestEnvVariables.PROJECT_NAME}-test-api`,
    });
  });

  it('should merge default headers with additional headers in CORS config', () => {
    const stack = new Stack();
    new ApiGatewayConstruct(stack, 'TestApiGateway', {
      apiName: 'test-api',
      envPrefix: TestEnvVariables.ENV_PREFIX,
      projectName: TestEnvVariables.PROJECT_NAME,
      cors: {
        allowOrigins: ['https://example.com'],
        additionalHeaders: ['X-Custom-Header', 'X-Another-Header'],
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      CorsConfiguration: {
        AllowHeaders: Match.arrayWith([
          'Content-Type',
          'Authorization',
          'X-Custom-Header',
          'X-Another-Header',
        ]),
      },
    });
  });
});
