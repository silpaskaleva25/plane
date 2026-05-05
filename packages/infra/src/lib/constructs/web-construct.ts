import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStackProps } from '../props/base-stack-props';
import { NameHelper } from '../utils/name-helper';
import { CloudFrontDistributionConstruct } from './cloudfront-distribution';

/**
 * Properties for WebConstruct
 */
export interface WebConstructProps extends BaseStackProps {
  /**
   * Optional props for the CloudFront distribution construct
   * These will be merged with the construct's default props
   * Note: distributionName, envPrefix, description, and insertHttpSecurityHeaders
   * are set by the construct and will override any values provided here
   */
  cloudFrontDistributionProps?: Omit<
    import('./cloudfront-distribution').CloudFrontDistributionConstructProps,
    | 'distributionName'
    | 'envPrefix'
    | 'description'
    | 'insertHttpSecurityHeaders'
  >;
}

/**
 * Web Construct
 *
 * This construct encapsulates the web infrastructure setup including:
 * - CloudFront distribution for SPA hosting
 * - CloudFormation outputs
 */
export class WebConstruct extends Construct {
  public readonly cloudFrontDistribution: CloudFrontDistributionConstruct;

  public constructor(scope: Construct, id: string, props: WebConstructProps) {
    super(scope, id);

    const { envPrefix, projectName, cloudFrontDistributionProps } = props;

    // Create name helper for consistent resource naming
    const nameHelper = new NameHelper(projectName, envPrefix);

    // Create CloudFront distribution for SPA hosting
    const cloudFrontDistribution = new CloudFrontDistributionConstruct(
      this,
      'WebDistribution',
      {
        distributionName: 'web-distribution',
        envPrefix, // Pass environment prefix for multi-environment support
        projectName, // Pass project name for resource naming
        description: 'CloudFront distribution for SPA hosting',
        insertHttpSecurityHeaders: false, // Not needed for single-page app
        ...cloudFrontDistributionProps,
      }
    );
    this.cloudFrontDistribution = cloudFrontDistribution;

    // CloudFront distribution outputs
    const cloudFrontUrl = cdk.Fn.join('', [
      'https://',
      cloudFrontDistribution.distribution.distributionDomainName,
    ]);
    const cloudFrontUrlExportName = nameHelper.name('DemoCloudFrontUrl');
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: cloudFrontUrl,
      description: 'CloudFront distribution URL',
      exportName: cloudFrontUrlExportName,
    });

    if (cloudFrontDistribution.bucket) {
      const s3BucketExportName = nameHelper.name('DemoS3BucketUi');
      new cdk.CfnOutput(this, 'S3BucketUi', {
        value: cloudFrontDistribution.bucket.bucketName,
        description: 'S3 bucket for UI hosting',
        exportName: s3BucketExportName,
      });
    }

    const cloudFrontDistributionIdExportName = nameHelper.name(
      'DemoCloudFrontDistributionId'
    );
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: cloudFrontDistribution.distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: cloudFrontDistributionIdExportName,
    });
  }
}
