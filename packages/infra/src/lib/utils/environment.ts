/**
 * Environment name constants for consistent usage across the platform
 */
export const ENVIRONMENT_NAMES = {
  PROD: 'prod',
  DEV: 'dev',
  UAT: 'uat',
  TEST: 'test',
  TOOLS: 'tools',
} as const;

/**
 * Type for environment names
 */
export type EnvironmentName =
  (typeof ENVIRONMENT_NAMES)[keyof typeof ENVIRONMENT_NAMES];

/**
 * Check if an environment name represents a production environment
 * @param envName The environment name to check
 * @returns true if the environment is production
 */
export function isProductionEnvironment(envName?: string): boolean {
  if (!envName) return false;
  const lowerEnvName = envName.toLowerCase();
  return lowerEnvName === ENVIRONMENT_NAMES.PROD;
}
