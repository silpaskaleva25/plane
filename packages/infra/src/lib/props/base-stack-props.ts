import { StackProps } from 'aws-cdk-lib';
import { VpcPrefix } from '../constants';

/**
 * Base stack properties that are common across all platform stacks
 */
export interface BaseStackProps extends StackProps {
  /**
   * Environment prefix (e.g., 'dev', 'staging', 'prod')
   */
  envPrefix: string;

  /**
   * Project name for resource naming (e.g., 'platform', 'myproject')
   */
  projectName: string;
}

export interface ApiBaseStackProps extends BaseStackProps {
  /**
   * VPC name prefix for AWS VPC lookup. Current supported prefixes are Dev, Test, Prod.
   */
  vpcPrefix: VpcPrefix;
}
