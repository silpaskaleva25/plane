import { TestEnvVariables, VPC_PREFIX } from '@starter/infra-components';
import * as infraComponents from '@starter/infra-components';
import { App } from 'aws-cdk-lib';
import { createApp } from './main';

jest.mock('@starter/infra-components', () => ({
  WebStack: jest.fn(),
  ApiStack: jest.fn(),
}));

const mockedInfraComponents = infraComponents as jest.Mocked<
  typeof infraComponents
>;

jest.mock('aws-cdk-lib', () => {
  const actual = jest.requireActual('aws-cdk-lib');
  return {
    ...actual,
    App: jest.fn().mockImplementation(() => ({
      node: {
        tryGetContext: jest.fn(),
      },
      synth: jest.fn(),
    })),
  };
});

describe('createApp', () => {
  const {
    AWS_ACCOUNT_ID,
    AWS_REGION,
    AWS_PROFILE,
    ENV_PREFIX: envPrefix,
    PROJECT_NAME: projectName,
  } = TestEnvVariables;
  let mockTryGetContext: jest.Mock;
  let MockedApp: jest.Mock;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    MockedApp = App as unknown as jest.Mock;
    mockTryGetContext = jest.fn();

    MockedApp.mockImplementation(() => ({
      node: {
        tryGetContext: mockTryGetContext,
      },
    }));

    // Backup original environment variables
    originalEnv = { ...process.env };
    delete process.env.ENV_PREFIX;
    delete process.env.VPC_PREFIX;
    delete process.env.PROJECT_NAME;

    // Set fake AWS environment variables
    process.env.CDK_DEFAULT_ACCOUNT = AWS_ACCOUNT_ID;
    process.env.CDK_DEFAULT_REGION = AWS_REGION;
    process.env.AWS_PROFILE = AWS_PROFILE;
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it.each([
    {
      missingKey: 'envPrefix',
      validContext: {
        vpcPrefix: VPC_PREFIX.DEV,
        projectName,
      },
      expectedError: /ENV_PREFIX/,
    },
    {
      missingKey: 'projectName',
      validContext: {
        envPrefix,
        vpcPrefix: VPC_PREFIX.DEV,
      },
      expectedError: /PROJECT_NAME/,
    },
    {
      missingKey: 'vpcPrefix',
      validContext: {
        envPrefix,
        projectName,
      },
      expectedError: /VPC_PREFIX/,
    },
  ])(
    'should throw error if $missingKey is missing from both context and env',
    ({ validContext, expectedError }) => {
      mockTryGetContext.mockImplementation(
        (key: string) => validContext[key as keyof typeof validContext]
      );
      expect(() => createApp()).toThrow(expectedError);
    }
  );

  it('should create WebStack and ApiStack instances when context is valid', () => {
    mockTryGetContext.mockImplementation((key: string) => {
      if (key === 'envPrefix') return TestEnvVariables.ENV_PREFIX;
      if (key === 'vpcPrefix') return VPC_PREFIX.DEV;
      if (key === 'projectName') return TestEnvVariables.PROJECT_NAME;
      return undefined;
    });

    createApp();

    expect(mockedInfraComponents.WebStack).toHaveBeenCalledTimes(1);
    expect(mockedInfraComponents.ApiStack).toHaveBeenCalledTimes(1);

    expect(mockedInfraComponents.WebStack).toHaveBeenCalledWith(
      expect.any(Object), // App is mocked, so strict type check might fail if not careful
      `${TestEnvVariables.ENV_PREFIX}-${TestEnvVariables.PROJECT_NAME}-web`,
      expect.objectContaining({
        projectName: TestEnvVariables.PROJECT_NAME,
        envPrefix: TestEnvVariables.ENV_PREFIX,
      })
    );

    expect(mockedInfraComponents.ApiStack).toHaveBeenCalledWith(
      expect.any(Object),
      `${TestEnvVariables.ENV_PREFIX}-${TestEnvVariables.PROJECT_NAME}-api`,
      expect.objectContaining({
        projectName: TestEnvVariables.PROJECT_NAME,
        envPrefix: TestEnvVariables.ENV_PREFIX,
        vpcPrefix: VPC_PREFIX.DEV,
      })
    );
  });

  it('should use environment variables when context is not provided', () => {
    process.env.ENV_PREFIX = 'env-from-env';
    process.env.VPC_PREFIX = VPC_PREFIX.DEV;
    process.env.PROJECT_NAME = 'project-from-env';

    mockTryGetContext.mockReturnValue(undefined);

    createApp();

    expect(mockedInfraComponents.WebStack).toHaveBeenCalledWith(
      expect.any(Object),
      'env-from-env-project-from-env-web',
      expect.objectContaining({
        projectName: 'project-from-env',
        envPrefix: 'env-from-env',
      })
    );

    expect(mockedInfraComponents.ApiStack).toHaveBeenCalledWith(
      expect.any(Object),
      'env-from-env-project-from-env-api',
      expect.objectContaining({
        projectName: 'project-from-env',
        envPrefix: 'env-from-env',
        vpcPrefix: VPC_PREFIX.DEV,
      })
    );
  });

  it('should prefer context over environment variables', () => {
    process.env.ENV_PREFIX = 'env-from-env';
    process.env.VPC_PREFIX = VPC_PREFIX.DEV;
    process.env.PROJECT_NAME = 'project-from-env';

    mockTryGetContext.mockImplementation((key: string) => {
      if (key === 'envPrefix') return 'context-env';
      if (key === 'vpcPrefix') return VPC_PREFIX.TEST;
      if (key === 'projectName') return 'context-project';
      return undefined;
    });

    createApp();

    expect(mockedInfraComponents.WebStack).toHaveBeenCalledWith(
      expect.any(Object),
      'context-env-context-project-web',
      expect.objectContaining({
        projectName: 'context-project',
        envPrefix: 'context-env',
      })
    );

    expect(mockedInfraComponents.ApiStack).toHaveBeenCalledWith(
      expect.any(Object),
      'context-env-context-project-api',
      expect.objectContaining({
        projectName: 'context-project',
        envPrefix: 'context-env',
        vpcPrefix: VPC_PREFIX.TEST,
      })
    );
  });

  it('should throw error for invalid VPC_PREFIX value', () => {
    mockTryGetContext.mockImplementation((key: string) => {
      if (key === 'envPrefix') return envPrefix;
      if (key === 'vpcPrefix') return 'InvalidVpc';
      if (key === 'projectName') return projectName;
      return undefined;
    });

    expect(() => createApp()).toThrow(
      /Invalid VPC_PREFIX value.*Must be one of/
    );
  });

  it.each([
    {
      variable: 'envPrefix',
      envKey: 'ENV_PREFIX' as const,
      value: '   ',
      testName: 'ENV_PREFIX with whitespace',
      expectedError: /ENV_PREFIX.*is not set/,
      otherVars: {
        PROJECT_NAME: projectName,
        VPC_PREFIX: VPC_PREFIX.DEV,
        AWS_PROFILE: AWS_PROFILE,
      },
    },
    {
      variable: 'projectName',
      envKey: 'PROJECT_NAME' as const,
      value: '   ',
      testName: 'PROJECT_NAME with whitespace',
      expectedError: /PROJECT_NAME.*is not set/,
      otherVars: {
        ENV_PREFIX: envPrefix,
        VPC_PREFIX: VPC_PREFIX.DEV,
        AWS_PROFILE: AWS_PROFILE,
      },
    },
    {
      variable: 'vpcPrefix',
      envKey: 'VPC_PREFIX' as const,
      value: '   ',
      testName: 'VPC_PREFIX with whitespace',
      expectedError: /VPC_PREFIX.*is not set/,
      otherVars: {
        ENV_PREFIX: envPrefix,
        PROJECT_NAME: projectName,
        AWS_PROFILE: AWS_PROFILE,
      },
    },
    {
      variable: 'awsProfile',
      envKey: 'AWS_PROFILE' as const,
      value: '   ',
      testName: 'AWS_PROFILE with whitespace',
      expectedError: /AWS_PROFILE.*is not set/,
      otherVars: {
        ENV_PREFIX: envPrefix,
        PROJECT_NAME: projectName,
        VPC_PREFIX: VPC_PREFIX.DEV,
      },
    },
  ])(
    'should throw error for $testName',
    ({ envKey, value, expectedError, otherVars }) => {
      process.env[envKey] = value;
      Object.assign(process.env, otherVars);

      mockTryGetContext.mockReturnValue(undefined);

      expect(() => createApp()).toThrow(expectedError);
    }
  );

  it.each([
    {
      profileValue: 'default',
      testName: '"default"',
      expectedError: /Using AWS profile "default" is not allowed/,
    },
  ])(
    'should throw error if AWS_PROFILE is set to $testName',
    ({ profileValue, expectedError }) => {
      process.env.AWS_PROFILE = profileValue;

      mockTryGetContext.mockImplementation((key: string) => {
        const validContext = {
          envPrefix,
          vpcPrefix: VPC_PREFIX.DEV,
          projectName,
        };
        return validContext[key as keyof typeof validContext];
      });

      expect(() => createApp()).toThrow(expectedError);
    }
  );

  it('should succeed with valid AWS_PROFILE set', () => {
    process.env.AWS_PROFILE = 'my-dev-profile';

    mockTryGetContext.mockImplementation((key: string) => {
      if (key === 'envPrefix') return envPrefix;
      if (key === 'vpcPrefix') return VPC_PREFIX.DEV;
      if (key === 'projectName') return projectName;
      return undefined;
    });

    createApp();

    expect(mockedInfraComponents.WebStack).toHaveBeenCalledTimes(1);
    expect(mockedInfraComponents.ApiStack).toHaveBeenCalledTimes(1);
  });
});


