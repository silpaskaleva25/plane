import { REGION, VPC_PREFIX, VpcPrefix } from '@starter/infra-components';
import { ApiStack, WebStack } from '@starter/infra-components';
import { App } from 'aws-cdk-lib';

export function createApp(): App {
  const app = new App();

  // Retrieve context values with environment variable fallback
  const contextKeys = [
    'envPrefix',
    'vpcPrefix',
    'projectName',
    'awsProfile',
  ] as const;
  const envMapping = {
    envPrefix: 'ENV_PREFIX',
    vpcPrefix: 'VPC_PREFIX',
    projectName: 'PROJECT_NAME',
    awsProfile: 'AWS_PROFILE',
  } as const;

  const context = Object.fromEntries(
    contextKeys.map((key) => [
      key,
      app.node.tryGetContext(key) || process.env[envMapping[key]],
    ])
  );

  let envPrefix = context.envPrefix;
  let projectName = context.projectName;
  let vpcPrefix = context.vpcPrefix;
  let awsProfile = context.awsProfile;

  if (!envPrefix || typeof envPrefix !== 'string' || !envPrefix.trim()) {
    throw new Error(
      'Required environment variable "ENV_PREFIX" is not set. You can set it through .env.local or pass it via CLI: -c envPrefix=<value>'
    );
  }
  envPrefix = envPrefix.trim();

  if (!projectName || typeof projectName !== 'string' || !projectName.trim()) {
    throw new Error(
      'Required environment variable "PROJECT_NAME" is not set. You can set it through .env.local or pass it via CLI: -c projectName=<value>'
    );
  }
  projectName = projectName.trim();

  if (!vpcPrefix || typeof vpcPrefix !== 'string' || !vpcPrefix.trim()) {
    throw new Error(
      'Required environment variable "VPC_PREFIX" is not set. You can set it through .env.local or pass it via CLI: -c vpcPrefix=Dev'
    );
  }
  vpcPrefix = vpcPrefix.trim();
  const validVpcPrefixes = Object.values(VPC_PREFIX);
  if (!validVpcPrefixes.includes(vpcPrefix as VpcPrefix)) {
    throw new Error(
      `Invalid VPC_PREFIX value: "${vpcPrefix}". Must be one of: ${validVpcPrefixes.join(
        ', '
      )}`
    );
  }

  if (!awsProfile || typeof awsProfile !== 'string' || !awsProfile.trim()) {
    throw new Error(
      'Required environment variable "AWS_PROFILE" is not set. You can set it through .env.local or pass it via CLI: -c awsProfile=<value>'
    );
  }
  awsProfile = awsProfile.trim();
  if (awsProfile === 'default') {
    throw new Error(
      'Using AWS profile "default" is not allowed for security reasons.\n'
    );
  }

  const webStackName = 'web';
  const webStackId = envPrefix
    ? `${envPrefix}-${projectName}-${webStackName}`
    : `${projectName}-${webStackName}`;

  // prettier-ignore
  new WebStack(app, webStackId, { // NOSONAR Typescript:S1848 - Stack instantiation has side effects (registers with CDK app)
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || REGION,
    },
    projectName,
    envPrefix,
  });

  const apiStackName = 'api';
  const apiStackId = envPrefix
    ? `${envPrefix}-${projectName}-${apiStackName}`
    : `${projectName}-${apiStackName}`;

  // Get desiredCount from CDK context (set by deploy.js based on image detection)
  // Default to 0 if not provided (infrastructure-only mode)
  const desiredCount =
    app.node.tryGetContext('desiredCount') == null
      ? 0
      : Number(app.node.tryGetContext('desiredCount'));

  // prettier-ignore
  new ApiStack(app, apiStackId, { // NOSONAR Typescript:S1848 - Stack instantiation has side effects (registers with CDK app)
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || REGION,
    },
    vpcPrefix: vpcPrefix as VpcPrefix,
    envPrefix,
    projectName,
    desiredCount, // Pass calculated desiredCount
    containerPort: 8080,
  });

  return app;
}

if (require.main === module) {
  createApp();
}


