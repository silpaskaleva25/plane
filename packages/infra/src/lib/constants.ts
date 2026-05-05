export const APP_SECURITY_GROUP = `App_sg`;
export const DATA_SECURITY_GROUP = `Data_sg`;
export const WEB_SECURITY_GROUP = `Web_sg`;
export const REGION = 'ca-central-1';

/**
 * VPC name prefix for AWS VPC lookup. Current supported prefixes are Dev, Test, Prod.
 */
export const VPC_PREFIX = {
  DEV: 'Dev',
  TEST: 'Test', // AWS Secure Environment Accelerator (ASEA) UAT environment's labeled value
  PROD: 'Prod',
} as const;

/**
 * Type for VPC prefix names
 */
export type VpcPrefix = (typeof VPC_PREFIX)[keyof typeof VPC_PREFIX];
