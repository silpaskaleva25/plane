import { WebConstruct } from '@starter/infra-components';
import { App } from 'aws-cdk-lib';
import { WebStack } from './web-stack';

describe('WebStack', () => {
  it('should create an instance and be properly defined', () => {
    const mockStack = new WebStack(new App(), 'TestWebStack', {
      env: { account: 'mockAccount', region: 'mockRegion' },
      projectName: 'demo',
      envPrefix: 'test',
    });

    const webConstruct = mockStack.node.children.find(
      (child) => child instanceof WebConstruct
    );

    expect(mockStack).toBeDefined();

    expect(webConstruct).toBeDefined();
  });
});

