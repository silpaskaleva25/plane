/**
 * Helper class for creating consistent naming patterns
 */
export class NameHelper {
  private readonly envPrefix: string;
  private readonly projectName: string;

  constructor(projectName: string, envPrefix = '') {
    this.envPrefix = envPrefix;
    this.projectName = projectName;
  }

  /**
   * Get a resource name with environment prefix and project name prefix
   * @param name The base name
   * @returns The name with environment prefix and project name prefix (e.g., "dev-project-api" or "project-api" if no env prefix)
   */
  name(name: string): string {
    const projectPrefixedName = `${this.projectName}-${name}`;
    return this.envPrefix
      ? `${this.envPrefix}-${projectPrefixedName}`
      : projectPrefixedName;
  }

  /**
   * Create SSM parameter name for cross-stack access
   * @param stackName The stack name
   * @param parameterName The parameter name
   * @returns The full SSM parameter name
   */
  createStackParameterName(stackName: string, parameterName: string): string {
    return `/${this.envPrefix}/${stackName}/${parameterName}`;
  }
}
