import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import * as cdk from 'aws-cdk-lib';
import { CfnResource } from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { NameHelper } from '../utils/name-helper';

/**
 * Domain configuration for CloudFront distribution
 * Supports both ViewerCertificate objects and certificate ARN references
 */
type DomainConfig = {
  domainNames: string[];
  certificate: cloudfront.ViewerCertificate | { certificateArn: string };
};

/**
 * Properties for CloudFrontDistributionConstruct
 */
export interface CloudFrontDistributionConstructProps {
  /**
   * The name of the distribution
   */
  distributionName: string;

  /**
   * Environment prefix (e.g., 'dev', 'prod', 'staging') for multi-environment support
   * Used for resource naming, tagging, and export names
   */
  envPrefix?: string;

  /**
   * Project name for resource naming (e.g., 'platform', 'myproject')
   */
  projectName: string;

  /**
   * Optional description for the CloudFront distribution
   */
  description?: string;

  /**
   * Optional existing S3 bucket to use as origin
   * If not provided, a new bucket will be created
   */
  existingBucketObj?: s3.IBucket;

  /**
   * Optional bucket properties if creating a new bucket
   */
  bucketProps?: s3.BucketProps;

  /**
   * Optional custom domain configuration
   * Can be provided directly or loaded from SSM parameters
   */
  domain?: {
    /**
     * Domain name (e.g., 'example.com')
     * If not provided and envPrefix is empty, will try to load from SSM parameter 'domainName'
     */
    domainName?: string;
    /**
     * Certificate ARN for the domain (must be in us-east-1 for CloudFront)
     * If not provided and envPrefix is empty, will try to load from SSM parameter 'certificateArn'
     */
    certificateArn?: string;
  };

  /**
   * Optional SSM parameter names for domain configuration
   * Used when envPrefix is not set and domain is not provided directly
   */
  domainSsmParameters?: {
    /**
     * SSM parameter name for domain name (defaults to 'domainName')
     */
    domainNameParam?: string;
    /**
     * SSM parameter name for certificate ARN (defaults to 'certificateArn')
     */
    certificateArnParam?: string;
  };

  /**
   * Optional default root object (defaults to 'index.html')
   */
  defaultRootObject?: string;

  /**
   * Optional error responses for SPA routing or custom error handling
   * Defaults to redirecting 403 and 404 to index.html for SPA routing
   */
  errorResponses?: cloudfront.ErrorResponse[];

  /**
   * Optional additional behaviors for CloudFront distribution
   * Example: maintenance pages, API routes, etc.
   */
  additionalBehaviors?: Record<string, cloudfront.BehaviorOptions>;

  /**
   * Whether to insert HTTP security headers (defaults to false)
   * Set to false for single-page applications that handle security headers
   */
  insertHttpSecurityHeaders?: boolean;

  /**
   * Optional CloudFront distribution comment
   */
  comment?: string;

  /**
   * Optional logical ID override for the CloudFront distribution
   * Useful for referencing existing resources
   */
  logicalId?: string;

  /**
   * Optional price class (defaults to PriceClass.PRICE_CLASS_ALL)
   */
  priceClass?: cloudfront.PriceClass;

  /**
   * Optional cache policy (defaults to CACHING_OPTIMIZED)
   */
  cachePolicy?: cloudfront.ICachePolicy;

  /**
   * Optional origin request policy
   */
  originRequestPolicy?: cloudfront.IOriginRequestPolicy;

  /**
   * Optional response headers policy
   */
  responseHeadersPolicy?: cloudfront.IResponseHeadersPolicy;

  /**
   * Optional CloudFront distribution props
   */
  cloudFrontDistributionProps?: cloudfront.DistributionProps;
}

/**
 * A construct that creates a CloudFront distribution with S3 origin using AWS Solutions Construct
 *
 * This construct wraps the AWS Solutions Construct CloudFrontToS3 to provide a standardized way
 * to create CloudFront distributions with S3 origins, with common configurations for caching,
 * security, and SPA routing.
 *
 * @example
 * ```typescript
 * const distribution = new CloudFrontDistributionConstruct(this, 'Distribution', {
 *   distributionName: 'my-distribution',
 *   envPrefix: 'dev',
 *   defaultRootObject: 'index.html',
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With existing bucket
 * const bucket = new s3.Bucket(this, 'Bucket', { bucketName: 'my-bucket' });
 * const distribution = new CloudFrontDistributionConstruct(this, 'Distribution', {
 *   distributionName: 'my-distribution',
 *   existingBucketObj: bucket,
 *   envPrefix: 'dev',
 * });
 * ```
 */
export class CloudFrontDistributionConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket?: s3.Bucket;
  public readonly cloudFrontWebDistribution: CloudFrontToS3;

  constructor(
    scope: Construct,
    id: string,
    props: CloudFrontDistributionConstructProps
  ) {
    super(scope, id);

    const {
      distributionName,
      envPrefix = '',
      projectName,
      description,
      existingBucketObj,
      bucketProps,
      defaultRootObject = 'index.html',
      errorResponses,
      additionalBehaviors,
      insertHttpSecurityHeaders = false,
      comment,
      logicalId,
      priceClass = cloudfront.PriceClass.PRICE_CLASS_ALL,
      cloudFrontDistributionProps,
    } = props;

    // Build resource name with environment prefix and project name
    const nameHelper = new NameHelper(projectName, envPrefix);
    const prefixedDistributionName = nameHelper.name(distributionName);

    // Prepare bucket props with environment prefix if creating new bucket
    let finalBucketProps = bucketProps;
    if (bucketProps?.bucketName) {
      finalBucketProps = {
        ...bucketProps,
        bucketName: nameHelper.name(bucketProps.bucketName),
      };
    }

    const defaultBehaviorOptions = this.resolveDefaultBehaviorOptions(props);
    const domainConfig = this.resolveDomainConfig(props);

    // Default error responses for SPA routing if not provided
    const defaultErrorResponses: cloudfront.ErrorResponse[] = [
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: `/${defaultRootObject}`,
        ttl: cdk.Duration.minutes(0),
      },
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: `/${defaultRootObject}`,
        ttl: cdk.Duration.minutes(0),
      },
    ];

    // Prepare CloudFront distribution props
    // Note: CloudFrontToS3 will handle the origin creation
    // Using Record<string, any> because CloudFrontToS3 accepts flexible props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const distributionProps: Record<string, any> = {
      defaultRootObject,
      errorResponses: errorResponses || defaultErrorResponses,
      comment:
        comment || `CloudFront distribution for ${prefixedDistributionName}`,
      priceClass,
      ...(additionalBehaviors && { additionalBehaviors }),
      ...(defaultBehaviorOptions && {
        defaultBehavior: defaultBehaviorOptions,
      }),
      ...cloudFrontDistributionProps,
    };

    // Only add domain configuration if it's fully defined
    // CloudFront requires both domainNames and certificate to be defined together
    if (domainConfig) {
      distributionProps['domainNames'] = domainConfig.domainNames;
      distributionProps['certificate'] = domainConfig.certificate;
    }

    // Create CloudFront to S3 construct
    this.cloudFrontWebDistribution = new CloudFrontToS3(
      this,
      'CloudFrontToS3',
      {
        existingBucketObj,
        bucketProps: finalBucketProps,
        cloudFrontDistributionProps: distributionProps,
        insertHttpSecurityHeaders,
      }
    );

    // Get references to created resources
    this.distribution =
      this.cloudFrontWebDistribution.cloudFrontWebDistribution;
    this.bucket = this.cloudFrontWebDistribution.s3Bucket;

    // Override logical ID if provided (useful for referencing existing resources)
    if (logicalId) {
      const defaultChild = this.distribution.node.defaultChild as CfnResource;
      if (defaultChild) {
        defaultChild.overrideLogicalId(logicalId);
      }
    }

    this.addTags(envPrefix);
    this.createOutputs(
      nameHelper,
      distributionName,
      prefixedDistributionName,
      description
    );
  }

  private resolveDefaultBehaviorOptions(
    props: CloudFrontDistributionConstructProps
  ): cloudfront.BehaviorOptions | undefined {
    const {
      cachePolicy = cloudfront.CachePolicy.CACHING_OPTIMIZED,
      originRequestPolicy,
      responseHeadersPolicy,
      cloudFrontDistributionProps,
    } = props;

    // Build default behavior options if policies are provided
    // Note: CloudFrontToS3 will create the origin, so we only override behavior options
    if (cachePolicy || originRequestPolicy || responseHeadersPolicy) {
      const baseBehavior = cloudFrontDistributionProps?.defaultBehavior;
      return {
        ...baseBehavior,
        ...(cachePolicy && { cachePolicy }),
        ...(originRequestPolicy && { originRequestPolicy }),
        ...(responseHeadersPolicy && { responseHeadersPolicy }),
      } as cloudfront.BehaviorOptions;
    }
    return undefined;
  }

  private resolveDomainConfig(
    props: CloudFrontDistributionConstructProps
  ): DomainConfig | undefined {
    const { domain, envPrefix = '', domainSsmParameters } = props;

    // Handle domain configuration - support SSM parameters when envPrefix is not set
    if (domain?.domainName && domain?.certificateArn) {
      // Direct domain configuration provided
      return {
        domainNames: [domain.domainName],
        certificate: cloudfront.ViewerCertificate.fromAcmCertificate(
          certificatemanager.Certificate.fromCertificateArn(
            this,
            'Certificate',
            domain.certificateArn
          ),
          {
            aliases: [domain.domainName],
            sslMethod: cloudfront.SSLMethod.SNI,
            securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
          }
        ),
      };
    } else if (!envPrefix && domainSsmParameters) {
      // Load from SSM parameters when envPrefix is not set and SSM parameters are provided
      // Note: SSM parameters must exist in AWS before deployment
      const domainNameParam =
        domainSsmParameters.domainNameParam || 'domainName';
      const certificateArnParam =
        domainSsmParameters.certificateArnParam || 'certificateArn';

      const domainName = ssm.StringParameter.fromStringParameterName(
        this,
        'DomainNameParam',
        domainNameParam
      );
      const certificateArn = ssm.StringParameter.fromStringParameterName(
        this,
        'CertificateArnParam',
        certificateArnParam
      );

      return {
        domainNames: [domainName.stringValue],
        certificate: { certificateArn: certificateArn.stringValue },
      };
    }
    return undefined;
  }

  private addTags(envPrefix: string) {
    // Add tags for resource identification
    cdk.Tags.of(this.distribution).add('ManagedBy', 'StarterPlatform');
    if (envPrefix) {
      cdk.Tags.of(this.distribution).add('Environment', envPrefix);
    }
    if (this.bucket) {
      cdk.Tags.of(this.bucket).add('ManagedBy', 'StarterPlatform');
      if (envPrefix) {
        cdk.Tags.of(this.bucket).add('Environment', envPrefix);
      }
    }
  }

  private createOutputs(
    nameHelper: NameHelper,
    distributionName: string,
    prefixedDistributionName: string,
    description?: string
  ) {
    const { distributionDomainName, distributionId } = this.distribution;

    // Add outputs with environment-prefixed export names
    const urlExportName = nameHelper.name(`${distributionName}-url`);
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distributionDomainName}`,
      description:
        description ||
        `CloudFront distribution URL for ${prefixedDistributionName}`,
      exportName: urlExportName,
    });

    const domainNameExportName = nameHelper.name(
      `${distributionName}-domain-name`
    );
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distributionDomainName,
      description: `CloudFront distribution domain name for ${prefixedDistributionName}`,
      exportName: domainNameExportName,
    });

    const distributionIdExportName = nameHelper.name(
      `${distributionName}-distribution-id`
    );
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distributionId,
      description: `CloudFront distribution ID for ${prefixedDistributionName}`,
      exportName: distributionIdExportName,
    });

    if (this.bucket) {
      const bucketNameExportName = nameHelper.name(
        `${distributionName}-bucket-name`
      );
      new cdk.CfnOutput(this, 'BucketName', {
        value: this.bucket.bucketName,
        description: `S3 bucket name for ${prefixedDistributionName}`,
        exportName: bucketNameExportName,
      });
    }
  }
}

