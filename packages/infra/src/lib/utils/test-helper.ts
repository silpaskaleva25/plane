/**
 * Test Environment Variables
 */
export const TestEnvVariables = {
  /**
   * Fake AWS account ID used for testing
   */
  AWS_ACCOUNT_ID: '123456789012',

  /**
   * Default AWS region used for testing
   */
  AWS_REGION: 'ca-central-1',

  /**
   * Fake AWS profile used for testing
   */
  AWS_PROFILE: 'test-profile',

  /**
   * Environment prefix used for testing
   */
  ENV_PREFIX: 'unittest',

  /**
   * Project name used for testing
   */
  PROJECT_NAME: 'starterunittest',
} as const;

