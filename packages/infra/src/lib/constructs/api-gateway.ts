import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';
import { BaseStackProps } from '../props/base-stack-props';
import { NameHelper } from '../utils/name-helper';

/**
 * Properties for ApiGatewayConstruct
 */
export interface ApiGatewayConstructProps extends BaseStackProps {
  /**
   * The name of the API Gateway
   */
  apiName: string;

  /**
   * Optional description for the API Gateway
   */
  description?: string;

  /**
   * CORS configuration (optional, defaults to wildcard '*')
   * Recommendation: Provide explicit origins for production deployments
   * Example: Use CloudFront distribution domain for browser access
   */
  cors?: {
    /**
     * Allowed origins. Can be string array or array containing CDK Tokens/References.
     * Example: `[cloudFrontDistribution.distributionDomainName]` or `['https://example.com']`
     * Defaults to wildcard '*' if not provided (convenient for dev, not recommended for production)
     */
    allowOrigins: (string | cdk.IResolvable)[];
    /**
     * Allowed HTTP methods (defaults to: GET, POST, PUT, DELETE, OPTIONS)
     */
    allowMethods?: apigatewayv2.CorsHttpMethod[];
    /**
     * Allowed headers (defaults to minimal set: Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token)
     * If provided, completely replaces the default headers
     */
    allowHeaders?: string[];
    /**
     * Additional custom headers to add to the default set
     * These will be merged with the default headers (Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token)
     * If allowHeaders is also provided, this will be ignored
     */
    additionalHeaders?: string[];
  };

  /**
   * Optional create default stage (defaults to true)
   */
  createDefaultStage?: boolean;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigatewayv2.HttpApi;
  public readonly defaultStage?: apigatewayv2.IHttpStage;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    const {
      apiName,
      envPrefix = '',
      projectName,
      description,
      cors,
      createDefaultStage = true,
    } = props;

    // Build resource names with environment prefix and project name
    const nameHelper = new NameHelper(projectName, envPrefix);
    const prefixedApiName = nameHelper.name(apiName);

    // Default CORS to wildcard if not provided
    // Recommendation: Provide explicit origins for production deployments
    const finalCors = cors ?? { allowOrigins: ['*'] };

    // Destructure CORS configuration with defaults
    const {
      allowOrigins,
      allowMethods = [
        apigatewayv2.CorsHttpMethod.GET,
        apigatewayv2.CorsHttpMethod.POST,
        apigatewayv2.CorsHttpMethod.PUT,
        apigatewayv2.CorsHttpMethod.DELETE,
        apigatewayv2.CorsHttpMethod.OPTIONS,
      ],
      allowHeaders: providedHeaders,
      additionalHeaders = [],
    } = finalCors;

    // Default headers - minimal set for basic API functionality
    const defaultHeaders = [
      'Content-Type',
      'X-Amz-Date',
      'Authorization',
      'X-Api-Key',
      'X-Amz-Security-Token',
    ];

    // If allowHeaders is provided, use it directly (complete override)
    // Otherwise, merge default headers with additionalHeaders
    const allowHeaders = providedHeaders ?? [
      ...defaultHeaders,
      ...additionalHeaders,
    ];

    // Create the HTTP API (v2)
    // Note: CDK resolves IResolvable tokens at synthesis time, but TypeScript types are strict
    this.api = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: prefixedApiName,
      description: description || `HTTP API Gateway for ${prefixedApiName}`,
      corsPreflight: {
        allowOrigins: allowOrigins as string[],
        allowMethods,
        allowHeaders,
      },
      createDefaultStage,
    });

    // Add tags for resource identification
    cdk.Tags.of(this.api).add('ManagedBy', 'StarterPlatform');
    if (envPrefix) {
      cdk.Tags.of(this.api).add('Environment', envPrefix);
    }

    // Get default stage if created
    if (createDefaultStage) {
      this.defaultStage = this.api.defaultStage;
    }

    const { url, httpApiId } = this.api;

    // Add output for the API Gateway URL
    const urlExportName = nameHelper.name(`${apiName}-url`);
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: url ?? '',
      description: 'HTTP API Gateway endpoint URL',
      exportName: urlExportName,
    });

    // Add output for the API Gateway ID
    const idExportName = nameHelper.name(`${apiName}-id`);
    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: httpApiId,
      description: 'HTTP API Gateway ID',
      exportName: idExportName,
    });
  }

  /**
   * Add routes to the HTTP API
   */
  public addRoutes(
    routeProps: apigatewayv2.AddRoutesOptions
  ): apigatewayv2.HttpRoute[] {
    return this.api.addRoutes(routeProps);
  }
}

